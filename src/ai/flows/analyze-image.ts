'use server';

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

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
3. Identify the origin region (e.g. Rajasthan, Gujarat, Kashmir, Bihar, Varanasi).
4. Predict the dominant raw material used (e.g. Multani Mitti & Quartz, Pure Chandi / Silver Alloy, Changthangi Cashmere Wool, Khadi Cotton, Natural Vegetable Dyes).
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
    if (!process.env.GEMINI_API_KEY && !process.env.GOOGLE_API_KEY) {
      console.warn("API Key missing. Falling back to mock Vision classifier.");
      return {
        predictedTitle: "Handcrafted Blue Pottery Vase",
        detectedCategory: "Home Decor",
        detectedRegion: "Rajasthan",
        detectedMaterial: "Multani Mitti & Quartz",
        suggestedTags: ["Blue Pottery", "Jaipur Art", "Ceramic Glaze", "Traditional Decor"]
      };
    }
    try {
      const { output } = await analyzeImagePrompt({
        imageDataUri: input.imageDataUri,
      });
      return output!;
    } catch (e) {
      console.warn("Genkit Vision call failed. Using mock vision metadata fallback.", e);
      return {
        predictedTitle: "Handcrafted Blue Pottery Vase",
        detectedCategory: "Home Decor",
        detectedRegion: "Rajasthan",
        detectedMaterial: "Multani Mitti & Quartz",
        suggestedTags: ["Blue Pottery", "Jaipur Art", "Ceramic Glaze", "Traditional Decor"]
      };
    }
  }
);
