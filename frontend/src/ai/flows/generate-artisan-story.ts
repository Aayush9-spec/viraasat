'use server';

/**
 * @fileOverview This file defines a Genkit flow for generating story ideas for artisans.
 *
 * - generateArtisanStory - The main function to generate story ideas.
 * - GenerateArtisanStoryInput - The input type for the generateArtisanStory function.
 * - GenerateArtisanStoryOutput - The output type for the generateArtisanStory function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateArtisanStoryInputSchema = z.object({
  artisanName: z.string().describe("The artisan's name."),
  shopName: z.string().describe("The artisan's shop name."),
  craftType: z.string().describe('The type of craft the artisan specializes in (e.g., Pottery, Jewelry).'),
  yearsExperience: z.coerce.number().describe('How many years the artisan has been practicing their craft.'),
});

export type GenerateArtisanStoryInput = z.infer<typeof GenerateArtisanStoryInputSchema>;

const GenerateArtisanStoryOutputSchema = z.object({
  storyIdeas: z.array(z.string()).describe('A list of 3-4 engaging story paragraphs for the artisan to use in their bio or product descriptions.'),
});

export type GenerateArtisanStoryOutput = z.infer<typeof GenerateArtisanStoryOutputSchema>;

export async function generateArtisanStory(input: GenerateArtisanStoryInput): Promise<GenerateArtisanStoryOutput> {
  return generateArtisanStoryFlow(input);
}

const generateArtisanStoryPrompt = ai.definePrompt({
  name: 'generateArtisanStoryPrompt',
  input: {schema: GenerateArtisanStoryInputSchema},
  output: {schema: GenerateArtisanStoryOutputSchema},
  prompt: `You are an expert storyteller and marketing assistant for a creative marketplace. Your goal is to help an artisan, {{{artisanName}}}, craft a compelling narrative for their shop, "{{{shopName}}}".

The artisan specializes in {{{craftType}}} and has {{{yearsExperience}}} years of experience.

Based on this, generate 3-4 distinct and engaging story paragraphs that they can use for their profile bio or "About" section. The tone should be warm, authentic, and connect with customers who value handcrafted goods. Focus on the passion, the process, and the person behind the products.

Here are some angles to consider:
- The origin story: How did they start? What was the spark?
- The craft: What makes their process for {{{craftType}}} special?
- The inspiration: Where do they draw inspiration from?
- The vision: What is the bigger purpose or dream behind {{{shopName}}}?

Return the story ideas as an array of strings.`,
});


const generateArtisanStoryFlow = ai.defineFlow(
  {
    name: 'generateArtisanStoryFlow',
    inputSchema: GenerateArtisanStoryInputSchema,
    outputSchema: GenerateArtisanStoryOutputSchema,
  },
  async input => {
    const {output} = await generateArtisanStoryPrompt(input);
    return output!;
  }
);
