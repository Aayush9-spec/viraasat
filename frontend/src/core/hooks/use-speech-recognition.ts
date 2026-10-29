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
  onnomatch: (() => void) | null;
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
  continuous = false,
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
  const [statusMessage, setStatusMessage] = useState<string>('Ready');

  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);
  const isIntentionalStopRef = useRef(false);
  const isStartingRef = useRef(false);
  const onFinalCallbackRef = useRef(onFinalTranscript);

  useEffect(() => {
    onFinalCallbackRef.current = onFinalTranscript;
  }, [onFinalTranscript]);

  // Check browser support safely on client mount
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
          recognitionRef.current.onstart = null;
          recognitionRef.current.onresult = null;
          recognitionRef.current.onerror = null;
          recognitionRef.current.onend = null;
          recognitionRef.current.onnomatch = null;
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
    setStatusMessage('Finished listening');
  }, []);

  const abortListening = useCallback(() => {
    isIntentionalStopRef.current = true;
    if (recognitionRef.current) {
      try {
        recognitionRef.current.onstart = null;
        recognitionRef.current.onresult = null;
        recognitionRef.current.onerror = null;
        recognitionRef.current.onend = null;
        recognitionRef.current.onnomatch = null;
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
    async (langOverride?: string) => {
      if (typeof window === 'undefined') return;

      // Prevent concurrent start calls
      if (isStartingRef.current) return;
      isStartingRef.current = true;

      const win = window as unknown as {
        SpeechRecognition?: SpeechRecognitionConstructor;
        webkitSpeechRecognition?: SpeechRecognitionConstructor;
      };

      const RecognitionClass = win.SpeechRecognition || win.webkitSpeechRecognition;

      if (!RecognitionClass) {
        setIsSupported(false);
        setError('Your browser does not support the Web Speech API. Please type your text or use Chrome/Edge/Safari.');
        setStatusMessage('Speech recognition unsupported');
        isStartingRef.current = false;
        return;
      }

      // Context security check (Web Speech API requires secure context HTTPS or localhost)
      if (
        window.isSecureContext === false &&
        window.location.hostname !== 'localhost' &&
        window.location.hostname !== '127.0.0.1'
      ) {
        setError('Microphone access requires a secure connection (HTTPS). Please open this website using https://.');
        setStatusMessage('HTTPS required');
        isStartingRef.current = false;
        return;
      }

      // Safely detach and abort any existing recognition session
      if (recognitionRef.current) {
        try {
          isIntentionalStopRef.current = true;
          recognitionRef.current.onstart = null;
          recognitionRef.current.onresult = null;
          recognitionRef.current.onerror = null;
          recognitionRef.current.onend = null;
          recognitionRef.current.onnomatch = null;
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

      // Pre-flight microphone permission if getUserMedia is supported
      if (typeof navigator !== 'undefined' && navigator.mediaDevices?.getUserMedia) {
        try {
          // Prompt for permission if not yet granted
          const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
          // Immediately stop and release all tracks so the speech recognition engine gets exclusive access
          stream.getTracks().forEach((track) => track.stop());
        } catch (mediaErr: unknown) {
          const errObj = mediaErr as { name?: string; message?: string };
          isStartingRef.current = false;
          setIsListening(false);

          if (errObj?.name === 'NotAllowedError' || errObj?.name === 'PermissionDeniedError') {
            setError('Microphone permission was denied. Please allow microphone access in your browser settings (look for the tune or camera/mic icon in your address bar).');
            setStatusMessage('Microphone access denied');
            return;
          }

          if (errObj?.name === 'NotFoundError' || errObj?.name === 'DevicesNotFoundError') {
            setError('No microphone hardware detected on your device.');
            setStatusMessage('No microphone detected');
            return;
          }

          // In case of other hardware or audio lock issues
          if (errObj?.name === 'NotReadableError' || errObj?.name === 'TrackStartError') {
            setError('Your microphone is currently in use by another application or system process.');
            setStatusMessage('Microphone busy');
            return;
          }
        }
      }

      try {
        const recognition = new RecognitionClass();

        // Safari on iOS/macOS WebKit does not support continuous mode reliably
        const isSafari =
          typeof navigator !== 'undefined' &&
          /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
        recognition.continuous = isSafari ? false : continuous;
        recognition.interimResults = interimResults;
        recognition.maxAlternatives = 1;
        recognition.lang = effectiveLang;

        recognition.onstart = () => {
          setIsListening(true);
          setError(null);
          setStatusMessage('Listening… Speak now');
          isStartingRef.current = false;
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
          // Handle aborted silently without treating as error
          if (event.error === 'aborted' || isIntentionalStopRef.current) {
            setStatusMessage('Recording stopped');
            setIsListening(false);
            isStartingRef.current = false;
            return;
          }

          console.warn('SpeechRecognition error:', event.error, event.message);

          if (event.error === 'not-allowed') {
            setError('Microphone permission was denied. Please allow microphone access in your browser settings (look for the tune/lock icon in your address bar).');
            setStatusMessage('Microphone access denied');
          } else if (event.error === 'service-not-allowed') {
            setError('The speech-recognition service is currently unavailable from your browser. You can type or paste your text directly.');
            setStatusMessage('Speech service unavailable');
          } else if (event.error === 'no-speech') {
            // Non-fatal: do not block UI with red error; simply guide user to retry
            setStatusMessage('No speech detected. Please speak clearly or tap the microphone to retry.');
          } else if (event.error === 'network') {
            setError('Speech network connection failed. Check your internet connection or enter text manually.');
            setStatusMessage('Speech network error');
          } else if (event.error === 'audio-capture') {
            setError('No microphone hardware was detected or your microphone is in use by another application.');
            setStatusMessage('No microphone detected');
          } else if (event.error === 'language-not-supported') {
            setError(`Speech recognition is not supported for ${effectiveLang} on this browser. Try Hindi or English, or enter text manually.`);
            setStatusMessage('Language not supported');
          } else {
            setError(`Speech recognition encountered an issue (${event.error}). You can enter text manually.`);
            setStatusMessage('Speech recognition error');
          }

          setIsListening(false);
          isStartingRef.current = false;
        };

        recognition.onnomatch = () => {
          setStatusMessage('Could not recognize speech clearly. Please try speaking again.');
        };

        recognition.onend = () => {
          setIsListening(false);
          setInterimTranscript('');
          isStartingRef.current = false;
          if (!isIntentionalStopRef.current) {
            setStatusMessage('Finished listening');
          }
        };

        recognitionRef.current = recognition;
        recognition.start();
      } catch (err: unknown) {
        console.error('Failed to start SpeechRecognition:', err);
        const errObj = err as { name?: string; message?: string };
        if (errObj?.name === 'InvalidStateError') {
          // Another recognition is active; gracefully ignore or retry
          setStatusMessage('Microphone already active');
        } else {
          setError('Could not initialize microphone recognition. You can type your text manually.');
          setStatusMessage('Initialization failed');
        }
        setIsListening(false);
        isStartingRef.current = false;
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
