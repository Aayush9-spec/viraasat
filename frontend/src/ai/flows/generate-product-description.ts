'use server';

/**
 * @fileOverview AI flow to generate culturally rich multilingual product descriptions
 * for traditional handmade items using Gemini and Genkit.
 *
 * Supports Hindi (Devanagari), English, Hinglish, Tamil, Bengali, Telugu,
 * Marathi, Urdu, Gujarati, Kannada, Malayalam, Punjabi, Odia, Assamese, etc.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import {
  getLanguageName,
  buildFallbackNativeDescription,
  buildFallbackEnglishDescription,
} from '@/ai/languages';

export const GenerateProductDescriptionInputSchema = z.object({
  productName: z
    .string()
    .trim()
    .min(3, 'Product name must be at least 3 characters')
    .max(160, 'Product name must not exceed 160 characters')
    .describe('The name of the traditional handmade product in any supported script.'),
  inputLanguage: z
    .string()
    .optional()
    .default('Hindi')
    .describe('The language script in which the product name is provided.'),
  outputLanguage: z
    .string()
    .optional()
    .default('Hindi')
    .describe('The primary language requested for the product description.'),
  generateEnglish: z
    .boolean()
    .optional()
    .default(true)
    .describe('Whether to also generate a corresponding English description.'),
});

export type GenerateProductDescriptionInput = z.infer<
  typeof GenerateProductDescriptionInputSchema
>;

export const GenerateProductDescriptionOutputSchema = z.object({
  description: z
    .string()
    .describe('A beautiful, culturally rich product description in the requested output language.'),
  englishDescription: z
    .string()
    .optional()
    .describe('The corresponding English product description if requested.'),
  outputLanguage: z
    .string()
    .optional()
    .describe('The language of the primary description.'),
  isFallback: z
    .boolean()
    .optional()
    .describe('Indicates whether smart fallback content was returned instead of live AI generation.'),
});

export type GenerateProductDescriptionOutput = z.infer<
  typeof GenerateProductDescriptionOutputSchema
>;

function isGeminiConfigured(): boolean {
  if (typeof process === 'undefined') return false;
  if (process.env.MOCK_AI === 'true') return false;
  const key = (process.env.GOOGLE_GENAI_API_KEY ?? process.env.GEMINI_API_KEY ?? '').trim();
  return typeof key === 'string' && key.startsWith('AIza') && key.length >= 25;
}

const generateProductDescriptionPrompt = ai.definePrompt({
  name: 'generateProductDescriptionPrompt',
  input: { schema: GenerateProductDescriptionInputSchema },
  output: { schema: GenerateProductDescriptionOutputSchema },
  prompt: `You are an expert multilingual cultural copywriter for "Viraasat" (विरासत), a premier Indian authentic artisan marketplace.

Input Details:
- Product Name: {{{productName}}}
- Source Input Language: {{{inputLanguage}}}
- Requested Primary Output Language: {{{outputLanguage}}}
- Generate English Version Also: {{{generateEnglish}}}

Instructions:
1. Write a beautiful, evocative, culturally accurate product description for the traditional handcrafted item "{{{productName}}}".
2. The primary description ("description") MUST be written strictly in the requested output language ({{{outputLanguage}}}) using its authentic native script (e.g. Hindi in Devanagari script, Tamil in Tamil script, Bengali in Bengali script, etc.).
3. If generateEnglish is true or outputLanguage is not English, provide a corresponding English description in the "englishDescription" field. If outputLanguage is English, both "description" and "englishDescription" can be English.
4. Content Guidelines:
   - Highlight the craft's cultural significance, regional roots, and artisanal pride without making up false GI tags or historical dates not mentioned in the name.
   - Mention the tactile feel, craftsmanship, and human dedication.
   - Keep each description concise, natural, informative, and compelling for e-commerce (under 120 words per language).
   - Use flowing prose. Do not use bullet points or markdown headings.
   - Set outputLanguage to "{{{outputLanguage}}}".
   - Set isFallback to false.`,
});

const generateProductDescriptionFlow = ai.defineFlow(
  {
    name: 'generateProductDescriptionFlow',
    inputSchema: GenerateProductDescriptionInputSchema,
    outputSchema: GenerateProductDescriptionOutputSchema,
  },
  async (input) => {
    const trimmedName = (input.productName || '').trim();
    const reqLang = getLanguageName(input.outputLanguage || 'Hindi');
    const inputLang = getLanguageName(input.inputLanguage || 'Hindi');
    const wantEnglish = input.generateEnglish !== false;

    // Only attempt live Gemini call if a valid Google AI Studio key starting with AIza is present
    if (isGeminiConfigured()) {
      try {
        const { output } = await generateProductDescriptionPrompt({
          productName: trimmedName,
          inputLanguage: inputLang,
          outputLanguage: reqLang,
          generateEnglish: wantEnglish,
        });

        if (output?.description) {
          return {
            description: output.description,
            englishDescription: wantEnglish
              ? output.englishDescription || buildFallbackEnglishDescription(trimmedName)
              : undefined,
            outputLanguage: reqLang,
            isFallback: false,
          };
        }
      } catch (e) {
        console.warn('Genkit generateProductDescription call failed. Using culturally grounded fallback.', e);
      }
    }

    // Smart culturally rich fallback
    const fallbackPrimary = buildFallbackNativeDescription(trimmedName, reqLang);
    const fallbackEnglish = wantEnglish
      ? (reqLang === 'English' ? fallbackPrimary : buildFallbackEnglishDescription(trimmedName))
      : undefined;

    return {
      description: fallbackPrimary,
      englishDescription: fallbackEnglish,
      outputLanguage: reqLang,
      isFallback: true,
    };
  }
);

/**
 * Server Action for multilingual product description generation.
 * Guaranteed never to throw an unhandled exception to the client.
 */
export async function generateProductDescription(
  input: GenerateProductDescriptionInput
): Promise<GenerateProductDescriptionOutput> {
  const trimmedName = String(input?.productName || '').trim();
  const reqLang = getLanguageName(input?.outputLanguage || 'Hindi');
  const inputLang = getLanguageName(input?.inputLanguage || 'Hindi');
  const wantEnglish = input?.generateEnglish !== false;

  try {
    const safeInput: GenerateProductDescriptionInput = {
      productName: trimmedName.length >= 3 ? trimmedName : 'Traditional Indian Handcrafted Item',
      inputLanguage: inputLang,
      outputLanguage: reqLang,
      generateEnglish: wantEnglish,
    };

    return await generateProductDescriptionFlow(safeInput);
  } catch (err) {
    console.warn('generateProductDescription top-level fallback engaged:', err);
    const fallbackPrimary = buildFallbackNativeDescription(trimmedName || 'Traditional Indian Craft', reqLang);
    const fallbackEnglish = wantEnglish
      ? (reqLang === 'English' ? fallbackPrimary : buildFallbackEnglishDescription(trimmedName || 'Traditional Indian Craft'))
      : undefined;

    return {
      description: fallbackPrimary,
      englishDescription: fallbackEnglish,
      outputLanguage: reqLang,
      isFallback: true,
    };
  }
}
