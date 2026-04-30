'use server';

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { products } from '@/lib/data';

const HeritageChatInputSchema = z.object({
  message: z.string(),
  history: z.array(z.object({
    role: z.enum(['user', 'model']),
    content: z.string(),
  })).optional(),
});

const HeritageChatOutputSchema = z.object({
  response: z.string(),
  suggestedProductIds: z.array(z.string()).optional(),
});

export const heritageChatFlow = ai.defineFlow(
  {
    name: 'heritageChatFlow',
    inputSchema: HeritageChatInputSchema,
    outputSchema: HeritageChatOutputSchema,
  },
  async (input) => {
    const productCatalog = products.map(p => ({
      id: p.id,
      name: p.name,
      region: p.region,
      category: p.category,
      description: p.description
    }));

    const response = await ai.generate({
      system: `You are the Viraasat Heritage Assistant, an expert in Indian crafts, history, and artisans. 
      Your tone is respectful, knowledgeable, and charmingly traditional. Use "Namaste" and other Indian greetings where appropriate.
      
      Your goals:
      1. Answer questions about Indian heritage, specific craft forms (like Blue Pottery, Dhokra, etc.), and regional traditions.
      2. Suggest relevant products from the catalog if the user expresses interest in buying or exploring specific items.
      3. Be concise but evocative.
      
      CATALOG:
      ${JSON.stringify(productCatalog, null, 2)}
      
      If you suggest products, please mention them naturally in your text.`,
      prompt: input.message,
      // history: input.history, // Genkit history format might vary, keeping it simple for now
    });

    const text = response.text();
    
    // Simple logic to extract product IDs if mentioned in the text
    const suggestedProductIds = products
      .filter(p => text.toLowerCase().includes(p.name.toLowerCase()) || text.toLowerCase().includes(p.id.toLowerCase()))
      .map(p => p.id)
      .slice(0, 3);

    return {
      response: text,
      suggestedProductIds: suggestedProductIds.length > 0 ? suggestedProductIds : undefined,
    };
  }
);
