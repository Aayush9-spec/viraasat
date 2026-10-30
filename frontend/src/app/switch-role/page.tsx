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
    if(!isLoaded)return;
    if(!user){router.replace('/login');return;}
    const role=user.publicMetadata?.role;
    router.replace(isTargetAdmin ? role==='admin'?'/admin':'/shop' : isTargetArtisan ? ['artisan','admin'].includes(String(role))?'/artisan/dashboard':'/apply' : '/shop');
  },[isLoaded,user,router,isTargetAdmin,isTargetArtisan]);

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
