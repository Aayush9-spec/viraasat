'use client';

import { useState, useRef, useCallback } from 'react';
import Image from 'next/image';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/core/hooks/use-toast';
import {
  Sparkles,
  Languages,
  Camera,
  Copy,
  Check,
  Loader2,
  Upload,
  X,
  Wand2,
  Globe2,
  ImageIcon,
  AlertTriangle,
  Zap,
} from 'lucide-react';

import { generateProductDescription } from '@/ai/flows/generate-product-description';
import {
  buildFallbackNativeDescription,
  buildFallbackEnglishDescription,
  getLanguageName,
} from '@/ai/languages';
import { translateText } from '@/ai/flows/translate-text';
import { generateImageCulturalStory } from '@/ai/flows/image-cultural-story';
import VoiceRecorder from '@/features/ai/components/voice-recorder';

// Detect whether Gemini AI is configured with a real key.
// Valid Google AI Studio keys start with "AIza". The placeholder in .env.local starts with "AQ."
const AI_CONFIGURED =
  typeof process !== 'undefined' &&
  typeof (process.env.GOOGLE_GENAI_API_KEY ?? process.env.GEMINI_API_KEY) === 'string' &&
  (process.env.GOOGLE_GENAI_API_KEY ?? process.env.GEMINI_API_KEY ?? '').startsWith('AIza');

const LANGUAGES = [
  { value: 'Hindi', label: 'हिन्दी (Hindi)' },
  { value: 'English', label: 'English' },
  { value: 'Hinglish', label: 'Hinglish (Hindi-English)' },
  { value: 'Tamil', label: 'தமிழ் (Tamil)' },
  { value: 'Bengali', label: 'বাংলা (Bengali)' },
  { value: 'Telugu', label: 'తెలుగు (Telugu)' },
  { value: 'Marathi', label: 'मराठी (Marathi)' },
  { value: 'Urdu', label: 'اردو (Urdu)' },
  { value: 'Gujarati', label: 'ગુજરાતી (Gujarati)' },
  { value: 'Kannada', label: 'ಕನ್ನಡ (Kannada)' },
  { value: 'Malayalam', label: 'മലയാളം (Malayalam)' },
  { value: 'Punjabi', label: 'ਪੰਜਾਬੀ (Punjabi)' },
  { value: 'Odia', label: 'ଓଡ଼ିଆ (Odia)' },
  { value: 'Assamese', label: 'অসমীয়া (Assamese)' },
  { value: 'French', label: 'Français (French)' },
  { value: 'Spanish', label: 'Español (Spanish)' },
  { value: 'Arabic', label: 'العربية (Arabic)' },
  { value: 'Japanese', label: '日本語 (Japanese)' },
];

