'use server';

import { isGeminiConfigured } from '@/ai/genkit';

export interface AIServiceStatus {
  configured: boolean;
  model: string;
  provider: string;
}

/**
 * Server Action to check AI service configuration status on the server runtime.
 * Never leaks the actual API key string.
 */
export async function getAIServiceStatus(): Promise<AIServiceStatus> {
  return {
    configured: isGeminiConfigured(),
    model: 'Gemini 1.5 Flash',
    provider: 'Google Genkit',
  };
}
