import { generateProductDescription } from '@/ai/flows/generate-product-description';
import { GenerateProductDescriptionInputSchema } from '@/ai/schemas/product-description-schemas';
import {
  getLanguageCode,
  getLanguageName,
  SUPPORTED_LANGUAGES,
} from '@/ai/languages';
import { saveLocalProduct, getLocalProducts } from '@/lib/data';
import type { Product } from '@/lib/types';

describe('Multilingual AI Product Description Generation', () => {
  describe('Input Validation & Language Utilities', () => {
    it('validates product name length constraints', () => {
      // Empty / too short
      const shortResult = GenerateProductDescriptionInputSchema.safeParse({ productName: 'ab' });
      expect(shortResult.success).toBe(false);

      // Valid range
      const validResult = GenerateProductDescriptionInputSchema.safeParse({
        productName: 'हाथ से बनी बनारसी रेशमी साड़ी',
        inputLanguage: 'Hindi',
        outputLanguage: 'Hindi',
        generateEnglish: true,
      });
      expect(validResult.success).toBe(true);

      // Excessive length
      const longName = 'A'.repeat(161);
      const longResult = GenerateProductDescriptionInputSchema.safeParse({ productName: longName });
      expect(longResult.success).toBe(false);
    });

    it('maps language names and codes accurately', () => {
      expect(getLanguageCode('Hindi')).toBe('hi');
      expect(getLanguageCode('English')).toBe('en');
      expect(getLanguageCode('Tamil')).toBe('ta');
      expect(getLanguageCode('Bengali')).toBe('bn');
      expect(getLanguageCode('Odia')).toBe('or');
      expect(getLanguageCode('Assamese')).toBe('as');
      expect(getLanguageName('hi')).toBe('Hindi');
      expect(getLanguageName('ta')).toBe('Tamil');
    });

    it('supports required regional languages', () => {
      const codes = SUPPORTED_LANGUAGES.map((l) => l.code);
      const expected = ['hi', 'en', 'hinglish', 'ta', 'bn', 'te', 'mr', 'ur', 'gu', 'kn', 'ml', 'pa', 'or', 'as'];
      for (const exp of expected) {
        expect(codes).toContain(exp);
      }
    });
  });

  describe('Multilingual Generation (Native & English Output)', () => {
    it('handles Hindi input with Hindi (Devanagari) and English output', async () => {
      const result = await generateProductDescription({
        productName: 'हाथ से बनी बनारसी रेशमी साड़ी',
        inputLanguage: 'Hindi',
        outputLanguage: 'Hindi',
        generateEnglish: true,
      });

      expect(result).toBeDefined();
      expect(result.description).toBeTruthy();
      expect(result.outputLanguage).toBe('Hindi');
      // Verify Devanagari Hindi presence
      expect(/[\u0900-\u097F]/.test(result.description)).toBe(true);

      // Verify English dual output
      expect(result.englishDescription).toBeTruthy();
      expect(typeof result.englishDescription).toBe('string');
      expect(result.englishDescription!.length).toBeGreaterThan(20);
    });

    it('handles English input with Hindi and English output', async () => {
      const result = await generateProductDescription({
        productName: 'Handcrafted Terracotta Horse',
        inputLanguage: 'English',
        outputLanguage: 'Hindi',
        generateEnglish: true,
      });

      expect(result).toBeDefined();
      expect(result.description).toBeTruthy();
      expect(/[\u0900-\u097F]/.test(result.description)).toBe(true);
      expect(result.englishDescription).toBeTruthy();
      expect(result.englishDescription!.toLowerCase()).toContain('terracotta');
    });

    it('handles Tamil input with Tamil and English output', async () => {
      const result = await generateProductDescription({
        productName: 'பித்தளை விநாயகர் சிலை',
        inputLanguage: 'Tamil',
        outputLanguage: 'Tamil',
        generateEnglish: true,
      });

      expect(result).toBeDefined();
      expect(result.description).toBeTruthy();
      expect(result.outputLanguage).toBe('Tamil');
      // Verify Tamil script unicode
      expect(/[\u0B80-\u0BFF]/.test(result.description)).toBe(true);
      expect(result.englishDescription).toBeTruthy();
    });

    it('handles single language output when generateEnglish is false', async () => {
      const result = await generateProductDescription({
        productName: 'Channapatna Wooden Toy',
        inputLanguage: 'English',
        outputLanguage: 'English',
        generateEnglish: false,
      });

      expect(result).toBeDefined();
      expect(result.description).toBeTruthy();
      expect(result.englishDescription).toBeUndefined();
    });

    it('provides smart culturally grounded fallback on unrecognized items', async () => {
      const result = await generateProductDescription({
        productName: 'Pure Sandalwood Carved Elephant Figurine',
        inputLanguage: 'English',
        outputLanguage: 'English',
        generateEnglish: true,
      });

      expect(result).toBeDefined();
      expect(result.description).toBeTruthy();
      expect(result.description).toContain('Pure Sandalwood Carved Elephant Figurine');
    });

    it('generates authentic descriptions for Diya without errors', async () => {
      const result = await generateProductDescription({
        productName: 'Diya',
        inputLanguage: 'Hindi',
        outputLanguage: 'Hindi',
        generateEnglish: true,
      });

      expect(result).toBeDefined();
      expect(result.description).toBeTruthy();
      expect(result.outputLanguage).toBe('Hindi');
      // Hindi Devanagari script present
      expect(/[\u0900-\u097F]/.test(result.description)).toBe(true);
      expect(result.englishDescription).toBeTruthy();
      expect(result.englishDescription!.toLowerCase()).toContain('diya');
      expect(result.isFallback).toBe(true);
    });
  });

  describe('Product Data Model & Storage Integration', () => {
    beforeEach(() => {
      if (typeof window !== 'undefined') {
        localStorage.clear();
      }
    });

    it('saves and reloads multilingual product data without losing translations', () => {
      const sampleItem: Partial<Product> = {
        id: 'test-multilingual-101',
        artisanId: 'artisan-1',
        name: 'हाथ से बनी बनारसी रेशमी साड़ी',
        description: 'वाराणसी के प्राचीन हथकरघों पर बुनी गई बनारसी रेशमी साड़ी।',
        originalLanguage: 'Hindi',
        englishDescription: 'Handwoven Banarasi pure silk saree crafted by master weavers.',
        descriptions: {
          hi: 'वाराणसी के प्राचीन हथकरघों पर बुनी गई बनारसी रेशमी साड़ी।',
          en: 'Handwoven Banarasi pure silk saree crafted by master weavers.',
        },
        category: 'Textiles & Handloom',
        price: 4500,
        currency: 'INR',
        stock: 5,
        region: 'Uttar Pradesh',
      };

      saveLocalProduct(sampleItem);
      const reloaded = getLocalProducts();
      const matched = reloaded.find((p) => p.id === 'test-multilingual-101');

      expect(matched).toBeDefined();
      expect(matched?.name).toBe('हाथ से बनी बनारसी रेशमी साड़ी');
      expect(matched?.originalLanguage).toBe('Hindi');
      expect(matched?.englishDescription).toBe('Handwoven Banarasi pure silk saree crafted by master weavers.');
      expect(matched?.descriptions?.hi).toBe('वाराणसी के प्राचीन हथकरघों पर बुनी गई बनारसी रेशमी साड़ी।');
      expect(matched?.descriptions?.en).toBe('Handwoven Banarasi pure silk saree crafted by master weavers.');
    });

    it('maintains compatibility with existing products without translations', () => {
      const legacyItem = {
        id: 'legacy-prod-999',
        artisanId: 'artisan-1',
        name: 'Legacy Clay Pot',
        description: 'A classic earthen pot.',
        price: 250,
        currency: 'INR',
        stock: 10,
        region: 'Rajasthan',
      };

      saveLocalProduct(legacyItem);
      const reloaded = getLocalProducts();
      const matched = reloaded.find((p) => p.id === 'legacy-prod-999');

      expect(matched).toBeDefined();
      expect(matched?.name).toBe('Legacy Clay Pot');
      expect(matched?.description).toBe('A classic earthen pot.');
      // Should not be undefined errors or broken structures
      expect(matched?.englishDescription).toBeUndefined();
    });

    it('allows updating an existing product while preserving translations', () => {
      const item: Partial<Product> = {
        id: 'test-edit-product-1',
        name: 'Handcrafted Brass Bell Chime',
        description: 'पारंपरिक पीतल की घंटी और नक्काशी।',
        originalLanguage: 'Hindi',
        englishDescription: 'Traditional handcrafted brass bell chime featuring intricate engravings.',
        descriptions: {
          hi: 'पारंपरिक पीतल की घंटी और नक्काशी।',
          en: 'Traditional handcrafted brass bell chime featuring intricate engravings.',
        },
        price: 1200,
        region: 'Uttar Pradesh',
      };

      saveLocalProduct(item);

      // Edit price and add care instructions
      const updatedItem = {
        ...item,
        price: 1500,
      };

      saveLocalProduct(updatedItem);
      const reloaded = getLocalProducts();
      const matched = reloaded.find((p) => p.id === 'test-edit-product-1');

      expect(matched).toBeDefined();
      expect(matched?.price).toBe(1500);
      expect(matched?.originalLanguage).toBe('Hindi');
      expect(matched?.descriptions?.en).toBe('Traditional handcrafted brass bell chime featuring intricate engravings.');
    });
  });
});
