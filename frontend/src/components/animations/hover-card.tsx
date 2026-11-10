'use client';

import * as React from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { cardHoverVariants } from '@/lib/animations/variants';
import { cn } from '@/core/utils/utils';

interface HoverCardProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string;
  elevate?: boolean;
  children: React.ReactNode;
}

export function HoverCard({
  className,
  elevate = true,
  children,
  ...props
}: HoverCardProps) {
  const shouldReduceMotion = useReducedMotion();

  if (shouldReduceMotion || !elevate) {
    return (
      <div className={className} {...props}>
        {children}
      </div>
    );
  }

  return (
    <motion.div
      variants={cardHoverVariants}
      initial="initial"
      whileHover="hover"
      whileTap="tap"
      className={cn(className)}
      {...(props as any)}
    >
      {children}
    </motion.div>
  );
}

