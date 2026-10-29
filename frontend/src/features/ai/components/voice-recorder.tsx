'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
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
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { useSpeechRecognition } from '@/core/hooks/use-speech-recognition';
import {
  SUPPORTED_LANGUAGES,
  getSpeechLanguageCode,
  getLanguageName,
} from '@/ai/languages';
import { generateProductDescription } from '@/ai/flows/generate-product-description';
import { useToast } from '@/core/hooks/use-toast';
import {
  Mic,
  MicOff,
  Sparkles,
  RotateCcw,
  Trash2,
  Check,
  AlertCircle,
  Loader2,
  Languages,
  Copy,
  Info,
  Square,
} from 'lucide-react';

export interface VoiceRecorderProps {
  /** Callback when transcription is accepted as plain text */
  onTranscriptionComplete?: (text: string) => void;
  /** Callback when dual AI descriptions are generated and applied */
  onDescriptionsGenerated?: (data: { description: string; englishDescription?: string }) => void;
  /** Default language script (e.g. 'Hindi', 'Tamil', 'English') */
  defaultLanguage?: string;
  /** Product name if known, to improve AI generation quality */
  productName?: string;
  /** Optional button variant */
  variant?: 'outline' | 'default' | 'ghost' | 'secondary';
  /** Optional button size */
  size?: 'default' | 'sm' | 'lg' | 'icon';
  /** Optional button text label; if undefined and size is icon, renders only mic */
  buttonLabel?: string;
  className?: string;
  /** Tooltip or title attribute */
  title?: string;
}

