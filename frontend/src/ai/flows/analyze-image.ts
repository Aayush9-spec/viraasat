'use server';

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const MAX_IMAGE_BYTES = 10 * 1024 * 1024; // mirror backend moderation limit
const MIN_IMAGE_BYTES = 1024;

const AnalyzeImageInputSchema = z.object({
  imageDataUri: z
    .string()
    .describe(
      "Image data URI of the handicraft item. Must include a MIME type and use Base64 encoding."
    ),
});
export type AnalyzeImageInput = z.infer<typeof AnalyzeImageInputSchema>;

const AnalyzeImageOutputSchema = z.object({
  predictedTitle: z.string().describe('Suggested name for the product.'),
  detectedCategory: z.string().describe('Matched craft category (e.g. Home Decor, Jewelry, Textiles, Kitchenware, Accessories).'),
  detectedRegion: z.string().describe('Likely Indian region or state of origin (e.g. Rajasthan, Gujarat, Kashmir, Bihar, Varanasi).'),
  detectedMaterial: z.string().describe('Suggested craft material (e.g. Natural Vegetable Dyes, Multani Mitti & Quartz, Changthangi Cashmere Wool, Pure Chandi / Silver Alloy, Khadi Cotton).'),
  suggestedTags: z.array(z.string()).describe('An array of 4-6 style tags and features for the product.'),
});
export type AnalyzeImageOutput = z.infer<typeof AnalyzeImageOutputSchema>;

export async function analyzeImage(input: AnalyzeImageInput): Promise<AnalyzeImageOutput> {
  return analyzeImageFlow(input);
}

const analyzeImagePrompt = ai.definePrompt({
  name: 'analyzeImagePrompt',
  input: { schema: AnalyzeImageInputSchema },
  output: { schema: AnalyzeImageOutputSchema },
  prompt: [
    {
      media: { url: '{{imageDataUri}}' },
    },
    {
      text: `You are a computer vision classifier for Viraasat, an Indian heritage handicraft platform.
Analyze this image and classify it into craft taxonomy:
1. Suggest a premium product title.
2. Detect the category: Match it to one of [Home Decor, Jewelry, Textiles, Kitchenware, Accessories].
3. Do not infer geographic origin from appearance; return Unknown unless supported by readable evidence.
4. Suggest the apparent material only, using Unknown when uncertain; do not certify composition. Examples (e.g. Multani Mitti & Quartz, Pure Chandi / Silver Alloy, Changthangi Cashmere Wool, Khadi Cotton, Natural Vegetable Dyes).
5. Extract 4-6 features/tags representing its aesthetic and style.

Return the classification in the requested JSON structure.`,
    },
  ],
});

const analyzeImageFlow = ai.defineFlow(
  {
    name: 'analyzeImageFlow',
    inputSchema: AnalyzeImageInputSchema,
    outputSchema: AnalyzeImageOutputSchema,
  },
  async (input) => {
    // Basic size guard. The authoritative SafeSearch check happens via
    // /api/moderate-image BEFORE this flow is ever called from the product
    // form. This is a belt-and-braces check in case any other caller
    // (tests, scripts) bypasses the FE gate.
    const approxBytes = Math.ceil((input.imageDataUri.length * 3) / 4);
    if (approxBytes < MIN_IMAGE_BYTES || approxBytes > MAX_IMAGE_BYTES) {
      throw new Error(
        `Image size out of range (${approxBytes} bytes). Must be between ${MIN_IMAGE_BYTES} and ${MAX_IMAGE_BYTES}.`,
      );
    }

    if (!process.env.GEMINI_API_KEY && !process.env.GOOGLE_API_KEY) {
      throw new Error('Image analysis is unavailable. Enter product details manually.');
    }
    try {
      const { output } = await analyzeImagePrompt({ imageDataUri: input.imageDataUri });
      if (!output) throw new Error('No image analysis returned');
      return output;
    } catch {
      throw new Error('Image analysis failed. No classification was produced.');
    }
  }
);
