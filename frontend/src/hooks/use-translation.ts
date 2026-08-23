'use client';

import { useLanguage } from '@/context/language-context';

export function useTranslation() {
  const { t } = useLanguage();
  return { t };
}
