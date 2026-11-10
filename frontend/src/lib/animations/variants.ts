import type { Variants } from 'motion/react';
import { heritageEase } from './transitions';

export const fadeInVariants: Variants = {
  hidden: {
    opacity: 0,
  },
  visible: (custom?: { delay?: number; duration?: number }) => ({
    opacity: 1,
    transition: {
      duration: custom?.duration ?? 0.45,
      delay: custom?.delay ?? 0,
      ease: heritageEase,
    },
  }),
};

export const slideUpVariants: Variants = {
  hidden: (custom?: { distance?: number }) => ({
    opacity: 0,
    y: custom?.distance ?? 18,
  }),
  visible: (custom?: { delay?: number; duration?: number }) => ({
    opacity: 1,
    y: 0,
    transition: {
      duration: custom?.duration ?? 0.5,
      delay: custom?.delay ?? 0,
      ease: heritageEase,
    },
  }),
};

export const slideDownVariants: Variants = {
  hidden: {
    opacity: 0,
    y: -14,
  },
  visible: (custom?: { delay?: number; duration?: number }) => ({
    opacity: 1,
    y: 0,
    transition: {
      duration: custom?.duration ?? 0.35,
      delay: custom?.delay ?? 0,
      ease: heritageEase,
    },
  }),
};

export const scaleUpVariants: Variants = {
  hidden: {
    opacity: 0,
    scale: 0.95,
  },
  visible: (custom?: { delay?: number }) => ({
    opacity: 1,
    scale: 1,
    transition: {
      duration: 0.35,
      delay: custom?.delay ?? 0,
      ease: heritageEase,
    },
  }),
};

export const staggerContainerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: (custom?: { staggerDelay?: number; delayChildren?: number }) => ({
    opacity: 1,
    transition: {
      staggerChildren: custom?.staggerDelay ?? 0.08,
      delayChildren: custom?.delayChildren ?? 0.05,
    },
  }),
};

export const staggerItemVariants: Variants = {
  hidden: {
    opacity: 0,
    y: 16,
  },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.45,
      ease: heritageEase,
    },
  },
};

export const cardHoverVariants: Variants = {
  initial: {
    y: 0,
    boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
  },
  hover: {
    y: -4,
    boxShadow: '0 12px 24px -6px rgba(112, 29, 36, 0.12), 0 4px 8px -2px rgba(197, 155, 75, 0.08)',
    transition: {
      duration: 0.28,
      ease: heritageEase,
    },
  },
  tap: {
    scale: 0.985,
    transition: {
      duration: 0.15,
      ease: heritageEase,
    },
  },
};

export const buttonTapVariants: Variants = {
  tap: {
    scale: 0.97,
    transition: { duration: 0.12, ease: heritageEase },
  },
};

export const modalVariants: Variants = {
  hidden: {
    opacity: 0,
    scale: 0.96,
    y: 12,
  },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: {
      duration: 0.28,
      ease: heritageEase,
    },
  },
  exit: {
    opacity: 0,
    scale: 0.97,
    y: 10,
    transition: {
      duration: 0.2,
      ease: heritageEase,
    },
  },
};

