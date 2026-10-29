'use client';

import { useLanguage } from '@/context/language-context';

export function useTranslation() {
  const { t, language, setLanguage, dir, isRTL } = useLanguage();
  return { t, language, setLanguage, dir, isRTL };
}
