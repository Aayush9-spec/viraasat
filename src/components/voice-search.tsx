'use client';
import { useState, useRef } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Mic, Search, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { searchWithVoice } from '@/ai/flows/search-with-voice';

export default function VoiceSearch() {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const { toast } = useToast();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery) return;
    toast({
        title: 'Searching...',
        description: `Looking for products matching: ${searchQuery}`,
    });
    // Implement actual search logic here
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
      toast({ title: 'Listening...', description: 'Speak your search query now.' });
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
      toast({ title: 'Processing your voice...' });
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
        toast({ 
            title: 'Voice query processed!', 
            description: `Search for: "${result.searchQuery}" of color "${result.color}" in category "${result.category}"`
        });
      } catch (error) {
        console.error('Voice search error:', error);
        toast({ variant: 'destructive', title: 'Voice Search Failed', description: 'Could not process your voice query.' });
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
    <form onSubmit={handleSearch} className="relative w-full max-w-sm flex items-center">
      <Input
        type="search"
        placeholder="Search for products..."
        className="pr-16"
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
          className="h-8 w-8"
        >
          {isProcessing ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Mic className="h-4 w-4" />
          )}
          <span className="sr-only">{isRecording ? 'Stop recording' : 'Start voice search'}</span>
        </Button>
        <Button type="submit" size="icon" variant="ghost" className="h-8 w-8">
            <Search className="h-4 w-4" />
            <span className="sr-only">Search</span>
        </Button>
      </div>
    </form>
  );
}
