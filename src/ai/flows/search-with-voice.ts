'use server';

/**
 * @fileOverview AI flow to perform a product search based on a voice query.
 * It transcribes the audio, understands mixed-language queries (Hinglish),
 * and extracts structured search terms.
 *
 * - searchWithVoice - The main function to handle voice search.
 * - SearchWithVoiceInput - The input type for the searchWithVoice function.
 * - SearchWithVoiceOutput - The return type for the searchWithVoice function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const SearchWithVoiceInputSchema = z.object({
  audioDataUri: z
    .string()
    .describe(
      "Audio data URI of the user's voice query. Must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
});
export type SearchWithVoiceInput = z.infer<typeof SearchWithVoiceInputSchema>;

const SearchWithVoiceOutputSchema = z.object({
  transcription: z.string().describe('The raw transcription of the user\'s voice query.'),
  searchQuery: z.string().describe('The primary search term or product name extracted from the query.'),
  category: z.string().optional().describe('The product category extracted, if any (e.g., "saree", "kurta", "pottery").'),
  color: z.string().optional().describe('The color extracted from the query, if any (e.g., "blue", "red", "hara").'),
});
export type SearchWithVoiceOutput = z.infer<typeof SearchWithVoiceOutputSchema>;

export async function searchWithVoice(input: SearchWithVoiceInput): Promise<SearchWithVoiceOutput> {
  return searchWithVoiceFlow(input);
}

const searchWithVoicePrompt = ai.definePrompt({
  name: 'searchWithVoicePrompt',
  input: { schema: z.object({ audioDataUri: z.string() }) },
  output: { schema: SearchWithVoiceOutputSchema },
  prompt: `You are an intelligent search assistant for Viraasat, an Indian artisan marketplace.
You will receive an audio file of a user's search query.
Your task is to:
1.  Transcribe the user's query. The query might be in English, Hindi, or a mix of both (Hinglish). For example: "mujhe blue colour ki saree dikhao".
2.  Analyze the transcription to understand the user's intent.
3.  Extract the key search terms into a structured format.
    - Identify the main product or query (searchQuery).
    - Identify the product category if mentioned.
    - Identify the color if mentioned.

Return the full transcription and the extracted search terms.

User's voice query: {{media url=audioDataUri}}`,
});

const searchWithVoiceFlow = ai.defineFlow(
  {
    name: 'searchWithVoiceFlow',
    inputSchema: SearchWithVoiceInputSchema,
    outputSchema: SearchWithVoiceOutputSchema,
  },
  async (input) => {
    const { output } = await searchWithVoicePrompt({
      audioDataUri: input.audioDataUri,
    });
    return output!;
  }
);
