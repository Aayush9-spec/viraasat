'use server';

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { products } from '@/lib/data';
import fs from 'fs';
import path from 'path';

const HeritageChatInputSchema = z.object({
  message: z.string(),
  history: z.array(z.object({
    role: z.enum(['user', 'model']),
    content: z.string(),
  })).optional(),
  imageDataUri: z.string().optional(),
});

const HeritageChatOutputSchema = z.object({
  response: z.string(),
  suggestedProductIds: z.array(z.string()).optional(),
  activeAgent: z.string().optional(),
});

export const heritageChatFlow = ai.defineFlow(
  {
    name: 'heritageChatFlow',
    inputSchema: HeritageChatInputSchema,
    outputSchema: HeritageChatOutputSchema,
  },
  async (input) => {
    // 1. RAG Document Retrieval
    let docsContext = '';
    try {
      const docsPath = fs.existsSync(path.join(process.cwd(), 'database/documents.json'))
        ? path.join(process.cwd(), 'database/documents.json')
        : path.join(process.cwd(), '../database/documents.json');
      if (fs.existsSync(docsPath)) {
        const docs = JSON.parse(fs.readFileSync(docsPath, 'utf8'));
        const queryWords = input.message.toLowerCase().split(/\s+/);
        // Find documents containing query keywords
        const matchedDocs = docs.filter((d: any) => 
          queryWords.some(word => word.length > 3 && (d.text.toLowerCase().includes(word) || d.title.toLowerCase().includes(word)))
        );
        if (matchedDocs.length > 0) {
          docsContext = matchedDocs.map((d: any) => `[Source: ${d.title}]\n${d.text}`).join('\n\n');
        }
      }
    } catch (e) {
      console.warn("RAG retrieval failed: using default knowledge base.");
    }

    // 2. Load Product Catalog
    const productCatalog = products.map(p => ({
      id: p.id,
      name: p.name,
      region: p.region,
      category: p.category,
      price: p.price,
      description: p.description
    }));

    // 3. Multi-Agent Prompt Orchestration
    const systemPrompt = `You are the Viraasat Intelligent Multi-Agent Coordinator. You coordinate several specialized AI agents:
1. **Buyer Agent**: Recommends products, suggests gifts (e.g. under budget from specific states), and coordinates shopping.
2. **Cultural Research Agent**: Answers questions about art origins, Mithila, Blue Pottery, Changthangi goats, materials, festivals, and GI tags.
3. **Inventory Agent**: Evaluates product stock and artisan logistics.

Identify which agent is answering at the beginning of your response (e.g. "[Buyer Agent]" or "[Cultural Research Agent]").

KNOWLEDGE RETRIEVED FROM GI REGISTER & LAWS (RAG Context):
${docsContext || "No direct heritage files matched. Use internal knowledge."}

AVAILABLE PRODUCTS CATALOG:
${JSON.stringify(productCatalog, null, 2)}

Provide a warm, polite, and culturally rich response. Use "Namaste" or traditional greetings when appropriate.`;

    const promptParts: any[] = [];
    if (input.imageDataUri) {
      promptParts.push({ media: { url: input.imageDataUri } });
      promptParts.push({ text: `Analyze this image in the context of the user's question: "${input.message}"` });
    } else {
      promptParts.push({ text: input.message });
    }

    let text = '';
    let activeAgent = 'Buyer Agent';

    try {
      // Force mock fallback if endpoint resolution is known to be failing on closed networks
      if (process.env.MOCK_AI === 'true') {
        throw new Error("Forced simulation mode");
      }

      const response = await ai.generate({
        system: systemPrompt,
        prompt: promptParts,
      });
      text = response.text;
      
      if (text.includes("[Cultural Research Agent]")) activeAgent = "Cultural Research Agent";
      else if (text.includes("[Inventory Agent]")) activeAgent = "Inventory Agent";
    } catch (e) {
      console.warn("Genkit generate failed or timed out. Falling back to local simulation.", e);
      const query = input.message.toLowerCase();
      text = "[Buyer Agent] Namaste! Based on your query, here is a curated recommendation: ";
      
      if (query.includes("origin") || query.includes("history") || query.includes("gi tag") || query.includes("culture")) {
        text = "[Cultural Research Agent] Namaste! Mithila painting (also known as Madhubani art) is a traditional art form of Bihar. It is created using natural vegetable dyes and traditionally depicts mythological stories and nature motifs.";
        activeAgent = "Cultural Research Agent";
      } else if (query.includes("stock") || query.includes("price") || query.includes("inventory")) {
        text = "[Inventory Agent] Namaste! We currently have 12 pieces of Azure Ceramic Vases in stock in our Jaipur warehouse. Delivery time to your location is estimated at 3-5 business days.";
        activeAgent = "Inventory Agent";
      } else {
        text += "The Azure Ceramic Vase from Rajasthan. Handcrafted by local master artisans using quartz glaze techniques, it's the perfect heritage piece under your budget.";
      }
    }

    // Extract matched products from response
    const suggestedProductIds = products
      .filter(p => text.toLowerCase().includes(p.name.toLowerCase()) || text.toLowerCase().includes(p.id.toLowerCase()))
      .map(p => p.id)
      .slice(0, 3);

    return {
      response: text,
      suggestedProductIds: suggestedProductIds.length > 0 ? suggestedProductIds : undefined,
      activeAgent: activeAgent
    };
  }
);
