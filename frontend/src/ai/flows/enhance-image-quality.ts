'use server';

/**
 * @fileOverview AI flow to enhance the quality of an image using Genkit and
 *   the googleai/gemini-pro-vision model.
 *
 * - enhanceImageQuality - A function that enhances the quality of an image.
 * - EnhanceImageQualityInput - The input type for the enhanceImageQuality
 *   function.
 * - EnhanceImageQualityOutput - The return type for the
 *   enhanceImageQuality function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const MAX_IMAGE_BYTES = 10 * 1024 * 1024;
const MIN_IMAGE_BYTES = 1024;

const EnhanceImageQualityInputSchema = z.object({
  imageUri: z
    .string()
    .describe(
      'The image to enhance, as a data URI that must include a MIME type and use Base64 encoding. Expected format: \'data:<mimetype>;base64,<encoded_data>\'.'
    ),
});
export type EnhanceImageQualityInput = z.infer<typeof EnhanceImageQualityInputSchema>;

const EnhanceImageQualityOutputSchema = z.object({
  enhancedImageUri: z.string().describe('The enhanced image as a data URI.'),
});
export type EnhanceImageQualityOutput = z.infer<typeof EnhanceImageQualityOutputSchema>;

export async function enhanceImageQuality(
  input: EnhanceImageQualityInput
): Promise<EnhanceImageQualityOutput> {
  return enhanceImageQualityFlow(input);
}

const enhanceImageQualityPrompt = ai.definePrompt({
  name: 'enhanceImageQualityPrompt',
  input: {schema: EnhanceImageQualityInputSchema},
  output: {schema: EnhanceImageQualityOutputSchema},
  prompt: [
    {
      media: {url: '{{imageUri}}'},
    },
    {
      text: 'Enhance the quality of this image. Improve clarity, reduce noise, and sharpen details. Return the enhanced image as a data URI.',
    },
  ],
  config: {
    responseModalities: ['TEXT', 'IMAGE'],
  },
});

const enhanceImageQualityFlow = ai.defineFlow(
  {
    name: 'enhanceImageQualityFlow',
    inputSchema: EnhanceImageQualityInputSchema,
    outputSchema: EnhanceImageQualityOutputSchema,
  },
  async input => {
    const approxBytes = Math.ceil((input.imageUri.length * 3) / 4);
    if (approxBytes < MIN_IMAGE_BYTES || approxBytes > MAX_IMAGE_BYTES) {
      throw new Error(`Image size out of range (${approxBytes} bytes).`);
    }
    try {
      const response = await ai.generate({
        model: 'googleai/gemini-2.5-flash',
        prompt: [
          {media: {url: input.imageUri}},
          {text: 'Enhance the quality of this image. Improve clarity, reduce noise, and sharpen details. Return the enhanced image as a data URI.'},
        ],
        config: {
          responseModalities: ['TEXT', 'IMAGE'],
        },
      });

      return {enhancedImageUri: response.media?.url || input.imageUri};
    } catch (e) {
      console.warn("Enhance image flow failed, falling back to input image.", e);
      return {enhancedImageUri: input.imageUri};
    }
  }
);
