import { ai } from '@/ai/genkit';

export class GeminiClient {
  static async generateText(prompt: string, systemInstruction?: string): Promise<string> {
    try {
      const response = await ai.generate({
        system: systemInstruction,
        prompt: prompt,
      });
      return response.text;
    } catch (e) {
      console.warn("Gemini offline, returning fallback text.");
      return "Namaste! Based on your query: " + prompt;
    }
  }
}
