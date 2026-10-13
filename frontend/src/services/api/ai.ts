import { apiClient } from './client';

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface ChatResponse {
  reply: string;
  suggestedActions?: string[];
}

export const aiApi = {
  /**
   * Send query to conversational AI assistant.
   */
  async sendMessage(messages: ChatMessage[], context?: Record<string, unknown>): Promise<ChatResponse> {
    return apiClient.post<ChatResponse>('chat', { messages, context });
  },

  /**
   * Generate craft description using backend or serverless AI flows.
   */
  async generateDescription(prompt: string, craftDetails?: Record<string, unknown>): Promise<{ description: string }> {
    return apiClient.post<{ description: string }>('ai', { prompt, craftDetails });
  },
};
