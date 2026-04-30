'use client';
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Sparkles, MessageSquare, X, Send, User, Bot } from 'lucide-react';
import { cn } from '@/lib/utils';

export function AIAssistant() {
  const [isOpen, setIsOpen] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [messages, setMessages] = useState<{ role: 'user' | 'bot'; content: string }[]>([
    { role: 'bot', content: 'Namaste! I am your Viraasat Heritage Assistant. How can I help you discover the perfect handcrafted treasure today?' }
  ]);
  const [input, setInput] = useState('');

  const handleSend = async () => {
    if (!input.trim() || isTyping) return;
    
    const userMsg = { role: 'user' as const, content: input };
    setMessages(prev => [...prev, userMsg]);
    const currentInput = input;
    setInput('');
    setIsTyping(true);
    
    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: currentInput }),
      });

      if (!response.ok) throw new Error('Failed to fetch response');
      
      const data = await response.json();
      setMessages(prev => [...prev, { role: 'bot', content: data.response }]);
    } catch (error) {
      console.error('Chat error:', error);
      setMessages(prev => [...prev, { role: 'bot', content: "I apologize, but I'm having trouble connecting to the heritage archives right now. Please try again in a moment." }]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="fixed bottom-8 right-8 z-[9999]">
      {isOpen ? (
        <Card className="w-[350px] md:w-[400px] h-[500px] flex flex-col shadow-2xl border-primary/20 clay-texture !rounded-none overflow-hidden animate-fade-in-up">
          <CardHeader className="bg-primary text-primary-foreground py-4 flex flex-row items-center justify-between !rounded-none">
            <CardTitle className="text-lg flex items-center gap-2">
              <Sparkles className="h-5 w-5" />
              Heritage Guide
            </CardTitle>
            <Button variant="ghost" size="icon" className="text-primary-foreground hover:bg-white/10 !rounded-none" onClick={() => setIsOpen(false)}>
              <X className="h-5 w-5" />
            </Button>
          </CardHeader>
          
          <CardContent className="flex-1 overflow-y-auto p-4 space-y-4 bg-background">
            {messages.map((msg, i) => (
              <div key={i} className={cn("flex gap-3", msg.role === 'user' ? "flex-row-reverse" : "flex-row")}>
                <div className={cn("h-8 w-8 !rounded-none flex items-center justify-center shrink-0", msg.role === 'user' ? "bg-secondary text-primary" : "bg-primary text-primary-foreground")}>
                  {msg.role === 'user' ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
                </div>
                <div className={cn("max-w-[80%] p-3 !rounded-none text-sm border", msg.role === 'user' ? "bg-primary/5 border-primary/10 text-foreground" : "bg-secondary border-border/50 text-foreground")}>
                  {msg.content}
                </div>
              </div>
            ))}
            {isTyping && (
              <div className="flex gap-3 animate-pulse">
                <div className="h-8 w-8 !rounded-none bg-primary text-primary-foreground flex items-center justify-center shrink-0">
                  <Bot className="h-4 w-4" />
                </div>
                <div className="bg-secondary p-3 !rounded-none text-xs border border-border/50 text-foreground italic">
                  Consulting heritage archives...
                </div>
              </div>
            )}
          </CardContent>

          <CardFooter className="p-4 border-t border-primary/10 bg-secondary/30 !rounded-none">
            <div className="flex w-full gap-2">
              <Input 
                placeholder="Ask about crafts, regions..." 
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                className="!rounded-none border-primary/20 focus-visible:ring-primary/20 bg-background"
              />
              <Button size="icon" onClick={handleSend} className="bg-primary hover:bg-primary/90 !rounded-none shrink-0">
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </CardFooter>
        </Card>
      ) : (
        <Button 
          onClick={() => setIsOpen(true)}
          className="h-16 w-16 !rounded-none shadow-2xl bg-primary hover:bg-primary/90 text-primary-foreground border border-primary/20 animate-bounce group"
        >
          <MessageSquare className="h-8 w-8 group-hover:scale-110 transition-transform" />
          <span className="absolute -top-1 -right-1 flex h-4 w-4">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent opacity-75"></span>
            <span className="relative inline-flex rounded-full h-4 w-4 bg-accent"></span>
          </span>
        </Button>
      )}
    </div>
  );
}
