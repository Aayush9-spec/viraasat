"use client";

import { useState } from "react";
import { useUser } from "@clerk/nextjs";
import { useToast } from "@/core/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { supabase } from "@/services/supabase";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export function NewsletterForm() {
  const { user } = useUser();
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const value = email.trim();

    if (!EMAIL_RE.test(value)) {
      toast({ variant: "destructive", title: "Check your email", description: "Please enter a valid email address." });
      return;
    }

    if (!user) {
      toast({ variant: "destructive", title: "Sign in required", description: "Please sign in to subscribe to the newsletter." });
      return;
    }

    setBusy(true);
    try {
      const { error } = await supabase
        .from('newsletter')
        .insert({
          email: value,
          user_id: user.id,
          source: 'footer',
          subscribed_at: new Date().toISOString(),
        });

      if (error) throw error;

      setEmail("");
      toast({ title: "Subscribed!", description: "You're on the list for new arrivals and special offers." });
    } catch (err) {
      console.warn("Failed to subscribe", err);
      toast({ variant: "destructive", title: "Subscription failed", description: "Something went wrong. Please try again." });
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex bg-background rounded-md border border-border focus-within:border-primary transition-colors p-1">
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Your email"
        aria-label="Email address"
        className="bg-transparent border-none text-sm text-foreground placeholder:text-muted-foreground focus:ring-0 flex-1 px-3 min-w-0"
      />
      <Button type="submit" size="sm" className="bg-primary hover:bg-primary/90 text-primary-foreground h-8" disabled={busy}>
        {busy ? "Subscribing…" : "Join"}
      </Button>
    </form>
  );
}