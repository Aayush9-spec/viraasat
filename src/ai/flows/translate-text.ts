'use server';

/**
 * @fileOverview AI flow to translate text into various languages using Gemini.
 *
 * - translateText - Translates text to a specified language.
 * - TranslateTextInput - Input type.
 * - TranslateTextOutput - Output type.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const TranslateTextInputSchema = z.object({
  text: z.string().describe('The text to translate.'),
  language: z
    .string()
    .describe(
      'The target language to translate into (e.g., Hindi, Tamil, Bengali, Telugu, Marathi, Urdu).'
    ),
});
export type TranslateTextInput = z.infer<typeof TranslateTextInputSchema>;

const TranslateTextOutputSchema = z.object({
  translatedText: z
    .string()
    .describe('The translated text in the target language.'),
});
export type TranslateTextOutput = z.infer<typeof TranslateTextOutputSchema>;

export async function translateText(
  input: TranslateTextInput
): Promise<TranslateTextOutput> {
  return translateTextFlow(input);
}

const translateTextPrompt = ai.definePrompt({
  name: 'translateTextPrompt',
  input: { schema: TranslateTextInputSchema },
  output: { schema: TranslateTextOutputSchema },
  prompt: `You are an expert multilingual translator. Translate the following text accurately into {{{language}}}.

Maintain the tone, style, and cultural nuances of the original text. If the text contains product descriptions or marketing copy, ensure the translation sounds natural and appealing in the target language.

Text to translate:
"{{{text}}}"

Provide only the translated text, nothing else.`,
});

const translateTextFlow = ai.defineFlow(
  {
    name: 'translateTextFlow',
    inputSchema: TranslateTextInputSchema,
    outputSchema: TranslateTextOutputSchema,
  },
  async (input) => {
    const { output } = await translateTextPrompt({
      text: input.text,
      language: input.language,
    });
    return {
      translatedText: output!.translatedText,
    };
  }
);
