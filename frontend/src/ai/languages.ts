export const SUPPORTED_LANGUAGES = [
  { code: 'hi', value: 'Hindi', label: 'हिन्दी (Hindi)' },
  { code: 'en', value: 'English', label: 'English' },
  { code: 'hinglish', value: 'Hinglish', label: 'Hinglish (Hindi-English)' },
  { code: 'ta', value: 'Tamil', label: 'தமிழ் (Tamil)' },
  { code: 'bn', value: 'Bengali', label: 'বাংলা (Bengali)' },
  { code: 'te', value: 'Telugu', label: 'తెలుగు (Telugu)' },
  { code: 'mr', value: 'Marathi', label: 'मराठी (Marathi)' },
  { code: 'ur', value: 'Urdu', label: 'اردو (Urdu)' },
  { code: 'gu', value: 'Gujarati', label: 'ગુજરાતી (Gujarati)' },
  { code: 'kn', value: 'Kannada', label: 'ಕನ್ನಡ (Kannada)' },
  { code: 'ml', value: 'Malayalam', label: 'മലയാളം (Malayalam)' },
  { code: 'pa', value: 'Punjabi', label: 'ਪੰਜਾਬੀ (Punjabi)' },
  { code: 'or', value: 'Odia', label: 'ଓଡ଼ିଆ (Odia)' },
  { code: 'as', value: 'Assamese', label: 'অসমীয়া (Assamese)' },
] as const;

export function getLanguageCode(langNameOrCode?: string): string {
  if (!langNameOrCode) return 'en';
  const norm = langNameOrCode.trim().toLowerCase();
  const match = SUPPORTED_LANGUAGES.find(
    (l) => l.code === norm || l.value.toLowerCase() === norm || l.label.toLowerCase().includes(norm)
  );
  return match ? match.code : norm.slice(0, 5);
}

export function getLanguageName(codeOrName?: string): string {
  if (!codeOrName) return 'English';
  const norm = codeOrName.trim().toLowerCase();
  const match = SUPPORTED_LANGUAGES.find(
    (l) => l.code === norm || l.value.toLowerCase() === norm || l.label.toLowerCase().includes(norm)
  );
  return match ? match.value : codeOrName;
}
