'use client';

import * as React from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { slideUpVariants } from '@/lib/animations/variants';
import { cn } from '@/core/utils/utils';

interface SlideUpProps extends React.HTMLAttributes<HTMLDivElement> {
  delay?: number;
  duration?: number;
  distance?: number;
  once?: boolean;
  className?: string;
  children: React.ReactNode;
}

export function SlideUp({
  delay = 0,
  duration = 0.5,
  distance = 18,
  once = true,
  className,
  children,
  ...props
}: SlideUpProps) {
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
      variants={slideUpVariants}
      initial="hidden"
      whileInView="visible"
      viewport={{ once, margin: '-30px' }}
      custom={{ delay, duration, distance }}
      className={cn(className)}
      {...(props as any)}
    >
      {children}
    </motion.div>
  );
}

