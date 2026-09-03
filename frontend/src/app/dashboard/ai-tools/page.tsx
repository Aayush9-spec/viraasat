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
import { useToast } from '@/hooks/use-toast';
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
} from 'lucide-react';
import { generateProductDescription } from '@/ai/flows/generate-product-description';
import { translateText } from '@/ai/flows/translate-text';
import { generateImageCulturalStory } from '@/ai/flows/image-cultural-story';

const LANGUAGES = [
  { value: 'Hindi', label: 'हिन्दी (Hindi)' },
  { value: 'Tamil', label: 'தமிழ் (Tamil)' },
  { value: 'Bengali', label: 'বাংলা (Bengali)' },
  { value: 'Telugu', label: 'తెలుగు (Telugu)' },
  { value: 'Marathi', label: 'मराठी (Marathi)' },
  { value: 'Urdu', label: 'اردو (Urdu)' },
  { value: 'Gujarati', label: 'ગુજરાતી (Gujarati)' },
  { value: 'Kannada', label: 'ಕನ್ನಡ (Kannada)' },
  { value: 'Malayalam', label: 'മലയാളം (Malayalam)' },
  { value: 'Punjabi', label: 'ਪੰਜਾਬੀ (Punjabi)' },
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
  const [description, setDescription] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleGenerate = async () => {
    if (!productName.trim()) {
      toast({
        variant: 'destructive',
        title: 'Product name required',
        description: 'Please enter a product name to generate a description.',
      });
      return;
    }

    setIsLoading(true);
    setDescription('');
    try {
      const result = await generateProductDescription({
        productName: productName.trim(),
      });
      setDescription(result.description);
      toast({
        title: '✨ Description Generated!',
        description: 'Your AI-crafted product description is ready.',
      });
    } catch (error) {
      console.error(error);
      toast({
        variant: 'destructive',
        title: 'Generation Failed',
        description: 'Could not generate description. Please try again.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(description);
    setCopied(true);
    toast({ title: 'Copied!', description: 'Description copied to clipboard.' });
    setTimeout(() => setCopied(false), 2000);
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
              <CardTitle className="text-lg">Description Generator</CardTitle>
              <CardDescription>
                Enter a product name to create a culturally rich description
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label
              htmlFor="ai-product-name"
              className="text-sm font-medium leading-none"
            >
              Product Name
            </label>
            <Input
              id="ai-product-name"
              placeholder="e.g. Handmade Clay Diya, Pashmina Shawl, Brass Tiffin Box..."
              value={productName}
              onChange={(e) => setProductName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleGenerate()}
              className="bg-background"
            />
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
                Crafting Description...
              </>
            ) : (
              <>
                <Sparkles className="mr-2 h-4 w-4" />
                Generate Description
              </>
            )}
          </Button>

          {/* Suggestion chips */}
          <div className="space-y-2">
            <p className="text-xs text-muted-foreground">Quick suggestions:</p>
            <div className="flex flex-wrap gap-2">
              {[
                'Banarasi Silk Saree',
                'Chikankari Kurta',
                'Terracotta Horse',
                'Marble Inlay Plate',
              ].map((suggestion) => (
                <button
                  key={suggestion}
                  type="button"
                  onClick={() => setProductName(suggestion)}
                  className="rounded-full border border-border px-3 py-1 text-xs text-muted-foreground hover:bg-muted hover:text-foreground transition-colors duration-200"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Output Card */}
      <Card className="border-accent/10 shadow-lg">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Generated Description</CardTitle>
            {description && (
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
              <div className="h-4 bg-muted rounded animate-pulse w-5/6" />
              <div className="h-4 bg-muted rounded animate-pulse w-4/6" />
              <div className="h-4 bg-muted rounded animate-pulse w-full" />
              <div className="h-4 bg-muted rounded animate-pulse w-3/4" />
            </div>
          ) : description ? (
            <div className="relative">
              <div className="absolute -inset-1 bg-gradient-to-r from-primary/5 to-accent/5 rounded-lg blur-sm" />
              <div className="relative bg-background/80 backdrop-blur-sm rounded-lg p-4 border border-primary/10">
                <p className="text-sm leading-relaxed whitespace-pre-wrap">
                  {description}
                </p>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="h-16 w-16 rounded-full bg-muted/50 flex items-center justify-center mb-4">
                <Wand2 className="h-7 w-7 text-muted-foreground/50" />
              </div>
              <p className="text-sm text-muted-foreground">
                Your AI-generated description will appear here
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