export default function VoiceRecorder({
  onTranscriptionComplete,
  onDescriptionsGenerated,
  defaultLanguage = 'Hindi',
  productName = '',
  variant = 'outline',
  size = 'icon',
  buttonLabel,
  className,
  title = 'Record product details by voice',
}: VoiceRecorderProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedLang, setSelectedLang] = useState(defaultLanguage);
  const [editableText, setEditableText] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedResult, setGeneratedResult] = useState<{
    description: string;
    englishDescription?: string;
    isFallback?: boolean;
    outputLanguage?: string;
  } | null>(null);

  const { toast } = useToast();

  const {
    isSupported,
    isListening,
    transcript,
    interimTranscript,
    error,
    statusMessage,
    startListening,
    stopListening,
    resetTranscript,
  } = useSpeechRecognition({
    language: getSpeechLanguageCode(selectedLang),
    continuous: true,
    interimResults: true,
  });

  // Keep editable text in sync with live transcript
  useEffect(() => {
    if (transcript) {
      setEditableText(transcript);
    }
  }, [transcript]);

  // Sync default language changes from props
  useEffect(() => {
    if (defaultLanguage) {
      setSelectedLang(defaultLanguage);
    }
  }, [defaultLanguage]);

  const handleOpenDialog = () => {
    setIsOpen(true);
    setGeneratedResult(null);
    setEditableText('');
    resetTranscript();
    // Do NOT auto-start listening on dialog open.
    // Wait for the artisan to explicitly click the microphone button.
  };

  const handleCloseDialog = useCallback(() => {
    stopListening();
    setIsOpen(false);
  }, [stopListening]);

  const handleLanguageSelect = (langValue: string) => {
    setSelectedLang(langValue);
    const speechCode = getSpeechLanguageCode(langValue);
    if (isListening) {
      stopListening();
      setTimeout(() => {
        startListening(speechCode);
      }, 200);
    }
  };

  const handleToggleListening = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening(getSpeechLanguageCode(selectedLang));
    }
  };

  const handleClear = () => {
    stopListening();
    resetTranscript();
    setEditableText('');
    setGeneratedResult(null);
  };

  const handleRetry = () => {
    resetTranscript();
    setEditableText('');
    setGeneratedResult(null);
    startListening(getSpeechLanguageCode(selectedLang));
  };

  const handleApplyTranscribedText = () => {
    const textToApply = editableText.trim() || transcript.trim();
    if (!textToApply) {
      toast({
        variant: 'destructive',
        title: 'No text to apply',
        description: 'Please speak or enter some product details first.',
      });
      return;
    }
    stopListening();
    onTranscriptionComplete?.(textToApply);
    toast({
      title: 'Details Applied',
      description: 'Spoken product details added to description.',
    });
    setIsOpen(false);
  };

  const handleGenerateDescriptions = async () => {
    const details = editableText.trim() || transcript.trim();
    const effectiveName = productName.trim() || details.slice(0, 60) || 'Traditional Indian Craft';

    stopListening();
    setIsGenerating(true);
    try {
      const result = await generateProductDescription({
        productName: effectiveName,
        productDetails: details || undefined,
        inputLanguage: selectedLang,
        outputLanguage: selectedLang,
        generateEnglish: true,
      });

      setGeneratedResult({
        description: result.description,
        englishDescription: result.englishDescription,
        isFallback: result.isFallback,
        outputLanguage: result.outputLanguage || selectedLang,
      });

      toast({
        title: result.isFallback ? '✨ Description Ready (Heritage Fallback)' : '✨ AI Descriptions Generated!',
        description: `Created authentic ${selectedLang} and English descriptions from your voice details.`,
      });
    } catch (err) {
      console.warn('Voice description generation fallback:', err);
      toast({
        variant: 'destructive',
        title: 'Generation Failed',
        description: 'Could not generate AI descriptions. You can still apply the transcribed text directly.',
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleApplyGeneratedDescriptions = () => {
    if (!generatedResult) return;

    if (onDescriptionsGenerated) {
      onDescriptionsGenerated({
        description: generatedResult.description,
        englishDescription: generatedResult.englishDescription,
      });
    } else if (onTranscriptionComplete) {
      onTranscriptionComplete(generatedResult.description);
    }

    toast({
      title: 'Descriptions Applied to Product!',
      description: 'Your native and English descriptions are now populated in the listing.',
    });
    setIsOpen(false);
  };

  return (
    <>
      <Button
        type="button"
        variant={variant}
        size={size}
        onClick={handleOpenDialog}
        className={className}
        title={title}
        aria-label={title}
      >
        <Mic className="h-4 w-4" />
        {buttonLabel && <span className="ml-1.5">{buttonLabel}</span>}
      </Button>

      <Dialog open={isOpen} onOpenChange={(open) => !open && handleCloseDialog()}>
        <DialogContent className="sm:max-w-xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                <Mic className="h-4 w-4" />
              </div>
              <div>
                <DialogTitle className="text-base font-semibold">
                  Voice Product Description (आवाज़ से विवरण)
                </DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground">
                  Speak craft details, materials, region, colors, and dimensions to craft authentic listings.
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="space-y-4 pt-1">
            {/* Language Selector & Tips */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 p-2.5 bg-muted/30 rounded-lg border border-border/60">
              <div className="flex items-center gap-2">
                <Languages className="h-4 w-4 text-primary shrink-0" />
                <span className="text-xs font-medium text-foreground">Speaking Language:</span>
              </div>
              <Select value={selectedLang} onValueChange={handleLanguageSelect}>
                <SelectTrigger className="w-full sm:w-[220px] h-8 text-xs bg-background">
                  <SelectValue placeholder="Select language" />
                </SelectTrigger>
                <SelectContent className="max-h-56">
                  {SUPPORTED_LANGUAGES.map((lang) => (
                    <SelectItem key={lang.value} value={lang.value} className="text-xs">
                      {lang.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Error or Unsupported Banner */}
            {!isSupported && (
              <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-md flex items-start gap-2.5 text-xs text-amber-700 dark:text-amber-300">
                <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold">Speech Recognition Not Supported in this Browser</p>
                  <p className="text-[11px] mt-0.5 text-amber-600/90 dark:text-amber-400/90">
                    Your current browser does not support the Web Speech API. You can manually type your product details below or use Google Chrome, Microsoft Edge, or Safari.
                  </p>
                </div>
              </div>
            )}

            {error && (
              <div className="p-2.5 bg-destructive/10 border border-destructive/20 rounded-md flex items-start gap-2 text-xs text-destructive">
                <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                <span className="leading-relaxed">{error}</span>
              </div>
            )}

            {/* Live Recording Visualizer */}
            {isSupported && (
              <div className="flex flex-col items-center justify-center p-4 rounded-xl border border-border/60 bg-gradient-to-b from-background to-muted/20 text-center">
                <button
                  type="button"
                  onClick={handleToggleListening}
                  className={`relative p-5 rounded-full transition-all duration-300 focus:outline-none focus:ring-4 focus:ring-primary/20 ${
                    isListening
                      ? 'bg-destructive text-destructive-foreground shadow-lg shadow-destructive/30 scale-105 animate-pulse'
                      : 'bg-primary text-primary-foreground shadow-md hover:bg-primary/90 hover:scale-105 active:scale-95'
                  }`}
                  aria-label={isListening ? 'Stop listening' : 'Start listening'}
                  title={isListening ? 'Click to stop listening' : 'Click to start speaking'}
                >
                  {isListening ? <Square className="h-6 w-6 fill-current" /> : <Mic className="h-6 w-6" />}
                  {isListening && (
                    <span className="absolute -inset-1 rounded-full border-2 border-destructive/50 animate-ping pointer-events-none" />
                  )}
                </button>

                <div className="mt-3 space-y-1">
                  <div
                    aria-live="polite"
                    className="text-xs font-semibold tracking-wide flex items-center justify-center gap-1.5"
                  >
                    {isListening ? (
                      <>
                        <span className="h-2 w-2 rounded-full bg-destructive animate-ping" />
                        <span className="text-destructive font-medium">Listening to {selectedLang}... Tap button to stop</span>
                      </>
                    ) : (
                      <span className="text-foreground font-medium">
                        {statusMessage && statusMessage !== 'Ready' ? statusMessage : 'Click microphone to speak (बोलने के लिए क्लिक करें)'}
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-muted-foreground max-w-sm">
                    {isListening
                      ? 'Speak clearly: "हाथ से बना टेराकोटा दीया, मिट्टी का काम, 6 इंच व्यास, राजस्थान की कारीगरी"'
                      : 'Speak craft details in your preferred language, or type directly in the box below.'}
                  </p>
                </div>
              </div>
            )}

            {/* Editable Transcribed Text */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <label htmlFor="voice-transcription-edit" className="font-semibold text-foreground">
                  Transcribed Details (समीक्षा एवं संपादन करें)
                </label>
                {(editableText || transcript) && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={handleClear}
                    className="h-6 text-[11px] text-muted-foreground hover:text-destructive gap-1 px-1.5"
                  >
                    <Trash2 className="h-3 w-3" />
                    Clear
                  </Button>
                )}
              </div>
              <div className="relative">
                <Textarea
                  id="voice-transcription-edit"
                  rows={4}
                  placeholder="Your spoken craft details will appear here. You can also edit or type directly..."
                  value={editableText}
                  onChange={(e) => setEditableText(e.target.value)}
                  className="text-xs leading-relaxed resize-none bg-background focus:ring-1"
                />
                {isListening && interimTranscript && (
                  <div className="absolute bottom-2 left-3 right-3 text-[11px] text-muted-foreground/80 italic pointer-events-none truncate">
                    {interimTranscript}
                  </div>
                )}
              </div>
            </div>

            {/* Generated Descriptions Preview (if generated) */}
            {generatedResult && (
              <div className="space-y-3 p-3.5 rounded-lg border border-primary/20 bg-primary/5">
                <div className="flex items-center justify-between border-b border-primary/10 pb-2">
                  <span className="text-xs font-bold text-primary flex items-center gap-1.5">
                    <Sparkles className="h-3.5 w-3.5" />
                    Generated Multilingual Descriptions
                  </span>
                  <Badge variant={generatedResult.isFallback ? 'secondary' : 'default'} className="text-[10px]">
                    {generatedResult.isFallback ? 'Smart Fallback' : 'Gemini AI'}
                  </Badge>
                </div>

                <div className="space-y-2">
                  <div className="space-y-1">
                    <span className="text-[11px] font-semibold text-muted-foreground">
                      {generatedResult.outputLanguage || selectedLang} Description:
                    </span>
                    <p className="text-xs leading-relaxed p-2 bg-background/80 rounded border whitespace-pre-wrap">
                      {generatedResult.description}
                    </p>
                  </div>

                  {generatedResult.englishDescription && (
                    <div className="space-y-1">
                      <span className="text-[11px] font-semibold text-muted-foreground">
                        English Description:
                      </span>
                      <p className="text-xs leading-relaxed p-2 bg-background/80 rounded border whitespace-pre-wrap">
                        {generatedResult.englishDescription}
                      </p>
                    </div>
                  )}
                </div>

                <Button
                  type="button"
                  onClick={handleApplyGeneratedDescriptions}
                  className="w-full text-xs h-8 bg-primary text-primary-foreground gap-1.5"
                >
                  <Check className="h-3.5 w-3.5" />
                  Apply Both to Product Listing
                </Button>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex flex-col-reverse sm:flex-row items-center justify-between gap-2 pt-2 border-t">
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleCloseDialog}
                  className="h-8 text-xs flex-1 sm:flex-none"
                >
                  Cancel
                </Button>
                {isSupported && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={handleRetry}
                    className="h-8 text-xs text-muted-foreground hover:text-foreground gap-1 flex-1 sm:flex-none"
                  >
                    <RotateCcw className="h-3 w-3" />
                    Speak Again
                  </Button>
                )}
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleApplyTranscribedText}
                  disabled={!editableText.trim()}
                  className="h-8 text-xs flex-1 sm:flex-none"
                  title="Insert transcribed text directly into description field"
                >
                  Use Transcribed Text
                </Button>

                <Button
                  type="button"
                  size="sm"
                  onClick={handleGenerateDescriptions}
                  disabled={isGenerating || !editableText.trim()}
                  className="h-8 text-xs bg-primary text-primary-foreground gap-1.5 flex-1 sm:flex-none shadow-sm"
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="h-3 w-3 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-3 w-3" />
                      AI Generate
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
