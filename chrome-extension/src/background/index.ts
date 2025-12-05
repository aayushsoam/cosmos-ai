import 'webextension-polyfill';
import {
  agentModelStore,
  AgentNameEnum,
  firewallStore,
  generalSettingsStore,
  llmProviderStore,
  analyticsSettingsStore,
} from '@extension/storage';
import { t } from '@extension/i18n';
import BrowserContext from './browser/context';
import { Executor } from './agent/executor';
import { createLogger } from './log';
import { ExecutionState } from './agent/event/types';
import { createChatModel } from './agent/helper';
import type { BaseChatModel } from '@langchain/core/language_models/chat_models';
import { DEFAULT_AGENT_OPTIONS } from './agent/types';
import { SpeechToTextService } from './services/speechToText';
import { injectBuildDomTreeScripts } from './browser/dom/service';
import { analytics } from './services/analytics';

const logger = createLogger('background');

const browserContext = new BrowserContext({});
let currentExecutor: Executor | null = null;
let currentPort: chrome.runtime.Port | null = null;
let isTaskRunning = false; // Track if a task is currently running

// Setup side panel behavior
chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true }).catch(error => console.error(error));

chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  if (tabId && changeInfo.status === 'complete' && tab.url?.startsWith('http')) {
    await injectBuildDomTreeScripts(tabId);

    // If task is running, show glowing border on newly loaded page
    if (isTaskRunning) {
      try {
        await chrome.tabs.sendMessage(tabId, { type: 'task_start' });
      } catch (error) {
        // Ignore errors if content script not ready yet
      }
    }
  }
});

// Listen for debugger detached event
// if canceled_by_user, remove the tab from the browser context
chrome.debugger.onDetach.addListener(async (source, reason) => {
  console.log('Debugger detached:', source, reason);
  if (reason === 'canceled_by_user') {
    if (source.tabId) {
      currentExecutor?.cancel();
      await browserContext.cleanup();
    }
  }
});

// Cleanup when tab is closed
chrome.tabs.onRemoved.addListener(tabId => {
  browserContext.removeAttachedPage(tabId);
});

logger.info('background loaded');

// Initialize analytics
analytics.init().catch(error => {
  logger.error('Failed to initialize analytics:', error);
});

// Listen for analytics settings changes
analyticsSettingsStore.subscribe(() => {
  analytics.updateSettings().catch(error => {
    logger.error('Failed to update analytics settings:', error);
  });
});

// Listen for simple messages (e.g., from options page)
chrome.runtime.onMessage.addListener(() => {
  // Handle other message types if needed in the future
  // Return false if response is not sent asynchronously
  // return false;
});

