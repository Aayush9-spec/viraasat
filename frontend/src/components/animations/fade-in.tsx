'use client';

import * as React from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { fadeInVariants } from '@/lib/animations/variants';
import { cn } from '@/core/utils/utils';

interface FadeInProps extends React.HTMLAttributes<HTMLDivElement> {
  delay?: number;
  duration?: number;
  once?: boolean;
  className?: string;
  children: React.ReactNode;
}

export function FadeIn({
  delay = 0,
  duration = 0.45,
  once = true,
  className,
  children,
  ...props
}: FadeInProps) {
  const shouldReduceMotion = useReducedMotion();

  if (shouldReduceMotion) {
    return (
      <div className={className} {...props}>
        {children}
      </div>
    );
  }

  return (
    <motion.div
      variants={fadeInVariants}
      initial="hidden"
      whileInView="visible"
      viewport={{ once, margin: '-40px' }}
      custom={{ delay, duration }}
      className={cn(className)}
      {...(props as any)}
    >
      {children}
    </motion.div>
  );
}
