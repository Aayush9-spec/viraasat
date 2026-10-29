'use client';

import { useLanguage } from '@/context/language-context';

export function useTranslation() {
  const { t, translateProduct, language, setLanguage, dir, isRTL } = useLanguage();
  return { t, translateProduct, language, setLanguage, dir, isRTL };
}