// Setup connection listener for long-lived connections (e.g., side panel)
chrome.runtime.onConnect.addListener(port => {
  if (port.name === 'side-panel-connection') {
    currentPort = port;

    port.onMessage.addListener(async message => {
      try {
        switch (message.type) {
          case 'heartbeat':
            // Acknowledge heartbeat
            port.postMessage({ type: 'heartbeat_ack' });
            break;

          case 'new_task': {
            if (!message.task) return port.postMessage({ type: 'error', error: t('bg_cmd_newTask_noTask') });
            if (!message.tabId) return port.postMessage({ type: 'error', error: t('bg_errors_noTabId') });

            logger.info('new_task', message.tabId, message.task);

            // Cleanup previous executor if exists
            if (currentExecutor) {
              logger.info('Cleaning up previous executor before starting new task');
              await currentExecutor.cleanup();
              currentExecutor = null;
            }

            currentExecutor = await setupExecutor(message.taskId, message.task, browserContext);
            subscribeToExecutorEvents(currentExecutor);

            const result = await currentExecutor.execute();
            logger.info('new_task execution result', message.tabId, result);
            break;
          }

          case 'follow_up_task': {
            if (!message.task) return port.postMessage({ type: 'error', error: t('bg_cmd_followUpTask_noTask') });
            if (!message.tabId) return port.postMessage({ type: 'error', error: t('bg_errors_noTabId') });

            logger.info('follow_up_task', message.tabId, message.task);

            // If executor exists, add follow-up task
            if (currentExecutor) {
              currentExecutor.addFollowUpTask(message.task);
              // Re-subscribe to events in case the previous subscription was cleaned up
              subscribeToExecutorEvents(currentExecutor);
              const result = await currentExecutor.execute();
              logger.info('follow_up_task execution result', message.tabId, result);
            } else {
              // executor was cleaned up, can not add follow-up task
              logger.info('follow_up_task: executor was cleaned up, can not add follow-up task');
              return port.postMessage({ type: 'error', error: t('bg_cmd_followUpTask_cleaned') });
            }
            break;
          }

          case 'cancel_task': {
            if (!currentExecutor) return port.postMessage({ type: 'error', error: t('bg_errors_noRunningTask') });
            await currentExecutor.cancel();
            break;
          }

          case 'resume_task': {
            if (!currentExecutor) return port.postMessage({ type: 'error', error: t('bg_cmd_resumeTask_noTask') });
            await currentExecutor.resume();
            return port.postMessage({ type: 'success' });
          }

          case 'pause_task': {
            if (!currentExecutor) return port.postMessage({ type: 'error', error: t('bg_errors_noRunningTask') });
            await currentExecutor.pause();
            return port.postMessage({ type: 'success' });
          }

          case 'screenshot': {
            if (!message.tabId) return port.postMessage({ type: 'error', error: t('bg_errors_noTabId') });
            const page = await browserContext.switchTab(message.tabId);
            const screenshot = await page.takeScreenshot();
            logger.info('screenshot', message.tabId, screenshot);
            return port.postMessage({ type: 'success', screenshot });
          }

          case 'state': {
            try {
              const browserState = await browserContext.getState(true);
              const elementsText = browserState.elementTree.clickableElementsToString(
                DEFAULT_AGENT_OPTIONS.includeAttributes,
              );

              logger.info('state', browserState);
              logger.info('interactive elements', elementsText);
              return port.postMessage({ type: 'success', msg: t('bg_cmd_state_printed') });
            } catch (error) {
              logger.error('Failed to get state:', error);
              return port.postMessage({ type: 'error', error: t('bg_cmd_state_failed') });
            }
          }

          case 'nohighlight': {
            const page = await browserContext.getCurrentPage();
            await page.removeHighlight();
            return port.postMessage({ type: 'success', msg: t('bg_cmd_nohighlight_ok') });
          }

          case 'speech_to_text': {
            try {
              if (!message.audio) {
                return port.postMessage({
                  type: 'speech_to_text_error',
                  error: t('bg_cmd_stt_noAudioData'),
                });
              }

              logger.info('Processing speech-to-text request...');

              // Get all providers for speech-to-text service
              const providers = await llmProviderStore.getAllProviders();

              // Create speech-to-text service with all providers
              const speechToTextService = await SpeechToTextService.create(providers);

              // Extract base64 audio data (remove data URL prefix if present)
              let base64Audio = message.audio;
              if (base64Audio.startsWith('data:')) {
                base64Audio = base64Audio.split(',')[1];
              }

              // Transcribe audio
              const transcribedText = await speechToTextService.transcribeAudio(base64Audio);

              logger.info('Speech-to-text completed successfully');
              return port.postMessage({
                type: 'speech_to_text_result',
                text: transcribedText,
              });
            } catch (error) {
              logger.error('Speech-to-text failed:', error);
              return port.postMessage({
                type: 'speech_to_text_error',
                error: error instanceof Error ? error.message : t('bg_cmd_stt_failed'),
              });
            }
          }

          case 'replay': {
            if (!message.tabId) return port.postMessage({ type: 'error', error: t('bg_errors_noTabId') });
            if (!message.taskId) return port.postMessage({ type: 'error', error: t('bg_errors_noTaskId') });
            if (!message.historySessionId)
              return port.postMessage({ type: 'error', error: t('bg_cmd_replay_noHistory') });
            logger.info('replay', message.tabId, message.taskId, message.historySessionId);

            try {
              // Switch to the specified tab
              await browserContext.switchTab(message.tabId);
              // Setup executor with the new taskId and a dummy task description
              currentExecutor = await setupExecutor(message.taskId, message.task, browserContext);
              subscribeToExecutorEvents(currentExecutor);

              // Run replayHistory with the history session ID
              const result = await currentExecutor.replayHistory(message.historySessionId);
              logger.debug('replay execution result', message.tabId, result);
            } catch (error) {
              logger.error('Replay failed:', error);
              return port.postMessage({
                type: 'error',
                error: error instanceof Error ? error.message : t('bg_cmd_replay_failed'),
              });
            }
            break;
          }

          default:
            return port.postMessage({ type: 'error', error: t('errors_cmd_unknown', [message.type]) });
        }
      } catch (error) {
        console.error('Error handling port message:', error);
        port.postMessage({
          type: 'error',
          error: error instanceof Error ? error.message : t('errors_unknown'),
        });
      }
    });

    port.onDisconnect.addListener(() => {
      // this event is also triggered when the side panel is closed, so we need to cancel the task
      console.log('Side panel disconnected');
      currentPort = null;
      currentExecutor?.cancel();
    });
  } else if (port.name === 'summarization-ai-connection') {
    // Handle summarization AI requests
    port.onMessage.addListener(async message => {
      try {
        switch (message.type) {
          case 'get_ai_answer': {
            const { topic, context } = message;
            logger.info('get_ai_answer request', topic);

            try {
              const providers = await llmProviderStore.getAllProviders();
              if (Object.keys(providers).length === 0) {
                return port.postMessage({
                  type: 'ai_answer',
                  success: false,
                  error: 'No API keys configured',
                });
              }

              // Get the first available provider (or use a specific one)
              const providerKeys = Object.keys(providers);
              const provider = providers[providerKeys[0]];

              // Get agent models to find a suitable model
              const agentModels = await agentModelStore.getAllAgentModels();
              const thinkerModel = agentModels.thinker || agentModels.navigator;

              if (!thinkerModel) {
                return port.postMessage({
                  type: 'ai_answer',
                  success: false,
                  error: 'No AI model configured',
                });
              }

              const { createChatModel } = await import('./agent/helper');
              const chatModel = createChatModel(provider, thinkerModel);

              const prompt = context
                ? `Based on the following context:\n\n${context}\n\nProvide a detailed answer about: ${topic}`
                : `Provide a detailed answer about: ${topic}`;

              const { HumanMessage } = await import('@langchain/core/messages');
              const response = await chatModel.invoke([new HumanMessage(prompt)]);
              const answer = response.content.toString();

              return port.postMessage({
                type: 'ai_answer',
                success: true,
                answer,
              });
            } catch (error) {
              logger.error('Error getting AI answer:', error);
              return port.postMessage({
                type: 'ai_answer',
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error',
              });
            }
          }

          case 'explore_path': {
            const { topic, prompt, context } = message;
            logger.info('explore_path request', topic, prompt);

            try {
              const providers = await llmProviderStore.getAllProviders();
              if (Object.keys(providers).length === 0) {
                return port.postMessage({
                  type: 'path_exploration',
                  success: false,
                  error: 'No API keys configured',
                });
              }

              const providerKeys = Object.keys(providers);
              const provider = providers[providerKeys[0]];

              const agentModels = await agentModelStore.getAllAgentModels();
              const thinkerModel = agentModels.thinker || agentModels.navigator;

              if (!thinkerModel) {
                return port.postMessage({
                  type: 'path_exploration',
                  success: false,
                  error: 'No AI model configured',
                });
              }

              const { createChatModel } = await import('./agent/helper');
              const chatModel = createChatModel(provider, thinkerModel);

              const fullPrompt = context
                ? `Topic: ${topic}\nContext: ${context}\n\nUser's question/prompt: ${prompt}\n\nPlease provide a detailed answer.`
                : `Topic: ${topic}\n\nUser's question/prompt: ${prompt}\n\nPlease provide a detailed answer.`;

              const { HumanMessage } = await import('@langchain/core/messages');
              const response = await chatModel.invoke([new HumanMessage(fullPrompt)]);
              const answer = response.content.toString();

              return port.postMessage({
                type: 'path_exploration',
                success: true,
                answer,
              });
            } catch (error) {
              logger.error('Error exploring path:', error);
              return port.postMessage({
                type: 'path_exploration',
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error',
              });
            }
          }

          default:
            return port.postMessage({
              type: 'error',
              error: `Unknown message type: ${message.type}`,
            });
        }
      } catch (error) {
        logger.error('Error handling summarization message:', error);
        port.postMessage({
          type: 'error',
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    });

    port.onDisconnect.addListener(() => {
      logger.info('Summarization AI connection disconnected');
    });
  }
});

async function setupExecutor(taskId: string, task: string, browserContext: BrowserContext) {
  const providers = await llmProviderStore.getAllProviders();
  // if no providers, need to display the options page
  if (Object.keys(providers).length === 0) {
    throw new Error(t('bg_setup_noApiKeys'));
  }

  // Clean up any legacy validator settings for backward compatibility
  await agentModelStore.cleanupLegacyValidatorSettings();

  const agentModels = await agentModelStore.getAllAgentModels();
  // verify if every provider used in the agent models exists in the providers
  for (const agentModel of Object.values(agentModels)) {
    if (!providers[agentModel.provider]) {
      throw new Error(t('bg_setup_noProvider', [agentModel.provider]));
    }
  }

  const navigatorModel = agentModels[AgentNameEnum.Navigator];
  if (!navigatorModel) {
    throw new Error(t('bg_setup_noNavigatorModel'));
  }
  // Log the provider config being used for the navigator
  const navigatorProviderConfig = providers[navigatorModel.provider];
  const navigatorLLM = createChatModel(navigatorProviderConfig, navigatorModel);

  let thinkerLLM: BaseChatModel | null = null;
  const thinkerModel = agentModels[AgentNameEnum.thinker];
  if (thinkerModel) {
    // Log the provider config being used for the thinker
    const thinkerProviderConfig = providers[thinkerModel.provider];
    thinkerLLM = createChatModel(thinkerProviderConfig, thinkerModel);
  }

  // Apply firewall settings to browser context
  const firewall = await firewallStore.getFirewall();
  if (firewall.enabled) {
    browserContext.updateConfig({
      allowedUrls: firewall.allowList,
      deniedUrls: firewall.denyList,
    });
  } else {
    browserContext.updateConfig({
      allowedUrls: [],
      deniedUrls: [],
    });
  }

  const generalSettings = await generalSettingsStore.getSettings();
  browserContext.updateConfig({
    minimumWaitPageLoadTime: generalSettings.minWaitPageLoad / 1000.0,
    displayHighlights: generalSettings.displayHighlights,
  });

  const executor = new Executor(task, taskId, browserContext, navigatorLLM, {
    thinkerLLM: thinkerLLM ?? navigatorLLM,
    agentOptions: {
      maxSteps: generalSettings.maxSteps,
      maxFailures: generalSettings.maxFailures,
      maxActionsPerStep: generalSettings.maxActionsPerStep,
      useVision: generalSettings.useVision,
      useVisionForthinker: true,
      planningInterval: generalSettings.planningInterval,
    },
    generalSettings: generalSettings,
  });

  return executor;
}

// Broadcast message to all tabs
async function broadcastToAllTabs(message: { type: string }) {
  try {
    const tabs = await chrome.tabs.query({});
    logger.info(`Broadcasting ${message.type} to ${tabs.length} tabs`);
    for (const tab of tabs) {
      if (tab.id) {
        chrome.tabs.sendMessage(tab.id, message).catch(err => {
          // Ignore errors for tabs that don't have content script
          logger.debug(`Failed to send to tab ${tab.id}:`, err.message);
        });
      }
    }
  } catch (error) {
    logger.error('Failed to broadcast message to tabs:', error);
  }
}

// Update subscribeToExecutorEvents to use port
async function subscribeToExecutorEvents(executor: Executor) {
  // Clear previous event listeners to prevent multiple subscriptions
  executor.clearExecutionEvents();

  // Subscribe to new events
  executor.subscribeExecutionEvents(async event => {
    try {
      if (currentPort) {
        currentPort.postMessage(event);
      }
    } catch (error) {
      logger.error('Failed to send message to side panel:', error);
    }

    // Show glowing border when task starts
    if (event.state === ExecutionState.TASK_START) {
      isTaskRunning = true;
      await broadcastToAllTabs({ type: 'task_start' });
    }

    // Hide glowing border when task ends
    if (
      event.state === ExecutionState.TASK_OK ||
      event.state === ExecutionState.TASK_FAIL ||
      event.state === ExecutionState.TASK_CANCEL
    ) {
      isTaskRunning = false;
      await broadcastToAllTabs({ type: 'task_end' });
      await currentExecutor?.cleanup();
      // Don't set currentExecutor to null here - let new_task handle it
      // This allows follow_up tasks to continue working
    }
  });
}