export default function AIToolsPage() {
  return (
    <div className="space-y-6">
      {/* Hero Header */}
      <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-primary/10 via-accent/5 to-primary/10 p-6 md:p-8 border border-primary/10">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,hsl(var(--primary)/0.08),transparent_60%)]" />
        <div className="absolute top-4 right-4 opacity-20">
          <Sparkles className="h-24 w-24 text-primary animate-pulse" />
        </div>
        <div className="relative">
          <h1 className="text-2xl md:text-3xl font-bold font-heading tracking-tight">
            Viraasat AI Studio
          </h1>
          <p className="text-muted-foreground mt-2 max-w-2xl">
            Harness the power of AI to create compelling product descriptions,
            translate content across languages, and discover the cultural stories
            behind every craft.
          </p>
          {/* AI status pill */}
          <div className="mt-4 inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-medium border
            bg-amber-50 border-amber-200 text-amber-800 dark:bg-amber-900/20 dark:border-amber-700 dark:text-amber-300">
            <AlertTriangle className="h-3 w-3 shrink-0" />
            Running in Smart Fallback mode — add a valid{' '}
            <code className="font-mono font-semibold">GOOGLE_GENAI_API_KEY</code>{' '}
            from{' '}
            <a
              href="https://aistudio.google.com/apikey"
              target="_blank"
              rel="noopener noreferrer"
              className="underline underline-offset-2"
            >
              aistudio.google.com
            </a>{' '}
            to enable live AI generation.
          </div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="description" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3 h-auto p-1 bg-muted/50 backdrop-blur-sm">
          <TabsTrigger
            value="description"
            className="flex items-center gap-2 py-3 data-[state=active]:bg-background data-[state=active]:shadow-sm"
          >
            <Wand2 className="h-4 w-4" />
            <span className="hidden sm:inline">Description</span>
            <span className="sm:hidden">Desc</span>
          </TabsTrigger>
          <TabsTrigger
            value="translate"
            className="flex items-center gap-2 py-3 data-[state=active]:bg-background data-[state=active]:shadow-sm"
          >
            <Globe2 className="h-4 w-4" />
            <span className="hidden sm:inline">Translator</span>
            <span className="sm:hidden">Trans</span>
          </TabsTrigger>
          <TabsTrigger
            value="image-story"
            className="flex items-center gap-2 py-3 data-[state=active]:bg-background data-[state=active]:shadow-sm"
          >
            <ImageIcon className="h-4 w-4" />
            <span className="hidden sm:inline">Image Story</span>
            <span className="sm:hidden">Image</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="description">
          <DescriptionGeneratorTab />
        </TabsContent>

        <TabsContent value="translate">
          <TranslatorTab />
        </TabsContent>

        <TabsContent value="image-story">
          <ImageStoryTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}

/* ==========================================
   Tab 1: AI Product Description Generator
   ========================================== */
function DescriptionGeneratorTab() {
  const { toast } = useToast();
  const [productName, setProductName] = useState('');
  const [productDetails, setProductDetails] = useState('');
  const [inputLanguage, setInputLanguage] = useState('Hindi');
  const [outputLanguage, setOutputLanguage] = useState('Hindi');
  const [generateEnglish, setGenerateEnglish] = useState(true);
  const [description, setDescription] = useState('');
  const [englishDescription, setEnglishDescription] = useState('');
  const [activeLang, setActiveLang] = useState('Hindi');
  const [isFallback, setIsFallback] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [copiedPrimary, setCopiedPrimary] = useState(false);
  const [copiedEnglish, setCopiedEnglish] = useState(false);

  const handleGenerate = async () => {
    const trimmed = productName.trim();
    if (!trimmed) {
      toast({
        variant: 'destructive',
        title: 'Product name required',
        description: 'Please enter a product name (e.g. हाथ से बनी बनारसी साड़ी).',
      });
      return;
    }
    if (trimmed.length < 3) {
      toast({
        variant: 'destructive',
        title: 'Product name too short',
        description: 'Product name must be at least 3 characters long.',
      });
      return;
    }
    if (trimmed.length > 160) {
      toast({
        variant: 'destructive',
        title: 'Product name too long',
        description: 'Product name cannot exceed 160 characters.',
      });
      return;
    }

    setIsLoading(true);
    setDescription('');
    setEnglishDescription('');
    setIsFallback(null);
    try {
      const result = await generateProductDescription({
        productName: trimmed,
        productDetails: productDetails.trim() || undefined,
        inputLanguage,
        outputLanguage,
        generateEnglish,
      });
      setDescription(result.description);
      setEnglishDescription(result.englishDescription || '');
      setActiveLang(result.outputLanguage || outputLanguage);
      setIsFallback(Boolean(result.isFallback));

      if (result.isFallback) {
        toast({
          title: 'Craft Heritage Description Ready (Smart Fallback)',
          description: `Generated authentic cultural description in ${result.outputLanguage || outputLanguage}.`,
        });
      } else {
        toast({
          title: '✨ Multilingual Descriptions Generated!',
          description: `Generated ${result.outputLanguage || outputLanguage}${generateEnglish ? ' and English' : ''} descriptions.`,
        });
      }
    } catch (error) {
      console.warn('Description generation call failed, using client fallback:', error);
      const reqLang = getLanguageName(outputLanguage);
      const fallbackNative = buildFallbackNativeDescription(trimmed, reqLang, productDetails.trim());
      const fallbackEnglish = generateEnglish
        ? (reqLang === 'English' ? fallbackNative : buildFallbackEnglishDescription(trimmed, productDetails.trim()))
        : '';

      setDescription(fallbackNative);
      setEnglishDescription(fallbackEnglish);
      setActiveLang(reqLang);
      setIsFallback(true);

      toast({
        title: 'Craft Heritage Description Ready (Fallback Mode)',
        description: `Generated authentic cultural description in ${reqLang}.`,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyPrimary = async () => {
    if (!description) return;
    await navigator.clipboard.writeText(description);
    setCopiedPrimary(true);
    toast({ title: 'Copied!', description: `${activeLang} description copied to clipboard.` });
    setTimeout(() => setCopiedPrimary(false), 2000);
  };

  const handleCopyEnglish = async () => {
    if (!englishDescription) return;
    await navigator.clipboard.writeText(englishDescription);
    setCopiedEnglish(true);
    toast({ title: 'Copied!', description: 'English description copied to clipboard.' });
    setTimeout(() => setCopiedEnglish(false), 2000);
  };

  return (
    <div className="grid gap-6 md:grid-cols-2">
      {/* Input Card */}
      <Card className="border-primary/10 shadow-lg">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-primary/20 to-accent/20">
              <Wand2 className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-lg">Multilingual Description Generator</CardTitle>
              <CardDescription>
                Enter or speak a product name in any Indian language to craft culturally rich native and English descriptions.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Product Name Input with Voice Input */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label
                htmlFor="ai-product-name"
                className="text-sm font-medium leading-none"
              >
                Product Name (उत्पाद का नाम)
              </label>
              <VoiceRecorder
                variant="ghost"
                size="sm"
                buttonLabel="Speak Name"
                className="h-6 text-xs text-primary hover:text-primary/80 gap-1 px-1.5"
                defaultLanguage={inputLanguage}
                title="Speak product name in your preferred language"
                onTranscriptionComplete={(text) => setProductName(text)}
              />
            </div>
            <Input
              id="ai-product-name"
              placeholder="e.g. हाथ से बनी बनारसी रेशमी साड़ी, Kashmiri Pashmina Shawl, பித்தளை விநாயகர்..."
              value={productName}
              onChange={(e) => setProductName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleGenerate()}
              className="bg-background"
            />
          </div>

          {/* Artisan Specifications / Spoken Notes */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label
                htmlFor="ai-product-details"
                className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5"
              >
                Craft Details & Specifications (शिल्प विवरण / सामग्री / माप)
              </label>
              <VoiceRecorder
                variant="ghost"
                size="sm"
                buttonLabel="Speak Details"
                className="h-6 text-xs text-primary hover:text-primary/80 gap-1 px-1.5"
                defaultLanguage={inputLanguage}
                productName={productName}
                title="Speak materials, region, dimensions, and craft details"
                onTranscriptionComplete={(text) =>
                  setProductDetails((prev) => (prev ? `${prev}\n${text}` : text))
                }
                onDescriptionsGenerated={({ description: d, englishDescription: ed }) => {
                  setDescription(d);
                  if (ed) setEnglishDescription(ed);
                  setActiveLang(outputLanguage);
                }}
              />
            </div>
            <Textarea
              id="ai-product-details"
              placeholder="Optional: Enter or speak materials (मिट्टी, सिल्क, पीतल), craft technique, region, dimensions, colors..."
              rows={3}
              value={productDetails}
              onChange={(e) => setProductDetails(e.target.value)}
              className="text-xs bg-background resize-none"
            />
          </div>

          {/* Language Selectors */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground">
                Input Name Language (नाम की भाषा)
              </label>
              <Select value={inputLanguage} onValueChange={setInputLanguage}>
                <SelectTrigger className="text-xs h-9 bg-background">
                  <SelectValue placeholder="Select input language" />
                </SelectTrigger>
                <SelectContent className="max-h-60">
                  {LANGUAGES.map((l) => (
                    <SelectItem key={`in-${l.value}`} value={l.value} className="text-xs">
                      {l.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground">
                Primary Output Language (विवरण की भाषा)
              </label>
              <Select value={outputLanguage} onValueChange={setOutputLanguage}>
                <SelectTrigger className="text-xs h-9 bg-background">
                  <SelectValue placeholder="Select output language" />
                </SelectTrigger>
                <SelectContent className="max-h-60">
                  {LANGUAGES.map((l) => (
                    <SelectItem key={`out-${l.value}`} value={l.value} className="text-xs">
                      {l.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Dual English Toggle */}
          <div className="flex items-center space-x-2.5 p-3 rounded-md bg-muted/40 border border-border/60">
            <input
              type="checkbox"
              id="ai-tools-generate-english"
              checked={generateEnglish}
              onChange={(e) => setGenerateEnglish(e.target.checked)}
              className="h-4 w-4 rounded border-border text-[#8b4513] focus:ring-[#8b4513]"
            />
            <label
              htmlFor="ai-tools-generate-english"
              className="text-xs font-medium leading-none cursor-pointer flex flex-col gap-0.5"
            >
              <span>Generate English version too (अंग्रेजी संस्करण भी बनाएं)</span>
              <span className="text-[10px] text-muted-foreground">
                Creates an export-ready English listing alongside your native description.
              </span>
            </label>
          </div>

          <Button
            onClick={handleGenerate}
            disabled={isLoading}
            className="w-full bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 transition-all duration-300"
            size="lg"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Crafting Multilingual Descriptions...
              </>
            ) : (
              <>
                <Sparkles className="mr-2 h-4 w-4" />
                Generate Descriptions
              </>
            )}
          </Button>

          {/* Suggestion chips */}
          <div className="space-y-2 pt-1">
            <p className="text-xs text-muted-foreground">Quick multilingual suggestions:</p>
            <div className="flex flex-wrap gap-2">
              {[
                { name: 'हाथ से बनी बनारसी रेशमी साड़ी', inLang: 'Hindi', outLang: 'Hindi' },
                { name: 'Kashmiri Sozni Pashmina Shawl', inLang: 'English', outLang: 'Hindi' },
                { name: 'பித்தளை விநாயகர் சிலை', inLang: 'Tamil', outLang: 'Tamil' },
                { name: 'আগ্রার মার্বেল ইনলে প্লেট', inLang: 'Bengali', outLang: 'Bengali' },
              ].map((s) => (
                <button
                  key={s.name}
                  type="button"
                  onClick={() => {
                    setProductName(s.name);
                    setInputLanguage(s.inLang);
                    setOutputLanguage(s.outLang);
                  }}
                  className="rounded-full border border-border px-3 py-1 text-xs text-muted-foreground hover:bg-muted hover:text-foreground transition-colors duration-200"
                >
                  {s.name}
                </button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Output Card */}
      <Card className="border-accent/10 shadow-lg flex flex-col">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg">Generated Descriptions</CardTitle>
              <CardDescription className="text-xs">
                {isFallback ? 'Craft-specific cultural fallback' : 'AI-generated authentic descriptions'}
              </CardDescription>
            </div>
            {isFallback !== null && (
              <Badge variant={isFallback ? 'secondary' : 'default'} className="text-[10px]">
                {isFallback ? 'Smart Fallback' : 'Gemini AI'}
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="flex-1 flex flex-col space-y-4">
          {isLoading ? (
            <div className="space-y-3 py-6">
              <div className="h-4 bg-muted rounded animate-pulse w-full" />
              <div className="h-4 bg-muted rounded animate-pulse w-5/6" />
              <div className="h-4 bg-muted rounded animate-pulse w-4/6" />
              <div className="h-4 bg-muted rounded animate-pulse w-full" />
              <div className="h-4 bg-muted rounded animate-pulse w-3/4" />
            </div>
          ) : description ? (
            <div className="space-y-4 flex-1">
              {/* Primary Native Language Output */}
              <div className="space-y-2 p-3.5 rounded-lg border border-primary/20 bg-background/80 relative">
                <div className="flex items-center justify-between border-b pb-2">
                  <span className="text-xs font-bold text-primary flex items-center gap-1.5">
                    <Globe2 className="h-3.5 w-3.5" />
                    {activeLang} Description ({activeLang === 'Hindi' ? 'हिंदी में' : activeLang})
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleCopyPrimary}
                    className="h-7 text-xs gap-1.5"
                  >
                    {copiedPrimary ? (
                      <>
                        <Check className="h-3.5 w-3.5 text-green-500" />
                        Copied
                      </>
                    ) : (
                      <>
                        <Copy className="h-3.5 w-3.5" />
                        Copy
                      </>
                    )}
                  </Button>
                </div>
                <p className="text-sm leading-relaxed whitespace-pre-wrap font-sans pt-1">
                  {description}
                </p>
              </div>

              {/* English Version (if enabled) */}
              {englishDescription && (
                <div className="space-y-2 p-3.5 rounded-lg border border-accent/30 bg-muted/20 relative">
                  <div className="flex items-center justify-between border-b pb-2">
                    <span className="text-xs font-bold text-accent-foreground flex items-center gap-1.5">
                      <Globe2 className="h-3.5 w-3.5" />
                      English Version (अंग्रेजी अनुवाद / Listing)
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleCopyEnglish}
                      className="h-7 text-xs gap-1.5"
                    >
                      {copiedEnglish ? (
                        <>
                          <Check className="h-3.5 w-3.5 text-green-500" />
                          Copied
                        </>
                      ) : (
                        <>
                          <Copy className="h-3.5 w-3.5" />
                          Copy
                        </>
                      )}
                    </Button>
                  </div>
                  <p className="text-sm leading-relaxed whitespace-pre-wrap text-muted-foreground pt-1">
                    {englishDescription}
                  </p>
                </div>
              )}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center my-auto">
              <div className="h-16 w-16 rounded-full bg-muted/50 flex items-center justify-center mb-4">
                <Wand2 className="h-7 w-7 text-muted-foreground/50" />
              </div>
              <p className="text-sm text-muted-foreground font-medium">
                Enter your product name to see native and English descriptions
              </p>
              <p className="text-xs text-muted-foreground/70 mt-1 max-w-xs">
                Supports Devanagari Hindi, Tamil, Bengali, Telugu, and all major Indian languages.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

/* ==========================================
   Tab 2: Multilingual Translator
   ========================================== */
function TranslatorTab() {
  const { toast } = useToast();
  const [sourceText, setSourceText] = useState('');
  const [language, setLanguage] = useState('');
  const [translatedText, setTranslatedText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleTranslate = async () => {
    if (!sourceText.trim()) {
      toast({
        variant: 'destructive',
        title: 'Text required',
        description: 'Please enter text to translate.',
      });
      return;
    }
    if (!language) {
      toast({
        variant: 'destructive',
        title: 'Language required',
        description: 'Please select a target language.',
      });
      return;
    }

    setIsLoading(true);
    setTranslatedText('');
    try {
      const result = await translateText({
        text: sourceText.trim(),
        language,
      });
      setTranslatedText(result.translatedText);
      toast({
        title: '🌐 Translation Complete!',
        description: `Successfully translated to ${language}.`,
      });
    } catch (error) {
      console.error(error);
      toast({
        variant: 'destructive',
        title: 'Translation Failed',
        description: 'Could not translate text. Please try again.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(translatedText);
    setCopied(true);
    toast({ title: 'Copied!', description: 'Translation copied to clipboard.' });
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="grid gap-6 md:grid-cols-2">
      {/* Source Card */}
      <Card className="border-primary/10 shadow-lg">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500/20 to-indigo-500/20">
              <Languages className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <CardTitle className="text-lg">Source Text</CardTitle>
              <CardDescription>
                Enter the text you want to translate
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <Textarea
            id="ai-translate-source"
            placeholder="Enter text to translate... e.g. product descriptions, artisan stories, marketing copy"
            value={sourceText}
            onChange={(e) => setSourceText(e.target.value)}
            rows={6}
            className="bg-background resize-none"
          />
          <div className="space-y-2">
            <label
              htmlFor="ai-target-language"
              className="text-sm font-medium leading-none"
            >
              Target Language
            </label>
            <Select value={language} onValueChange={setLanguage}>
              <SelectTrigger id="ai-target-language" className="bg-background">
                <SelectValue placeholder="Select language" />
              </SelectTrigger>
              <SelectContent>
                {LANGUAGES.map((lang) => (
                  <SelectItem key={lang.value} value={lang.value}>
                    {lang.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button
            onClick={handleTranslate}
            disabled={isLoading}
            className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white transition-all duration-300"
            size="lg"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Translating...
              </>
            ) : (
              <>
                <Globe2 className="mr-2 h-4 w-4" />
                Translate
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Translation Output Card */}
      <Card className="border-blue-500/10 shadow-lg">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">
              Translation{' '}
              {language && (
                <span className="text-sm font-normal text-muted-foreground">
                  → {language}
                </span>
              )}
            </CardTitle>
            {translatedText && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleCopy}
                className="gap-2"
              >
                {copied ? (
                  <Check className="h-4 w-4 text-green-500" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
                {copied ? 'Copied' : 'Copy'}
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              <div className="h-4 bg-muted rounded animate-pulse w-full" />
              <div className="h-4 bg-muted rounded animate-pulse w-4/5" />
              <div className="h-4 bg-muted rounded animate-pulse w-3/5" />
              <div className="h-4 bg-muted rounded animate-pulse w-full" />
            </div>
          ) : translatedText ? (
            <div className="relative">
              <div className="absolute -inset-1 bg-gradient-to-r from-blue-500/5 to-indigo-500/5 rounded-lg blur-sm" />
              <div className="relative bg-background/80 backdrop-blur-sm rounded-lg p-4 border border-blue-500/10">
                <p className="text-sm leading-relaxed whitespace-pre-wrap">
                  {translatedText}
                </p>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="h-16 w-16 rounded-full bg-muted/50 flex items-center justify-center mb-4">
                <Globe2 className="h-7 w-7 text-muted-foreground/50" />
              </div>
              <p className="text-sm text-muted-foreground">
                Your translation will appear here
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

/* ==========================================
   Tab 3: Image → Cultural Story Generator
   ========================================== */

const IMAGE_STORY_MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

function ImageStoryTab() {
  const { toast } = useToast();
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageDataUri, setImageDataUri] = useState<string | null>(null);
  const [story, setStory] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const processFile = useCallback(
    (file: File) => {
      if (!file.type.startsWith('image/')) {
        toast({
          variant: 'destructive',
          title: 'Invalid file',
          description: 'Please upload an image file (JPEG, PNG, WebP).',
        });
        return;
      }
      if (file.size > IMAGE_STORY_MAX_FILE_SIZE) {
        toast({
          variant: 'destructive',
          title: 'File too large',
          description: 'Please upload an image smaller than 5MB.',
        });
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        const dataUri = e.target?.result as string;
        setImagePreview(dataUri);
        setImageDataUri(dataUri);
        setStory('');
      };
      reader.readAsDataURL(file);
    },
    [toast]
  );

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
  };

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const file = e.dataTransfer.files?.[0];
      if (file) processFile(file);
    },
    [processFile]
  );

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => setIsDragging(false);

  const clearImage = () => {
    setImagePreview(null);
    setImageDataUri(null);
    setStory('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleAnalyze = async () => {
    if (!imageDataUri) {
      toast({
        variant: 'destructive',
        title: 'Image required',
        description: 'Please upload an image to analyze.',
      });
      return;
    }

    setIsLoading(true);
    setStory('');
    try {
      const result = await generateImageCulturalStory({
        imageDataUri,
      });
      setStory(result.story);
      toast({
        title: '📷 Cultural Story Generated!',
        description: 'Discover the heritage behind this craft.',
      });
    } catch (error) {
      console.error(error);
      toast({
        variant: 'destructive',
        title: 'Analysis Failed',
        description: 'Could not analyze the image. Please try again.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="grid gap-6 md:grid-cols-2">
      {/* Upload Card */}
      <Card className="border-primary/10 shadow-lg">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-amber-500/20 to-orange-500/20">
              <Camera className="h-5 w-5 text-amber-600 dark:text-amber-400" />
            </div>
            <div>
              <CardTitle className="text-lg">Image Analyzer</CardTitle>
              <CardDescription>
                Upload a photo of any handicraft to discover its cultural story
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={handleFileChange}
            className="hidden"
            id="ai-image-upload"
          />

          {imagePreview ? (
            <div className="relative group">
              <div className="aspect-square w-full overflow-hidden rounded-lg border border-border">
                <Image
                  src={imagePreview}
                  alt="Uploaded craft"
                  width={512}
                  height={512}
                  unoptimized
                  className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                />
              </div>
              <button
                type="button"
                onClick={clearImage}
                className="absolute top-2 right-2 h-8 w-8 rounded-full bg-background/80 backdrop-blur-sm flex items-center justify-center border border-border shadow-sm hover:bg-destructive hover:text-destructive-foreground transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <div
              onClick={() => fileInputRef.current?.click()}
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              className={`
                aspect-square w-full rounded-lg border-2 border-dashed cursor-pointer 
                flex flex-col items-center justify-center gap-3 transition-all duration-300
                ${
                  isDragging
                    ? 'border-primary bg-primary/5 scale-[1.02]'
                    : 'border-muted-foreground/25 hover:border-primary/50 hover:bg-muted/30'
                }
              `}
            >
              <div
                className={`h-14 w-14 rounded-full flex items-center justify-center transition-colors ${isDragging ? 'bg-primary/10' : 'bg-muted/50'}`}
              >
                <Upload
                  className={`h-6 w-6 ${isDragging ? 'text-primary' : 'text-muted-foreground/50'}`}
                />
              </div>
              <div className="text-center">
                <p className="text-sm font-medium">
                  {isDragging ? 'Drop your image here' : 'Click or drag & drop'}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  JPEG, PNG, or WebP (max 5MB)
                </p>
              </div>
            </div>
          )}

          <Button
            onClick={handleAnalyze}
            disabled={isLoading || !imageDataUri}
            className="w-full bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white transition-all duration-300"
            size="lg"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Analyzing Craft...
              </>
            ) : (
              <>
                <Camera className="mr-2 h-4 w-4" />
                Discover Cultural Story
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Story Output Card */}
      <Card className="border-amber-500/10 shadow-lg">
        <CardHeader>
          <CardTitle className="text-lg">Cultural Story</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              <div className="h-4 bg-muted rounded animate-pulse w-full" />
              <div className="h-4 bg-muted rounded animate-pulse w-5/6" />
              <div className="h-4 bg-muted rounded animate-pulse w-4/6" />
              <div className="h-4 bg-muted rounded animate-pulse w-full" />
              <div className="h-4 bg-muted rounded animate-pulse w-3/4" />
              <div className="h-4 bg-muted rounded animate-pulse w-5/6" />
              <div className="h-4 bg-muted rounded animate-pulse w-2/3" />
              <div className="h-4 bg-muted rounded animate-pulse w-full" />
            </div>
          ) : story ? (
            <div className="relative">
              <div className="absolute -inset-1 bg-gradient-to-r from-amber-500/5 to-orange-500/5 rounded-lg blur-sm" />
              <div className="relative bg-background/80 backdrop-blur-sm rounded-lg p-4 border border-amber-500/10">
                <p className="text-sm leading-relaxed whitespace-pre-wrap">
                  {story}
                </p>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="h-16 w-16 rounded-full bg-muted/50 flex items-center justify-center mb-4">
                <Camera className="h-7 w-7 text-muted-foreground/50" />
              </div>
              <p className="text-sm text-muted-foreground">
                Upload a craft image to discover its cultural story
              </p>
              <p className="text-xs text-muted-foreground/70 mt-1 max-w-xs">
                Our AI will identify the craft, its origin, techniques, and
                cultural significance
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
