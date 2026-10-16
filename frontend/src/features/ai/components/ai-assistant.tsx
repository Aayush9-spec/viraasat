'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Sparkles, MessageSquare, X, Send, User, Bot,
  Camera, Mic, MicOff, Loader2, AlertCircle,
} from 'lucide-react';
import { cn } from '@/core/utils/utils';
import Image from 'next/image';
import Link from 'next/link';
import { products } from '@/lib/data';

// ─── Types ────────────────────────────────────────────────────────────────────

interface ChatMessage {
  role: 'user' | 'bot';
  content: string;
  agent?: string;
  image?: string;
  productIds?: string[];
  isError?: boolean;
}

interface HistoryEntry {
  role: 'user' | 'model';
  content: string;
}

// ─── Simple markdown renderer ─────────────────────────────────────────────────
// Handles **bold**, *italic*, bullet lists, and newlines — no external lib needed

function renderMarkdown(text: string): React.ReactNode {
  const lines = text.split('\n');
  const elements: React.ReactNode[] = [];

  lines.forEach((line, lineIdx) => {
    if (!line.trim()) {
      elements.push(<div key={lineIdx} className="h-1" />);
      return;
    }

    // Bullet list item
    const isBullet = /^[•\-\*]\s/.test(line.trim());
    const content = isBullet ? line.replace(/^[•\-\*]\s/, '') : line;

    // Inline formatting: **bold** and *italic*
    const parts = content.split(/(\*\*[^*]+\*\*|\*[^*]+\*)/g);
    const formatted = parts.map((part, i) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={i} className="font-semibold text-[#5e2c18]">{part.slice(2, -2)}</strong>;
      }
      if (part.startsWith('*') && part.endsWith('*')) {
        return <em key={i}>{part.slice(1, -1)}</em>;
      }
      return part;
    });

    if (isBullet) {
      elements.push(
        <div key={lineIdx} className="flex gap-1.5 items-start">
          <span className="text-amber-600 mt-0.5 shrink-0">•</span>
          <span>{formatted}</span>
        </div>
      );
    } else {
      elements.push(<div key={lineIdx}>{formatted}</div>);
    }
  });

  return <div className="space-y-0.5 leading-relaxed">{elements}</div>;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function AIAssistant() {
  const [isOpen, setIsOpen] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: 'bot',
      content: 'Namaste! 🙏 I am your Viraasat Intelligent Assistant.\n\nI coordinate three specialized sub-agents:\n• **Buyer Agent** — product recommendations & shopping\n• **Cultural Research Agent** — craft history, GI tags, techniques\n• **Inventory Agent** — stock, shipping, logistics\n\nAsk me about Indian heritage crafts, or describe the perfect piece you\'re looking for!',
      agent: 'Buyer Agent',
    }
  ]);
  const [input, setInput] = useState('');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [chatHistory, setChatHistory] = useState<HistoryEntry[]>([]);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll to bottom whenever messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  // Focus input when chat opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  const addMessage = useCallback((msg: ChatMessage) => {
    setMessages(prev => [...prev, msg]);
  }, []);

  const handleSend = useCallback(async () => {
    const text = input.trim();
    if (!text && !selectedImage) return;
    if (isTyping) return;

    const userMsg: ChatMessage = {
      role: 'user',
      content: text || 'Analyze this craft image',
      image: selectedImage ?? undefined,
    };

    addMessage(userMsg);
    setInput('');
    setSelectedImage(null);
    setIsTyping(true);

    // Build history for context (last 6 turns)
    const newHistory: HistoryEntry[] = [
      ...chatHistory.slice(-12),
      { role: 'user', content: text || 'Analyze this craft image' },
    ];

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text || 'Analyze this craft image',
          history: chatHistory.slice(-12),
          imageDataUri: selectedImage ?? undefined,
        }),
      });

      const data = await response.json();

      const botMsg: ChatMessage = {
        role: 'bot',
        content: data.response ?? "I'm sorry, I couldn't process that request.",
        agent: data.activeAgent ?? 'Buyer Agent',
        productIds: data.suggestedProductIds ?? undefined,
        isError: !!data.errorCode && data.errorCode !== 'CHAT_RATE_LIMITED',
      };

      addMessage(botMsg);

      // Update history with both turns
      setChatHistory([
        ...newHistory,
        { role: 'model', content: data.response ?? '' },
      ]);
    } catch {
      addMessage({
        role: 'bot',
        content: "I'm having trouble connecting right now. Please check your connection and try again.",
        agent: 'System',
        isError: true,
      });
    } finally {
      setIsTyping(false);
    }
  }, [input, selectedImage, isTyping, chatHistory, addMessage]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) return; // 5MB max
    const reader = new FileReader();
    reader.onloadend = () => setSelectedImage(reader.result as string);
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const toggleRecording = async () => {
    if (isRecording) {
      mediaRecorderRef.current?.stop();
      setIsRecording(false);
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;
      audioChunksRef.current = [];

      recorder.ondataavailable = (e) => audioChunksRef.current.push(e.data);
      recorder.onstop = async () => {
        const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        stream.getTracks().forEach(t => t.stop());
        // Convert to base64 and use as a note — without real STT, just show a hint
        const reader = new FileReader();
        reader.onloadend = () => {
          // Since we don't have STT, just prompt user to type what they said
          setInput(prev => prev || 'I just recorded a voice message — please help me find a handcrafted item');
          inputRef.current?.focus();
        };
        reader.readAsDataURL(blob);
      };

      recorder.start();
      setIsRecording(true);
    } catch {
      // Microphone permission denied — ignore silently
    }
  };

  // Quick suggestion chips
  const suggestions = [
    'Show gifts under ₹500',
    'Tell me about Banarasi silk',
    'Pottery from Rajasthan',
    'What is a GI tag?',
    'Jewelry under ₹1000',
  ];

  return (
    <div className="fixed bottom-8 right-8 z-[9999]">
      {isOpen ? (
        <Card className="w-[380px] md:w-[440px] h-[600px] flex flex-col shadow-2xl border-primary/20 !rounded-none overflow-hidden">
          {/* Header */}
          <CardHeader className="bg-[#5e2c18] text-white py-3 px-4 flex flex-row items-center justify-between !rounded-none shrink-0">
            <CardTitle className="text-sm flex items-center gap-2 font-heading tracking-wide">
              <Sparkles className="h-4 w-4 text-amber-400" />
              Viraasat AI Assistant
            </CardTitle>
            <div className="flex items-center gap-1.5">
              <div className="flex gap-1 items-center text-[10px] text-amber-300 bg-amber-900/30 rounded px-2 py-0.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                3 agents online
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-white hover:bg-white/10 !rounded-none"
                onClick={() => setIsOpen(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>

          {/* Messages */}
          <CardContent className="flex-1 overflow-y-auto p-3 space-y-3 bg-[#fbf7f0]/40 min-h-0">
            {messages.map((msg, i) => (
              <div
                key={i}
                className={cn(
                  'flex flex-col gap-1',
                  msg.role === 'user' ? 'items-end' : 'items-start'
                )}
              >
                {/* Agent label */}
                {msg.agent && msg.role === 'bot' && (
                  <span className="text-[8px] uppercase tracking-widest text-[#5e2c18]/50 font-bold ml-9">
                    🤖 {msg.agent}
                  </span>
                )}

                <div className={cn(
                  'flex gap-2 max-w-[88%]',
                  msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'
                )}>
                  {/* Avatar */}
                  <div className={cn(
                    'h-7 w-7 rounded flex items-center justify-center shrink-0 border mt-0.5',
                    msg.role === 'user'
                      ? 'bg-amber-50 border-amber-200 text-[#5e2c18]'
                      : msg.isError
                        ? 'bg-red-100 border-red-200 text-red-600'
                        : 'bg-[#5e2c18] border-[#5e2c18] text-white'
                  )}>
                    {msg.role === 'user'
                      ? <User className="h-3.5 w-3.5" />
                      : msg.isError
                        ? <AlertCircle className="h-3.5 w-3.5" />
                        : <Bot className="h-3.5 w-3.5" />
                    }
                  </div>

                  {/* Bubble */}
                  <div className="space-y-2 min-w-0 flex-1">
                    <div className={cn(
                      'p-3 rounded text-xs border leading-relaxed shadow-sm',
                      msg.role === 'user'
                        ? 'bg-card border-border text-card-foreground'
                        : msg.isError
                          ? 'bg-red-50 border-red-200 text-red-800'
                          : 'bg-card border-border text-card-foreground'
                    )}>
                      {msg.image && (
                        <div className="relative w-full aspect-video mb-2 border overflow-hidden rounded">
                          <Image
                            src={msg.image}
                            alt="Uploaded craft"
                            width={400}
                            height={225}
                            unoptimized
                            className="w-full h-full object-cover"
                          />
                        </div>
                      )}
                      {msg.role === 'bot'
                        ? renderMarkdown(msg.content)
                        : msg.content
                      }
                    </div>

                    {/* Product Cards */}
                    {msg.productIds && msg.productIds.length > 0 && (
                      <div className="grid grid-cols-2 gap-1.5">
                        {msg.productIds.map(id => {
                          const product = products.find(p => p.id === id);
                          if (!product) return null;
                          return (
                            <Link
                              key={id}
                              href={`/product/${id}`}
                              onClick={() => setIsOpen(false)}
                              className="block bg-card border border-border hover:border-amber-600/30 p-2 transition-all group rounded"
                            >
                              <div className="relative aspect-square w-full overflow-hidden bg-neutral-100 mb-1 rounded">
                                <Image
                                  src={product.images[0]}
                                  alt={product.name}
                                  width={150}
                                  height={150}
                                  unoptimized
                                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                />
                              </div>
                              <p className="text-[10px] font-semibold text-[#5e2c18] truncate leading-tight">{product.name}</p>
                              <p className="text-[9px] text-muted-foreground">₹{product.price.toLocaleString('en-IN')}</p>
                            </Link>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}

            {/* Typing indicator */}
            {isTyping && (
              <div className="flex gap-2 items-start">
                <div className="h-7 w-7 rounded bg-[#5e2c18] text-white flex items-center justify-center shrink-0 border border-[#5e2c18]">
                  <Bot className="h-3.5 w-3.5" />
                </div>
                <div className="bg-card border border-border p-3 rounded text-[10px] text-muted-foreground italic shadow-sm flex items-center gap-2">
                  <Loader2 className="h-3 w-3 animate-spin" />
                  Consulting heritage archives...
                </div>
              </div>
            )}

            {/* Scroll anchor */}
            <div ref={messagesEndRef} />
          </CardContent>

          {/* Quick suggestions (show only when 1 message / just opened) */}
          {messages.length === 1 && (
            <div className="px-3 py-2 bg-card/80 border-t border-primary/5 flex gap-1.5 overflow-x-auto shrink-0">
              {suggestions.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => {
                    setInput(s);
                    setTimeout(() => inputRef.current?.focus(), 50);
                  }}
                  className="text-[9px] whitespace-nowrap border border-amber-200 bg-amber-50 hover:bg-amber-100 text-amber-900 px-2 py-1 rounded-full transition-colors shrink-0"
                >
                  {s}
                </button>
              ))}
            </div>
          )}

          {/* Image attachment preview */}
          {selectedImage && (
            <div className="px-3 py-2 bg-card border-t border-border flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <div className="relative w-8 h-8 border rounded overflow-hidden">
                  <Image
                    src={selectedImage}
                    alt="Attachment"
                    width={32}
                    height={32}
                    unoptimized
                    className="w-full h-full object-cover"
                  />
                </div>
                <span className="text-[10px] text-muted-foreground">Image attached</span>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 text-muted-foreground"
                onClick={() => setSelectedImage(null)}
              >
                <X className="h-3.5 w-3.5" />
              </Button>
            </div>
          )}

          {/* Input bar */}
          <CardFooter className="p-3 border-t border-primary/10 bg-secondary/70 !rounded-none shrink-0">
            <div className="flex w-full gap-1.5 items-center">
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleImageUpload}
                accept="image/*"
                className="hidden"
              />
              <Button
                type="button"
                size="icon"
                variant="outline"
                className={cn(
                  '!rounded-none border-primary/20 bg-card hover:bg-secondary text-foreground h-9 w-9 shrink-0',
                  selectedImage && 'text-green-600 border-green-300'
                )}
                onClick={() => fileInputRef.current?.click()}
                title="Attach craft image"
              >
                <Camera className="h-3.5 w-3.5" />
              </Button>
              <Button
                type="button"
                size="icon"
                variant={isRecording ? 'destructive' : 'outline'}
                className="!rounded-none border-primary/20 bg-card hover:bg-secondary text-foreground h-9 w-9 shrink-0"
                onClick={toggleRecording}
                title={isRecording ? 'Stop recording' : 'Voice input'}
              >
                {isRecording
                  ? <MicOff className="h-3.5 w-3.5" />
                  : <Mic className="h-3.5 w-3.5" />
                }
              </Button>
              <Input
                ref={inputRef}
                placeholder="Ask about crafts, regions, prices..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={isTyping}
                className="!rounded-none border-primary/20 focus-visible:ring-primary/20 bg-background text-xs h-9"
              />
              <Button
                size="icon"
                onClick={handleSend}
                disabled={isTyping || (!input.trim() && !selectedImage)}
                className="bg-primary hover:bg-primary/90 disabled:opacity-40 !rounded-none shrink-0 h-9 w-9 text-white"
              >
                {isTyping
                  ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  : <Send className="h-3.5 w-3.5" />
                }
              </Button>
            </div>
          </CardFooter>
        </Card>
      ) : (
        <button
          onClick={() => setIsOpen(true)}
          className="h-14 w-14 bg-primary hover:bg-primary/90 text-white shadow-2xl border border-[#5e2c18]/20 flex items-center justify-center transition-transform hover:scale-105 relative"
          title="Open AI Assistant"
        >
          <MessageSquare className="h-6 w-6" />
          <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-amber-500" />
          </span>
        </button>
      )}
    </div>
  );
}
