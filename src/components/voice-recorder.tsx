'use client';
import { useState, useRef } from 'react';
import { Button } from './ui/button';
import { Mic, Square, Circle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { generateProductDescriptionFromVoice } from '@/ai/flows/generate-product-description-from-voice';

interface VoiceRecorderProps {
  onTranscriptionComplete: (text: string) => void;
}

export default function VoiceRecorder({ onTranscriptionComplete }: VoiceRecorderProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const { toast } = useToast();

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);
      mediaRecorderRef.current.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };
      mediaRecorderRef.current.onstop = handleStop;
      mediaRecorderRef.current.start();
      setIsRecording(true);
      toast({ title: 'Recording started', description: 'Describe your product out loud.' });
    } catch (err) {
      console.error('Error accessing microphone:', err);
      toast({ variant: 'destructive', title: 'Microphone Error', description: 'Could not access microphone.' });
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      setIsProcessing(true);
      toast({ title: 'Processing audio...' });
    }
  };

  const handleStop = async () => {
    const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
    const reader = new FileReader();
    reader.readAsDataURL(audioBlob);
    reader.onloadend = async () => {
      const base64Audio = reader.result as string;
      try {
        const { enhancedDescription } = await generateProductDescriptionFromVoice({ audioDataUri: base64Audio });
        onTranscriptionComplete(enhancedDescription);
        toast({ title: 'Description Generated!', description: 'Your voice description has been enhanced by AI.' });
      } catch (error) {
        console.error('Transcription error:', error);
        toast({ variant: 'destructive', title: 'Transcription Failed', description: 'Could not process audio.' });
      } finally {
        setIsProcessing(false);
        audioChunksRef.current = [];
        // Stop all media tracks to turn off the mic indicator
        mediaRecorderRef.current?.stream.getTracks().forEach(track => track.stop());
      }
    };
  };

  return (
    <div className="absolute bottom-2 right-2">
      <Button
        type="button"
        size="icon"
        variant={isRecording ? 'destructive' : 'outline'}
        onClick={isRecording ? stopRecording : startRecording}
        disabled={isProcessing}
        className="rounded-full w-10 h-10"
      >
        {isProcessing ? (
          <Circle className="h-5 w-5 animate-pulse" />
        ) : isRecording ? (
          <Square className="h-5 w-5" />
        ) : (
          <Mic className="h-5 w-5" />
        )}
        <span className="sr-only">{isRecording ? 'Stop recording' : 'Start recording'}</span>
      </Button>
    </div>
  );
}
