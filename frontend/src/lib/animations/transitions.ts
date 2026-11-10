/**
 * Viraasat Design System – Animation Transitions & Easing Curves
 * Authentic Indian Heritage aesthetic: smooth, purposeful, and elegant.
 */

export const heritageEase = [0.22, 1, 0.36, 1] as const;

export const transitions = {
  // Micro-interactions (toggles, icons, badges): 150-250ms
  micro: {
    duration: 0.2,
    ease: heritageEase,
  },
  // Button presses and card hovers: 200-350ms
  card: {
    duration: 0.28,
    ease: heritageEase,
  },
  // Section entrances: 400-650ms
  section: {
    duration: 0.55,
    ease: heritageEase,
  },
  // Page level transitions: 250-400ms
  page: {
    duration: 0.32,
    ease: heritageEase,
  },
  // Natural springs for physical interactions
  spring: {
    gentle: {
      type: 'spring',
      stiffness: 300,
      damping: 30,
    },
    snappy: {
      type: 'spring',
      stiffness: 450,
      damping: 32,
    },
    bouncy: {
      type: 'spring',
      stiffness: 400,
      damping: 24,
    },
  },
} as const;

