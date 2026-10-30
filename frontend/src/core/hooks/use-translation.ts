'use client';

import { useLanguage } from '@/context/language-context';

export function useTranslation() {
  const {
    t,
    translateProduct,
    translateDescription,
    translateCategory,
    translateRegion,
    language,
    setLanguage,
    dir,
    isRTL,
  } = useLanguage();

  return {
    t,
    translateProduct,
    translateDescription,
    translateCategory,
    translateRegion,
    language,
    setLanguage,
    dir,
    isRTL,
  };
}
