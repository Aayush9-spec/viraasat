'use server';

/**
 * @fileOverview AI flow to suggest products based on a cultural query using Gemini.
 *
 * - suggestProducts - Suggests matching product IDs based on user's query.
 * - SuggestProductsInput - Input type.
 * - SuggestProductsOutput - Output type.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { products } from '@/lib/data';

const SuggestProductsInputSchema = z.object({
  query: z.string().describe('The cultural or heritage query from the user.'),
});
export type SuggestProductsInput = z.infer<typeof SuggestProductsInputSchema>;

const SuggestProductsOutputSchema = z.object({
  productIds: z.array(z.string()).describe('The IDs of the products that match the query.'),
  explanation: z.string().describe('A short explanation of why these products were suggested.'),
});
export type SuggestProductsOutput = z.infer<typeof SuggestProductsOutputSchema>;

export async function suggestProducts(
  input: SuggestProductsInput
): Promise<SuggestProductsOutput> {
  return suggestProductsFlow(input);
}

// Prepare a list of products for the AI
const productCatalog = products.map(p => ({
  id: p.id,
  name: p.name,
  category: p.category,
  region: p.region,
  description: p.description
}));

const suggestProductsPrompt = ai.definePrompt({
  name: 'suggestProductsPrompt',
  input: { schema: SuggestProductsInputSchema },
  output: { schema: SuggestProductsOutputSchema },
  prompt: `You are an expert cultural commerce assistant for VIRAASAT, a platform for Indian heritage.
Your goal is to suggest 2-4 the most relevant products from our catalog based on the user's cultural query.

User Query: "{{{query}}}"

CATALOG:
${JSON.stringify(productCatalog, null, 2)}

Instructions:
1. Identify the products that best match the craft tradition, region, or category mentioned in the query.
2. If the query is vague, suggest featured or popular heritage items.
3. Provide a list of product IDs and a concise, charming explanation of why they were chosen (e.g., "These Blue Pottery items perfectly represent the Jaipur tradition you mentioned.")

Return the IDs in order of relevance.`,
});

const suggestProductsFlow = ai.defineFlow(
  {
    name: 'suggestProductsFlow',
    inputSchema: SuggestProductsInputSchema,
    outputSchema: SuggestProductsOutputSchema,
  },
  async (input) => {
    const { output } = await suggestProductsPrompt({
      query: input.query,
    });
    
    if (!output) {
      return {
        productIds: [],
        explanation: "I couldn't find specific products for your query, but here are some of our most popular heritage treasures."
      };
    }

    return {
      productIds: output.productIds,
      explanation: output.explanation,
    };
  }
);
