'use client';
import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ViraasatLogo } from '@/components/viraasat-logo';
import { ArrowRight } from 'lucide-react';

export default function LoginPage() {
  return (
    <div className="w-full lg:grid lg:min-h-screen lg:grid-cols-2">
      <div className="flex items-center justify-center p-6 sm:p-12 lg:p-0">
        <div className="mx-auto grid w-[400px] gap-8">
            <div className="absolute top-8 left-8">
                <ViraasatLogo />
            </div>
            <div className="space-y-2 text-center lg:text-left">
                <h1 className="text-3xl font-bold">Welcome to Viraasat</h1>
                <p className="text-balance text-muted-foreground">
                Choose your path to begin.
                </p>
            </div>
            
            <div className="group relative">
                <div className="absolute -inset-0.5 animate-tilt rounded-lg bg-gradient-to-r from-amber-400 to-orange-500 opacity-30 blur transition duration-1000 group-hover:opacity-75 group-hover:duration-200"></div>
                <div className="relative flex flex-col items-start gap-4 rounded-lg border bg-card p-6 text-card-foreground">
                    <div className="space-y-1">
                        <h2 className="text-xl font-bold">For Our Customers</h2>
                        <p className="text-muted-foreground text-sm">
                        Sign in to continue your shopping journey, view your orders, and manage your account.
                        </p>
                    </div>
                    <Button asChild className="w-full">
                        <Link href="/login/customer">
                        Customer Login / Sign Up <ArrowRight className="ml-2 h-4 w-4" />
                        </Link>
                    </Button>
                </div>
            </div>

            <div className="relative group">
                 <div className="relative flex flex-col items-start gap-4 rounded-lg border bg-card p-6 text-card-foreground">
                    <div className="space-y-1">
                        <h2 className="text-xl font-bold">For Our Artisans</h2>
                        <p className="text-muted-foreground text-sm">
                         Log in to manage your products, view your sales, and connect with a global audience.
                        </p>
                    </div>
                    <Button asChild variant="secondary" className="w-full">
                        <Link href="/login/artisan">
                        Artisan Login / Sign Up <ArrowRight className="ml-2 h-4 w-4" />
                        </Link>
                    </Button>
                </div>
            </div>


        </div>
      </div>
      <div className="hidden bg-muted lg:block">
        <Image
          src="https://picsum.photos/seed/login-customer/1200/1800"
          alt="Image"
          width="1920"
          height="1080"
          className="h-full w-full object-cover dark:brightness-[0.2] dark:grayscale"
          data-ai-hint="marketplace background"
        />
      </div>
    </div>
  );
}
