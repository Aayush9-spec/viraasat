'use client';
import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ViraasatLogo } from '@/components/viraasat-logo';
import { ArrowRight, ShoppingBag, Store } from 'lucide-react';
import { Login3DBackground } from '@/components/login-3d-background';

export default function LoginPage() {
  return (
    <div className="relative w-full min-h-screen overflow-hidden">
      {/* 3D Background */}
      <Login3DBackground />

      {/* Gradient Overlays */}
      <div className="absolute inset-0 bg-gradient-to-br from-amber-50/90 via-white/80 to-orange-50/90 dark:from-gray-900/90 dark:via-gray-800/80 dark:to-amber-900/20" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(251,191,36,0.15),transparent_50%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_80%,rgba(249,115,22,0.15),transparent_50%)]" />

      <div className="relative w-full lg:grid lg:min-h-screen lg:grid-cols-2">
        {/* Left Side - Login Options */}
        <div className="flex items-center justify-center p-6 sm:p-12 lg:p-16 relative z-10">
          <div className="mx-auto w-full max-w-[480px] space-y-10">
            {/* Removed redundant logo as it's present in navbar */}

            {/* Header */}
            <div className="space-y-3 text-center lg:text-left">
              <h1 className="text-4xl lg:text-5xl font-heading font-bold bg-gradient-to-r from-amber-700 via-orange-600 to-amber-600 bg-clip-text text-transparent">
                Welcome to Viraasat
              </h1>
              <p className="text-lg text-gray-600 dark:text-gray-300">
                Choose your path to begin your journey
              </p>
            </div>

            {/* Customer Login Card */}
            <div className="group relative">
              <div className="absolute -inset-0.5 rounded-2xl bg-gradient-to-r from-teal-400 via-emerald-500 to-teal-500 opacity-40 blur transition duration-500 group-hover:opacity-70 group-hover:duration-200 animate-tilt" />
              <div className="relative flex flex-col gap-5 rounded-2xl border border-teal-200/50 bg-white/70 dark:bg-gray-800/70 backdrop-blur-xl p-8 shadow-xl transition-all duration-300 group-hover:shadow-2xl group-hover:scale-[1.02]">
                <div className="flex items-start gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-teal-400 to-emerald-500 shadow-lg">
                    <ShoppingBag className="h-6 w-6 text-white" />
                  </div>
                  <div className="flex-1 space-y-2">
                    <h2 className="text-2xl font-heading font-bold text-gray-900 dark:text-white">
                      For Our Customers
                    </h2>
                    <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
                      Sign in to continue your shopping journey, view your orders, and manage your account.
                    </p>
                  </div>
                </div>
                <Button
                  asChild
                  size="lg"
                  className="w-full bg-gradient-to-r from-teal-500 to-emerald-600 hover:from-teal-600 hover:to-emerald-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 group/btn"
                >
                  <Link href="/login/customer" className="flex items-center justify-center gap-2">
                    Customer Login / Sign Up
                    <ArrowRight className="h-5 w-5 transition-transform group-hover/btn:translate-x-1" />
                  </Link>
                </Button>
              </div>
            </div>

            {/* Artisan Login Card */}
            <div className="group relative">
              <div className="absolute -inset-0.5 rounded-2xl bg-gradient-to-r from-amber-400 via-orange-500 to-amber-500 opacity-40 blur transition duration-500 group-hover:opacity-70 group-hover:duration-200 animate-tilt" />
              <div className="relative flex flex-col gap-5 rounded-2xl border border-amber-200/50 bg-white/70 dark:bg-gray-800/70 backdrop-blur-xl p-8 shadow-xl transition-all duration-300 group-hover:shadow-2xl group-hover:scale-[1.02]">
                <div className="flex items-start gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 shadow-lg">
                    <Store className="h-6 w-6 text-white" />
                  </div>
                  <div className="flex-1 space-y-2">
                    <h2 className="text-2xl font-heading font-bold text-gray-900 dark:text-white">
                      For Our Artisans
                    </h2>
                    <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
                      Log in to manage your products, view your sales, and connect with a global audience.
                    </p>
                  </div>
                </div>
                <Button
                  asChild
                  size="lg"
                  className="w-full bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 group/btn"
                >
                  <Link href="/login/artisan" className="flex items-center justify-center gap-2">
                    Artisan Login / Sign Up
                    <ArrowRight className="h-5 w-5 transition-transform group-hover/btn:translate-x-1" />
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side - Hero Image */}
        <div className="hidden lg:block relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-l from-transparent to-white/20 dark:to-gray-900/20 z-10" />
          <Image
            src="https://images.unsplash.com/photo-1610701596007-11502861dcfa?q=80&w=1200"
            alt="Indian artisan crafts and heritage"
            fill
            className="object-cover brightness-90"
            priority
            data-ai-hint="Indian handicrafts and artisan work"
          />
          {/* Decorative Pattern Overlay */}
          <div className="absolute inset-0 opacity-10 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAxMCAwIEwgMCAwIDAgMTAiIGZpbGw9Im5vbmUiIHN0cm9rZT0iY3VycmVudENvbG9yIiBzdHJva2Utd2lkdGg9IjEiLz48L3BhdHRlcm4+PC9kZWZzPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9InVybCgjZ3JpZCkiLz48L3N2Zz4=')] z-20" />
        </div>
      </div>
    </div>
  );
}
