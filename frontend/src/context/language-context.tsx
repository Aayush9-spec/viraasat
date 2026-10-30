'use client';

import {
  PRODUCT_NAME_TRANSLATIONS,
  PRODUCT_DESCRIPTION_TRANSLATIONS,
  PRODUCT_CATEGORY_TRANSLATIONS,
  PRODUCT_REGION_TRANSLATIONS,
  getTranslatedProductName,
  getTranslatedProductDescription,
  getTranslatedProductCategory,
  getTranslatedRegion,
} from '@/core/utils/product-translations';
import React, { createContext, useState, useContext, useEffect, ReactNode, useMemo, useCallback } from 'react';
import en from '@/locales/en.json';
import hi from '@/locales/hi.json';
import ta from '@/locales/ta.json';
import bn from '@/locales/bn.json';
import te from '@/locales/te.json';
import mr from '@/locales/mr.json';
import ur from '@/locales/ur.json';
import gu from '@/locales/gu.json';
import kn from '@/locales/kn.json';
import ml from '@/locales/ml.json';
import pa from '@/locales/pa.json';
import or from '@/locales/or.json';
import as from '@/locales/as.json';

const translations: Record<string, any> = { en, hi, ta, bn, te, mr, ur, gu, kn, ml, pa, or, as };

// Master Phrase Dictionary for Full Website Translation across all languages
const PHRASE_DICTIONARY: Record<string, Record<string, string>> = {
  hi: {
    "Home": "होम",
    "Shop": "दुकान",
    "Artisan Portal": "कारीगर पोर्टल",
    "Products": "उत्पाद",
    "Orders": "ऑर्डर",
    "Login": "लॉग इन",
    "Sign Up": "साइन अप",
    "Wishlist": "विशलिस्ट",
    "Cart": "कार्ट",
    "Dashboard": "डैशबोर्ड",
    "Preserving India's Heritage": "भारत की विरासत का संरक्षण",
    "Discover authentic Indian handicrafts, each one a unique piece of art, telling a story of tradition and skill.": "प्रामाणिक भारतीय हस्तशिल्प की खोज करें, प्रत्येक कलाकृति परंपरा और कौशल की कहानी कहती है।",
    "Enter The Viraasat": "विरासत में प्रवेश करें",
    "ENTER THE VIRAASAT": "विरासत में प्रवेश करें",
    "Our Philosophy": "हमारा दर्शन",
    "OUR PHILOSOPHY": "हमारा दर्शन",
    "Our Mission": "हमारा मिशन",
    "OUR MISSION": "हमारा मिशन",
    "Viraasat is a tribute to the soul of India's artisan communities. We provide a platform for talented craftspeople to share their ancestral skills and handmade treasures with the world.": "विरासत भारत के कारीगर समुदायों की आत्मा को एक श्रद्धांजलि है। हम प्रतिभाशाली कारीगरों को अपने पैतृक कौशल और हस्तनिर्मित खजाने दुनिया के साथ साझा करने के लिए एक मंच प्रदान करते हैं।",
    "The Collection": "संग्रह",
    "THE COLLECTION": "संग्रह",
    "Masterpieces": "उत्कृष्ट कृतियाँ",
    "Handcrafted treasures from the heart of India": "भारत के दिल से हस्तनिर्मित खजाने",
    "View Gallery": "गैलरी देखें",
    "VIEW GALLERY": "गैलरी देखें",
    "View Full Gallery": "पूरी गैलरी देखें",
    "VIEW FULL GALLERY": "पूरी गैलरी देखें",
    "Curated Selections": "चयनित संग्रह",
    "Regional Heritage": "क्षेत्रीय विरासत",
    "Explore by Origin": "उत्पत्ति के अनुसार खोजें",
    "Tradition": "परंपरा",
    "Supporting The Hands That Create": "सृजन करने वाले हाथों का समर्थन",
    "Viraasat is not just a marketplace; it is a movement. A movement to bring the spotlight back to the hands that weave magic, carve history, and paint culture. Your patronage directly empowers these guardians of our heritage.": "विरासत केवल एक बाज़ार नहीं है; यह एक आंदोलन है। जादू बुनने, इतिहास तराशने और संस्कृति को चित्रित करने वाले हाथों को वापस सुर्खियों में लाने का आंदोलन।",
    "Join The Legacy": "विरासत से जुड़ें",
    "Be the first to know about rare acquirements.": "दुर्लभ कलाकृतियों के बारे में सबसे पहले जानें।",
    "Subscribe": "सब्सक्राइब करें",
    "EMAIL ADDRESS": "ईमेल पता",
    "The Viraasat Collection": "विरासत संग्रह",
    "Bring India's Soul To Your Home": "भारत की आत्मा को अपने घर लाएं",
    "Explore by Geographic Heritage": "भौगोलिक विरासत के अनुसार खोजें",
  },
  mr: {
    "Home": "मुख्यपृष्ठ",
    "Shop": "दुकान",
    "Artisan Portal": "कारागीर पोर्टल",
    "Products": "उत्पादने",
    "Orders": "ऑर्डर्स",
    "Login": "लॉगिन",
    "Sign Up": "साइन अप",
    "Wishlist": "विशलिस्ट",
    "Cart": "कार्ट",
    "Dashboard": "डॅशबोर्ड",
    "Preserving India's Heritage": "भारताचा वारसा जपणे",
    "Discover authentic Indian handicrafts, each one a unique piece of art, telling a story of tradition and skill.": "अस्सल भारतीय हस्तकलेचा शोध घ्या, प्रत्येक कलाकृती परंपरा आणि कौशल्याची कथा सांगते.",
    "Enter The Viraasat": "विरासत मध्ये प्रवेश करा",
    "ENTER THE VIRAASAT": "विरासत मध्ये प्रवेश करा",
    "Our Philosophy": "आमचे तत्त्वज्ञान",
    "OUR PHILOSOPHY": "आमचे तत्त्वज्ञान",
    "Our Mission": "आमचे ध्येय",
    "OUR MISSION": "आमचे ध्येय",
    "Viraasat is a tribute to the soul of India's artisan communities. We provide a platform for talented craftspeople to share their ancestral skills and handmade treasures with the world.": "विरासत ही भारतातील कारागीर समुदायांच्या आत्म्याला दिलेली श्रद्धांजली आहे. आम्ही कुशल कारागिरांना त्यांच्या पूर्वजांचे कौशल्य जगभरात पोहोचवण्यासाठी एक मंच प्रदान करतो.",
    "The Collection": "संग्रह",
    "THE COLLECTION": "संग्रह",
    "Masterpieces": "उत्कृष्ट कलाकृती",
    "Handcrafted treasures from the heart of India": "भारताच्या हृदयातील हस्तनिर्मित खजिना",
    "View Gallery": "गॅलरी पहा",
    "VIEW GALLERY": "गॅलरी पहा",
    "View Full Gallery": "संपूर्ण गॅलरी पहा",
    "VIEW FULL GALLERY": "संपूर्ण गॅलरी पहा",
    "Curated Selections": "निवडक संग्रह",
    "Regional Heritage": "प्रांतीय वारसा",
    "Explore by Origin": "उगमस्थानानुसार शोधा",
    "Tradition": "परंपरा",
    "Supporting The Hands That Create": "सृजनशील हातांना पाठिंबा",
    "Viraasat is not just a marketplace; it is a movement. A movement to bring the spotlight back to the hands that weave magic, carve history, and paint culture. Your patronage directly empowers these guardians of our heritage.": "विरासत ही केवळ एक बाजारपेठ नाही; ही एक चळवळ आहे. जादू विणणाऱ्या आणि इतिहास घडवणाऱ्या हातांना सन्मान मिळवून देणारी चळवळ.",
    "Join The Legacy": "वारशाचा भाग बना",
    "Be the first to know about rare acquirements.": "दुर्मिळ कलाकृतींबद्दल माहिती मिळवणारे पहिले बना.",
    "Subscribe": "सबस्क्राईब करा",
    "EMAIL ADDRESS": "ईमेल पत्ता",
    "The Viraasat Collection": "विरासत संग्रह",
    "Bring India's Soul To Your Home": "भारताचा आत्मा तुमच्या घरी आणा",
    "Explore by Geographic Heritage": "भौगोलिक वारशानुसार शोधा",
  },
  bn: {
    "Home": "হোম",
    "Shop": "দোকান",
    "Artisan Portal": "কারিগর পোর্টাল",
    "Products": "পণ্যসমূহ",
    "Orders": "অর্ডারসমূহ",
    "Login": "লগইন",
    "Sign Up": "সাইন আপ",
    "Wishlist": "প্রিয়",
    "Cart": "কার্ট",
    "Dashboard": "ড্যাশবোর্ড",
    "Preserving India's Heritage": "ভারতের ঐতিহ্য সংরক্ষণ",
    "Discover authentic Indian handicrafts, each one a unique piece of art, telling a story of tradition and skill.": "প্রামাণিক ভারতীয় হস্তশিল্প আবিষ্কার করুন, প্রতিটি শিল্পকর্ম ঐতিহ্য এবং দক্ষতার গল্প বলে।",
    "Enter The Viraasat": "বিরাসাতে প্রবেশ করুন",
    "ENTER THE VIRAASAT": "বিরাসাতে প্রবেশ করুন",
    "Our Philosophy": "আমাদের দর্শন",
    "OUR PHILOSOPHY": "আমাদের দর্শন",
    "Our Mission": "আমাদের লক্ষ্য",
    "OUR MISSION": "আমাদের লক্ষ্য",
    "Viraasat is a tribute to the soul of India's artisan communities. We provide a platform for talented craftspeople to share their ancestral skills and handmade treasures with the world.": "বিরাসাত ভারতের কারিগর সম্প্রদায়ের আত্মার প্রতি শ্রদ্ধাঞ্জলি। আমরা দক্ষ কারিগরদের তাদের ঐতিহ্যবাহী দক্ষতা বিশ্বের সাথে শেয়ার করার প্ল্যাটফর্ম প্রদান করি।",
    "The Collection": "সংগ্রহ",
    "THE COLLECTION": "সংগ্রহ",
    "Masterpieces": "সেরা শিল্পকর্ম",
    "Handcrafted treasures from the heart of India": "ভারতের বুক থেকে হাতে তৈরি ধন",
    "View Gallery": "গ্যালারি দেখুন",
    "VIEW GALLERY": "গ্যালারি দেখুন",
    "View Full Gallery": "সম্পূর্ণ গ্যালারি দেখুন",
    "VIEW FULL GALLERY": "সম্পূর্ণ গ্যালারি দেখুন",
    "Curated Selections": "নির্বাচিত সংগ্রহ",
    "Regional Heritage": "আঞ্চলিক ঐতিহ্য",
    "Explore by Origin": "উৎপত্তি অনুযায়ী খুঁজুন",
    "Tradition": "ঐতিহ্য",
    "Supporting The Hands That Create": "সৃষ্টিকর্তা হাতকে সমর্থন",
    "Viraasat is not just a marketplace; it is a movement. A movement to bring the spotlight back to the hands that weave magic, carve history, and paint culture.": "বিরাসাত কেবল একটি বাজার নয়; এটি একটি আন্দোলন।",
    "Join The Legacy": "ঐতিহ্যে যোগ দিন",
    "Be the first to know about rare acquirements.": "বিরল সংগ্রহ সম্পর্কে আগে জানুন।",
    "Subscribe": "সাবস্ক্রাইব করুন",
    "EMAIL ADDRESS": "ইমেল ঠিকানা",
    "The Viraasat Collection": "বিরাসাত সংগ্রহ",
    "Bring India's Soul To Your Home": "ভারতের আত্মাকে আপনার ঘরে আনুন",
    "Explore by Geographic Heritage": "ভৌগোলিক ঐতিহ্য অনুযায়ী খুঁজুন",
  },
  ta: {
    "Home": "முகப்பு",
    "Shop": "கடை",
    "Artisan Portal": "கைவினைஞர் போர்டல்",
    "Products": "தயாரிப்புகள்",
    "Orders": "ஆர்டர்கள்",
    "Login": "உள்நுழைவு",
    "Sign Up": "பதிவு செய்க",
    "Wishlist": "விருப்பப்பட்டியல்",
    "Cart": "கார்ட்",
    "Dashboard": "டாஷ்போர்டு",
    "Preserving India's Heritage": "இந்தியாவின் பாரம்பரியத்தைப் பாதுகாத்தல்",
    "Discover authentic Indian handicrafts, each one a unique piece of art, telling a story of tradition and skill.": "உண்மையான இந்திய கைவினைப்பொருட்களைக் கண்டறியவும், ஒவ்வொன்றும் கதை கூறுகிறது.",
    "Enter The Viraasat": "விராசத்திற்குள் நுழையவும்",
    "ENTER THE VIRAASAT": "விராசத்திற்குள் நுழையவும்",
    "Our Philosophy": "எங்கள் தத்துவம்",
    "OUR PHILOSOPHY": "எங்கள் தத்துவம்",
    "Our Mission": "எங்கள் நோக்கம்",
    "OUR MISSION": "எங்கள் நோக்கம்",
    "The Collection": "சேகரிப்பு",
    "Masterpieces": "அற்புத கலைப்படைகள்",
    "View Gallery": "கேலரியைப் பார்க்கவும்",
    "View Full Gallery": "முழு கேலரியைப் பார்க்கவும்",
    "Curated Selections": "தேர்ந்தெடுக்கப்பட்ட கலைகள்",
    "Regional Heritage": "பிராந்திய பாரம்பரியம்",
    "Explore by Origin": "தோற்றத்தின்படி ஆராயுங்கள்",
    "Tradition": "பாரம்பரியம்",
    "Join The Legacy": "பாரம்பரியத்தில் இணையுங்கள்",
    "Subscribe": "சந்தா சேரவும்",
    "The Viraasat Collection": "விராசாத் சேகரிப்பு",
    "Bring India's Soul To Your Home": "இந்தியாவின் ஆன்மாவை உங்கள் வீட்டிற்கு கொண்டு வாருங்கள்",
    "Explore by Geographic Heritage": "புவியியல் பாரம்பரியத்தின்படி ஆராயுங்கள்",
  },
  te: {
    "Home": "హోమ్",
    "Shop": "షాప్",
    "Artisan Portal": "ఆర్టిసన్ పోర్టల్",
    "Products": "ఉత్పత్తులు",
    "Orders": "ఆర్డర్లు",
    "Login": "లాగిన్",
    "Sign Up": "సైన్ అప్",
    "Wishlist": "విష్‌లిస్ట్",
    "Cart": "కార్ట్",
    "Dashboard": "డాష్‌బోర్డ్",
    "Preserving India's Heritage": "భారతీయ వారసత్వాన్ని పరిరక్షించడం",
    "Enter The Viraasat": "విరాసత్‌లోకి ప్రవేశించండి",
    "Our Philosophy": "మా తత్వశాస్త్రం",
    "Our Mission": "మా లక్ష్యం",
    "The Collection": "సేకరణ",
    "Masterpieces": "అద్భుత కళాఖండాలు",
    "View Gallery": "గ్యాలరీ చూడండి",
    "View Full Gallery": "పూర్తి గ్యాలరీ చూడండి",
    "Bring India's Soul To Your Home": "భారతదేశ ఆత్మను మీ ఇంటికి తీసుకురండి",
    "Explore by Geographic Heritage": "భౌగోళిక వారసత్వం ప్రకారం అన్వేషించండి",
  },
  ur: {
    "Home": "ہوم",
    "Shop": "دکان",
    "Artisan Portal": "دستکار پورٹل",
    "Products": "مصنوعات",
    "Orders": "آرڈرز",
    "Preserving India's Heritage": "ہندوستانی ورثے کا تحفظ",
    "Enter The Viraasat": "وراثت میں داخل ہوں",
    "Our Philosophy": "ہمارا فلسفہ",
    "Our Mission": "ہمارا مقصد",
    "The Collection": "مجموعہ",
    "View Gallery": "گیلری دیکھیں",
    "Bring India's Soul To Your Home": "ہندوستان کی روح اپنے گھر لائیں",
  },
  gu: {
    "Home": "હોમ",
    "Shop": "દુકાન",
    "Artisan Portal": "કારીગર પોર્ટલ",
    "Products": "ઉત્પાદનો",
    "Orders": "ઓર્ડર",
    "Preserving India's Heritage": "ભારતના વારસાનું જતન",
    "Enter The Viraasat": "વિરાસતમાં પ્રવેશ કરો",
    "Our Philosophy": "અમારું ફિલસૂફી",
    "Our Mission": "અમારો હેતુ",
    "The Collection": "સંગ્રહ",
    "View Gallery": "ગેલેરી જુઓ",
    "Bring India's Soul To Your Home": "ભારતના આત્માને તમારા ઘરે લાવો",
  },
  kn: {
    "Home": "ಮುಖ್ಯಪುಟ",
    "Shop": "ಅಂಗಡಿ",
    "Artisan Portal": "ಕರಕುಶಲ ಪೋರ್ಟಲ್",
    "Products": "ಉತ್ಪನ್ನಗಳು",
    "Orders": "ಆರ್ಡರ್‌ಗಳು",
    "Preserving India's Heritage": "ಭಾರತದ ಪರಂಪರೆಯನ್ನು ಸಂರಕ್ಷಿಸುವುದು",
    "Enter The Viraasat": "ವಿರಾಸತ್ ಪ್ರವೇಶಿಸಿ",
    "Our Philosophy": "ನಮ್ಮ ತತ್ವಶಾಸ್ತ್ರ",
    "Our Mission": "ನಮ್ಮ ಧ್ಯೇಯ",
    "The Collection": "ಸಂಗ್ರಹ",
    "View Gallery": "ಗ್ಯಾಲರಿ ವೀಕ್ಷಿಸಿ",
    "Bring India's Soul To Your Home": "ಭಾರತದ ಆತ್ಮವನ್ನು ನಿಮ್ಮ ಮನೆಗೆ ತನ್ನಿ",
  },
  ml: {
    "Home": "ഹോം",
    "Shop": "ഷോപ്പ്",
    "Artisan Portal": "കരകൗശല പോർട്ടൽ",
    "Products": "ഉൽപ്പന്നങ്ങൾ",
    "Orders": "ഓർഡറുകൾ",
    "Preserving India's Heritage": "ഇന്ത്യയുടെ പൈതൃകം സംരക്ഷിക്കുന്നു",
    "Enter The Viraasat": "വിരാസതിലേക്ക് പ്രവേശിക്കുക",
    "Our Philosophy": "ഞങ്ങളുടെ തത്വം",
    "Our Mission": "ഞങ്ങളുടെ ലക്ഷ്യം",
    "The Collection": "ശേഖരം",
    "View Gallery": "ഗാലറി കാണുക",
    "Bring India's Soul To Your Home": "ഇന്ത്യയുടെ ആത്മാവിനെ നിങ്ങളുടെ വീട്ടിലേക്ക് കൊണ്ടുവരിക",
  },
  pa: {
    "Home": "ਹੋਮ",
    "Shop": "ਦੁਕਾਨ",
    "Artisan Portal": "ਕਾਰੀਗਰ ਪੋਰਟਲ",
    "Products": "ਉਤਪਾਦ",
    "Orders": "ਆਰਡਰ",
    "Preserving India's Heritage": "ਭਾਰਤ ਦੀ ਵਿਰਾਸਤ ਨੂੰ ਸੰਭਾਲਣਾ",
    "Enter The Viraasat": "ਵਿਰਾਸਤ ਵਿੱਚ ਦਾਖਲ ਹੋਵੋ",
    "Our Philosophy": "ਸਾਡਾ ਫਲਸਫਾ",
    "Our Mission": "ਸਾਡਾ ਮਿਸ਼ਨ",
    "The Collection": "ਸੰਗ੍ਰਹਿ",
    "View Gallery": "ਗੈਲਰੀ ਦੇਖੋ",
    "Bring India's Soul To Your Home": "ਭਾਰਤ ਦੀ ਰੂਹ ਨੂੰ ਆਪਣੇ ਘਰ ਲਿਆਓ",
  }
};

