import { z } from 'zod';

export const StructuredCulturalStorySchema = z.object({
  identifiedObject: z.string().describe('Specific name and visual description of the identified item'),
  craftCategory: z.string().describe('Craft category, e.g. Pottery, Textiles, Metalwork, Woodcraft, Painting, Jewelry'),
  visualObservations: z.array(z.string()).describe('2-5 specific visual details directly observed in the photo'),
  possibleMaterials: z.array(z.string()).describe('Materials observed or traditionally used'),
  possibleTechniques: z.array(z.string()).describe('Craftsmanship techniques observed or traditional methods'),
  possibleRegion: z.object({
    name: z.string().describe('Likely Indian craft region or Unknown / Multiple Traditions'),
    confidence: z.enum(['high', 'medium', 'low']),
    reason: z.string().describe('Explanation based strictly on visual motifs and evidence'),
  }),
  culturalStory: z.string().describe('Comprehensive cultural narrative in the target language'),
  historicalContext: z.string().describe('Evidence-based historical roots and royal patronages'),
  artisanProcess: z.string().describe('Step-by-step description of how master artisans handcraft this piece'),
  culturalSignificance: z.string().describe('Symbolism, festive, and spiritual significance'),
  giInformation: z.object({
    possibleAssociation: z.string().nullable().describe('Possible GI craft match or null'),
    verified: z.boolean().default(false),
    explanation: z.string().describe('Statement that visual inspection alone cannot confirm GI status without physical provenance documentation'),
  }),
  confidence: z.enum(['high', 'medium', 'low']),
  limitations: z.array(z.string()).describe('Known limitations of optical visual analysis'),
});

export type StructuredCulturalStory = z.infer<typeof StructuredCulturalStorySchema>;

export const ImageCulturalStoryInputSchema = z.object({
  imageDataUri: z
    .string()
    .min(50, 'Image data URI too short')
    .refine((data) => data.startsWith('data:image/'), {
      message: 'Image must be a valid data URI starting with data:image/',
    }),
  craftContext: z.string().trim().max(500).optional(),
  outputLanguage: z.string().optional().default('Hindi'),
  requestId: z.string().optional(),
});

export type ImageCulturalStoryInput = z.infer<typeof ImageCulturalStoryInputSchema>;

export const ImageCulturalStoryOutputSchema = z.object({
  success: z.boolean().default(true),
  story: z.string(),
  isAiGenerated: z.boolean().optional().default(true),
  isHandicraft: z.boolean().optional().default(true),
  craftTitle: z.string().optional(),
  error: z.string().optional(),
  structured: StructuredCulturalStorySchema.optional(),
  requestId: z.string().optional(),
});

export type ImageCulturalStoryOutput = z.infer<typeof ImageCulturalStoryOutputSchema>;
