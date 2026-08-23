'use server';

/**
 * @fileOverview AI flow to generate culturally rich product descriptions
 * for traditional handmade items using Gemini.
 *
 * - generateProductDescription - Generates a compelling product description.
 * - GenerateProductDescriptionInput - Input type.
 * - GenerateProductDescriptionOutput - Output type.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const GenerateProductDescriptionInputSchema = z.object({
  productName: z
    .string()
    .describe('The name of the traditional handmade product.'),
});
export type GenerateProductDescriptionInput = z.infer<
  typeof GenerateProductDescriptionInputSchema
>;

const GenerateProductDescriptionOutputSchema = z.object({
  description: z
    .string()
    .describe(
      'A beautiful, culturally rich product description for marketing purposes.'
    ),
});
export type GenerateProductDescriptionOutput = z.infer<
  typeof GenerateProductDescriptionOutputSchema
>;

export async function generateProductDescription(
  input: GenerateProductDescriptionInput
): Promise<GenerateProductDescriptionOutput> {
  return generateProductDescriptionFlow(input);
}

const generateProductDescriptionPrompt = ai.definePrompt({
  name: 'generateProductDescriptionPrompt',
  input: { schema: GenerateProductDescriptionInputSchema },
  output: { schema: GenerateProductDescriptionOutputSchema },
  prompt: `You are an expert copywriter for a premium Indian artisan marketplace called "Viraasat" (meaning Heritage).

Write a beautiful, evocative product description for a traditional handmade item called "{{{productName}}}".

Your description must:
- Highlight the cultural significance and heritage behind the craft
- Describe the craftsmanship, materials, and techniques used
- Evoke emotional appeal — connect the buyer to the artisan's story
- Be poetic yet informative, suitable for a premium e-commerce listing
- Stay under 120 words

Write in English. Do not use bullet points. Write in flowing prose.`,
});

const generateProductDescriptionFlow = ai.defineFlow(
  {
    name: 'generateProductDescriptionFlow',
    inputSchema: GenerateProductDescriptionInputSchema,
    outputSchema: GenerateProductDescriptionOutputSchema,
  },
  async (input) => {
    const { output } = await generateProductDescriptionPrompt({
      productName: input.productName,
    });
    return {
      description: output!.description,
    };
  }
);
