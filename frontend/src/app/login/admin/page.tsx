'use client';
import {Suspense,useEffect} from 'react';
import {useUser} from '@clerk/nextjs';
import {useRouter} from 'next/navigation';
import {LoginForm} from '@/features/auth/components/login-form';
function AdminLogin() {
  const {user,isLoaded}=useUser();const router=useRouter();
  useEffect(()=>{if(isLoaded && user?.publicMetadata?.role==='admin')router.replace('/admin');},[isLoaded,user,router]);
  return <main className="max-w-lg mx-auto px-4 py-12 space-y-6"><h1 className="text-3xl font-serif">Administrator sign in</h1>
    {isLoaded && user && user.publicMetadata?.role!=='admin'?<p role="alert">This account does not have administrator access. Contact your administrator to request access.</p>:<LoginForm userType="Admin"/>}
  </main>;
}
export default function Page(){return <Suspense fallback={<p>Loading…</p>}><AdminLogin/></Suspense>;}
