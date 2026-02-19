/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect, useCallback, useRef } from 'react';
import { type Message, Actors, chatHistoryStore, agentModelStore, generalSettingsStore } from '@extension/storage';
import favoritesStorage, { type FavoritePrompt } from '@extension/storage/lib/prompt/favorites';
import { t } from '@extension/i18n';
import ChatHistoryList from './components/ChatHistoryList';
import TabSelectorModal from './components/TabSelectorModal';
import { MCPConnection } from '@extension/storage/lib/types/mcp';

import { EventType, type AgentEvent, ExecutionState } from './types/event';
import './SidePanel.css';
import './styles/eclipse-ui.css';
import EclipseHeader from './components/EclipseHeader';
import EclipseContent from './components/EclipseContent';
import EclipseFooter from './components/EclipseFooter';
import EmailComposeCard from './components/EmailComposeCard';
import { type EmailData } from './components/EmailComposeModal';
import mcpSettingsStore from '@extension/storage/lib/settings/mcpSettings';
import LinkedInAutoApply from './components/LinkedInAutoApply';

// Declare chrome API types
declare global {
  interface Window {
    chrome: typeof chrome;
  }
}

const SidePanel = () => {
  const progressMessage = 'Showing progress...';
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputEnabled, setInputEnabled] = useState(true);
  const [showStopButton, setShowStopButton] = useState(false);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [showHistory, setShowHistory] = useState(false);
  const [chatSessions, setChatSessions] = useState<Array<{ id: string; title: string; createdAt: number }>>([]);
  const [isFollowUpMode, setIsFollowUpMode] = useState(false);
  const [isHistoricalSession, setIsHistoricalSession] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [favoritePrompts, setFavoritePrompts] = useState<FavoritePrompt[]>([]);
  const [hasConfiguredModels, setHasConfiguredModels] = useState<boolean | null>(null); // null = loading, false = no models, true = has models
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessingSpeech, setIsProcessingSpeech] = useState(false);
  const [isReplaying, setIsReplaying] = useState(false);
  const [replayEnabled, setReplayEnabled] = useState(false);
  const [currentAgent, setCurrentAgent] = useState<{
    type: 'thinker' | 'navigation' | 'system';
    status: 'running' | 'completed' | 'error';
  } | null>(null);
  const [agentHistory, setAgentHistory] = useState<
    Array<{
      type: 'thinker' | 'navigation' | 'system';
      status: 'completed' | 'error';
      timestamp: number;
    }>
  >([]);
  const [showAgentHistory, setShowAgentHistory] = useState(false);
  const [showSummarize, setShowSummarize] = useState(false);
  const [showLinkedIn, setShowLinkedIn] = useState(false);
  const [availableMCPs, setAvailableMCPs] = useState<MCPConnection[]>([]);
  const [showTabSelector, setShowTabSelector] = useState(false);
  const [tabSummaries] = useState<
    {
      tabId: number;
      title: string;
      url: string;
      favicon?: string;
      summary: string;
    }[]
  >([]);
  const [selectedTabUrl, setSelectedTabUrl] = useState<string>('');
  const [tabs, setTabs] = useState<Array<{ id: number; title: string; url: string; favicon?: string }>>([]);
  const [selectedTabs, setSelectedTabs] = useState<
    Array<{ id: number; title: string; url: string; favIconUrl?: string }>
  >([]);
  const [currentActiveTab, setCurrentActiveTab] = useState<{
    id: number;
    title: string;
    url: string;
    favIconUrl?: string;
  } | null>(null);

  // Debug: Log selected tabs changes
  useEffect(() => {
    console.log('Selected tabs updated:', selectedTabs);
  }, [selectedTabs]);
  const [showCurrentTabIndicator, setShowCurrentTabIndicator] = useState<boolean>(false);
  const [selectedMCPs, setSelectedMCPs] = useState<MCPConnection[]>([]);
  const [hasStartedChat, setHasStartedChat] = useState<boolean>(false);
  const [showEmailCompose, setShowEmailCompose] = useState<boolean>(false);
  const [emailData, setEmailData] = useState<Partial<EmailData>>({});
  const [selectedMode, setSelectedMode] = useState<string>('ask');
  const sessionIdRef = useRef<string | null>(null);
  const lastTaskTextRef = useRef<string>('');
  const isReplayingRef = useRef<boolean>(false);
  const portRef = useRef<chrome.runtime.Port | null>(null);
  const heartbeatIntervalRef = useRef<number | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const setInputTextRef = useRef<((text: string) => void) | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordingTimerRef = useRef<number | null>(null);

  // Force dark mode as default
  useEffect(() => {
    setIsDarkMode(true);
  }, []);

  // Check if models are configured
  useEffect(() => {
    checkModelConfiguration();
    loadAvailableMCPs();
  }, []);

  const loadAvailableMCPs = async () => {
    try {
      const conns = await mcpSettingsStore.getConnections();
      setAvailableMCPs(conns);
    } catch (error) {
      console.error('Failed to load MCP connections:', error);
    }
  };
  const checkModelConfiguration = useCallback(async () => {
    try {
      const configuredAgents = await agentModelStore.getConfiguredAgents();

      // Check if at least one agent (preferably Navigator) is configured
      const hasAtLeastOneModel = configuredAgents.length > 0;
      setHasConfiguredModels(hasAtLeastOneModel);
    } catch (error) {
      console.error('Error checking model configuration:', error);
      setHasConfiguredModels(false);
    }
  }, []);

  // Load general settings to check if replay is enabled
  const loadGeneralSettings = useCallback(async () => {
    try {
      const settings = await generalSettingsStore.getSettings();
      setReplayEnabled(settings.replayHistoricalTasks);
    } catch (error) {
      console.error('Error loading general settings:', error);
      setReplayEnabled(false);
    }
  }, []);

  // Check model configuration on mount
  useEffect(() => {
    checkModelConfiguration();
    loadGeneralSettings();
  }, [checkModelConfiguration, loadGeneralSettings]);

  // Fetch browser tabs - updates in real-time
  useEffect(() => {
    const fetchTabs = async () => {
      try {
        const currentTabs = await chrome.tabs.query({ currentWindow: true });
        const tabsData = currentTabs.map(tab => ({
          id: tab.id || 0,
          title: tab.title || 'Untitled',
          url: tab.url || 'about:blank',
          favicon: tab.favIconUrl,
        }));
        setTabs(tabsData);
      } catch (error) {
        console.error('Error fetching tabs:', error);
      }
    };

    // Fetch immediately on mount
    fetchTabs();

    // Create separate listeners
    const onTabUpdated = (tabId: number) => {
      fetchTabs();
    };

    const onTabRemoved = (tabId: number) => {
      fetchTabs();
    };

    const onTabCreated = () => {
      fetchTabs();
    };

    // Add all listeners for tab changes
    chrome.tabs.onUpdated.addListener(onTabUpdated);
    chrome.tabs.onRemoved.addListener(onTabRemoved);
    chrome.tabs.onCreated.addListener(onTabCreated);

    // Cleanup
    return () => {
      chrome.tabs.onUpdated.removeListener(onTabUpdated);
      chrome.tabs.onRemoved.removeListener(onTabRemoved);
      chrome.tabs.onCreated.removeListener(onTabCreated);
    };
  }, []);

  // Re-check model configuration when the side panel becomes visible again
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        // Panel became visible, re-check configuration and settings
        checkModelConfiguration();
        loadGeneralSettings();
      }
    };

    const handleFocus = () => {
      // Panel gained focus, re-check configuration and settings
      checkModelConfiguration();
      loadGeneralSettings();
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleFocus);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
    };
  }, [checkModelConfiguration, loadGeneralSettings]);

  useEffect(() => {
    sessionIdRef.current = currentSessionId;
  }, [currentSessionId]);

  useEffect(() => {
    isReplayingRef.current = isReplaying;
  }, [isReplaying]);

  const appendMessage = useCallback((newMessage: Message, sessionId?: string | null) => {
    // Don't save progress messages
    const isProgressMessage = newMessage.content === progressMessage;

    setMessages(prev => {
      const filteredMessages = prev.filter((msg, idx) => !(msg.content === progressMessage && idx === prev.length - 1));
      return [...filteredMessages, newMessage];
    });

    // Use provided sessionId if available, otherwise fall back to sessionIdRef.current
    const effectiveSessionId = sessionId !== undefined ? sessionId : sessionIdRef.current;

    console.log('sessionId', effectiveSessionId);

    // Save message to storage if we have a session and it's not a progress message
    if (effectiveSessionId && !isProgressMessage) {
      chatHistoryStore
        .addMessage(effectiveSessionId, newMessage)
        .catch(err => console.error('Failed to save message to history:', err));
    }
  }, []);

  const handleTaskState = useCallback(
    (event: AgentEvent) => {
      const { actor, state, timestamp, data } = event;
      const content = data?.details;
      let skip = true;
      let displayProgress = false;

      // Track current agent and history
      if (actor === Actors.thinker) {
        if (state === ExecutionState.STEP_START) {
          setCurrentAgent({ type: 'thinker', status: 'running' });
        } else if (state === ExecutionState.STEP_OK) {
          setCurrentAgent(null);
          setAgentHistory(prev => [...prev, { type: 'thinker', status: 'completed', timestamp: Date.now() }]);
        } else if (state === ExecutionState.STEP_FAIL) {
          setCurrentAgent(null);
          setAgentHistory(prev => [...prev, { type: 'thinker', status: 'error', timestamp: Date.now() }]);
        }
      } else if (actor === Actors.NAVIGATOR) {
        if (state === ExecutionState.STEP_START) {
          setCurrentAgent({ type: 'navigation', status: 'running' });
        } else if (state === ExecutionState.STEP_OK) {
          setCurrentAgent(null);
          setAgentHistory(prev => [...prev, { type: 'navigation', status: 'completed', timestamp: Date.now() }]);
        } else if (state === ExecutionState.STEP_FAIL) {
          setCurrentAgent(null);
          setAgentHistory(prev => [...prev, { type: 'navigation', status: 'error', timestamp: Date.now() }]);
        }
      }

      switch (actor) {
        case Actors.SYSTEM:
          switch (state) {
            case ExecutionState.TASK_START:
              // Reset historical session flag when a new task starts
              setIsHistoricalSession(false);
              // Don't reset currentAgent - let it show initial status if in agent mode
              // It will be updated by individual agent events (thinker, navigator)
              setAgentHistory([]);
              setShowAgentHistory(false);
              break;
            case ExecutionState.TASK_OK:
              setIsFollowUpMode(false); // Executor cleanup happens, so reset to allow new tasks
              setInputEnabled(true);
              setShowStopButton(false);
              setIsReplaying(false);
              skip = false; // Show completion message with final answer

              // Check if task contains summarize keywords and open summarization page
              const taskText = lastTaskTextRef.current;
              if (taskText && containsSummarizeKeywords(taskText)) {
                const effectiveTaskId = data?.taskId || '';
                const finalText = (content || '').trim();
                if (effectiveTaskId && finalText) {
                  chrome.storage.local
                    .set({
                      [`summarization_result_${effectiveTaskId}`]: {
                        task: taskText,
                        result: finalText,
                        timestamp: Date.now(),
                      },
                    })
                    .catch(err => console.error('Failed to store summarization result:', err));
                }
                openSummarizationPage(effectiveTaskId, taskText);
              }
              break;
            case ExecutionState.TASK_FAIL:
              setIsFollowUpMode(false); // Executor cleanup happens, so reset to allow new tasks
              setInputEnabled(true);
              setShowStopButton(false);
              setIsReplaying(false);
              skip = false;
              break;
            case ExecutionState.TASK_CANCEL:
              setIsFollowUpMode(false);
              setInputEnabled(true);
              setShowStopButton(false);
              setIsReplaying(false);
              skip = false;
              break;
            case ExecutionState.TASK_PAUSE:
              break;
            case ExecutionState.TASK_RESUME:
              break;
            default:
              console.error('Invalid task state', state);
              return;
          }
          break;
        case Actors.USER:
          break;
        case Actors.thinker:
          switch (state) {
            case ExecutionState.STEP_START:
              displayProgress = false;
              break;
            case ExecutionState.STEP_OK:
              skip = true; // Hide thinker messages from UI
              break;
            case ExecutionState.STEP_FAIL:
              skip = true; // Hide thinker messages from UI
              break;
            case ExecutionState.STEP_CANCEL:
              break;
            default:
              console.error('Invalid step state', state);
              return;
          }
          break;
        case Actors.NAVIGATOR:
          switch (state) {
            case ExecutionState.STEP_START:
              displayProgress = false;
              break;
            case ExecutionState.STEP_OK:
              displayProgress = false;
              skip = true; // Hide navigator messages from UI
              break;
            case ExecutionState.STEP_FAIL:
              skip = true; // Hide navigator messages from UI
              displayProgress = false;
              break;
            case ExecutionState.STEP_CANCEL:
              displayProgress = false;
              break;
            case ExecutionState.ACT_START:
              if (content !== 'cache_content') {
                // skip to display caching content
                skip = true; // Hide action details from UI
              }
              break;
            case ExecutionState.ACT_OK:
              skip = true; // Hide action success messages
              break;
            case ExecutionState.ACT_FAIL:
              skip = true; // Hide action failure details, show in agent status only
              break;
            default:
              console.error('Invalid action', state);
              return;
          }
          break;
        case Actors.VALIDATOR:
          // Handle legacy validator events from historical messages
          switch (state) {
            case ExecutionState.STEP_START:
              displayProgress = true;
              break;
            case ExecutionState.STEP_OK:
              skip = false;
              break;
            case ExecutionState.STEP_FAIL:
              skip = false;
              break;
            default:
              console.error('Invalid validation', state);
              return;
          }
          break;
        default:
          console.error('Unknown actor', actor);
          return;
      }

      if (!skip) {
        appendMessage({
          actor,
          content: content || '',
          timestamp: timestamp,
        });
      }

      if (displayProgress) {
        appendMessage({
          actor,
          content: progressMessage,
          timestamp: timestamp,
        });
      }
    },
    [appendMessage],
  );

  // Stop heartbeat and close connection
  const stopConnection = useCallback(() => {
    if (heartbeatIntervalRef.current) {
      clearInterval(heartbeatIntervalRef.current);
      heartbeatIntervalRef.current = null;
    }
    if (portRef.current) {
      portRef.current.disconnect();
      portRef.current = null;
    }
  }, []);

  // Setup connection management
  const setupConnection = useCallback(() => {
    // Only setup if no existing connection
    if (portRef.current) {
      return;
    }

    try {
      portRef.current = chrome.runtime.connect({ name: 'side-panel-connection' });

      // biome-ignore lint/suspicious/noExplicitAny: <explanation>
      portRef.current.onMessage.addListener((message: any) => {
        // Add type checking for message
        if (message && message.type === EventType.EXECUTION) {
          handleTaskState(message);
        } else if (message && message.type === 'error') {
          // Handle error messages from service worker
          appendMessage({
            actor: Actors.SYSTEM,
            content: message.error || t('errors_unknown'),
            timestamp: Date.now(),
          });
          setInputEnabled(true);
          setShowStopButton(false);
        } else if (message && message.type === 'speech_to_text_result') {
          // Handle speech-to-text result
          if (message.text && setInputTextRef.current) {
            setInputTextRef.current(message.text);
          }
          setIsProcessingSpeech(false);
        } else if (message && message.type === 'speech_to_text_error') {
          // Handle speech-to-text error
          appendMessage({
            actor: Actors.SYSTEM,
            content: message.error || t('chat_stt_recognitionFailed'),
            timestamp: Date.now(),
          });
          setIsProcessingSpeech(false);
        } else if (message && message.type === 'heartbeat_ack') {
          console.log('Heartbeat acknowledged');
        }
      });

      portRef.current.onDisconnect.addListener(() => {
        const error = chrome.runtime.lastError;
        console.log('Connection disconnected', error ? `Error: ${error.message}` : '');
        portRef.current = null;
        if (heartbeatIntervalRef.current) {
          clearInterval(heartbeatIntervalRef.current);
          heartbeatIntervalRef.current = null;
        }
        setInputEnabled(true);
        setShowStopButton(false);
      });

      // Setup heartbeat interval
      if (heartbeatIntervalRef.current) {
        clearInterval(heartbeatIntervalRef.current);
      }

      heartbeatIntervalRef.current = window.setInterval(() => {
        if (portRef.current?.name === 'side-panel-connection') {
          try {
            portRef.current.postMessage({ type: 'heartbeat' });
          } catch (error) {
            console.error('Heartbeat failed:', error);
            stopConnection(); // Stop connection if heartbeat fails
          }
        } else {
          stopConnection(); // Stop if port is invalid
        }
      }, 25000);
    } catch (error) {
      console.error('Failed to establish connection:', error);
      appendMessage({
        actor: Actors.SYSTEM,
        content: t('errors_conn_serviceWorker'),
        timestamp: Date.now(),
      });
      // Clear any references since connection failed
      portRef.current = null;
    }
  }, [handleTaskState, appendMessage, stopConnection]);

  // Add safety check for message sending
  const sendMessage = useCallback(
    // biome-ignore lint/suspicious/noExplicitAny: <explanation>
    (message: any) => {
      if (portRef.current?.name !== 'side-panel-connection') {
        throw new Error('No valid connection available');
      }
      try {
        portRef.current.postMessage(message);
      } catch (error) {
        console.error('Failed to send message:', error);
        stopConnection(); // Stop connection when message sending fails
        throw error;
      }
    },
    [stopConnection],
  );

  // Handle replay command
  const handleReplay = async (historySessionId: string): Promise<void> => {
    try {
      // Check if replay is enabled in settings
      if (!replayEnabled) {
        appendMessage({
          actor: Actors.SYSTEM,
          content: t('chat_replay_disabled'),
          timestamp: Date.now(),
        });
        return;
      }

      // Check if history exists using loadAgentStepHistory
      const historyData = await chatHistoryStore.loadAgentStepHistory(historySessionId);
      if (!historyData) {
        appendMessage({
          actor: Actors.SYSTEM,
          content: t('chat_replay_noHistory', historySessionId.substring(0, 20)),
          timestamp: Date.now(),
        });
        return;
      }

      // Get current tab ID
      const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
      const tabId = tabs[0]?.id;
      if (!tabId) {
        throw new Error('No active tab found');
      }

      // Clear messages if we're in a historical session
      if (isHistoricalSession) {
        setMessages([]);
      }

      // Create a new chat session for this replay task
      const newSession = await chatHistoryStore.createSession(`Replay of ${historySessionId.substring(0, 20)}...`);
      console.log('newSession for replay', newSession);

      // Store the new session ID in both state and ref
      const newTaskId = newSession.id;
      setCurrentSessionId(newTaskId);
      sessionIdRef.current = newTaskId;

      // Send replay command to background
      setInputEnabled(false);
      setShowStopButton(true);

      // Reset follow-up mode and historical session flags
      setIsFollowUpMode(false);
      setIsHistoricalSession(false);

      const userMessage = {
        actor: Actors.USER,
        content: `/replay ${historySessionId}`,
        timestamp: Date.now(),
      };

      // Add the user message to the new session
      appendMessage(userMessage, sessionIdRef.current);

      // Setup connection if not exists
      if (!portRef.current) {
        setupConnection();
      }

      // Send replay command to background with the task from history
      portRef.current?.postMessage({
        type: 'replay',
        taskId: newTaskId,
        tabId: tabId,
        historySessionId: historySessionId,
        task: historyData.task, // Add the task from history
      });

      appendMessage({
        actor: Actors.SYSTEM,
        content: t('chat_replay_starting', historyData.task),
        timestamp: Date.now(),
      });
      setIsReplaying(true);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      appendMessage({
        actor: Actors.SYSTEM,
        content: t('chat_replay_failed', errorMessage),
        timestamp: Date.now(),
      });
    }
  };

  // Handle chat commands that start with /
  const handleCommand = async (command: string): Promise<boolean> => {
    try {
      // Setup connection if not exists
      if (!portRef.current) {
        setupConnection();
      }

      // Handle different commands
      if (command === '/state') {
        portRef.current?.postMessage({
          type: 'state',
        });
        return true;
      }

      if (command === '/nohighlight') {
        portRef.current?.postMessage({
          type: 'nohighlight',
        });
        return true;
      }

      if (command.startsWith('/replay ')) {
        // Parse replay command: /replay <historySessionId>
        // Handle multiple spaces by filtering out empty strings
        const parts = command.split(' ').filter(part => part.trim() !== '');
        if (parts.length !== 2) {
          appendMessage({
            actor: Actors.SYSTEM,
            content: t('chat_replay_invalidArgs'),
            timestamp: Date.now(),
          });
          return true;
        }

        const historySessionId = parts[1];
        await handleReplay(historySessionId);
        return true;
      }

      // Unsupported command
      appendMessage({
        actor: Actors.SYSTEM,
        content: t('errors_cmd_unknown', command),
        timestamp: Date.now(),
      });
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      console.error('Command error', errorMessage);
      appendMessage({
        actor: Actors.SYSTEM,
        content: errorMessage,
        timestamp: Date.now(),
      });
      return true;
    }
  };

  const handleSendMessage = async (text: string, displayText?: string) => {
    console.log('handleSendMessage', text);

    // Trim the input text first
    const trimmedText = text.trim();

    if (!trimmedText) return;

    // Check if the input is a command (starts with /)
    if (trimmedText.startsWith('/')) {
      // Process command and return if it was handled
      const wasHandled = await handleCommand(trimmedText);
      if (wasHandled) return;
    }

    // Block sending messages in historical sessions
    if (isHistoricalSession) {
      console.log('Cannot send messages in historical sessions');
      return;
    }

    try {
      const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
      const tabId = tabs[0]?.id;
      if (!tabId) {
        throw new Error('No active tab found');
      }

      setInputEnabled(false);
      setShowStopButton(true);

      // Show initial agent status if in agent mode
      if (selectedMode === 'agent') {
        // Set initial status to show that agent is starting (Planning phase)
        setCurrentAgent({ type: 'thinker', status: 'running' });
        console.log('Agent mode: Setting initial Planning status');
      }

      // Create a new chat session for this task if not in follow-up mode
      if (!isFollowUpMode) {
        // Use display text for session title if available, otherwise use full text
        const titleText = displayText || text;
        const newSession = await chatHistoryStore.createSession(
          titleText.substring(0, 50) + (titleText.length > 50 ? '...' : ''),
        );
        console.log('newSession', newSession);

        // Store the session ID in both state and ref
        const sessionId = newSession.id;
        setCurrentSessionId(sessionId);
        sessionIdRef.current = sessionId;

        // Store task text for summarization detection
        lastTaskTextRef.current = text.toLowerCase();
      }

      // Extract links from text (use displayText if available to avoid capturing URLs from hidden metadata)
      const urlRegex = /(https?:\/\/[^\s]+)/g;
      const links = (displayText || text).match(urlRegex) || [];

      // Prepare tabs data (include current tab if indicator is shown)
      const tabsToInclude: Array<{ id: number; title: string; url: string; favIconUrl?: string }> = [];

      // Add selected tabs
      if (selectedTabs.length > 0) {
        tabsToInclude.push(...selectedTabs);
      }

      // Add current tab if indicator is shown
      if (showCurrentTabIndicator && currentActiveTab) {
        // Check if current tab is not already in selected tabs
        const isAlreadyIncluded = selectedTabs.some(t => t.id === currentActiveTab.id);
        if (!isAlreadyIncluded) {
          tabsToInclude.push(currentActiveTab);
        }
      }

      const userMessage = {
        actor: Actors.USER,
        content: displayText || text, // Use display text for chat UI, full text for background service
        timestamp: Date.now(),
        tabs: tabsToInclude.length > 0 ? tabsToInclude : undefined,
        links: links.length > 0 ? links : undefined,
      };

      // Pass the sessionId directly to appendMessage
      appendMessage(userMessage, sessionIdRef.current);

      // Setup connection if not exists
      if (!portRef.current) {
        setupConnection();
      }

      // Send message using the utility function
      if (isFollowUpMode) {
        // Send as follow-up task
        await sendMessage({
          type: 'follow_up_task',
          task: text,
          taskId: sessionIdRef.current,
          tabId,
        });
        console.log('follow_up_task sent', text, tabId, sessionIdRef.current);
      } else {
        // Send as new task
        await sendMessage({
          type: 'new_task',
          task: text,
          taskId: sessionIdRef.current,
          tabId,
        });
        console.log('new_task sent', text, tabId, sessionIdRef.current);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      console.error('Task error', errorMessage);
      appendMessage({
        actor: Actors.SYSTEM,
        content: errorMessage,
        timestamp: Date.now(),
      });
      setInputEnabled(true);
      setShowStopButton(false);
      stopConnection();
    }
  };

  const handleStopTask = async () => {
    try {
      portRef.current?.postMessage({
        type: 'cancel_task',
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      console.error('cancel_task error', errorMessage);
      appendMessage({
        actor: Actors.SYSTEM,
        content: errorMessage,
        timestamp: Date.now(),
      });
    }
    setInputEnabled(true);
    setShowStopButton(false);
  };

  const handleNewChat = () => {
    // Clear messages and start a new chat
    setMessages([]);
    setCurrentSessionId(null);
    sessionIdRef.current = null;
    setInputEnabled(true);
    setShowStopButton(false);
    setIsFollowUpMode(false);
    setIsHistoricalSession(false);

    // Disconnect any existing connection
    stopConnection();
  };

  const loadChatSessions = useCallback(async () => {
    try {
      const sessions = await chatHistoryStore.getSessionsMetadata();
      setChatSessions(sessions.sort((a, b) => b.createdAt - a.createdAt));
    } catch (error) {
      console.error('Failed to load chat sessions:', error);
    }
  }, []);

  const handleLoadHistory = async () => {
    await loadChatSessions();
    setShowHistory(true);
  };

  const handleBackToChat = (reset = false) => {
    setShowHistory(false);
    if (reset) {
      setCurrentSessionId(null);
      setMessages([]);
      setIsFollowUpMode(false);
      setIsHistoricalSession(false);
    }
  };

  const handleSessionSelect = async (sessionId: string) => {
    try {
      const fullSession = await chatHistoryStore.getSession(sessionId);
      if (fullSession && fullSession.messages.length > 0) {
        setCurrentSessionId(fullSession.id);
        setMessages(fullSession.messages);
        setIsFollowUpMode(false);
        setIsHistoricalSession(true); // Mark this as a historical session
        console.log('history session selected', sessionId);
      }
      setShowHistory(false);
    } catch (error) {
      console.error('Failed to load session:', error);
    }
  };

  const handleSessionDelete = async (sessionId: string) => {
    try {
      await chatHistoryStore.deleteSession(sessionId);
      await loadChatSessions();
      if (sessionId === currentSessionId) {
        setMessages([]);
        setCurrentSessionId(null);
      }
    } catch (error) {
      console.error('Failed to delete session:', error);
    }
  };

  const handleSessionBookmark = async (sessionId: string) => {
    try {
      const fullSession = await chatHistoryStore.getSession(sessionId);

      if (fullSession && fullSession.messages.length > 0) {
        // Get the session title
        const sessionTitle = fullSession.title;
        // Get the first 8 words of the title
        const title = sessionTitle.split(' ').slice(0, 8).join(' ');

        // Get the first message content (the task)
        const taskContent = fullSession.messages[0]?.content || '';

        // Add to favorites storage
        await favoritesStorage.addPrompt(title, taskContent);

        // Update favorites in the UI
        const prompts = await favoritesStorage.getAllPrompts();
        setFavoritePrompts(prompts);

        // Return to chat view after pinning
        handleBackToChat(true);
      }
    } catch (error) {
      console.error('Failed to pin session to favorites:', error);
    }
  };

  const handleBookmarkSelect = (content: string) => {
    if (setInputTextRef.current) {
      setInputTextRef.current(content);
    }
  };

  const handleBookmarkUpdateTitle = async (id: number, title: string) => {
    try {
      await favoritesStorage.updatePromptTitle(id, title);

      // Update favorites in the UI
      const prompts = await favoritesStorage.getAllPrompts();
      setFavoritePrompts(prompts);
    } catch (error) {
      console.error('Failed to update favorite prompt title:', error);
    }
  };

  const handleBookmarkDelete = async (id: number) => {
    try {
      await favoritesStorage.removePrompt(id);

      // Update favorites in the UI
      const prompts = await favoritesStorage.getAllPrompts();
      setFavoritePrompts(prompts);
    } catch (error) {
      console.error('Failed to delete favorite prompt:', error);
    }
  };

  const handleBookmarkReorder = async (draggedId: number, targetId: number) => {
    try {
      // Directly pass IDs to storage function - it now handles the reordering logic
      await favoritesStorage.reorderPrompts(draggedId, targetId);

      // Fetch the updated list from storage to get the new IDs and reflect the authoritative order
      const updatedPromptsFromStorage = await favoritesStorage.getAllPrompts();
      setFavoritePrompts(updatedPromptsFromStorage);
    } catch (error) {
      console.error('Failed to reorder favorite prompts:', error);
    }
  };

  const handleCurrentTabClick = () => {
    setShowTabSelector(true);
  };

  const handleTabsSelected = async (tabIds: number[]) => {
    if (tabIds.length === 0) return;

    try {
      // Fetch tab details
      const allTabs = await chrome.tabs.query({ currentWindow: true });
      const selectedTabs = allTabs.filter(tab => tabIds.includes(tab.id || 0));

      // Build tab information
      let tabInfo = '';
      selectedTabs.forEach((tab, index) => {
        tabInfo += `\n\nTab ${index + 1}:\nTitle: ${tab.title || 'Untitled'}\nURL: ${tab.url}`;
      });

      // Show user message
      appendMessage({
        actor: Actors.USER,
        content: `Summarize ${selectedTabs.length} selected tab(s)`,
        timestamp: Date.now(),
      });

      // Show AI response with tab summaries
      const summaryMessage = `Here are the ${selectedTabs.length} tab(s) you selected for summarization:${tabInfo}\n\nTo get detailed summaries, I would need to access the actual content of these pages. Since I'm working with just the URLs and titles, I can provide general information based on the URLs.\n\nWould you like me to navigate to these pages and extract their content for a detailed summary?`;

      appendMessage({
        actor: Actors.SYSTEM,
        content: summaryMessage,
        timestamp: Date.now(),
      });
    } catch (error) {
      console.error('Failed to get tab information:', error);
      appendMessage({
        actor: Actors.SYSTEM,
        content: 'Failed to get tab information for summarization',
        timestamp: Date.now(),
      });
    }
  };

  // Load favorite prompts from storage
  useEffect(() => {
    const loadFavorites = async () => {
      try {
        const prompts = await favoritesStorage.getAllPrompts();
        setFavoritePrompts(prompts);
      } catch (error) {
        console.error('Failed to load favorite prompts:', error);
      }
    };

    loadFavorites();
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      // Stop recording if active
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
        mediaRecorderRef.current.stop();
      }
      // Clear recording timer
      if (recordingTimerRef.current) {
        clearTimeout(recordingTimerRef.current);
        recordingTimerRef.current = null;
      }
      stopConnection();
    };
  }, [stopConnection]);

  // Scroll to bottom when new messages arrive
  // biome-ignore lint/correctness/useExhaustiveDependencies: <explanation>
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleMicClick = async () => {
    if (isRecording) {
      // Stop recording
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
        mediaRecorderRef.current.stop();
      }
      // Clear the timer
      if (recordingTimerRef.current) {
        clearTimeout(recordingTimerRef.current);
        recordingTimerRef.current = null;
      }
      setIsRecording(false);
      return;
    }

    try {
      // First check if permission is already granted
      const permissionStatus = await navigator.permissions.query({ name: 'microphone' as PermissionName });

      if (permissionStatus.state === 'denied') {
        appendMessage({
          actor: Actors.SYSTEM,
          content: t('chat_stt_microphone_permissionDenied'),
          timestamp: Date.now(),
        });
        return;
      }

      // If permission is not granted, open permission page
      if (permissionStatus.state !== 'granted') {
        const permissionUrl = chrome.runtime.getURL('permission/index.html');

        // Open permission page in a new window
        chrome.windows.create(
          {
            url: permissionUrl,
            type: 'popup',
            width: 500,
            height: 600,
          },
          createdWindow => {
            if (createdWindow?.id) {
              // Listen for window close to check permission status
              chrome.windows.onRemoved.addListener(function onWindowClose(windowId) {
                if (windowId === createdWindow.id) {
                  chrome.windows.onRemoved.removeListener(onWindowClose);
                  // Check permission status after window closes
                  setTimeout(async () => {
                    try {
                      const newPermissionStatus = await navigator.permissions.query({
                        name: 'microphone' as PermissionName,
                      });
                      // Only retry if permission was granted
                      if (newPermissionStatus.state === 'granted') {
                        handleMicClick();
                      }
                      // If denied or prompt, do nothing - let user manually try again
                    } catch (error) {
                      console.error('Failed to check permission status:', error);
                    }
                  }, 500);
                }
              });
            }
          },
        );
        return;
      }

      // Permission granted - proceed with recording
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      // Clear previous audio chunks
      audioChunksRef.current = [];

      // Create MediaRecorder
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      // Handle data available event
      mediaRecorder.ondataavailable = event => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      // Handle stop event
      mediaRecorder.onstop = async () => {
        // Stop all tracks to release microphone
        stream.getTracks().forEach(track => track.stop());

        if (audioChunksRef.current.length > 0) {
          // Create audio blob
          const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });

          // Convert blob to base64
          const reader = new FileReader();
          reader.onloadend = () => {
            const base64Audio = reader.result as string;

            // Setup connection if not exists
            if (!portRef.current) {
              setupConnection();
            }

            // Send audio to backend for speech-to-text conversion
            try {
              setIsProcessingSpeech(true);
              portRef.current?.postMessage({
                type: 'speech_to_text',
                audio: base64Audio,
              });
            } catch (error) {
              console.error('Failed to send audio for speech-to-text:', error);
              appendMessage({
                actor: Actors.SYSTEM,
                content: t('chat_stt_processingFailed'),
                timestamp: Date.now(),
              });
              setIsRecording(false);
              setIsProcessingSpeech(false);
            }
          };
          reader.readAsDataURL(audioBlob);
        }
      };

      // Set up 2-minute duration limit
      const maxDuration = 2 * 60 * 1000;
      recordingTimerRef.current = window.setTimeout(() => {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
          mediaRecorderRef.current.stop();
        }
        setIsRecording(false);
        setIsProcessingSpeech(true);
        recordingTimerRef.current = null;
      }, maxDuration);

      // Start recording
      mediaRecorder.start();
      setIsRecording(true);
    } catch (error) {
      console.error('Error accessing microphone:', error);

      let errorMessage = t('chat_stt_microphone_accessFailed');
      if (error instanceof Error) {
        if (error.name === 'NotAllowedError') {
          errorMessage += t('chat_stt_microphone_grantPermission');
        } else if (error.name === 'NotFoundError') {
          errorMessage += t('chat_stt_microphone_notFound');
        } else {
          errorMessage += error.message;
        }
      }

      appendMessage({
        actor: Actors.SYSTEM,
        content: errorMessage,
        timestamp: Date.now(),
      });
      setIsRecording(false);
    }
  };

  // Convert messages to Eclipse format
  const eclipseMessages: {
    id?: string;
    type: 'user' | 'assistant' | 'system' | 'email_compose';
    content: string;
    timestamp?: number;
    tabs?: any[];
    links?: string[];
    emailData?: any;
  }[] = messages.map(msg => ({
    id: `${msg.actor}-${msg.timestamp}`,
    type:
      msg.content === 'email_compose'
        ? 'email_compose'
        : msg.actor === Actors.USER
          ? 'user'
          : msg.actor === Actors.SYSTEM
            ? 'system'
            : 'assistant',
    content: msg.content,
    timestamp: msg.timestamp,
    tabs: (msg as any).tabs,
    links: (msg as any).links,
    emailData: (msg as any).emailData,
  }));

  // Update hasStartedChat when messages change
  useEffect(() => {
    if (messages.length > 0 && !hasStartedChat) {
      setHasStartedChat(true);
    }
  }, [messages.length, hasStartedChat]);

  // Get current active tab
  useEffect(() => {
    const getCurrentTab = async () => {
      try {
        const currentTabs = await chrome.tabs.query({ active: true, currentWindow: true });
        if (currentTabs[0]) {
          setCurrentActiveTab({
            id: currentTabs[0].id || 0,
            title: currentTabs[0].title || 'Untitled',
            url: currentTabs[0].url || 'about:blank',
            favIconUrl: currentTabs[0].favIconUrl,
          });
        }
      } catch (error) {
        console.error('Error getting current tab:', error);
      }
    };
    getCurrentTab();
  }, []);

  const handleAddTab = (tab: { id: number; title: string; url: string; favIconUrl?: string }): boolean => {
    console.log('🔵 handleAddTab called with:', tab.title, tab.id);
    console.log('Current selectedTabs count:', selectedTabs.length);
    console.log('showCurrentTabIndicator:', showCurrentTabIndicator);

    // Check if already selected - if yes, don't add
    const alreadySelected = selectedTabs.find(t => t.id === tab.id);
    if (alreadySelected) {
      console.log('⚠️ Tab already selected, skipping add');
      return false;
    }

    const totalSelected = selectedTabs.length + (showCurrentTabIndicator ? 1 : 0);
    console.log('Total selected:', totalSelected, 'Max: 5');

    if (totalSelected >= 5) {
      console.log('❌ Cannot add tab - limit reached (5 tabs max)');
      return false;
    }

    // Don't add if it's the current active tab (unless current tab indicator is not shown)
    if (currentActiveTab && currentActiveTab.id === tab.id && showCurrentTabIndicator) {
      console.log('⚠️ Tab is current active tab, skipping');
      return false;
    }

    // Add the tab
    setSelectedTabs(prev => {
      const updated = [...prev, tab];
      console.log('✅ Tab added successfully:', tab.title, 'Total selected:', updated.length);
      console.log('Updated selectedTabs:', updated);
      return updated;
    });
    return true;
  };

  const handleRemoveTab = (tabId: number) => {
    setSelectedTabs(prev => {
      const filtered = prev.filter(t => t.id !== tabId);
      console.log('Tab removed:', tabId, 'Remaining:', filtered.length);
      return filtered;
    });
  };

  const handleToggleCurrentTab = () => {
    if (currentActiveTab) {
      if (showCurrentTabIndicator) {
        setShowCurrentTabIndicator(false);
      } else {
        setShowCurrentTabIndicator(true);
      }
    }
  };

  const handleRemoveCurrentTab = () => {
    setShowCurrentTabIndicator(false);
  };

  const handleAddMCP = (conn: any) => {
    // Avoid duplicates
    if (!selectedMCPs.find(c => c.id === conn.id)) {
      setSelectedMCPs(prev => [...prev, conn]);
    }
  };

  const handleRemoveMCP = (id: string) => {
    setSelectedMCPs(prev => prev.filter(c => c.id !== id));
  };

  // Detect if message is an email request and parse email data
  const detectAndParseEmail = (text: string): Partial<EmailData> | null => {
    const normalized = text.toLowerCase();

    // Check for email keywords
    const emailKeywords = ['email', 'mail', 'send', 'bhejo', 'bhej', 'send karo'];
    const hasEmailKeyword = emailKeywords.some(keyword => normalized.includes(keyword));

    if (!hasEmailKeyword) return null;

    // Extract email address (to field)
    const emailRegex = /([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9_-]+)/gi;
    const emails = text.match(emailRegex);

    if (!emails || emails.length === 0) return null;

    const to = emails[0];

    // Extract subject from common patterns
    let subject = '';

    // Pattern 1: "about [subject]"
    const aboutMatch = text.match(/about\s+(.+?)(?:\s+mail|\s+email|$)/i);
    if (aboutMatch) {
      subject = aboutMatch[1].trim();
    }

    // Pattern 2: Extract context from the message
    // Remove email address and keywords to get the actual content
    let context = text
      .replace(emailRegex, '')
      .replace(/email|mail|send|bhejo|bhej|send karo/gi, '')
      .trim();

    // Use context as subject if no explicit subject found
    if (!subject && context) {
      // Take first few words as subject
      const words = context.split(' ').filter(w => w.length > 0);
      subject = words.slice(0, 3).join(' ');
      if (subject.length > 50) {
        subject = subject.substring(0, 50) + '...';
      }
    }

    // Return basic data - AI will generate the body
    return {
      to,
      subject: subject || 'Email from Cosmos AI',
      body: '', // Will be filled by AI
      userRequest: text, // Store original request for AI
    } as any;
  };

  const handleFooterSendMessage = (text: string, mode?: string, displayText?: string) => {
    // Check if this is an email request
    const emailData = detectAndParseEmail(displayText || text);

    if (emailData) {
      // Show user message
      appendMessage({
        actor: Actors.USER,
        content: displayText || text,
        timestamp: Date.now(),
      });

      // Send task to AI to generate email content
      const emailTask = `Generate a professional email with the following details:
- To: ${emailData.to}
- Subject: ${emailData.subject}
- User's request: ${(emailData as any).userRequest}

Please write a complete, professional email body based on the user's request. The email should be polite, clear, and appropriate for the context.`;

      // Send to AI for email generation
      handleSendMessage(emailTask, displayText);

      // Note: The email compose card will be shown after AI generates the content
      // For now, we'll show it with the basic data and let user edit
      setTimeout(() => {
        appendMessage({
          actor: Actors.SYSTEM,
          content: 'email_compose',
          timestamp: Date.now(),
          emailData: emailData,
        } as any);

        setEmailData(emailData);
        setShowEmailCompose(true);
      }, 500);

      return;
    }

    // If not an email request, handle normally
    handleSendMessage(text, displayText);
  };

  const handleModeChange = (mode: string) => {
    setSelectedMode(mode);
  };

  // Handle email sending through Gmail MCP
  const handleSendEmail = async (emailData: EmailData) => {
    try {
      // Find Gmail connection
      const gmailConnection = availableMCPs.find(
        conn => conn.serviceType === 'gmail' || conn.serviceName.toLowerCase().includes('gmail'),
      );

      if (!gmailConnection) {
        throw new Error('Gmail connection not found. Please configure Gmail in settings.');
      }

      // Create email task through MCP
      await mcpSettingsStore.addTask({
        connectionId: gmailConnection.id,
        serviceType: gmailConnection.serviceType,
        action: 'send_email',
        parameters: {
          to: emailData.to,
          cc: emailData.cc,
          bcc: emailData.bcc,
          subject: emailData.subject,
          body: emailData.body,
        },
      });

      // Update last used timestamp
      await mcpSettingsStore.updateConnection(gmailConnection.id, {
        lastUsed: Date.now(),
      });

      // Show success message
      appendMessage({
        actor: Actors.SYSTEM,
        content: `Email sent successfully to ${emailData.to}`,
        timestamp: Date.now(),
      });

      // Close modal
      setShowEmailCompose(false);
      setEmailData({});
    } catch (error) {
      console.error('Failed to send email:', error);
      throw error; // Re-throw to let modal handle the error display
    }
  };

  // Open email compose modal with AI-generated content
  const handleOpenEmailCompose = (data: Partial<EmailData>) => {
    setEmailData(data);
    setShowEmailCompose(true);
  };

  // Check if task contains summarize keywords
  const containsSummarizeKeywords = (text: string): boolean => {
    const normalized = (text || '').toLowerCase();
    const summarizeKeywords = [
      'summarize',
      'summarise',
      'summary',
      'summarization',
      'summarisation',
      'summarize karo',
      'summarize kar do',
      'summary banao',
      'summary do',
      'research',
      'research karo',
      'research kar do',
      'research paper',
      'paper generate',
      'generate paper',
      'generate research paper',
      'latex',
      'latex code',
      'compile',
      'pdf',
    ];

    return summarizeKeywords.some(keyword => normalized.includes(keyword));
  };

  // Open summarization page
  const openSummarizationPage = async (taskId: string, taskText: string) => {
    try {
      const summarizationUrl = chrome.runtime.getURL('summarization/index.html');
      const url = `${summarizationUrl}?taskId=${encodeURIComponent(taskId)}&task=${encodeURIComponent(taskText)}`;

      await chrome.tabs.create({
        url: url,
        active: true,
      });
    } catch (error) {
      console.error('Failed to open summarization page:', error);
    }
  };

  // Handle open summarization from header menu
  const handleOpenSummarization = () => {
    // Open summarization page without task ID (user can create new summarization)
    openSummarizationPage('', 'New Summarization');
  };

  const handleOpenLinkedIn = () => {
    setShowLinkedIn(true);
  };

  return (
    <div className="sidebar-container">
      {showLinkedIn ? (
        <LinkedInAutoApply
          onClose={() => setShowLinkedIn(false)}
          onSendMessage={(text: string, displayText?: string) => {
            setShowLinkedIn(false);
            setSelectedMode('agent');
            handleSendMessage(text, displayText);
          }}
        />
      ) : showHistory ? (
        <>
          <EclipseHeader
            hasStartedChat={hasStartedChat}
            title="eclipse"
            onNewChat={handleNewChat}
            onLoadHistory={handleLoadHistory}
            onOpenSettings={() => chrome.runtime.openOptionsPage()}
            onOpenLinkedIn={handleOpenLinkedIn}
            onOpenSummarization={handleOpenSummarization}
            showHistory={showHistory}
            onBackToChat={() => handleBackToChat(false)}
          />
          <div className="flex-1 overflow-hidden">
            <ChatHistoryList
              sessions={chatSessions}
              onSessionSelect={handleSessionSelect}
              onSessionDelete={handleSessionDelete}
              onSessionBookmark={handleSessionBookmark}
              visible={true}
              isDarkMode={isDarkMode}
            />
          </div>
        </>
      ) : (
        <>
          {/* Show loading state while checking model configuration */}
          {hasConfiguredModels === null && (
            <div className="sidebar-container">
              <EclipseHeader
                hasStartedChat={false}
                title="cosmos ai"
                onOpenSettings={() => chrome.runtime.openOptionsPage()}
              />
              <div className="flex flex-1 items-center justify-center bg-black p-8 text-white">
                <div className="text-center">
                  <div className="mx-auto mb-4 size-8 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                  <p>{t('status_checkingConfig')}</p>
                </div>
              </div>
            </div>
          )}

          {/* Show setup message when no models are configured */}
          {hasConfiguredModels === false && (
            <div className="sidebar-container">
              <EclipseHeader
                hasStartedChat={false}
                title="cosmos ai"
                onOpenSettings={() => chrome.runtime.openOptionsPage()}
              />
              <div className="flex flex-1 items-center justify-center bg-black p-8 text-white">
                <div className="max-w-md text-center">
                  <div className="mb-4 text-5xl font-bold text-white">cosmos ai</div>
                  <h3 className="mb-2 text-lg font-semibold text-white">{t('welcome_title')}</h3>
                  <p className="mb-4 text-white">{t('welcome_instruction')}</p>
                  <button
                    onClick={() => chrome.runtime.openOptionsPage()}
                    className="my-4 rounded-lg border border-white bg-black px-6 py-3 font-medium text-white transition-all hover:bg-white hover:text-black">
                    {t('welcome_openSettings')}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Show normal chat interface when models are configured */}
          {hasConfiguredModels === true && (
            <>
              <EclipseHeader
                hasStartedChat={hasStartedChat}
                title="cosmos ai"
                onNewChat={handleNewChat}
                onLoadHistory={handleLoadHistory}
                onOpenSummarization={handleOpenSummarization}
                onOpenLinkedIn={handleOpenLinkedIn}
                onOpenSettings={() => chrome.runtime.openOptionsPage()}
                showHistory={showHistory}
              />
              <EclipseContent
                messages={eclipseMessages}
                isTyping={showStopButton && !isReplaying}
                isStreaming={false}
                streamingContent=""
                welcomeMessage="Your browser complex flows executed autonomously"
                onChatStart={() => setHasStartedChat(true)}
                currentAgent={currentAgent}
                selectedMode={selectedMode}
                onSendEmail={handleSendEmail}
                onCloseEmailCompose={() => {
                  setShowEmailCompose(false);
                  setEmailData({});
                  // Remove the email compose message from messages
                  setMessages(prev => prev.filter(m => (m as any).emailData === undefined));
                }}
              />
              <EclipseFooter
                onSendMessage={handleFooterSendMessage}
                selectedTabs={selectedTabs}
                tabs={tabs.map(t => ({ id: t.id, title: t.title, url: t.url, favIconUrl: t.favicon }))}
                showCurrentTabIndicator={showCurrentTabIndicator}
                currentActiveTab={currentActiveTab}
                onAddTab={handleAddTab}
                onRemoveTab={handleRemoveTab}
                onToggleCurrentTab={handleToggleCurrentTab}
                onRemoveCurrentTab={handleRemoveCurrentTab}
                totalSelected={selectedTabs.length + (showCurrentTabIndicator ? 1 : 0)}
                maxLimit={5}
                disabled={!inputEnabled || isHistoricalSession}
                onModeChange={handleModeChange}
                showStopButton={showStopButton}
                onStopTask={handleStopTask}
                selectedMCPs={selectedMCPs}
                onRemoveMCP={handleRemoveMCP}
                availableMCPs={availableMCPs}
                onAddMCP={handleAddMCP}
              />
            </>
          )}
        </>
      )}

      {/* Tab Selector Modal */}
      <TabSelectorModal
        isOpen={showTabSelector}
        onClose={() => setShowTabSelector(false)}
        onConfirm={handleTabsSelected}
        isDarkMode={isDarkMode}
      />

      {/* Summarize Modal */}
      {showSummarize && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-2">
          <div className="max-h-[80vh] w-full max-w-md overflow-auto rounded-xl border border-white bg-black">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-white bg-black p-3">
              <h2 className="text-sm font-bold text-white">📄 AI Summary</h2>
              <button onClick={() => setShowSummarize(false)} className="rounded p-1 hover:bg-black">
                ✕
              </button>
            </div>

            {/* Summaries List */}
            <div className="space-y-2 p-3">
              {tabSummaries.length === 0 ? (
                <p className="py-4 text-center text-xs text-gray-400">
                  No summaries available. Generate summaries to see them here.
                </p>
              ) : (
                tabSummaries.map(summary => (
                  <button
                    key={summary.tabId}
                    onClick={() => setSelectedTabUrl(summary.url)}
                    className={`cursor-pointer rounded border-2 p-2 transition-all ${
                      selectedTabUrl === summary.url
                        ? 'border-blue-500 bg-black'
                        : 'border-slate-700 bg-black/50 hover:border-slate-600'
                    }`}>
                    <div className="flex items-start gap-2">
                      {summary.favicon && (
                        <img src={summary.favicon} alt="" className="mt-0.5 size-4 shrink-0 rounded" />
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-xs font-semibold text-white">{summary.title}</p>
                        <p className="truncate text-xs text-gray-400">{summary.url}</p>
                      </div>
                      {selectedTabUrl === summary.url && <span className="text-blue-400">✓</span>}
                    </div>
                    <p className="mt-2 line-clamp-3 text-xs text-gray-300">{summary.summary}</p>
                  </button>
                ))
              )}
            </div>

            {/* Modal Footer */}
            <div className="flex gap-2 border-t border-sky-800 bg-black p-3">
              <button
                onClick={() => setShowSummarize(false)}
                className="flex-1 rounded bg-black px-2 py-1 text-xs font-medium text-gray-200 transition-colors hover:bg-black">
                Cancel
              </button>
              <button
                onClick={() => {
                  console.log('Selected URL:', selectedTabUrl);
                  setShowSummarize(false);
                }}
                className="flex-1 rounded bg-green-600 px-2 py-1 text-xs font-medium text-white transition-colors hover:bg-green-500">
                ✓ Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SidePanel;
