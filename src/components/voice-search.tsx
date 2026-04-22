'use client';
import { useState, useRef } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Mic, Search, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { searchWithVoice } from '@/ai/flows/search-with-voice';
import { suggestProducts } from '@/ai/flows/suggest-products';
import { products } from '@/lib/data';
import { Product } from '@/lib/types';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import Image from 'next/image';
import Link from 'next/link';

export default function VoiceSearch() {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestedProducts, setSuggestedProducts] = useState<Product[]>([]);
  const [suggestionExplanation, setSuggestionExplanation] = useState('');
  const [showResults, setShowResults] = useState(false);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const { toast } = useToast();

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
    window.location.href = `/shop?q=${encodeURIComponent(searchQuery)}`;
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream, { mimeType: 'audio/webm' });
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

  const handleStop = async () => {
    const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
    const reader = new FileReader();
    reader.readAsDataURL(audioBlob);
    reader.onloadend = async () => {
      const base64Audio = reader.result as string;
      try {
        const result = await searchWithVoice({ audioDataUri: base64Audio });
        setSearchQuery(result.transcription);
        
        // conversational commerce: get product suggestions
        const suggestions = await suggestProducts({ query: result.transcription });
        
        if (suggestions.productIds.length > 0) {
          const matchedProducts = products.filter(p => suggestions.productIds.includes(p.id));
          setSuggestedProducts(matchedProducts);
          setSuggestionExplanation(suggestions.explanation);
          setShowResults(true);
        }

        toast({
          title: 'Voice processed!',
          description: `Found cultural matches for: "${result.transcription}"`
        });
      } catch (error) {
        console.error('Voice search error:', error);
        toast({ variant: 'destructive', title: 'Voice Search Failed', description: 'Could not process your query.' });
      } finally {
        setIsProcessing(false);
        audioChunksRef.current = [];
        mediaRecorderRef.current?.stream.getTracks().forEach(track => track.stop());
      }
    };
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
            <p className="text-xs text-amber-900/70 font-serif italic mb-6">"{suggestionExplanation}"</p>
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
