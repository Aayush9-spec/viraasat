'use client';

import * as React from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { staggerContainerVariants, staggerItemVariants } from '@/lib/animations/variants';
import { cn } from '@/core/utils/utils';

interface StaggerContainerProps extends React.HTMLAttributes<HTMLDivElement> {
  staggerDelay?: number;
  delayChildren?: number;
  once?: boolean;
  className?: string;
  children: React.ReactNode;
}

export function StaggerContainer({
  staggerDelay = 0.07,
  delayChildren = 0.04,
  once = true,
  className,
  children,
  ...props
}: StaggerContainerProps) {
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
      variants={staggerContainerVariants}
      initial="hidden"
      whileInView="visible"
      viewport={{ once, margin: '-20px' }}
      custom={{ staggerDelay, delayChildren }}
      className={cn(className)}
      {...(props as any)}
    >
      {children}
    </motion.div>
  );
}

interface StaggerItemProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string;
  children: React.ReactNode;
}

export function StaggerItem({ className, children, ...props }: StaggerItemProps) {
  const shouldReduceMotion = useReducedMotion();

  if (shouldReduceMotion) {
    return (
      <div className={className} {...props}>
        {children}
      </div>
    );
  }

  return (
    <motion.div variants={staggerItemVariants} className={cn(className)} {...(props as any)}>
      {children}
    </motion.div>
  );
}
