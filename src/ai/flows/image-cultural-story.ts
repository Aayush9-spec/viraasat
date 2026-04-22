'use server';

/**
 * @fileOverview AI flow to analyze an image of a handicraft and generate
 * a cultural story about its origin, traditional use, and significance.
 *
 * - generateImageCulturalStory - Generates a cultural story from an image.
 * - ImageCulturalStoryInput - Input type.
 * - ImageCulturalStoryOutput - Output type.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const ImageCulturalStoryInputSchema = z.object({
  imageDataUri: z
    .string()
    .describe(
      "Image data URI of the handicraft item. Must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
});
export type ImageCulturalStoryInput = z.infer<
  typeof ImageCulturalStoryInputSchema
>;

const ImageCulturalStoryOutputSchema = z.object({
  story: z
    .string()
    .describe(
      'A detailed cultural story about the handicraft item including its origin, techniques, traditional use, and significance in Indian culture.'
    ),
});
export type ImageCulturalStoryOutput = z.infer<
  typeof ImageCulturalStoryOutputSchema
>;

export async function generateImageCulturalStory(
  input: ImageCulturalStoryInput
): Promise<ImageCulturalStoryOutput> {
  return imageCulturalStoryFlow(input);
}

const imageCulturalStoryPrompt = ai.definePrompt({
  name: 'imageCulturalStoryPrompt',
  input: { schema: ImageCulturalStoryInputSchema },
  output: { schema: ImageCulturalStoryOutputSchema },
  prompt: [
    {
      media: { url: '{{imageDataUri}}' },
    },
    {
      text: `You are a cultural heritage expert specializing in Indian handicrafts and traditional arts.

Analyze this image and provide a detailed cultural story. Your response should include:

1. **Identification**: What is this handicraft item? Describe it visually.
2. **Cultural Origin**: Where in India does this craft likely originate from? Which community or region is known for it?
3. **Traditional Techniques**: What traditional methods and materials are likely used in its creation?
4. **Cultural Significance**: What role does this item play in Indian traditions, festivals, or daily life?
5. **Heritage Value**: Why is preserving this craft form important for Indian cultural heritage?

Write in an engaging, narrative style — as if telling a story to someone discovering Indian crafts for the first time. Keep the response between 150-250 words.`,
    },
  ],
});

const imageCulturalStoryFlow = ai.defineFlow(
  {
    name: 'imageCulturalStoryFlow',
    inputSchema: ImageCulturalStoryInputSchema,
    outputSchema: ImageCulturalStoryOutputSchema,
  },
  async (input) => {
    const { output } = await imageCulturalStoryPrompt({
      imageDataUri: input.imageDataUri,
    });
    return {
      story: output!.story,
    };
  }
);
