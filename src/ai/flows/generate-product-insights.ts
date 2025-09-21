'use server';

/**
 * @fileOverview This file defines a Genkit flow for generating product insights, including features, style tags, and use cases.
 *
 * - generateProductInsights - The main function to generate product insights.
 * - GenerateProductInsightsInput - The input type for the generateProductInsights function.
 * - GenerateProductInsightsOutput - The output type for the generateProductInsights function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateProductInsightsInputSchema = z.object({
  productName: z.string().describe('The name of the product.'),
  productDescription: z.string().describe('A detailed description of the product.'),
  productCategory: z.string().describe('The category of the product (e.g., clothing, home decor).'),
  artisanName: z.string().describe('The name of the artisan or shop.'),
});

export type GenerateProductInsightsInput = z.infer<typeof GenerateProductInsightsInputSchema>;

const GenerateProductInsightsOutputSchema = z.object({
  features: z.array(z.string()).describe('A list of key features of the product.'),
  styleTags: z.array(z.string()).describe('A list of style tags relevant to the product.'),
  useCases: z.array(z.string()).describe('A list of potential use cases for the product.'),
});

export type GenerateProductInsightsOutput = z.infer<typeof GenerateProductInsightsOutputSchema>;

export async function generateProductInsights(input: GenerateProductInsightsInput): Promise<GenerateProductInsightsOutput> {
  return generateProductInsightsFlow(input);
}

const generateProductInsightsPrompt = ai.definePrompt({
  name: 'generateProductInsightsPrompt',
  input: {schema: GenerateProductInsightsInputSchema},
  output: {schema: GenerateProductInsightsOutputSchema},
  prompt: `You are an AI assistant helping artisans create compelling product listings. Based on the provided product information, generate a list of key features, style tags, and potential use cases.

Product Name: {{{productName}}}
Product Description: {{{productDescription}}}
Product Category: {{{productCategory}}}
Artisan Name: {{{artisanName}}}

Features: A list of concise and descriptive features of the product.
Style Tags: A list of relevant style tags that capture the product's aesthetic.
Use Cases: A list of potential scenarios or purposes for which the product can be used. Return the features, style tags and use cases in JSON format.`,
});

const generateProductInsightsFlow = ai.defineFlow(
  {
    name: 'generateProductInsightsFlow',
    inputSchema: GenerateProductInsightsInputSchema,
    outputSchema: GenerateProductInsightsOutputSchema,
  },
  async input => {
    const {output} = await generateProductInsightsPrompt(input);
    return output!;
  }
);