interface LanguageContextType {
  language: string;
  setLanguage: (language: string) => void;
  t: (key: string, params?: Record<string, string | number>) => string;
  translateProduct: (nameOrProduct: any) => string;
  translateDescription: (descOrProduct: any) => string;
  translateCategory: (category: string | null | undefined) => string;
  translateRegion: (region: string | null | undefined) => string;
  dir: 'ltr' | 'rtl';
  isRTL: boolean;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState('en');

  const dir: 'ltr' | 'rtl' = language === 'ur' ? 'rtl' : 'ltr';
  const isRTL = dir === 'rtl';

  const applyDocumentAttributes = useCallback((lang: string) => {
    if (typeof document !== 'undefined') {
      document.documentElement.lang = lang;
      document.documentElement.dir = lang === 'ur' ? 'rtl' : 'ltr';
    }
  }, []);

  useEffect(() => {
    const savedLanguage = localStorage.getItem('viraasat-lang');
    if (savedLanguage && translations[savedLanguage]) {
      setLanguageState(savedLanguage);
      applyDocumentAttributes(savedLanguage);
    } else {
      applyDocumentAttributes('en');
    }
  }, [applyDocumentAttributes]);

  const setLanguage = useCallback((lang: string) => {
    localStorage.setItem('viraasat-lang', lang);
    setLanguageState(lang);
    applyDocumentAttributes(lang);
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('viraasat_language_change', { detail: { language: lang } }));
    }
  }, [applyDocumentAttributes]);

  const t = useCallback((key: string, params?: Record<string, string | number>): string => {
    if (!key) return '';

    let text = '';

    // 1. Direct translation matches for active language
    if (language !== 'en') {
      if (PRODUCT_NAME_TRANSLATIONS[key]?.[language]) {
        text = PRODUCT_NAME_TRANSLATIONS[key][language];
      } else if (PRODUCT_DESCRIPTION_TRANSLATIONS[key]?.[language]) {
        text = PRODUCT_DESCRIPTION_TRANSLATIONS[key][language];
      } else if (PRODUCT_CATEGORY_TRANSLATIONS[key]?.[language]) {
        text = PRODUCT_CATEGORY_TRANSLATIONS[key][language];
      } else if (PRODUCT_REGION_TRANSLATIONS[key]?.[language]) {
        text = PRODUCT_REGION_TRANSLATIONS[key][language];
      } else if (PHRASE_DICTIONARY[language]?.[key]) {
        text = PHRASE_DICTIONARY[language][key];
      }
    } else {
      text = '';
    }

    if (!text) {
      // 2. Dot-notation key resolution
      const keys = key.split('.');
      let result = translations[language];
      for (const k of keys) {
        result = result?.[k];
        if (result === undefined) break;
      }

      if (result !== undefined && typeof result === 'string') {
        text = result;
      } else {
        // Fallback to English dot-notation
        let fallbackResult = translations['en'];
        for (const fk of keys) {
          fallbackResult = fallbackResult?.[fk];
          if (fallbackResult === undefined) break;
        }

        // 3. Fallback phrase dictionary match if key wasn't dot-notation
        if (language !== 'en' && PHRASE_DICTIONARY[language]?.[fallbackResult || key]) {
          text = PHRASE_DICTIONARY[language][fallbackResult || key];
        } else {
          text = typeof fallbackResult === 'string' ? fallbackResult : key;
        }
      }
    }

    // 4. Parameter interpolation: replace {paramName} with value
    if (params && typeof text === 'string') {
      for (const [pKey, pVal] of Object.entries(params)) {
        text = text.replace(new RegExp(`\\{${pKey}\\}`, 'g'), String(pVal));
      }
    }

    return text;
  }, [language]);

  const translateProduct = useCallback((nameOrProduct: any) => {
    return getTranslatedProductName(nameOrProduct, language);
  }, [language]);

  const contextValue = useMemo(() => ({
    language,
    setLanguage,
    t,
    translateProduct,
    dir,
    isRTL,
  }), [language, setLanguage, t, translateProduct, dir, isRTL]);

  return (
    <LanguageContext.Provider value={contextValue}>
      {children}
    </LanguageContext.Provider>
  );
}

const defaultContextValue: LanguageContextType = {
  language: 'en',
  setLanguage: () => {},
  translateProduct: (p: any) => typeof p === 'string' ? p : p?.name || '',
  t: (key: string, params?: Record<string, string | number>) => {
    if (!key) return '';
    const keys = key.split('.');
    let res: any = translations['en'];
    for (const k of keys) {
      res = res?.[k];
      if (res === undefined) break;
    }
    let text = typeof res === 'string' ? res : key;
    if (params) {
      for (const [pKey, pVal] of Object.entries(params)) {
        text = text.replace(new RegExp(`\\{${pKey}\\}`, 'g'), String(pVal));
      }
    }
    return text;
  },
  dir: 'ltr',
  isRTL: false,
};

export function useLanguage(): LanguageContextType {
  const context = useContext(LanguageContext);
  return context || defaultContextValue;
}
