'use client';

import * as React from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { heritageEase } from '@/lib/animations/transitions';
import { usePathname } from 'next/navigation';

interface PageTransitionProps {
  children: React.ReactNode;
  className?: string;
}

export function PageTransition({ children, className }: PageTransitionProps) {
  const pathname = usePathname();
  const shouldReduceMotion = useReducedMotion();

  if (shouldReduceMotion) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      key={pathname}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.28,
        ease: heritageEase,
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

