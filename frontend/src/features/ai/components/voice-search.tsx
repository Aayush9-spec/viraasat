'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Mic,
  MicOff,
  Search,
  Loader2,
  X,
  Volume2,
  RefreshCw,
  Globe2,
  AlertCircle,
  Sparkles,
} from 'lucide-react';
import { useToast } from '@/core/hooks/use-toast';
import { useTranslation } from '@/core/hooks/use-translation';
import { useSpeechRecognition } from '@/core/hooks/use-speech-recognition';
import { suggestProducts } from '@/ai/flows/suggest-products';
import { SUPPORTED_LANGUAGES, getSpeechLanguageCode } from '@/ai/languages';
import { products } from '@/lib/data';
import { Product } from '@/lib/types';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import Image from 'next/image';
import Link from 'next/link';

export default function VoiceSearch() {
  const router = useRouter();
  const { toast } = useToast();
  const { t } = useTranslation();

  // Search input state
  const [searchQuery, setSearchQuery] = useState('');
  const [isVoiceModalOpen, setIsVoiceModalOpen] = useState(false);
  const [editableVoiceText, setEditableVoiceText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // AI suggestions state
  const [suggestedProducts, setSuggestedProducts] = useState<Product[]>([]);
  const [suggestionExplanation, setSuggestionExplanation] = useState('');
  const [showAiResults, setShowAiResults] = useState(false);

  // Speech Recognition Hook
  const {
    isSupported,
    isListening,
    transcript,
    interimTranscript,
    speechLang,
    setSpeechLang,
    error: speechError,
    statusMessage,
    startListening,
    stopListening,
    abortListening,
    resetTranscript,
  } = useSpeechRecognition({
    defaultLanguage: 'Hindi',
    continuous: false,
  });

  // Sync speech transcript with the editable voice text input in real-time
  useEffect(() => {
    const combined = `${transcript} ${interimTranscript}`.trim();
    if (combined) {
      setEditableVoiceText(combined);
    }
  }, [transcript, interimTranscript]);

  // Cleanly abort speech recognition when modal closes
  const handleCloseVoiceModal = useCallback(() => {
    abortListening();
    setIsVoiceModalOpen(false);
    resetTranscript();
    setEditableVoiceText('');
  }, [abortListening, resetTranscript]);

  // Execute actual search query
  const executeSearch = async (queryText: string) => {
    const trimmed = queryText.trim();
    if (!trimmed) {
      toast({
        variant: 'destructive',
        title: 'Empty Search Query',
        description: 'Please speak or enter a search query.',
      });
      return;
    }

    setIsSubmitting(true);
    abortListening();
    setIsVoiceModalOpen(false);
    setSearchQuery(trimmed);

    // Check for cultural heritage intent for AI suggestions
    const culturalKeywords = [
      'pottery', 'silk', 'weaving', 'heritage', 'artisan', 'craft',
      'tradition', 'painting', 'handicraft', 'carving', 'diya', 'saree',
      'pashmina', 'brass', 'dhokra', 'chikankari', 'terracotta'
    ];
    const isCultural = culturalKeywords.some((k) =>
      trimmed.toLowerCase().includes(k)
    );

    if (isCultural) {
      try {
        const suggestions = await suggestProducts({ query: trimmed });
        if (suggestions.productIds && suggestions.productIds.length > 0) {
          const matched = products.filter((p) =>
            suggestions.productIds.includes(p.id)
          );
          if (matched.length > 0) {
            setSuggestedProducts(matched);
            setSuggestionExplanation(suggestions.explanation);
            setShowAiResults(true);
            setIsSubmitting(false);
            return;
          }
        }
      } catch (err) {
        console.warn('AI suggestions error, falling back to shop search:', err);
      }
    }

    setIsSubmitting(false);
    // Standard catalog search across actual products
    router.push(`/shop?q=${encodeURIComponent(trimmed)}`);
  };

  // Direct form submit for typed search
  const handleManualSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      executeSearch(searchQuery);
    }
  };

  // Open Voice Modal and start recognition
  const handleOpenVoiceSearch = () => {
    setIsVoiceModalOpen(true);
    resetTranscript();
    setEditableVoiceText('');
    startListening();
  };

  // Switch voice recognition language
  const handleLanguageChange = (newSpeechCode: string) => {
    setSpeechLang(newSpeechCode);
    if (isListening) {
      stopListening();
      // Restart with new language
      setTimeout(() => {
        startListening(newSpeechCode);
      }, 200);
    }
  };

  return (
    <>
      {/* Regular Search Bar in Header with Microphone Action */}
      <form
        onSubmit={handleManualSearch}
        className="relative w-[150px] sm:w-[220px] md:w-[260px] lg:w-[320px] flex items-center"
        role="search"
        aria-label="Sitewide Product Search"
      >
        <Input
          type="search"
          placeholder={t('nav.searchPlaceholder') || "Search heritage..."}
          aria-label={t('nav.searchAria') || "Search authentic handicrafts"}
          className="pr-16 h-9 bg-background/80 border-input rounded-full focus:ring-primary focus:border-primary text-xs sm:text-sm text-foreground placeholder:text-muted-foreground shadow-sm transition-all"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        <div className="absolute right-1 top-1/2 -translate-y-1/2 flex items-center gap-0.5">
          <Button
            type="button"
            size="icon"
            variant="ghost"
            onClick={handleOpenVoiceSearch}
            aria-label={t('nav.voiceSearchAria') || "Search using your voice"}
            title={t('nav.voiceSearchAria') || "Search using voice"}
            className="h-7 w-7 text-primary hover:text-primary hover:bg-primary/10 rounded-full transition-transform active:scale-95"
          >
            <Mic className="h-4 w-4" />
          </Button>
          <Button
            type="submit"
            size="icon"
            variant="ghost"
            aria-label="Submit search"
            className="h-7 w-7 text-muted-foreground hover:text-foreground hover:bg-muted rounded-full"
          >
            <Search className="h-3.5 w-3.5" />
          </Button>
        </div>
      </form>

      {/* Accessible Interactive Voice Search Modal */}
      <Dialog open={isVoiceModalOpen} onOpenChange={(open) => !open && handleCloseVoiceModal()}>
        <DialogContent
          className="sm:max-w-lg bg-background border-border shadow-2xl rounded-2xl p-6"
          aria-describedby="voice-search-description"
        >
          <DialogHeader className="text-left space-y-1">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/15 text-primary">
                  <Volume2 className="h-4 w-4" />
                </span>
                <DialogTitle className="text-lg font-bold font-heading">
                  {t('nav.voiceModalTitle') || "Voice Product Search"}
                </DialogTitle>
              </div>
              {/* Language Selector */}
              <div className="flex items-center gap-1.5">
                <Globe2 className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                <Select value={speechLang} onValueChange={handleLanguageChange}>
                  <SelectTrigger
                    className="h-8 text-xs w-[130px] sm:w-[150px] bg-muted/40"
                    aria-label="Select speech language"
                  >
                    <SelectValue placeholder="Language" />
                  </SelectTrigger>
                  <SelectContent className="max-h-60">
                    {SUPPORTED_LANGUAGES.map((lang) => (
                      <SelectItem key={`speech-${lang.speechCode}`} value={lang.speechCode} className="text-xs">
                        {lang.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogDescription id="voice-search-description" className="text-xs text-muted-foreground">
              {t('nav.voiceModalDesc') || "Speak in Hindi, English, Tamil, Bengali, or your preferred language to find authentic handcrafted heirlooms."}
            </DialogDescription>
          </DialogHeader>

          {/* Central Microphone Animation Area */}
          <div className="my-6 flex flex-col items-center justify-center space-y-4">
            <button
              type="button"
              onClick={isListening ? stopListening : () => startListening()}
              aria-label={isListening ? 'Stop listening' : 'Start listening'}
              className={`relative flex h-20 w-20 items-center justify-center rounded-full transition-all duration-300 focus:outline-none focus:ring-4 focus:ring-primary/30 ${
                isListening
                  ? 'bg-red-500 text-white shadow-lg shadow-red-500/40 scale-105 animate-pulse'
                  : 'bg-primary/10 text-primary hover:bg-primary/20'
              }`}
            >
              {isListening && (
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-60" />
              )}
              {isListening ? <Mic className="h-8 w-8" /> : <Mic className="h-8 w-8" />}
            </button>

            {/* Status indicator */}
            <div className="text-center space-y-1" aria-live="polite">
              <p className="text-sm font-semibold text-foreground flex items-center justify-center gap-1.5">
                {isListening ? (
                  <>
                    <span className="h-2 w-2 rounded-full bg-red-500 animate-pulse" />
                    Listening… Speak now
                  </>
                ) : (
                  statusMessage
                )}
              </p>
              <p className="text-xs text-muted-foreground">
                {isListening ? 'Tap microphone when done speaking' : 'Tap microphone to speak'}
              </p>
            </div>
          </div>

          {/* Error Notice if Web Speech API unsupported or denied */}
          {(!isSupported || speechError) && (
            <div
              className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg text-amber-800 dark:text-amber-300 text-xs flex items-start gap-2"
              role="alert"
            >
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5 text-amber-600 dark:text-amber-400" />
              <div>
                <p className="font-semibold">Speech Recognition Notice</p>
                <p>
                  {speechError ||
                    'Web Speech API is not supported in this browser. You can type your query in the box below.'}
                </p>
              </div>
            </div>
          )}

          {/* Live / Editable Transcription Input */}
          <div className="space-y-2">
            <label htmlFor="voice-search-query-input" className="text-xs font-semibold text-muted-foreground flex items-center justify-between">
              <span>Recognized Query (Review & Edit):</span>
              {editableVoiceText && (
                <button
                  type="button"
                  onClick={() => {
                    resetTranscript();
                    setEditableVoiceText('');
                  }}
                  className="text-[11px] text-muted-foreground hover:text-foreground underline"
                >
                  Clear
                </button>
              )}
            </label>
            <div className="relative">
              <Input
                id="voice-search-query-input"
                value={editableVoiceText}
                onChange={(e) => setEditableVoiceText(e.target.value)}
                placeholder="Spoken words will appear here in real time..."
                className="text-sm bg-muted/30 pr-10 focus:ring-primary"
                onKeyDown={(e) => e.key === 'Enter' && executeSearch(editableVoiceText)}
              />
              {interimTranscript && (
                <span className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1 text-[10px] text-primary font-medium animate-pulse">
                  <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                  live
                </span>
              )}
            </div>
          </div>

          {/* Modal Action Controls */}
          <div className="flex items-center justify-between gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleCloseVoiceModal}
              className="text-xs"
            >
              Cancel
            </Button>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => {
                  resetTranscript();
                  setEditableVoiceText('');
                  startListening();
                }}
                disabled={isListening}
                className="text-xs gap-1.5"
              >
                <RefreshCw className="h-3 w-3" />
                Retry
              </Button>
              <Button
                type="button"
                size="sm"
                onClick={() => executeSearch(editableVoiceText)}
                disabled={isSubmitting || !editableVoiceText.trim()}
                className="text-xs gap-1.5 font-semibold bg-primary hover:bg-primary/90 text-primary-foreground"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-3 w-3 animate-spin" />
                    Searching…
                  </>
                ) : (
                  <>
                    <Search className="h-3 w-3" />
                    Search Handicrafts
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* AI Suggestion Results Modal for Cultural Queries */}
      <Dialog open={showAiResults} onOpenChange={setShowAiResults}>
        <DialogContent className="sm:max-w-md bg-[#fbf7f0] border-amber-900/15 rounded-xl shadow-xl">
          <DialogHeader>
            <div className="flex items-center gap-2 mb-1">
              <Sparkles className="h-4 w-4 text-amber-700" />
              <DialogTitle className="text-xs font-bold tracking-[0.25em] uppercase text-amber-900/70">
                Viraasat AI Cultural Match
              </DialogTitle>
            </div>
            <p className="text-xs text-amber-950/80 font-serif italic mb-4">
              &ldquo;{suggestionExplanation}&rdquo;
            </p>
          </DialogHeader>
          <div className="space-y-3">
            {suggestedProducts.map((product) => (
              <Link
                key={product.id}
                href={`/product/${product.id}`}
                onClick={() => setShowAiResults(false)}
                className="flex items-center gap-3 p-3 bg-white border border-amber-900/10 hover:border-amber-900/30 rounded-lg shadow-sm transition-all group"
              >
                <div className="relative h-14 w-14 overflow-hidden rounded bg-neutral-100 shrink-0">
                  <Image
                    src={product.images[0]}
                    alt={product.name}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                </div>
                <div className="flex-grow min-w-0">
                  <h4 className="text-sm font-heading text-[#5e2c18] truncate font-medium">
                    {product.name}
                  </h4>
                  <p className="text-[10px] text-amber-900/60 uppercase tracking-wider font-semibold">
                    {product.region}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-xs font-bold text-[#5e2c18]">
                    ₹{product.price.toLocaleString('en-IN')}
                  </p>
                </div>
              </Link>
            ))}
            <Button
              className="w-full bg-[#5e2c18] hover:bg-[#4a2315] uppercase tracking-wider text-[11px] h-10 mt-3 rounded-lg text-white"
              onClick={() => {
                setShowAiResults(false);
                router.push(`/shop?q=${encodeURIComponent(searchQuery)}`);
              }}
            >
              Explore Full Collection
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
