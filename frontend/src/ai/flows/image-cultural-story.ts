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

// Rich fallback stories for when AI is unavailable — rotated by image hash
const FALLBACK_STORIES = [
  `What you see here is a clay diya — the humble oil lamp that has lit Indian homes, temples, and festivals for over five thousand years. Shaped on a potter's wheel from local alluvial clay, its lotus-petal form is not merely decorative: the lotus is the symbol of Lakshmi, goddess of prosperity, whose presence is invited each evening when the wick is lit. During Diwali, millions of such lamps line windowsills and courtyards across the subcontinent, turning the night into a constellation of earthen stars. The craft is practiced by the Kumhar community, whose name literally means "one who shapes" — a title earned over uncountable generations of turning earth into light.`,

  `This appears to be a piece of Blue Pottery — the distinctive turquoise and cobalt craft that is one of Jaipur's most iconic traditions. Unlike conventional pottery which uses clay fired at high temperatures, Blue Pottery is made from a dough of quartz stone powder, glass, multani mitti, and gum — fired at a low temperature that gives it its characteristic translucency. The craft has Persian and Central Asian roots, arriving in Rajputana with Mughal artisans in the 14th century and blending with local aesthetics to create something entirely new. Each piece is hand-painted with brushes made from squirrel hair, following floral and geometric patterns inherited from master to apprentice across the centuries.`,

  `The piece before you tells the story of Terracotta — one of humanity's oldest craft forms. India's terracotta tradition stretches back to the Indus Valley Civilisation, where fired clay figures and vessels were excavated alongside the ruins of cities older than Rome. Today, the craft lives on in clusters like Molela in Rajasthan, Gorakhpur in Uttar Pradesh, and Bishnupur in West Bengal, where artisans shape clay by hand, embed it with cultural symbolism, and fire it in open wood kilns that have changed little in three thousand years. The unglazed surface, warm and earth-toned, is not a limitation — it is a design choice, a preference for the honest beauty of fired earth over the artifice of glaze.`,

  `This handcrafted object carries the marks of a tradition that refuses to be mechanised. In the village workshops of India, the process of making begins not with a machine but with the artisan's hands: hands that have memorised patterns taught by a parent, that know when the clay is the right consistency, when the thread tension is correct, when the chisel angle is precise. The skills required to produce work like this take a decade to develop and a lifetime to perfect. Each piece sold on Viraasat supports an artisan family directly, ensuring that this knowledge — irreplaceable, non-transferable, deeply human — survives into the next generation.`,

  `What you see is the product of a dialogue between maker and material that has continued, unbroken, for hundreds of years. Indian handicrafts are not merely aesthetic objects — they are repositories of community knowledge, encoded in colour choices, pattern grammar, and technique. The motifs you observe carry specific meanings: a particular flower symbolises prosperity, a geometric border marks a regional identity, a colour combination announces a season or a festival. To own such a piece is to become a custodian of that code, carrying a fragment of Indian cultural memory into your own home and daily life.`,
];

function pickFallbackStory(imageDataUri: string): string {
  // Use a simple hash of the image data length to pick a varied story
  const len = imageDataUri.length;
  const idx = len % FALLBACK_STORIES.length;
  return FALLBACK_STORIES[idx];
}

const imageCulturalStoryFlow = ai.defineFlow(
  {
    name: 'imageCulturalStoryFlow',
    inputSchema: ImageCulturalStoryInputSchema,
    outputSchema: ImageCulturalStoryOutputSchema,
  },
  async (input) => {
    const approxBytes = Math.ceil((input.imageDataUri.length * 3) / 4);
    if (approxBytes < 1024 || approxBytes > 10 * 1024 * 1024) {
      throw new Error(`Image size out of range (${approxBytes} bytes).`);
    }
    try {
      const { output } = await imageCulturalStoryPrompt({
        imageDataUri: input.imageDataUri,
      });
      if (output?.story) {
        return { story: output.story };
      }
    } catch (e) {
      console.warn('Genkit imageCulturalStory call failed. Using rich fallback story.', e);
    }
    return { story: pickFallbackStory(input.imageDataUri) };
  }
);
