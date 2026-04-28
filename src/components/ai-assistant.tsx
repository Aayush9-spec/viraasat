'use client';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Sparkles, MessageSquare, X, Send, User, Bot } from 'lucide-react';
import { cn } from '@/lib/utils';

export function AIAssistant() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<{ role: 'user' | 'bot'; content: string }[]>([
    { role: 'bot', content: 'Namaste! I am your Viraasat Heritage Assistant. How can I help you discover the perfect handcrafted treasure today?' }
  ]);
  const [input, setInput] = useState('');

  const handleSend = () => {
    if (!input.trim()) return;
    const userMsg = { role: 'user' as const, content: input };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    
    // Simulate bot response
    setTimeout(() => {
      setMessages(prev => [...prev, { role: 'bot', content: "That's a wonderful interest! Our artisans from Rajasthan have some exquisite hand-painted wooden boxes that might match what you're looking for. Would you like to see them?" }]);
    }, 1000);
  };

  return (
    <div className="fixed bottom-8 right-8 z-[100]">
      {isOpen ? (
        <Card className="w-[350px] md:w-[400px] h-[500px] flex flex-col shadow-2xl border-primary/20 clay-texture overflow-hidden animate-fade-in-up">
          <CardHeader className="bg-primary text-primary-foreground py-4 flex flex-row items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <Sparkles className="h-5 w-5" />
              Heritage Guide
            </CardTitle>
            <Button variant="ghost" size="icon" className="text-primary-foreground hover:bg-white/10" onClick={() => setIsOpen(false)}>
              <X className="h-5 w-5" />
            </Button>
          </CardHeader>
          
          <CardContent className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((msg, i) => (
              <div key={i} className={cn("flex gap-3", msg.role === 'user' ? "flex-row-reverse" : "flex-row")}>
                <div className={cn("h-8 w-8 rounded-full flex items-center justify-center shrink-0", msg.role === 'user' ? "bg-secondary text-primary" : "bg-primary text-primary-foreground")}>
                  {msg.role === 'user' ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
                </div>
                <div className={cn("max-w-[80%] p-3 rounded-2xl text-sm", msg.role === 'user' ? "bg-primary/10 text-foreground rounded-tr-none" : "bg-secondary text-foreground rounded-tl-none")}>
                  {msg.content}
                </div>
              </div>
            ))}
          </CardContent>

          <CardFooter className="p-4 border-t border-primary/10 bg-background/50">
            <div className="flex w-full gap-2">
              <Input 
                placeholder="Ask about crafts, regions..." 
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                className="rounded-none border-primary/20 focus-visible:ring-primary/20"
              />
              <Button size="icon" onClick={handleSend} className="bg-primary hover:bg-primary/90 rounded-none shrink-0">
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </CardFooter>
        </Card>
      ) : (
        <Button 
          onClick={() => setIsOpen(true)}
          className="h-16 w-16 rounded-full shadow-2xl bg-[#5e2c18] hover:bg-[#4a2315] text-[#fbf7f0] border-2 border-primary/20 animate-bounce group"
        >
          <MessageSquare className="h-8 w-8 group-hover:scale-110 transition-transform" />
          <span className="absolute -top-1 -right-1 flex h-4 w-4">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
            <span className="relative inline-flex rounded-full h-4 w-4 bg-primary"></span>
          </span>
        </Button>
      )}
    </div>
  );
}
