import { genkit } from 'genkit';
import { googleAI } from '@genkit-ai/google-genai';

/**
 * Safely resolves the Google Gemini API key from standard environment variables.
 * Checks GEMINI_API_KEY, GOOGLE_GENAI_API_KEY, and GOOGLE_API_KEY in priority order.
 * Trims whitespace and ignores placeholder values.
 */
export function getGeminiApiKey(): string | undefined {
  if (typeof process === 'undefined') return undefined;

  const candidate =
    process.env.GEMINI_API_KEY ||
    process.env.GOOGLE_GENAI_API_KEY ||
    process.env.GOOGLE_API_KEY ||
    '';

  const trimmed = candidate.trim();
  if (
    !trimmed ||
    trimmed === 'your_gemini_api_key_here' ||
    trimmed === 'your-key-here' ||
    trimmed === 'placeholder' ||
    trimmed.length < 8
  ) {
    return undefined;
  }

  return trimmed;
}

/**
 * Checks if a usable Gemini API key is configured on the server.
 */
export function isGeminiConfigured(): boolean {
  if (typeof process === 'undefined') return false;
  if (process.env.MOCK_AI === 'true') return false;
  return Boolean(getGeminiApiKey());
}

const resolvedApiKey = getGeminiApiKey();

/**
 * Singleton Genkit AI instance with Google AI plugin.
 * Configured with gemini-1.5-flash for high performance, multimodal reasoning, and rich Indian language support.
 */
export const ai = genkit({
  plugins: [googleAI({ apiKey: resolvedApiKey })],
  model: 'googleai/gemini-1.5-flash',
});
