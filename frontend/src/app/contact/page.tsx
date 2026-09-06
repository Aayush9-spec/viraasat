'use client';

import { useState, type FormEvent } from 'react';
import { useUser } from '@clerk/nextjs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { db } from '@/services/firebase/firestore';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { sendContactReceipt } from '@/lib/notifications/email';
import { Mail, MapPin, Send } from 'lucide-react';

const channel = {
  email: 'care@viraasat.in',
  location: 'Jaipur Heritage Bazaar, Rajasthan, India',
  hours: 'Mon–Sat, 10am–7pm IST',
};

export default function ContactPage() {
  const { toast } = useToast();
  const { user } = useUser();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [topic, setTopic] = useState('General enquiry');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();

    if (!user) {
      toast({
        variant: 'destructive',
        title: 'Sign in required',
        description: 'Please sign in to send us a message.',
      });
      return;
    }

    setSending(true);
    try {
      if (db) {
        await addDoc(collection(db, 'contactSubmissions'), {
          userId: user.id,
          name: name.trim(),
          email: email.trim(),
          topic,
          message: message.trim(),
          createdAt: serverTimestamp(),
        });
      }
      await sendContactReceipt({
        to: email.trim(),
        name: name.trim(),
        topic,
      });
      setName('');
      setEmail('');
      setMessage('');
      toast({
        title: 'Message sent',
        description: `Thanks, ${name || 'friend'}! We'll reply to ${email || 'your email'} within 24 hours.`,
      });
    } catch (error) {
      console.error('Failed to submit contact form:', error);
      toast({
        variant: 'destructive',
        title: 'Submission failed',
        description: 'Something went wrong. Please try again.',
      });
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="bg-background min-h-screen">
      <header className="relative py-24 overflow-hidden bg-[#fbf7f0] border-b border-primary/5">
        <div className="absolute inset-0 opacity-[0.03] clay-texture pointer-events-none" />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
          <Badge variant="outline" className="mb-4 border-primary/20 text-primary px-4 py-1 uppercase tracking-widest text-[10px]">Say Hello</Badge>
          <h1 className="text-4xl md:text-6xl font-heading font-normal text-[#5e2c18] mb-6">Contact Us</h1>
          <p className="max-w-2xl mx-auto text-lg text-[#8b4513]/70 font-serif italic">
            Questions, commissions, or press — we read every message and reply within a business day.
          </p>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-12">
          <form onSubmit={onSubmit} className="lg:col-span-3 space-y-6">
            <div className="grid sm:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="name">Your name</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Asha Kumar"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email address</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="topic">Topic</Label>
              <select
                id="topic"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option>General enquiry</option>
                <option>Order support</option>
                <option>Custom / commissioned piece</option>
                <option>Artisan &amp; partner application</option>
                <option>Press &amp; media</option>
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="message">Message</Label>
              <Textarea
                id="message"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="How can we help?"
                rows={6}
                required
              />
            </div>

            <Button type="submit" disabled={sending} className="bg-primary text-primary-foreground">
              {sending ? 'Sending…' : 'Send Message'}
              <Send className="h-4 w-4 ml-2" />
            </Button>
          </form>

          <aside className="lg:col-span-2 space-y-6">
            <div className="border border-primary/10 bg-white p-6">
              <div className="flex items-center gap-3 text-[#5e2c18]">
                <Mail className="h-5 w-5" />
                <span className="font-heading">Email us</span>
              </div>
              <a href={`mailto:${channel.email}`} className="block mt-3 text-sm text-primary hover:underline">
                {channel.email}
              </a>
              <p className="text-xs text-muted-foreground mt-2">{channel.hours}</p>
            </div>
            <div className="border border-primary/10 bg-white p-6">
              <div className="flex items-center gap-3 text-[#5e2c18]">
                <MapPin className="h-5 w-5" />
                <span className="font-heading">Visit us</span>
              </div>
              <p className="mt-3 text-sm text-foreground/70 leading-relaxed">{channel.location}</p>
              <p className="text-xs text-muted-foreground mt-2">
                Our showroom doubles as a heritage display — walk-ins welcome.
              </p>
            </div>
            <div className="border border-primary/10 bg-white p-6">
              <span className="font-heading text-[#5e2c18]">Artisan partnership</span>
              <p className="text-sm text-foreground/70 leading-relaxed mt-3">
                If you craft with your hands, we&rsquo;d love to work with you.
              </p>
              <a href="/apply" className="inline-block mt-4 text-sm font-bold text-primary border-b border-primary/20 pb-1 hover:border-primary">
                Apply to Sell →
              </a>
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
}