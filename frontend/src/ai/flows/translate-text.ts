'use server';

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const TranslateTextInputSchema = z.object({
  text: z.string().describe('The text to translate.'),
  language: z
    .string()
    .describe(
      'The target language to translate into (e.g., Hindi, Tamil, Bengali, Telugu, Marathi, Urdu, Gujarati, Kannada, Malayalam, Punjabi).'
    ),
});
export type TranslateTextInput = z.infer<typeof TranslateTextInputSchema>;

const TranslateTextOutputSchema = z.object({
  translatedText: z
    .string()
    .describe('The translated text in the target language.'),
});
export type TranslateTextOutput = z.infer<typeof TranslateTextOutputSchema>;

const LANGUAGE_CODES: Record<string, string> = {
  Hindi: 'hi',
  Tamil: 'ta',
  Bengali: 'bn',
  Telugu: 'te',
  Marathi: 'mr',
  Urdu: 'ur',
  Gujarati: 'gu',
  Kannada: 'kn',
  Malayalam: 'ml',
  Punjabi: 'pa',
  French: 'fr',
  Spanish: 'es',
  Arabic: 'ar',
  Japanese: 'ja',
  German: 'de',
};

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
    // 1. Try Genkit AI translation
    try {
      const { output } = await translateTextPrompt({
        text: input.text,
        language: input.language,
      });
      if (output?.translatedText && !output.translatedText.includes('(' + input.language + ')')) {
        return { translatedText: output.translatedText };
      }
    } catch (e) {
      console.warn('Genkit translateText call failed. Using secondary translation provider.', e);
    }

    // 2. Try online translation API (MyMemory) for accurate native script output
    const langCode = LANGUAGE_CODES[input.language] || input.language.toLowerCase().slice(0, 2);
    try {
      const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(input.text)}&langpair=en|${langCode}`;
      const res = await fetch(url, { headers: { 'User-Agent': 'ViraasatApp/1.0' }, signal: AbortSignal.timeout(10000) });
      if (res.ok) {
        const data = await res.json();
        const translated = data?.responseData?.translatedText;
        if (data.responseStatus === 200 && translated && typeof translated === 'string' && translated.trim().length > 0) {
          return { translatedText: translated };
        }
      }
    } catch (e) {
      console.warn('Online translation API failed, translation unavailable:', e);
    }

    throw new Error('Translation is unavailable. The original text has been preserved.');
  }
);
