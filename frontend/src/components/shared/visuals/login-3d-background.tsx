'use client';

import { memo } from 'react';

/**
 * Static Heritage Background for Viraasat Authentication Pages.
 * Replaces the heavy WebGL 3D canvas with an elegant, authentic
 * Indian craft aesthetic featuring subtle jali lattice motifs,
 * warm ambient glow, and static artisan heritage badges.
 */
export const Login3DBackground = memo(function Login3DBackground() {
  return (
    <div className="absolute inset-0 -z-10 overflow-hidden pointer-events-none select-none bg-background">
      {/* Soft Ambient Warm Gradients */}
      <div 
        className="absolute -top-32 -left-32 w-96 h-96 sm:w-[500px] sm:h-[500px] rounded-full bg-gradient-to-br from-amber-500/15 via-orange-400/10 to-transparent blur-3xl"
        aria-hidden="true" 
      />
      <div 
        className="absolute -bottom-32 -right-32 w-96 h-96 sm:w-[500px] sm:h-[500px] rounded-full bg-gradient-to-tl from-amber-600/15 via-amber-400/10 to-transparent blur-3xl" 
        aria-hidden="true" 
      />
      <div 
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] rounded-full bg-amber-400/[0.04] blur-2xl" 
        aria-hidden="true" 
      />

      {/* Subtle Heritage Jali / Lattice SVG Pattern Overlay */}
      <svg
        className="absolute inset-0 w-full h-full opacity-[0.035] dark:opacity-[0.06] text-amber-950 dark:text-amber-200"
        xmlns="http://www.w3.org/2000/svg"
        width="100%"
        height="100%"
        aria-hidden="true"
      >
        <defs>
          <pattern id="heritage-lattice" width="60" height="60" patternUnits="userSpaceOnUse">
            {/* Traditional Indian Geometric Jali Motif */}
            <circle cx="30" cy="30" r="16" fill="none" stroke="currentColor" strokeWidth="1.2" />
            <circle cx="30" cy="30" r="8" fill="none" stroke="currentColor" strokeWidth="0.8" />
            <path d="M0,30 L60,30 M30,0 L30,60" stroke="currentColor" strokeWidth="0.8" />
            <path d="M0,0 L60,60 M60,0 L0,60" stroke="currentColor" strokeWidth="0.6" strokeDasharray="2,2" />
            <rect x="22" y="22" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="0.8" transform="rotate(45 30 30)" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#heritage-lattice)" />
      </svg>

      {/* Decorative Heritage Corner Ornaments (Subtle Mandala Accents) */}
      <div className="absolute top-8 left-8 hidden lg:block opacity-20 dark:opacity-30">
        <HeritageMandala />
      </div>
      <div className="absolute bottom-8 right-8 hidden lg:block opacity-20 dark:opacity-30 rotate-180">
        <HeritageMandala />
      </div>

      {/* Static Peripheral Heritage Badges (Desktop Viewport) */}
      <div className="hidden xl:flex flex-col gap-3 absolute top-28 left-12 max-w-[240px]">
        <div className="flex items-center gap-2.5 px-3.5 py-2 rounded-xl bg-card/75 dark:bg-card/60 backdrop-blur-md border border-border/80 shadow-xs text-xs font-medium text-foreground">
          <span className="text-base">🪔</span>
          <span>100% Direct Artisan Support</span>
        </div>
        <div className="flex items-center gap-2.5 px-3.5 py-2 rounded-xl bg-card/75 dark:bg-card/60 backdrop-blur-md border border-border/80 shadow-xs text-xs font-medium text-foreground">
          <span className="text-base">🏛️</span>
          <span>GI-Certified Heritage Crafts</span>
        </div>
      </div>

      <div className="hidden xl:flex flex-col gap-3 absolute bottom-24 right-12 max-w-[250px] text-right">
        <div className="flex items-center justify-end gap-2.5 px-3.5 py-2 rounded-xl bg-card/75 dark:bg-card/60 backdrop-blur-md border border-border/80 shadow-xs text-xs font-medium text-foreground">
          <span>Cryptographic Provenance</span>
          <span className="text-base">🔒</span>
        </div>
        <div className="flex items-center justify-end gap-2.5 px-3.5 py-2 rounded-xl bg-card/75 dark:bg-card/60 backdrop-blur-md border border-border/80 shadow-xs text-xs font-medium text-foreground">
          <span>12,400+ Master Craftsmen</span>
          <span className="text-base">🇮🇳</span>
        </div>
      </div>
    </div>
  );
});

function HeritageMandala() {
  return (
    <svg width="120" height="120" viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-primary">
      <circle cx="60" cy="60" r="50" stroke="currentColor" strokeWidth="1" strokeDasharray="3 3" />
      <circle cx="60" cy="60" r="38" stroke="currentColor" strokeWidth="1" />
      <circle cx="60" cy="60" r="24" stroke="currentColor" strokeWidth="1.2" />
      <circle cx="60" cy="60" r="10" fill="currentColor" fillOpacity="0.1" stroke="currentColor" strokeWidth="1.5" />
      {/* 8-petal radial florets */}
      {[0, 45, 90, 135, 180, 225, 270, 315].map((angle) => (
        <path
          key={angle}
          d="M60 22 C64 34, 56 34, 60 22"
          stroke="currentColor"
          strokeWidth="1.2"
          fill="none"
          transform={`rotate(${angle} 60 60)`}
        />
      ))}
    </svg>
  );
}
