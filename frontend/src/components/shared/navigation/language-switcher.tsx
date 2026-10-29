'use client';

import { useLanguage } from '@/context/language-context';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Globe, Check } from 'lucide-react';
import { cn } from '@/core/utils/utils';

export const SUPPORTED_UI_LANGUAGES = [
  { code: 'en', name: 'English', native: 'English' },
  { code: 'hi', name: 'हिन्दी (Hindi)', native: 'हिन्दी' },
  { code: 'ta', name: 'தமிழ் (Tamil)', native: 'தமிழ்' },
  { code: 'bn', name: 'বাংলা (Bengali)', native: 'বাংলা' },
  { code: 'te', name: 'తెలుగు (Telugu)', native: 'తెలుగు' },
  { code: 'mr', name: 'मराठी (Marathi)', native: 'मराठी' },
  { code: 'ur', name: 'اردو (Urdu)', native: 'اردو' },
  { code: 'gu', name: 'ગુજરાતી (Gujarati)', native: 'ગુજરાતી' },
  { code: 'kn', name: 'ಕನ್ನಡ (Kannada)', native: 'ಕನ್ನಡ' },
  { code: 'ml', name: 'മലയാളം (Malayalam)', native: 'മലയാളം' },
  { code: 'pa', name: 'ਪੰਜਾਬੀ (Punjabi)', native: 'ਪੰਜਾਬੀ' },
  { code: 'or', name: 'ଓଡ଼ିଆ (Odia)', native: 'ଓଡ଼ିଆ' },
  { code: 'as', name: 'অসমীয়া (Assamese)', native: 'অসমীয়া' },
];

interface LanguageSwitcherProps {
  className?: string;
  showLabel?: boolean;
}

export default function LanguageSwitcher({ className, showLabel = false }: LanguageSwitcherProps) {
  const { language, setLanguage, t } = useLanguage();

  const currentLang = SUPPORTED_UI_LANGUAGES.find((l) => l.code === language) || SUPPORTED_UI_LANGUAGES[0];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size={showLabel ? 'sm' : 'icon'}
          className={cn('text-muted-foreground hover:text-primary gap-1.5', className)}
          aria-label={t('common.selectLanguage') || 'Select Language'}
        >
          <Globe className="h-4 w-4 text-primary" />
          {showLabel && <span className="text-xs font-medium">{currentLang.native}</span>}
          <span className="sr-only">Change language</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48 max-h-80 overflow-y-auto">
        {SUPPORTED_UI_LANGUAGES.map((lang) => {
          const isSelected = language === lang.code;
          return (
            <DropdownMenuItem
              key={lang.code}
              onSelect={() => setLanguage(lang.code)}
              className={cn(
                'flex items-center justify-between cursor-pointer text-xs font-medium',
                isSelected && 'bg-primary/10 text-primary font-semibold'
              )}
            >
              <span>{lang.name}</span>
              {isSelected && <Check className="h-3.5 w-3.5 text-primary ml-2 shrink-0" />}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
