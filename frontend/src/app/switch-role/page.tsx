'use client';

import { Suspense, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useUser } from '@clerk/nextjs';
import { STORAGE_KEYS } from '@/core/config/constants';
import { Loader2 } from 'lucide-react';

export default function SwitchRolePage() {
  return (
    <Suspense fallback={<SwitchRoleLoading />}>
      <SwitchRoleContent />
    </Suspense>
  );
}

function SwitchRoleLoading() {
  return (
    <div className="flex min-h-screen items-center justify-center p-4 bg-background">
      <div className="text-center space-y-3">
        <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
        <p className="text-sm text-muted-foreground font-medium">Switching workspace mode...</p>
      </div>
    </div>
  );
}

function SwitchRoleContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, isLoaded } = useUser();

  const toParam = searchParams.get('to');
  const targetRole = toParam === 'admin' ? 'admin' : toParam === 'artisan' ? 'artisan' : 'buyer';
  const isTargetArtisan = targetRole === 'artisan';
  const isTargetAdmin = targetRole === 'admin';

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEYS.SESSION_ROLE, targetRole);

      const demoStr = localStorage.getItem('viraasat_demo_user');
      if (demoStr) {
        try {
          const parsed = JSON.parse(demoStr);
          parsed.role = targetRole;
          localStorage.setItem('viraasat_demo_user', JSON.stringify(parsed));
        } catch {
          // ignore
        }
      }

      window.dispatchEvent(new Event('storage'));
      window.dispatchEvent(new Event('viraasat_auth_change'));
    }

    if (isLoaded && user && typeof user.update === 'function') {
      user.update({
        unsafeMetadata: {
          ...user.unsafeMetadata,
          role: targetRole,
        },
      }).catch(() => {});
    }

    const destination = isTargetAdmin
      ? '/admin'
      : isTargetArtisan
        ? '/artisan/dashboard'
        : '/shop';
    router.replace(destination);
  }, [targetRole, isTargetArtisan, isTargetAdmin, isLoaded, user, router]);

  return (
    <div className="flex min-h-screen items-center justify-center p-4 bg-background">
      <div className="text-center space-y-3">
        <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
        <p className="text-sm text-muted-foreground font-medium">
          {isTargetAdmin
            ? 'Opening Admin Console...'
            : isTargetArtisan
              ? 'Opening Artisan Studio...'
              : 'Opening Customer Gallery...'}
        </p>
      </div>
    </div>
  );
}
