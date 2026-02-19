import { BaseAgent, type BaseAgentOptions, type ExtraAgentOptions } from './base';
import { createLogger } from '@src/background/log';
import { z } from 'zod';
import type { AgentOutput } from '../types';
import { HumanMessage } from '@langchain/core/messages';
import { Actors, ExecutionState } from '../event/types';
import {
  ChatModelAuthError,
  ChatModelBadRequestError,
  ChatModelForbiddenError,
  isAbortedError,
  isAuthenticationError,
  isBadRequestError,
  isForbiddenError,
  LLM_FORBIDDEN_ERROR_MESSAGE,
  RequestCancelledError,
} from './errors';
import { filterExternalContent } from '../messages/utils';
const logger = createLogger('thinkerAgent');

// Define Zod schema for thinker output
export const thinkerOutputSchema = z.object({
  observation: z.string(),
  challenges: z.string(),
  done: z.union([
    z.boolean(),
    z.string().transform(val => {
      if (val.toLowerCase() === 'true') return true;
      if (val.toLowerCase() === 'false') return false;
      throw new Error('Invalid boolean string');
    }),
  ]),
  next_steps: z.string(),
  final_answer: z.string(),
  reasoning: z.string(),
  web_task: z.union([
    z.boolean(),
    z.string().transform(val => {
      if (val.toLowerCase() === 'true') return true;
      if (val.toLowerCase() === 'false') return false;
      throw new Error('Invalid boolean string');
    }),
  ]),
});

export type thinkerOutput = z.infer<typeof thinkerOutputSchema>;

export class thinkerAgent extends BaseAgent<typeof thinkerOutputSchema, thinkerOutput> {
  constructor(options: BaseAgentOptions, extraOptions?: Partial<ExtraAgentOptions>) {
    super(thinkerOutputSchema, options, { ...extraOptions, id: 'thinker' });
  }

  async execute(): Promise<AgentOutput<thinkerOutput>> {
    try {
      this.context.emitEvent(Actors.thinker, ExecutionState.STEP_START, 'Planning...');
      // get all messages from the message manager, state message should be the last one
      const messages = this.context.messageManager.getMessages();
      // Use full message history except the first one
      const thinkerMessages = [this.prompt.getSystemMessage(), ...messages.slice(1)];

      // Remove images from last message if vision is not enabled for thinker but vision is enabled
      // Optimized: Only process if actually needed
      if (!this.context.options.useVisionForthinker && this.context.options.useVision) {
        const lastStateMessage = thinkerMessages[thinkerMessages.length - 1];
        // Check if message actually contains images before processing
        const hasImages =
          Array.isArray(lastStateMessage.content) &&
          lastStateMessage.content.some((msg: any) => msg.type === 'image_url');

        if (hasImages) {
          let newMsg = '';
          if (Array.isArray(lastStateMessage.content)) {
            for (const msg of lastStateMessage.content) {
              if (msg.type === 'text') {
                newMsg += msg.text;
              }
              // Skip image_url messages
            }
          } else {
            newMsg = lastStateMessage.content;
          }
          thinkerMessages[thinkerMessages.length - 1] = new HumanMessage(newMsg);
        }
      }

      const modelOutput = await this.invoke(thinkerMessages);
      if (!modelOutput) {
        throw new Error('Failed to validate thinker output');
      }

      // clean the model output
      const observation = filterExternalContent(modelOutput.observation);
      const final_answer = filterExternalContent(modelOutput.final_answer);
      const next_steps = filterExternalContent(modelOutput.next_steps);
      const challenges = filterExternalContent(modelOutput.challenges);
      const reasoning = filterExternalContent(modelOutput.reasoning);

      const cleanedPlan: thinkerOutput = {
        ...modelOutput,
        observation,
        challenges,
        reasoning,
        final_answer,
        next_steps,
      };

      // If task is done, emit the final answer; otherwise emit next steps
      const eventMessage = cleanedPlan.done ? cleanedPlan.final_answer : cleanedPlan.next_steps;
      this.context.emitEvent(Actors.thinker, ExecutionState.STEP_OK, eventMessage);
      logger.info('thinker output', JSON.stringify(cleanedPlan, null, 2));

      return {
        id: this.id,
        result: cleanedPlan,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      // Check if this is an authentication error
      if (isAuthenticationError(error)) {
        throw new ChatModelAuthError(errorMessage, error);
      } else if (isBadRequestError(error)) {
        throw new ChatModelBadRequestError(errorMessage, error);
      } else if (isAbortedError(error)) {
        throw new RequestCancelledError(errorMessage);
      } else if (isForbiddenError(error)) {
        throw new ChatModelForbiddenError(LLM_FORBIDDEN_ERROR_MESSAGE, error);
      }

      logger.error(`Planning failed: ${errorMessage}`);
      this.context.emitEvent(Actors.thinker, ExecutionState.STEP_FAIL, `Planning failed: ${errorMessage}`);
      return {
        id: this.id,
        error: errorMessage,
      };
    }
  }
}
