'use client';

import { useState } from 'react';
import { useUser } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import { ShoppingBag, Store, Sparkles, CheckCircle2, Loader2 } from 'lucide-react';
import { createUser, updateUserRole, getUser } from '@/lib/firebase/users';
import { UserRole } from '@/types/user';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

interface RoleSelectorProps {
  onRoleSelected?: (role: UserRole) => void;
  redirectOnSelect?: boolean;
}

export function RoleSelector({ onRoleSelected, redirectOnSelect = true }: RoleSelectorProps) {
  const { user, isLoaded } = useUser();
  const router = useRouter();
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSelectRole = async (role: UserRole) => {
    if (!user || isSubmitting) return;

    setSelectedRole(role);
    setIsSubmitting(true);
    setError(null);

    try {
      const clerkUserId = user.id;
      const name = user.fullName || user.username || user.primaryEmailAddress?.emailAddress || 'Viraasat User';
      const email = user.primaryEmailAddress?.emailAddress || '';
      const imageUrl = user.imageUrl || '';

      const existingDoc = await getUser(clerkUserId);

      if (existingDoc) {
        await updateUserRole(clerkUserId, role);
      } else {
        await createUser({
          clerkUserId,
          name,
          email,
          imageUrl,
          role,
        });
      }

      // Also update Clerk unsafeMetadata for convenience
      try {
        await user.update({
          unsafeMetadata: {
            ...user.unsafeMetadata,
            role,
          },
        });
      } catch (err) {
        console.warn('Could not update Clerk unsafeMetadata:', err);
      }

      if (onRoleSelected) {
        onRoleSelected(role);
      }

      if (redirectOnSelect) {
        if (role === 'artisan') {
          router.push('/artisan/dashboard');
        } else {
          router.push('/dashboard');
        }
        router.refresh();
      }
    } catch (err: any) {
      console.error('Error saving user role:', err);
      setError(err?.message || 'Failed to save role. Please try again.');
      setIsSubmitting(false);
    }
  };

  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="w-full max-w-4xl mx-auto p-4 sm:p-6 lg:p-8 space-y-8">
      <div className="text-center space-y-3">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold uppercase tracking-wider">
          <Sparkles className="w-3.5 h-3.5" />
          Welcome to Viraasat
        </div>
        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-heading font-bold text-foreground">
          How will you use Viraasat?
        </h1>
        <p className="text-muted-foreground text-base sm:text-lg max-w-xl mx-auto">
          Preserving Heritage. Empowering Artisans. Select your account type to personalize your experience.
        </p>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-sm text-center">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8 pt-4">
        {/* BUYER CARD */}
        <div
          onClick={() => !isSubmitting && handleSelectRole('buyer')}
          className={cn(
            'group relative cursor-pointer rounded-3xl border-2 p-8 transition-all duration-300',
            'bg-card hover:shadow-2xl hover:scale-[1.02]',
            selectedRole === 'buyer' && isSubmitting
              ? 'border-emerald-500 ring-4 ring-emerald-500/20 bg-emerald-500/5'
              : 'border-border hover:border-emerald-500/60'
          )}
        >
          <div className="flex flex-col h-full justify-between gap-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-teal-400 to-emerald-600 text-white shadow-lg group-hover:scale-110 transition-transform">
                  <ShoppingBag className="h-7 w-7" />
                </div>
                <span className="text-xs font-bold px-3 py-1 rounded-full bg-emerald-100 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300">
                  BUYER
                </span>
              </div>
              <div>
                <h2 className="text-2xl font-heading font-bold text-foreground group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                  Buy traditional products
                </h2>
                <p className="mt-2 text-muted-foreground leading-relaxed text-sm sm:text-base">
                  Discover authentic Indian heritage products. Explore handcrafted treasures direct from verified master artisans.
                </p>
              </div>
            </div>

            <Button
              disabled={isSubmitting}
              className={cn(
                'w-full py-6 text-base font-semibold rounded-xl transition-all',
                'bg-emerald-600 hover:bg-emerald-700 text-white shadow-md'
              )}
            >
              {isSubmitting && selectedRole === 'buyer' ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="h-5 w-5 animate-spin" /> Saving Preference...
                </span>
              ) : (
                <span className="flex items-center justify-center gap-2">
                  Continue as Buyer <CheckCircle2 className="h-5 w-5 opacity-0 group-hover:opacity-100 transition-opacity" />
                </span>
              )}
            </Button>
          </div>
        </div>

        {/* ARTISAN CARD */}
        <div
          onClick={() => !isSubmitting && handleSelectRole('artisan')}
          className={cn(
            'group relative cursor-pointer rounded-3xl border-2 p-8 transition-all duration-300',
            'bg-card hover:shadow-2xl hover:scale-[1.02]',
            selectedRole === 'artisan' && isSubmitting
              ? 'border-amber-500 ring-4 ring-amber-500/20 bg-amber-500/5'
              : 'border-border hover:border-amber-500/60'
          )}
        >
          <div className="flex flex-col h-full justify-between gap-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-400 to-orange-600 text-white shadow-lg group-hover:scale-110 transition-transform">
                  <Store className="h-7 w-7" />
                </div>
                <span className="text-xs font-bold px-3 py-1 rounded-full bg-amber-100 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300">
                  ARTISAN
                </span>
              </div>
              <div>
                <h2 className="text-2xl font-heading font-bold text-foreground group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
                  Sell traditional products
                </h2>
                <p className="mt-2 text-muted-foreground leading-relaxed text-sm sm:text-base">
                  Sell your craft and grow your heritage business. Access AI pricing, demand forecasting, and GI provenance tracking.
                </p>
              </div>
            </div>

            <Button
              disabled={isSubmitting}
              className={cn(
                'w-full py-6 text-base font-semibold rounded-xl transition-all',
                'bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white shadow-md'
              )}
            >
              {isSubmitting && selectedRole === 'artisan' ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="h-5 w-5 animate-spin" /> Setting Up Workshop...
                </span>
              ) : (
                <span className="flex items-center justify-center gap-2">
                  Continue as Artisan <CheckCircle2 className="h-5 w-5 opacity-0 group-hover:opacity-100 transition-opacity" />
                </span>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
