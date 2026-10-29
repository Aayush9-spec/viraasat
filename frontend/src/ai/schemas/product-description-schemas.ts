import { z } from 'genkit';

export const GenerateProductDescriptionInputSchema = z.object({
  productName: z
    .string()
    .trim()
    .min(3, 'Product name must be at least 3 characters')
    .max(160, 'Product name must not exceed 160 characters')
    .describe('The name of the traditional handmade product in any supported script.'),
  productDetails: z
    .string()
    .trim()
    .max(2000, 'Product details must not exceed 2000 characters')
    .optional()
    .describe('Artisan-provided specifications, craft technique, materials, regional nuances, colors, dimensions, or spoken notes.'),
  inputLanguage: z
    .string()
    .optional()
    .default('Hindi')
    .describe('The language script in which the product name is provided.'),
  outputLanguage: z
    .string()
    .optional()
    .default('Hindi')
    .describe('The primary language requested for the product description.'),
  generateEnglish: z
    .boolean()
    .optional()
    .default(true)
    .describe('Whether to also generate a corresponding English description.'),
});

export type GenerateProductDescriptionInput = z.infer<
  typeof GenerateProductDescriptionInputSchema
>;

export const GenerateProductDescriptionOutputSchema = z.object({
  description: z
    .string()
    .describe('A beautiful, culturally rich product description in the requested output language.'),
  englishDescription: z
    .string()
    .optional()
    .describe('The corresponding English product description if requested.'),
  outputLanguage: z
    .string()
    .optional()
    .describe('The language of the primary description.'),
  detectedLanguage: z
    .string()
    .optional()
    .describe('The detected language if recognized.'),
  isFallback: z
    .boolean()
    .optional()
    .describe('Indicates whether smart fallback content was returned instead of live AI generation.'),
});

export type GenerateProductDescriptionOutput = z.infer<
  typeof GenerateProductDescriptionOutputSchema
>;
