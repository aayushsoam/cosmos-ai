/* eslint-disable @typescript-eslint/no-unused-vars */
import { BasePrompt } from './base';
import { HumanMessage, SystemMessage } from '@langchain/core/messages';
import type { AgentContext } from '@src/background/agent/types';
import { thinkerSystemPromptTemplate } from './templates/thinker';

export class thinkerPrompt extends BasePrompt {
  getSystemMessage(): SystemMessage {
    return new SystemMessage(thinkerSystemPromptTemplate);
  }

  async getUserMessage(context: AgentContext): Promise<HumanMessage> {
    return new HumanMessage('');
  }
}
