'use server';

/**
 * @fileOverview Server Action to generate culturally rich multilingual product descriptions
 * for traditional handmade items using Google Gemini via Genkit.
 *
 * Supports Hindi (Devanagari), English, Hinglish, Tamil, Bengali, Telugu,
 * Marathi, Urdu, Gujarati, Kannada, Malayalam, Punjabi, Odia, Assamese, etc.
 */

import { ai, isGeminiConfigured } from '@/ai/genkit';
import {
  GenerateProductDescriptionInputSchema,
  GenerateProductDescriptionOutputSchema,
  type GenerateProductDescriptionInput,
  type GenerateProductDescriptionOutput,
} from '@/ai/schemas/product-description-schemas';
import {
  getLanguageName,
  buildFallbackNativeDescription,
  buildFallbackEnglishDescription,
} from '@/ai/languages';

export type { GenerateProductDescriptionInput, GenerateProductDescriptionOutput };

const generateProductDescriptionPrompt = ai.definePrompt({
  name: 'generateProductDescriptionPrompt',
  input: { schema: GenerateProductDescriptionInputSchema },
  output: { schema: GenerateProductDescriptionOutputSchema },
  prompt: `You are an expert multilingual cultural copywriter for "Viraasat" (विरासत), a premier Indian authentic artisan marketplace.

Input Details:
- Product Name: {{{productName}}}
- Artisan Specifications / Spoken Notes: {{{productDetails}}}
- Source Input Language: {{{inputLanguage}}}
- Requested Primary Output Language: {{{outputLanguage}}}
- Generate English Version Also: {{{generateEnglish}}}

Instructions:
1. Write a beautiful, evocative, culturally accurate product description for the traditional handcrafted item "{{{productName}}}".
2. If artisan details or specifications are provided in {{{productDetails}}}, faithfully integrate those materials, craft techniques, dimensions, and regional nuances.
3. Strict authenticity: Do NOT invent false GI certifications, fabricated historical dates, or artificial claims not provided by the artisan.
4. The primary description ("description") MUST be written strictly in the requested output language ({{{outputLanguage}}}) using its authentic native script (e.g. Hindi in Devanagari script, Tamil in Tamil script, Bengali in Bengali script, etc.).
5. If generateEnglish is true or outputLanguage is not English, provide a corresponding English description in the "englishDescription" field. If outputLanguage is English, both "description" and "englishDescription" can be English.
6. Content Guidelines:
   - Highlight the craft's cultural significance, regional roots, and artisanal pride.
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
    const trimmedDetails = (input.productDetails || '').trim();
    const reqLang = getLanguageName(input.outputLanguage || 'Hindi');
    const inputLang = getLanguageName(input.inputLanguage || 'Hindi');
    const wantEnglish = input.generateEnglish !== false;

    // Attempt real live Gemini generation if an API key is configured
    if (isGeminiConfigured()) {
      try {
        const { output } = await generateProductDescriptionPrompt({
          productName: trimmedName,
          productDetails: trimmedDetails || undefined,
          inputLanguage: inputLang,
          outputLanguage: reqLang,
          generateEnglish: wantEnglish,
        });

        if (output?.description) {
          return {
            description: output.description,
            englishDescription: wantEnglish
              ? output.englishDescription || buildFallbackEnglishDescription(trimmedName, trimmedDetails)
              : undefined,
            outputLanguage: reqLang,
            detectedLanguage: inputLang,
            isFallback: false,
          };
        }
      } catch (e) {
        console.warn('Genkit live description generation failed; providing culturally grounded fallback:', e);
      }
    }

    // Culturally rich fallback incorporating artisan details when AI key is missing or quota exceeded
    const fallbackPrimary = buildFallbackNativeDescription(trimmedName, reqLang, trimmedDetails);
    const fallbackEnglish = wantEnglish
      ? (reqLang === 'English' ? fallbackPrimary : buildFallbackEnglishDescription(trimmedName, trimmedDetails))
      : undefined;

    return {
      description: fallbackPrimary,
      englishDescription: fallbackEnglish,
      outputLanguage: reqLang,
      detectedLanguage: inputLang,
      isFallback: true,
    };
  }
);

/**
 * Server Action for multilingual product description generation.
 * Guaranteed to export only an async function to adhere to Next.js "use server" constraints.
 */
export async function generateProductDescription(
  input: GenerateProductDescriptionInput
): Promise<GenerateProductDescriptionOutput> {
  const trimmedName = String(input?.productName || '').trim();
  const trimmedDetails = String(input?.productDetails || '').trim();
  const reqLang = getLanguageName(input?.outputLanguage || 'Hindi');
  const inputLang = getLanguageName(input?.inputLanguage || 'Hindi');
  const wantEnglish = input?.generateEnglish !== false;

  try {
    const safeInput: GenerateProductDescriptionInput = {
      productName: trimmedName.length >= 3 ? trimmedName : 'Traditional Indian Handcrafted Item',
      productDetails: trimmedDetails || undefined,
      inputLanguage: inputLang,
      outputLanguage: reqLang,
      generateEnglish: wantEnglish,
    };

    return await generateProductDescriptionFlow(safeInput);
  } catch (err) {
    console.warn('generateProductDescription top-level fallback engaged:', err);
    const fallbackPrimary = buildFallbackNativeDescription(
      trimmedName || 'Traditional Indian Craft',
      reqLang,
      trimmedDetails
    );
    const fallbackEnglish = wantEnglish
      ? (reqLang === 'English' ? fallbackPrimary : buildFallbackEnglishDescription(trimmedName || 'Traditional Indian Craft', trimmedDetails))
      : undefined;

    return {
      description: fallbackPrimary,
      englishDescription: fallbackEnglish,
      outputLanguage: reqLang,
      detectedLanguage: inputLang,
      isFallback: true,
    };
  }
}
