import { renderHook, act } from '@testing-library/react';
import {
  getSpeechLanguageCode,
  SUPPORTED_LANGUAGES,
  getLanguageName,
} from '@/ai/languages';
import { useSpeechRecognition } from '@/core/hooks/use-speech-recognition';
import { generateProductDescription } from '@/ai/flows/generate-product-description';
import { searchWithVoice } from '@/ai/flows/search-with-voice';
import { generateProductDescriptionFromVoice } from '@/ai/flows/generate-product-description-from-voice';

describe('Voice Features: Voice Search & Voice Product Description', () => {
  describe('1. Multilingual Speech Language Resolution', () => {
    it('maps all supported Indian languages to their standard BCP-47 speech recognition codes', () => {
      expect(getSpeechLanguageCode('Hindi')).toBe('hi-IN');
      expect(getSpeechLanguageCode('hi')).toBe('hi-IN');
      expect(getSpeechLanguageCode('hi-IN')).toBe('hi-IN');

      expect(getSpeechLanguageCode('English')).toBe('en-IN');
      expect(getSpeechLanguageCode('en')).toBe('en-IN');
      // Hinglish maps to hi-IN which handles hybrid Indian vocabulary best in browser SpeechRecognition
      expect(getSpeechLanguageCode('Hinglish')).toBe('hi-IN');

      expect(getSpeechLanguageCode('Tamil')).toBe('ta-IN');
      expect(getSpeechLanguageCode('ta')).toBe('ta-IN');

      expect(getSpeechLanguageCode('Bengali')).toBe('bn-IN');
      expect(getSpeechLanguageCode('bn')).toBe('bn-IN');

      expect(getSpeechLanguageCode('Telugu')).toBe('te-IN');
      expect(getSpeechLanguageCode('te')).toBe('te-IN');

      expect(getSpeechLanguageCode('Marathi')).toBe('mr-IN');
      expect(getSpeechLanguageCode('mr')).toBe('mr-IN');

      expect(getSpeechLanguageCode('Gujarati')).toBe('gu-IN');
      expect(getSpeechLanguageCode('gu')).toBe('gu-IN');

      expect(getSpeechLanguageCode('Kannada')).toBe('kn-IN');
      expect(getSpeechLanguageCode('kn')).toBe('kn-IN');

      expect(getSpeechLanguageCode('Malayalam')).toBe('ml-IN');
      expect(getSpeechLanguageCode('ml')).toBe('ml-IN');

      expect(getSpeechLanguageCode('Punjabi')).toBe('pa-IN');
      expect(getSpeechLanguageCode('pa')).toBe('pa-IN');

      expect(getSpeechLanguageCode('Urdu')).toBe('ur-IN');
      expect(getSpeechLanguageCode('ur')).toBe('ur-IN');

      expect(getSpeechLanguageCode('Odia')).toBe('or-IN');
      expect(getSpeechLanguageCode('Assamese')).toBe('as-IN');
    });

    it('contains speech codes in all SUPPORTED_LANGUAGES definitions', () => {
      for (const lang of SUPPORTED_LANGUAGES) {
        expect(lang.speechCode).toBeDefined();
        expect(lang.speechCode.length).toBeGreaterThanOrEqual(5);
        expect(lang.speechCode).toContain('-');
      }
    });
  });

  describe('2. Browser Speech Recognition Hook & Fallback', () => {
    it('gracefully reports isSupported=false in environments without window.SpeechRecognition', () => {
      const { result } = renderHook(() =>
        useSpeechRecognition({ defaultLanguage: 'Hindi' })
      );

      expect(result.current.isSupported).toBe(false);
      expect(result.current.isListening).toBe(false);
      expect(result.current.transcript).toBe('');
      expect(result.current.interimTranscript).toBe('');

      // Calling startListening or stopListening should not throw
      act(() => {
        result.current.startListening();
      });
      expect(result.current.error).toContain('Web Speech API');

      act(() => {
        result.current.stopListening();
        result.current.abortListening();
        result.current.resetTranscript();
      });
      expect(result.current.isListening).toBe(false);
    });

    it('works with simulated Web Speech API events', () => {
      // Mock window.SpeechRecognition
      class MockSpeechRecognition {
        continuous = false;
        interimResults = false;
        lang = 'hi-IN';
        onstart: (() => void) | null = null;
        onresult: ((event: any) => void) | null = null;
        onerror: ((event: any) => void) | null = null;
        onend: (() => void) | null = null;

        start() {
          if (this.onstart) this.onstart();
        }
        stop() {
          if (this.onend) this.onend();
        }
        abort() {
          if (this.onend) this.onend();
        }
      }

      (window as any).SpeechRecognition = MockSpeechRecognition;

      const { result } = renderHook(() =>
        useSpeechRecognition({ defaultLanguage: 'Hindi' })
      );

      expect(result.current.isSupported).toBe(true);

      // Start listening
      act(() => {
        result.current.startListening('hi-IN');
      });
      expect(result.current.isListening).toBe(true);

      // Stop listening
      act(() => {
        result.current.stopListening();
      });
      expect(result.current.isListening).toBe(false);

      // Clean up mock
      delete (window as any).SpeechRecognition;
    });
  });

  describe('3. Multilingual Description Generation with Spoken Details', () => {
    it('generates descriptions incorporating artisan spoken details without throwing', async () => {
      const result = await generateProductDescription({
        productName: 'हाथ से बना टेराकोटा दीया',
        productDetails: 'विशुद्ध काली मिट्टी से चाक पर बना, 6 इंच, प्राकृतिक रंग',
        inputLanguage: 'Hindi',
        outputLanguage: 'Hindi',
        generateEnglish: true,
      });

      expect(result).toBeDefined();
      expect(result.description).toBeTruthy();
      // Contains Devanagari Hindi
      expect(/[\u0900-\u097F]/.test(result.description)).toBe(true);

      // English description was also generated
      expect(result.englishDescription).toBeTruthy();
      expect(typeof result.englishDescription).toBe('string');
      expect(result.englishDescription!.length).toBeGreaterThan(20);
    });

    it('generates descriptions for Tamil with English translation', async () => {
      const result = await generateProductDescription({
        productName: 'தஞ்சாவூர் ஓவியம்',
        productDetails: 'தங்க இலை வேலைப்பாடு, தேக்கு மரச்சட்டகம்',
        inputLanguage: 'Tamil',
        outputLanguage: 'Tamil',
        generateEnglish: true,
      });

      expect(result).toBeDefined();
      expect(result.description).toBeTruthy();
      expect(result.englishDescription).toBeTruthy();
    });
  });

  describe('4. Server Action Resilience (Prevents React Minified Error #441)', () => {
    it('searchWithVoice returns safe fallback without unhandled server exception', async () => {
      // Pass empty/mock base64 data
      const result = await searchWithVoice({
        audioDataUri: 'data:audio/webm;base64,GkXfo59ChoEBQveBAULygQ8=',
      });

      expect(result).toBeDefined();
      expect(result.searchQuery).toBeDefined();
      expect(typeof result.searchQuery).toBe('string');
      // Must not throw or reject
    });

    it('generateProductDescriptionFromVoice returns enhanced description safely', async () => {
      const result = await generateProductDescriptionFromVoice({
        audioDataUri: 'data:audio/webm;base64,GkXfo59ChoEBQveBAULygQ8=',
      });

      expect(result).toBeDefined();
      expect(result.enhancedDescription).toBeDefined();
      expect(typeof result.enhancedDescription).toBe('string');
      expect(result.enhancedDescription.length).toBeGreaterThan(10);
    });
  });
});
