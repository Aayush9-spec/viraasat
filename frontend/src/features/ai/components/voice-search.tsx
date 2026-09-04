'use client';
import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';

// Minimal Web Speech API typings (not in TS DOM lib for all targets).
interface WebSpeechResult {
  transcript: string;
}
interface WebSpeechResultList {
  [index: number]: { [index: number]: WebSpeechResult } | undefined;
  length: number;
}
interface WebSpeechRecognizer {
  lang: string;
  interimResults: boolean;
  maxAlternatives: number;
  onresult: ((event: { results?: WebSpeechResultList }) => void) | null;
  onerror: ((event: { error: string }) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
}
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Mic, Search, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { searchWithVoice } from '@/ai/flows/search-with-voice';
import { suggestProducts } from '@/ai/flows/suggest-products';
import { products } from '@/lib/data';
import { Product } from '@/lib/types';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import Image from 'next/image';
import Link from 'next/link';

export default function VoiceSearch() {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestedProducts, setSuggestedProducts] = useState<Product[]>([]);
  const [suggestionExplanation, setSuggestionExplanation] = useState('');
  const [showResults, setShowResults] = useState(false);
  const router = useRouter();

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const { toast } = useToast();

  // Release the microphone if the component unmounts mid-recording.
  useEffect(() => {
    return () => {
      mediaRecorderRef.current?.stream.getTracks().forEach(track => track.stop());
    };
  }, []);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery) return;

    // Check if it's a cultural/heritage query to trigger AI suggestions
    const culturalKeywords = ['pottery', 'silk', 'weaving', 'heritage', 'artisan', 'craft', 'tradition', 'painting', 'handicraft', 'carving'];
    const isCulturalQuery = culturalKeywords.some(keyword => searchQuery.toLowerCase().includes(keyword));

    if (isCulturalQuery) {
      setIsProcessing(true);
      toast({ title: 'Exploring heritage matches...', description: `Finding treasures related to "${searchQuery}"` });

      try {
        const suggestions = await suggestProducts({ query: searchQuery });
        if (suggestions.productIds.length > 0) {
          const matchedProducts = products.filter(p => suggestions.productIds.includes(p.id));
          setSuggestedProducts(matchedProducts);
          setSuggestionExplanation(suggestions.explanation);
          setShowResults(true);
          return; // Don't redirect if we found AI suggestions
        }
      } catch (error) {
        console.error('AI Suggestion error:', error);
      } finally {
        setIsProcessing(false);
      }
    }

    // Default behavior: search in shop
    router.push(`/shop?q=${encodeURIComponent(searchQuery)}`);
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      // Dynamically select a supported mimeType (crucial for cross-browser, e.g. Safari vs Chrome)
      let options = {};
      if (typeof MediaRecorder !== 'undefined') {
        const types = ['audio/webm', 'audio/mp4', 'audio/ogg', 'audio/wav', 'audio/aac'];
        for (const type of types) {
          if (MediaRecorder.isTypeSupported(type)) {
            options = { mimeType: type };
            break;
          }
        }
      }

      mediaRecorderRef.current = new MediaRecorder(stream, options);
      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) audioChunksRef.current.push(event.data);
      };
      mediaRecorderRef.current.onstop = handleStop;
      audioChunksRef.current = [];
      mediaRecorderRef.current.start();
      setIsRecording(true);
      toast({ title: 'Listening...', description: 'Speak your heritage query now.' });
    } catch (err) {
      console.error('Error accessing microphone:', err);
      toast({ variant: 'destructive', title: 'Microphone Error', description: 'Could not access microphone.' });
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current?.state === 'recording') {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      setIsProcessing(true);
      toast({ title: 'Understanding your request...' });
    }
  };

  const stopTracks = () => {
    mediaRecorderRef.current?.stream.getTracks().forEach(track => track.stop());
  };

  /** Shared follow-up for any successful transcription: AI suggestions, else shop search. */
  const processTranscription = async (transcription: string) => {
    const query = transcription.trim();
    if (!query) {
      toast({ variant: 'destructive', title: 'Empty Result', description: 'Heard nothing — please try speaking again.' });
      return;
    }
    setSearchQuery(query);

    try {
      // conversational commerce: get product suggestions
      const suggestions = await suggestProducts({ query });

      if (suggestions.productIds.length > 0) {
        const matchedProducts = products.filter(p => suggestions.productIds.includes(p.id));
        setSuggestedProducts(matchedProducts);
        setSuggestionExplanation(suggestions.explanation);
        setShowResults(true);
        toast({
          title: 'Voice processed!',
          description: `Found cultural matches for: "${query}"`
        });
        return;
      }
    } catch (error) {
      // AI suggestions are best-effort; fall through to plain shop search.
      console.error('AI Suggestion error:', error);
    }

    router.push(`/shop?q=${encodeURIComponent(query)}`);
  };

  /** On-device fallback when the server transcription flow is unavailable. */
  const transcribeWithBrowserSpeech = (): Promise<string> => {
    return new Promise((resolve, reject) => {
      const w = window as unknown as {
        SpeechRecognition?: new () => WebSpeechRecognizer;
        webkitSpeechRecognition?: new () => WebSpeechRecognizer;
      };
      const Recognition = w.SpeechRecognition ?? w.webkitSpeechRecognition;
      if (!Recognition) {
        reject(new Error('Browser speech recognition is not supported.'));
        return;
      }
      const recognition = new Recognition();
      recognition.lang = 'hi-IN';
      recognition.interimResults = false;
      recognition.maxAlternatives = 1;
      recognition.onresult = (event) => {
        const transcript = event.results?.[0]?.[0]?.transcript ?? '';
        resolve(transcript);
      };
      recognition.onerror = (event) => {
        reject(new Error(`Microphone transcription failed (${event.error}).`));
      };
      recognition.onend = () => {
        // If the service ended with no result, resolve empty so callers can prompt a retry.
        resolve('');
      };
      try {
        recognition.start();
      } catch (err) {
        reject(err instanceof Error ? err : new Error('Could not start speech recognition.'));
      }
    });
  };

  const handleStop = async () => {
    const mimeType = mediaRecorderRef.current?.mimeType || 'audio/webm';
    const chunks = audioChunksRef.current;
    audioChunksRef.current = [];
    const totalBytes = chunks.reduce((sum, c) => sum + c.size, 0);

    const finish = () => {
      setIsProcessing(false);
      stopTracks();
    };

    // Guard: tapped mic without speaking (or no data) — don't call the AI with empty audio.
    if (chunks.length === 0 || totalBytes === 0) {
      toast({ variant: 'destructive', title: 'No Audio Captured', description: 'Please hold the mic and speak your query.' });
      finish();
      return;
    }

    const audioBlob = new Blob(chunks, { type: mimeType });
    const reader = new FileReader();
    reader.onerror = () => {
      toast({ variant: 'destructive', title: 'Voice Search Failed', description: 'Could not read the recording.' });
      finish();
    };
    reader.onloadend = async () => {
      if (typeof reader.result !== 'string' || !reader.result.includes(',')) {
        toast({ variant: 'destructive', title: 'Voice Search Failed', description: 'Recording was unreadable — please try again.' });
        finish();
        return;
      }
      try {
        const result = await searchWithVoice({ audioDataUri: reader.result });
        await processTranscription(result.transcription);
      } catch (error) {
        console.error('Voice search error:', error);
        // Fall back to on-device transcription before giving up entirely.
        try {
          toast({ title: 'Server Busy', description: 'Trying on-device transcription…' });
          const fallback = await transcribeWithBrowserSpeech();
          if (fallback.trim()) {
            await processTranscription(fallback);
          } else {
            throw new Error('No speech detected.');
          }
        } catch (fallbackError) {
          console.error('Voice fallback error:', fallbackError);
          const detail =
            error instanceof Error && error.message
              ? error.message
              : 'Could not process your query.';
          toast({ variant: 'destructive', title: 'Voice Search Failed', description: detail });
        }
      } finally {
        finish();
      }
    };
    reader.readAsDataURL(audioBlob);
  };

  const toggleRecording = () => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  return (
    <>
      <form onSubmit={handleSearch} className="relative w-[140px] sm:w-full sm:max-w-sm flex items-center">
        <Input
          type="search"
          placeholder="Search heritage..."
          className="pr-16 bg-white/5 border-white/10 rounded-none focus:ring-amber-500 focus:border-amber-500 text-amber-50 placeholder:text-amber-50/20"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        <div className="absolute right-1 top-1/2 -translate-y-1/2 flex items-center">
          <Button
            type="button"
            size="icon"
            variant={isRecording ? 'destructive' : 'ghost'}
            onClick={toggleRecording}
            disabled={isProcessing}
            className="h-8 w-8 text-amber-200 hover:text-amber-100 hover:bg-amber-500/10"
          >
            {isProcessing ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Mic className={`h-4 w-4 ${isRecording ? 'animate-pulse text-red-500' : ''}`} />
            )}
            <span className="sr-only">{isRecording ? 'Stop recording' : 'Start voice search'}</span>
          </Button>
          <Button type="submit" size="icon" variant="ghost" className="h-8 w-8 text-amber-200 hover:text-amber-100 hover:bg-amber-500/10">
            <Search className="h-4 w-4" />
            <span className="sr-only">Search</span>
          </Button>
        </div>
      </form>

      {/* AI Suggestion Results Modal */}
      <Dialog open={showResults} onOpenChange={setShowResults}>
        <DialogContent className="sm:max-w-md bg-[#fbf7f0] border-amber-900/10 rounded-none">
          <DialogHeader>
            <div className="flex items-center gap-2 mb-2">
              <div className="w-1 h-4 bg-amber-600" />
              <DialogTitle className="text-[10px] font-bold tracking-[0.3em] uppercase text-amber-900/60">Viraasat AI Suggestions</DialogTitle>
            </div>
            <p className="text-xs text-amber-900/70 font-serif italic mb-6">&ldquo;{suggestionExplanation}&rdquo;</p>
          </DialogHeader>
          <div className="space-y-4">
            {suggestedProducts.map((product) => (
              <Link
                key={product.id}
                href={`/product/${product.id}`}
                onClick={() => setShowResults(false)}
                className="flex items-center gap-4 p-3 bg-white border border-amber-900/5 hover:border-amber-900/20 transition-all group"
              >
                <div className="relative h-16 w-16 overflow-hidden bg-neutral-100 shrink-0">
                  <Image src={product.images[0]} alt={product.name} fill className="object-cover group-hover:scale-110 transition-transform duration-500" />
                </div>
                <div className="flex-grow">
                  <h4 className="text-sm font-heading text-[#5e2c18]">{product.name}</h4>
                  <p className="text-[9px] text-amber-900/40 uppercase tracking-widest font-bold">{product.region}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs font-bold text-[#5e2c18]">₹{product.price.toLocaleString('en-IN')}</p>
                </div>
              </Link>
            ))}
            <Button className="w-full rounded-none bg-[#5e2c18] hover:bg-[#4a2315] uppercase tracking-widest text-[10px] h-12 mt-4" asChild>
              <a href="/shop">Explore More Masters</a>
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
