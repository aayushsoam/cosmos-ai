// Service to communicate with background script for AI responses

export interface AIResponse {
  answer: string;
  success: boolean;
  error?: string;
}

export class AIService {
  private static port: chrome.runtime.Port | null = null;

  private static getPort(): chrome.runtime.Port {
    if (!this.port) {
      this.port = chrome.runtime.connect({ name: 'summarization-ai-connection' });

      this.port.onDisconnect.addListener(() => {
        this.port = null;
      });
    }
    return this.port;
  }

  static async getAnswerForTopic(topic: string, context?: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const port = this.getPort();

      const messageHandler = (response: any) => {
        if (response.type === 'ai_answer') {
          port.onMessage.removeListener(messageHandler);
          if (response.success) {
            resolve(response.answer);
          } else {
            reject(new Error(response.error || 'Failed to get AI answer'));
          }
        }
      };

      port.onMessage.addListener(messageHandler);

      port.postMessage({
        type: 'get_ai_answer',
        topic,
        context,
      });

      // Timeout after 30 seconds
      setTimeout(() => {
        port.onMessage.removeListener(messageHandler);
        reject(new Error('Request timeout'));
      }, 30000);
    });
  }

  static async explorePath(topic: string, prompt: string, context?: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const port = this.getPort();

      const messageHandler = (response: any) => {
        if (response.type === 'path_exploration') {
          port.onMessage.removeListener(messageHandler);
          if (response.success) {
            resolve(response.answer);
          } else {
            reject(new Error(response.error || 'Failed to explore path'));
          }
        }
      };

      port.onMessage.addListener(messageHandler);

      port.postMessage({
        type: 'explore_path',
        topic,
        prompt,
        context,
      });

      // Timeout after 30 seconds
      setTimeout(() => {
        port.onMessage.removeListener(messageHandler);
        reject(new Error('Request timeout'));
      }, 30000);
    });
  }
}
