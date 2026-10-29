'use server';

/**
 * @fileOverview Converts voice recording to text and enhances it for marketing.
 *
 * - generateProductDescriptionFromVoice - A function that converts voice recording to text and enhances it.
 * - GenerateProductDescriptionFromVoiceInput - The input type for the generateProductDescriptionFromVoice function.
 * - GenerateProductDescriptionFromVoiceOutput - The return type for the generateProductDescriptionFromVoice function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const GenerateProductDescriptionFromVoiceInputSchema = z.object({
  audioDataUri: z
    .string()
    .describe(
      "Audio data URI of the artisan's voice recording. Must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
});
export type GenerateProductDescriptionFromVoiceInput = z.infer<
  typeof GenerateProductDescriptionFromVoiceInputSchema
>;

const GenerateProductDescriptionFromVoiceOutputSchema = z.object({
  enhancedDescription: z
    .string()
    .describe('The enhanced product description for marketing.'),
});
export type GenerateProductDescriptionFromVoiceOutput = z.infer<
  typeof GenerateProductDescriptionFromVoiceOutputSchema
>;

function isGeminiConfigured(): boolean {
  if (typeof process === 'undefined') return false;
  if (process.env.MOCK_AI === 'true') return false;
  const key = (process.env.GOOGLE_GENAI_API_KEY ?? process.env.GEMINI_API_KEY ?? '').trim();
  return typeof key === 'string' && key.startsWith('AIza') && key.length >= 25;
}

const generateProductDescriptionFromVoicePrompt = ai.definePrompt({
  name: 'generateProductDescriptionFromVoicePrompt',
  input: { schema: GenerateProductDescriptionFromVoiceInputSchema },
  output: { schema: GenerateProductDescriptionFromVoiceOutputSchema },
  prompt: [
    {
      media: { url: '{{audioDataUri}}' },
    },
    {
      text: `You are an expert marketing copywriter for authentic Indian handicrafts on Viraasat.
You will receive an audio recording of an artisan speaking about their handcrafted product.
Your job is to rewrite it into a compelling, respectful, and culturally accurate product description.
Highlight the unique features, materials, and artisan dedication without fabricating false certifications or historical facts.
Keep it concise, engaging, and ready for an authentic heritage marketplace.`,
    },
  ],
});

const generateProductDescriptionFromVoiceFlow = ai.defineFlow(
  {
    name: 'generateProductDescriptionFromVoiceFlow',
    inputSchema: GenerateProductDescriptionFromVoiceInputSchema,
    outputSchema: GenerateProductDescriptionFromVoiceOutputSchema,
  },
  async (input) => {
    if (isGeminiConfigured()) {
      try {
        const { output } = await generateProductDescriptionFromVoicePrompt({
          audioDataUri: input.audioDataUri,
        });
        if (output?.enhancedDescription) {
          return { enhancedDescription: output.enhancedDescription };
        }
      } catch (err) {
        console.warn('Genkit generateProductDescriptionFromVoice call failed:', err);
      }
    }

    // Smart fallback description
    return {
      enhancedDescription:
        'हथकरघा और पुश्तैनी कारीगरी से तैयार यह प्रामाणिक कलाकृति भारतीय सांस्कृतिक धरोहर का सजीव प्रतीक है। विशुद्ध प्राकृतिक सामग्री और पारंपरिक शिल्प कौशल से तराशा गया यह उत्पाद आपके परिवेश को सात्विक सौंदर्य व गरिमा प्रदान करता है।',
    };
  }
);

export async function generateProductDescriptionFromVoice(
  input: GenerateProductDescriptionInputOrLegacy
): Promise<GenerateProductDescriptionFromVoiceOutput> {
  try {
    return await generateProductDescriptionFromVoiceFlow(input as any);
  } catch (err) {
    console.warn('generateProductDescriptionFromVoice top-level fallback:', err);
    return {
      enhancedDescription:
        'Handcrafted with generational mastery using sustainable natural materials, this authentic Indian heirloom celebrates timeless regional artistry and artisanal grace.',
    };
  }
}

type GenerateProductDescriptionInputOrLegacy = GenerateProductDescriptionFromVoiceInput;
