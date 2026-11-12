import { getAIServiceStatus } from '@/ai/actions';
import { generateProductDescription } from '@/ai/flows/generate-product-description';
import { translateText } from '@/ai/flows/translate-text';
import { generateImageCulturalStory } from '@/ai/flows/image-cultural-story';

describe('Viraasat AI Tools Production Suite', () => {
  describe('getAIServiceStatus', () => {
    it('returns valid status structure without throwing', async () => {
      const status = await getAIServiceStatus();
      expect(status).toHaveProperty('configured');
      expect(typeof status.configured).toBe('boolean');
      expect(status).toHaveProperty('model');
      expect(status).toHaveProperty('provider');
    });
  });

  describe('Tool 1: Multilingual Product Description Generator', () => {
    it('generates rich native and English descriptions with fallback or live model', async () => {
      const result = await generateProductDescription({
        productName: 'हाथ से बनी बनारसी सिल्क साड़ी',
        inputLanguage: 'Hindi',
        outputLanguage: 'Hindi',
        generateEnglish: true,
        productDetails: 'Zari border, pure silk, handloom woven in Varanasi',
      });

      expect(result).toBeDefined();
      expect(result.description).toBeTruthy();
      expect(result.description.length).toBeGreaterThan(20);
      expect(result.englishDescription).toBeTruthy();
    });

    it('handles short or blank product name safely via fallback defaults', async () => {
      const result = await generateProductDescription({
        productName: '   ',
        inputLanguage: 'Hindi',
        outputLanguage: 'Hindi',
      });

      expect(result).toBeDefined();
      expect(result.description).toBeTruthy();
      expect(result.isFallback).toBe(true);
    });
  });

  describe('Tool 2: AI Multilingual Translator', () => {
    it('throws informative error when offline and API key is unconfigured', async () => {
      await expect(
        translateText({
          text: 'Authentic handcrafted pottery made from natural terracotta clay',
          language: 'Hindi',
        })
      ).rejects.toThrow(/AI Translation is currently offline/);
    });

    it('throws error for empty input text', async () => {
      await expect(
        translateText({
          text: '',
          language: 'Hindi',
        })
      ).rejects.toThrow();
    });
  });

  describe('Tool 3: Cultural Story & Image Analyzer', () => {
    it('gracefully handles invalid data URI schemes without crashing', async () => {
      const result = await generateImageCulturalStory({
        imageDataUri: 'http://example.com/not-a-data-uri.jpg',
      });
      expect(result.success).toBe(false);
      expect(result.error).toMatch(/Invalid image format/);
    });

    it('rejects unsupported image mime types without throwing', async () => {
      const result = await generateImageCulturalStory({
        imageDataUri: 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7',
      });
      expect(result.success).toBe(false);
      expect(result.error).toMatch(/Unsupported image format/);
    });

    it('generates authentic historical past story for Banarasi Saree in English', async () => {
      const result = await generateImageCulturalStory({
        imageDataUri: 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEASABIAAD/2wBD...',
        craftContext: 'Banarasi Saree',
        outputLanguage: 'English',
      });
      expect(result.success).toBe(true);
      expect(result.story).toContain('Banarasi');
      expect(result.story).toContain('Varanasi');
      expect(result.isHandicraft).toBe(true);
    });

    it('rejects irrelevant non-handicraft items such as smartphones or vehicles', async () => {
      const result = await generateImageCulturalStory({
        imageDataUri: 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEASABIAAD/2wBD...',
        craftContext: 'Modern iPhone 15 smartphone',
        outputLanguage: 'English',
      });
      expect(result.success).toBe(false);
      expect(result.isHandicraft).toBe(false);
      expect(result.error).toMatch(/Non-Handicraft Item Detected/);
    });

    it('does NOT default an unknown image to Banarasi Saree when craft context is absent', async () => {
      const result = await generateImageCulturalStory({
        imageDataUri: 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEASABIAAD/2wBD...',
        craftContext: '',
        outputLanguage: 'Hindi',
      });
      expect(result).toBeDefined();
      // Crucial fix verification: Must NEVER blindly substitute Banarasi saree on unknown images
      if (!result.isAiGenerated) {
        expect(result.story).not.toContain('बनारसी हथकरघा रेशम साड़ी');
      }
    });

    it('correctly maps specific craft contexts to distinct heritage stories without cross-contamination', async () => {
      const potteryResult = await generateImageCulturalStory({
        imageDataUri: 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEASABIAAD/2wBD...',
        craftContext: 'Jaipur Blue Pottery urn',
        outputLanguage: 'English',
      });
      expect(potteryResult.success).toBe(true);
      expect(potteryResult.story.toLowerCase()).toContain('blue pottery');
      expect(potteryResult.story).not.toContain('Banarasi Saree');

      const dhokraResult = await generateImageCulturalStory({
        imageDataUri: 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEASABIAAD/2wBD...',
        craftContext: 'Bastar Dhokra bell metal casting',
        outputLanguage: 'English',
      });
      expect(dhokraResult.success).toBe(true);
      expect(dhokraResult.story.toLowerCase()).toContain('dhokra');
      expect(dhokraResult.story).not.toContain('Banarasi Saree');
      expect(dhokraResult.story).not.toContain('Blue Pottery');
    });

    it('echoes back client requestId to prevent client-side race conditions', async () => {
      const uniqueId = 'test-client-req-999';
      const result = await generateImageCulturalStory({
        imageDataUri: 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEASABIAAD/2wBD...',
        craftContext: 'Kashmiri Pashmina Shawl',
        outputLanguage: 'English',
        requestId: uniqueId,
      });
      expect(result.requestId).toBe(uniqueId);
    });

    it('returns structured object properties when archival match is formed', async () => {
      const result = await generateImageCulturalStory({
        imageDataUri: 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEASABIAAD/2wBD...',
        craftContext: 'Jaipur Blue Pottery',
        outputLanguage: 'English',
      });
      expect(result.success).toBe(true);
      if (result.structured) {
        expect(result.structured).toHaveProperty('identifiedObject');
        expect(result.structured).toHaveProperty('craftCategory');
        expect(result.structured).toHaveProperty('visualObservations');
        expect(Array.isArray(result.structured.visualObservations)).toBe(true);
        expect(result.structured).toHaveProperty('possibleMaterials');
        expect(result.structured).toHaveProperty('possibleTechniques');
        expect(result.structured).toHaveProperty('possibleRegion');
        expect(result.structured).toHaveProperty('giInformation');
        expect(result.structured.giInformation.verified).toBe(false);
      }
    });
  });
});
