'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { getSpeechLanguageCode } from '@/ai/languages';

// TypeScript declarations for Web Speech API
interface SpeechRecognitionEventLike {
  resultIndex: number;
  results: {
    length: number;
    [index: number]: {
      isFinal: boolean;
      length: number;
      [index: number]: {
        transcript: string;
        confidence: number;
      };
    };
  };
}

interface SpeechRecognitionErrorEventLike {
  error: string;
  message?: string;
}

interface SpeechRecognitionInstance {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  maxAlternatives: number;
  onstart: (() => void) | null;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEventLike) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
  abort: () => void;
}

type SpeechRecognitionConstructor = new () => SpeechRecognitionInstance;

export interface UseSpeechRecognitionOptions {
  defaultLanguage?: string;
  language?: string;
  onFinalTranscript?: (text: string) => void;
  continuous?: boolean;
  interimResults?: boolean;
}

export function useSpeechRecognition({
  defaultLanguage = 'Hindi',
  language,
  onFinalTranscript,
  continuous = true,
  interimResults = true,
}: UseSpeechRecognitionOptions = {}) {
  const [isSupported, setIsSupported] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [interimTranscript, setInterimTranscript] = useState('');
  const [speechLang, setSpeechLang] = useState(() =>
    getSpeechLanguageCode(language || defaultLanguage)
  );
  const [error, setError] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string>('Idle');

  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);
  const isIntentionalStopRef = useRef(false);
  const onFinalCallbackRef = useRef(onFinalTranscript);

  useEffect(() => {
    onFinalCallbackRef.current = onFinalTranscript;
  }, [onFinalTranscript]);

  // Check browser support on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const win = window as unknown as {
        SpeechRecognition?: SpeechRecognitionConstructor;
        webkitSpeechRecognition?: SpeechRecognitionConstructor;
      };
      const hasSupport = Boolean(win.SpeechRecognition || win.webkitSpeechRecognition);
      setIsSupported(hasSupport);
    }
  }, []);

  // Clean up recognition instance when unmounting
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        try {
          isIntentionalStopRef.current = true;
          recognitionRef.current.abort();
        } catch {
          // ignore cleanup errors
        }
        recognitionRef.current = null;
      }
    };
  }, []);

  const stopListening = useCallback(() => {
    isIntentionalStopRef.current = true;
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {
        try {
          recognitionRef.current.abort();
        } catch {
          // no-op
        }
      }
    }
    setIsListening(false);
    setStatusMessage('Processing query...');
  }, []);

  const abortListening = useCallback(() => {
    isIntentionalStopRef.current = true;
    if (recognitionRef.current) {
      try {
        recognitionRef.current.abort();
      } catch {
        // no-op
      }
      recognitionRef.current = null;
    }
    setIsListening(false);
    setInterimTranscript('');
    setStatusMessage('Cancelled');
  }, []);

  const resetTranscript = useCallback(() => {
    setTranscript('');
    setInterimTranscript('');
    setError(null);
    setStatusMessage('Ready');
  }, []);

  const startListening = useCallback(
    (langOverride?: string) => {
      if (typeof window === 'undefined') return;

      const win = window as unknown as {
        SpeechRecognition?: SpeechRecognitionConstructor;
        webkitSpeechRecognition?: SpeechRecognitionConstructor;
      };

      const RecognitionClass = win.SpeechRecognition || win.webkitSpeechRecognition;

      if (!RecognitionClass) {
        setIsSupported(false);
        setError('Browser does not support the Web Speech API. Please type your query or use Chrome/Edge/Safari.');
        setStatusMessage('Speech recognition unsupported');
        return;
      }

      // If already listening, stop previous session first cleanly
      if (recognitionRef.current) {
        try {
          isIntentionalStopRef.current = true;
          recognitionRef.current.abort();
        } catch {
          // ignore
        }
        recognitionRef.current = null;
      }

      setError(null);
      isIntentionalStopRef.current = false;
      const effectiveLang = langOverride ? getSpeechLanguageCode(langOverride) : speechLang;
      setSpeechLang(effectiveLang);

      try {
        const recognition = new RecognitionClass();
        recognition.continuous = continuous;
        recognition.interimResults = interimResults;
        recognition.maxAlternatives = 1;
        recognition.lang = effectiveLang;

        recognition.onstart = () => {
          setIsListening(true);
          setStatusMessage('Listening… Speak now');
        };

        recognition.onresult = (event: SpeechRecognitionEventLike) => {
          let currentInterim = '';
          let finalAddition = '';

          for (let i = event.resultIndex; i < event.results.length; ++i) {
            const res = event.results[i];
            const text = res?.[0]?.transcript || '';
            if (res.isFinal) {
              finalAddition += text;
            } else {
              currentInterim += text;
            }
          }

          if (finalAddition) {
            setTranscript((prev) => {
              const updated = prev ? `${prev.trim()} ${finalAddition.trim()}` : finalAddition.trim();
              if (onFinalCallbackRef.current) {
                onFinalCallbackRef.current(updated);
              }
              return updated;
            });
          }

          setInterimTranscript(currentInterim);
        };

        recognition.onerror = (event: SpeechRecognitionErrorEventLike) => {
          console.warn('SpeechRecognition error:', event.error, event.message);

          if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
            setError('Microphone permission was denied. Please allow microphone access in your browser settings.');
            setStatusMessage('Microphone access denied');
          } else if (event.error === 'no-speech') {
            // Non-fatal: user simply didn't speak in the window
            setStatusMessage('No speech detected. Please speak louder or tap mic to retry.');
          } else if (event.error === 'network') {
            setError('Speech network connection failed. Check your internet connection.');
            setStatusMessage('Speech network error');
          } else if (event.error === 'audio-capture') {
            setError('No microphone hardware detected on your device.');
            setStatusMessage('No microphone detected');
          } else if (event.error === 'aborted') {
            setStatusMessage('Recording cancelled');
          } else {
            setError(`Speech recognition encountered an issue (${event.error}).`);
            setStatusMessage('Speech recognition error');
          }

          setIsListening(false);
        };

        recognition.onend = () => {
          setIsListening(false);
          setInterimTranscript('');
          if (!isIntentionalStopRef.current) {
            setStatusMessage('Finished listening');
          }
        };

        recognitionRef.current = recognition;
        recognition.start();
      } catch (err) {
        console.error('Failed to start SpeechRecognition:', err);
        setError('Could not initialize microphone recognition.');
        setStatusMessage('Initialization failed');
        setIsListening(false);
      }
    },
    [continuous, interimResults, speechLang]
  );

  return {
    isSupported,
    isListening,
    transcript,
    setTranscript,
    interimTranscript,
    speechLang,
    setSpeechLang,
    error,
    setError,
    statusMessage,
    startListening,
    stopListening,
    abortListening,
    resetTranscript,
  };
}
