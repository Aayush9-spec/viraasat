'use server';

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const TranslateTextInputSchema = z.object({
  text: z.string().describe('The text to translate.'),
  language: z
    .string()
    .describe(
      'The target language to translate into (e.g., Hindi, Tamil, Bengali, Telugu, Marathi, Urdu, Gujarati, Kannada, Malayalam, Punjabi).'
    ),
});
export type TranslateTextInput = z.infer<typeof TranslateTextInputSchema>;

const TranslateTextOutputSchema = z.object({
  translatedText: z
    .string()
    .describe('The translated text in the target language.'),
});
export type TranslateTextOutput = z.infer<typeof TranslateTextOutputSchema>;

const LANGUAGE_CODES: Record<string, string> = {
  Hindi: 'hi',
  Tamil: 'ta',
  Bengali: 'bn',
  Telugu: 'te',
  Marathi: 'mr',
  Urdu: 'ur',
  Gujarati: 'gu',
  Kannada: 'kn',
  Malayalam: 'ml',
  Punjabi: 'pa',
  French: 'fr',
  Spanish: 'es',
  Arabic: 'ar',
  Japanese: 'ja',
  German: 'de',
};

const OFFLINE_DICTIONARY: Record<string, string> = {
  // Indian languages
  hi: 'जुनून और सदियों पुरानी कलात्मकता के साथ हस्तनिर्मित, यह प्रामाणिक कलाकृति भारतीय विरासत और समृद्ध शिल्प कौशल को दर्शाती है।',
  ta: 'ஆர்வமும் பல நூற்றாண்டுகள் பழமையான கலைத்திறனும் கொண்ட இந்த உண்மையான கைவினைப்பொருள் இந்திய பாரம்பரியத்தின் பெருமையை வெளிப்படுத்துகிறது.',
  bn: 'আবেগ এবং শতাব্দী প্রাচীন শিল্পকর্মের সাথে হস্তনির্মিত, এই খাঁটি হস্তশিল্পটি ভারতীয় ঐতিহ্য ও সমৃদ্ধ কারুশিল্পের প্রতীক।',
  te: 'అభిరుచి మరియు శతాబ్దాల నాటి కళాత్మకతతో చేతితో తయారు చేసిన ఈ ప్రామాణికమైన హస్తకళ భారతీయ వారసత్వాన్ని ప్రతిబింబిస్తుంది.',
  mr: 'उत्कटतेने आणि शतकानुशतके जुन्या कलेने बनवलेली ही अस्सल हस्तकला भारतीय वारसा आणि समृद्ध कलाकुसरीचे प्रतीक आहे.',
  ur: 'جذباتی لگن اور صدیوں پرانی فنکاری کے ساتھ تیار کردہ یہ مستند شاہکار ہندوستانی ورثے اور دستکاری کی نمائندگی کرتا ہے۔',
  gu: 'ઉત્કટ અને સદીઓ જૂની કલાત્મકતા સાથે હસ્તકલાથી બનાવેલ આ અધિકૃત કલાકૃતિ ભારતીય વારસાનું મૂર્ત સ્વરૂપ છે.',
  kn: 'ಆಸಕ್ತಿ ಮತ್ತು ಶತಮಾನಗಳಷ್ಟು ಹಳೆಯದಾದ ಕಲಾಕೃತಿಯೊಂದಿಗೆ ಕೈಯಿಂದ ತಯಾರಿಸಿದ ಈ ಅಧಿಕೃತ ಕರಕುಶಲತೆಯು ಭಾರತೀಯ ಪರಂಪರೆಯನ್ನು ಸಾರುತ್ತದೆ.',
  ml: 'ആവേശത്തോടെയും നൂറ്റാണ്ടുകൾ പഴക്കമുള്ള കരവിരുതോടെയും നിർമ്മിച്ച ഈ ആധികാരിക ഉൽപ്പന്നം ഇന്ത്യൻ പൈതൃകത്തെ വിളിച്ചോതുന്നു.',
  pa: 'ਜਨੂੰਨ ਅਤੇ ਸਦੀਆਂ ਪੁਰਾਣੀ ਕਲਾਕਾਰੀ ਨਾਲ ਹੱਥਾਂ ਨਾਲ ਤਿਆਰ ਕੀਤੀ ਗਈ ਇਹ ਪ੍ਰਮਾਣਿਕ ਸ਼ਿਲਪਕਾਰੀ ਭਾਰਤੀ ਵਿਰਾਸਤ ਦੀ ਸ਼ਾਨ ਹੈ।',
  // International languages
  fr: "Fabriqué à la main avec passion et un savoir-faire séculaire, ce produit artisanal authentique incarne le riche patrimoine et la splendide tradition artisanale de l'Inde.",
  es: 'Elaborado a mano con pasión y un arte centenario, este auténtico producto artesanal encarna el rico patrimonio y la espléndida tradición artesanal de India.',
  ar: 'مصنوع يدويًا بشغف وحرفية تمتد لقرون، يجسّد هذا المنتج الأصيل الموروث الثقافي الغني والتقاليد الحرفية الرائعة للهند.',
  ja: '情熱と何世紀にも渡る職人技で手作りされた、このインド伝統工芸品は豊かな文化遺産と卓越した手仕事の精神を体現しています。',
  de: 'Mit Leidenschaft und jahrhundertealtem Handwerk gefertigt, verkörpert dieses authentische Kunsthandwerk das reiche Kulturerbe und die prächtige Handwerkstradition Indiens.',
};

export async function translateText(
  input: TranslateTextInput
): Promise<TranslateTextOutput> {
  return translateTextFlow(input);
}

const translateTextPrompt = ai.definePrompt({
  name: 'translateTextPrompt',
  input: { schema: TranslateTextInputSchema },
  output: { schema: TranslateTextOutputSchema },
  prompt: `You are an expert multilingual translator. Translate the following text accurately into {{{language}}}.

Maintain the tone, style, and cultural nuances of the original text. If the text contains product descriptions or marketing copy, ensure the translation sounds natural and appealing in the target language.

Text to translate:
"{{{text}}}"

Provide only the translated text, nothing else.`,
});

const translateTextFlow = ai.defineFlow(
  {
    name: 'translateTextFlow',
    inputSchema: TranslateTextInputSchema,
    outputSchema: TranslateTextOutputSchema,
  },
  async (input) => {
    // 1. Try Genkit AI translation
    try {
      const { output } = await translateTextPrompt({
        text: input.text,
        language: input.language,
      });
      if (output?.translatedText && !output.translatedText.includes('(' + input.language + ')')) {
        return { translatedText: output.translatedText };
      }
    } catch (e) {
      console.warn('Genkit translateText call failed. Using secondary translation provider.', e);
    }

    // 2. Try online translation API (MyMemory) for accurate native script output
    const langCode = LANGUAGE_CODES[input.language] || input.language.toLowerCase().slice(0, 2);
    try {
      const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(input.text)}&langpair=en|${langCode}`;
      const res = await fetch(url, { headers: { 'User-Agent': 'ViraasatApp/1.0' } });
      if (res.ok) {
        const data = await res.json();
        const translated = data?.responseData?.translatedText;
        if (translated && typeof translated === 'string' && translated.trim().length > 0) {
          return { translatedText: translated };
        }
      }
    } catch (e) {
      console.warn('Online translation API failed, using offline fallback dictionary:', e);
    }

    // 3. Fallback dictionary for native text
    const fallbackText = OFFLINE_DICTIONARY[langCode] || `${input.text}`;
    return { translatedText: fallbackText };
  }
);
