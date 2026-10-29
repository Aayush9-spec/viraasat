'use server';

import { ai, isGeminiConfigured } from '@/ai/genkit';
import { z } from 'genkit';
import { getLanguageName } from '@/ai/languages';

const TranslateTextInputSchema = z.object({
  text: z
    .string()
    .trim()
    .min(1, 'Source text cannot be empty')
    .max(5000, 'Text exceeds maximum limit of 5000 characters')
    .describe('The text to translate.'),
  language: z
    .string()
    .describe(
      'The target language to translate into (e.g., Hindi, Tamil, Bengali, Telugu, Marathi, Urdu, Gujarati, Kannada, Malayalam, Punjabi, English).'
    ),
  sourceLanguage: z
    .string()
    .optional()
    .describe('The source language if known, or auto-detect.'),
  tone: z
    .enum(['natural', 'formal', 'conversational', 'marketplace'])
    .optional()
    .default('natural')
    .describe('Tone of the translated output.'),
});

export type TranslateTextInput = z.infer<typeof TranslateTextInputSchema>;

const TranslateTextOutputSchema = z.object({
  translatedText: z
    .string()
    .describe('The faithful translation in the requested target language.'),
  detectedSourceLanguage: z
    .string()
    .optional()
    .describe('Detected source language if recognized.'),
  isAiGenerated: z
    .boolean()
    .optional()
    .default(true)
    .describe('Whether the translation was generated via Gemini AI inference.'),
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
  Odia: 'or',
  Assamese: 'as',
  English: 'en',
  French: 'fr',
  Spanish: 'es',
  Arabic: 'ar',
  Japanese: 'ja',
  German: 'de',
};

const translateTextPrompt = ai.definePrompt({
  name: 'translateTextPrompt',
  input: { schema: TranslateTextInputSchema },
  output: { schema: TranslateTextOutputSchema },
  prompt: `You are a professional, culturally fluent translator specializing in Indian languages and e-commerce.

Translate the following source text accurately into {{{language}}}.

Translation Rules:
1. Output MUST be rendered in the authentic script of {{{language}}} (e.g. Devanagari for Hindi/Marathi, Tamil script for Tamil, Bengali script for Bengali, Gurmukhi for Punjabi, Perso-Arabic for Urdu).
2. Faithfully preserve proper nouns, artisan names, Indian craft terms (e.g., Zari, Dhokra, Banarasi, Chikankari, Terracotta), numbers, prices (₹/INR), measurements, dimensions, and URLs.
3. Preserve paragraph breaks, spacing, and structured bullet lists.
4. Tone should be {{{tone}}}: appealing, natural, and respectful of traditional heritage.
5. If source language is provided as "{{{sourceLanguage}}}", use that context; otherwise auto-detect.

Text to translate:
"""
{{{text}}}
"""

Provide the translated text in the "translatedText" field and any detected source language in "detectedSourceLanguage".`,
});

const translateTextFlow = ai.defineFlow(
  {
    name: 'translateTextFlow',
    inputSchema: TranslateTextInputSchema,
    outputSchema: TranslateTextOutputSchema,
  },
  async (input) => {
    const trimmed = input.text.trim();
    if (!trimmed) {
      throw new Error('Please enter text to translate.');
    }

    const targetLang = getLanguageName(input.language);

    // 1. Live Gemini AI Inference
    if (isGeminiConfigured()) {
      try {
        const { output } = await translateTextPrompt({
          text: trimmed,
          language: targetLang,
          sourceLanguage: input.sourceLanguage,
          tone: input.tone || 'natural',
        });

        if (output?.translatedText && output.translatedText.trim().length > 0) {
          return {
            translatedText: output.translatedText.trim(),
            detectedSourceLanguage: output.detectedSourceLanguage,
            isAiGenerated: true,
          };
        }
      } catch (geminiErr) {
        console.warn('Genkit translateText AI call failed:', geminiErr);
      }
    }

    // 2. High-availability secondary web translator for short phrases (< 500 chars)
    if (typeof fetch === 'function' && trimmed.length <= 500) {
      const targetCode = LANGUAGE_CODES[targetLang] || targetLang.toLowerCase().slice(0, 2);
      try {
        const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(trimmed)}&langpair=autodetect|${targetCode}`;
        const res = await fetch(url, {
          headers: { 'User-Agent': 'ViraasatApp/1.0 (ArtisanMarketplace)' },
          signal: AbortSignal.timeout(4000),
        });

        if (res.ok) {
          const data = await res.json();
          const translated = data?.responseData?.translatedText;
          if (
            translated &&
            typeof translated === 'string' &&
            translated.trim().length > 0 &&
            !translated.includes('MYMEMORY WARNING')
          ) {
            return {
              translatedText: translated.trim(),
              detectedSourceLanguage: data?.responseData?.detectedLanguage,
              isAiGenerated: false,
            };
          }
        }
      } catch (netErr) {
        console.warn('Secondary web translation unavailable:', netErr);
      }
    }

    // 3. Truthful failure report instead of fake static dictionary
    if (!isGeminiConfigured()) {
      throw new Error(
        'AI Translation is currently offline: Gemini API key is not configured on the server. Please configure GEMINI_API_KEY to enable live translation.'
      );
    }

    throw new Error(
      `Could not translate text to ${targetLang}. Please verify your network connection and try again.`
    );
  }
);

/**
 * Server Action for translating text.
 * Strictly exports only an async function for Next.js Server Actions compatibility.
 */
export async function translateText(
  input: TranslateTextInput
): Promise<TranslateTextOutput> {
  return translateTextFlow(input);
}
