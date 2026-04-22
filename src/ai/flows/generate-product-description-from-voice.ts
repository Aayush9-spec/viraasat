'use server';
/**
 * @fileOverview Converts voice recording to text and enhances it for marketing.
 *
 * - generateProductDescriptionFromVoice - A function that converts voice recording to text and enhances it.
 * - GenerateProductDescriptionFromVoiceInput - The input type for the generateProductDescriptionFromVoice function.
 * - GenerateProductDescriptionFromVoiceOutput - The return type for the generateProductDescriptionFromVoice function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateProductDescriptionFromVoiceInputSchema = z.object({
  audioDataUri: z
    .string()
    .describe(
      "Audio data URI of the artisan's voice recording. Must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
});
export type GenerateProductDescriptionFromVoiceInput = z.infer<
  typeof GenerateProductDescriptionFromVoiceInputSchema
>;

const GenerateProductDescriptionFromVoiceOutputSchema = z.object({
  enhancedDescription: z
    .string()
    .describe('The enhanced product description for marketing.'),
});
export type GenerateProductDescriptionFromVoiceOutput = z.infer<
  typeof GenerateProductDescriptionFromVoiceOutputSchema
>;

export async function generateProductDescriptionFromVoice(
  input: GenerateProductDescriptionFromVoiceInput
): Promise<GenerateProductDescriptionFromVoiceOutput> {
  return generateProductDescriptionFromVoiceFlow(input);
}

const generateProductDescriptionFromVoicePrompt = ai.definePrompt({
  name: 'generateProductDescriptionFromVoicePrompt',
  input: {schema: GenerateProductDescriptionFromVoiceInputSchema},
  output: {schema: GenerateProductDescriptionFromVoiceOutputSchema},
  prompt: `You are an expert marketing copywriter. You will receive a transcription of an artisan's spoken description of their product.
Your job is to rewrite it into a compelling product description that is grammatically correct and optimized for marketing purposes.

Here is the artisan's description: {{{audioDataUri}}}

Rewrite this description to be more appealing to customers. Focus on highlighting the unique features and benefits of the product. Make sure the generated text is concise, engaging, and persuasive, ready to be used on an e-commerce platform.
`,
  config: {
    safetySettings: [
      {
        category: 'HARM_CATEGORY_HATE_SPEECH',
        threshold: 'BLOCK_ONLY_HIGH',
      },
      {
        category: 'HARM_CATEGORY_DANGEROUS_CONTENT',
        threshold: 'BLOCK_NONE',
      },
      {
        category: 'HARM_CATEGORY_HARASSMENT',
        threshold: 'BLOCK_MEDIUM_AND_ABOVE',
      },
      {
        category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT',
        threshold: 'BLOCK_LOW_AND_ABOVE',
      },
    ],
  },
});

const generateProductDescriptionFromVoiceFlow = ai.defineFlow(
  {
    name: 'generateProductDescriptionFromVoiceFlow',
    inputSchema: GenerateProductDescriptionFromVoiceInputSchema,
    outputSchema: GenerateProductDescriptionFromVoiceOutputSchema,
  },
  async input => {
    const {output} = await generateProductDescriptionFromVoicePrompt({
      audioDataUri: input.audioDataUri,
    });
    return {
      enhancedDescription: output!.enhancedDescription,
    };
  }
);
