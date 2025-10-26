import { Variants } from 'framer-motion';

/**
 * Animation variants for Framer Motion
 * Optimized for mobile performance with GPU acceleration
 */

// Like burst animation - radiating hearts/sparkles
export const likeBurstVariants: Variants = {
  hidden: {
    scale: 0,
    opacity: 0,
    rotate: 0,
  },
  visible: {
    scale: [0, 1.2, 1],
    opacity: [0, 1, 0],
    rotate: [0, 180, 360],
    transition: {
      duration: 0.6,
      ease: [0.4, 0.0, 0.2, 1], // Material Design ease-out
    }
  },
};

// Card swipe reveal - slide in from edges
export const swipeRevealVariants: Variants = {
  leftHidden: { x: -100, opacity: 0 },
  rightHidden: { x: 100, opacity: 0 },
  visible: {
    x: 0,
    opacity: 1,
    transition: {
      type: "spring",
      stiffness: 300,
      damping: 30,
    }
  },
  exit: {
    x: 0,
    opacity: 0,
    transition: { duration: 0.2 }
  },
};

// Button press feedback
export const buttonPressVariants: Variants = {
  initial: { scale: 1 },
  pressed: {
    scale: 0.95,
    transition: { duration: 0.1 }
  },
  released: {
    scale: 1,
    transition: {
      type: "spring",
      stiffness: 500,
      damping: 15,
    }
  },
};

// Heart/like icon animation
export const heartBeatVariants: Variants = {
  initial: { scale: 1 },
  liked: {
    scale: [1, 1.3, 0.9, 1.1, 1],
    transition: {
      duration: 0.5,
      ease: "easeInOut",
    }
  },
};

// Card entrance stagger
export const cardEntranceVariants: Variants = {
  hidden: {
    opacity: 0,
    y: 20,
    scale: 0.95,
  },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      delay: i * 0.05, // Stagger by 50ms
      duration: 0.3,
      ease: [0.4, 0.0, 0.2, 1],
    },
  }),
};

// Pull-to-refresh spinner
export const pullRefreshVariants: Variants = {
  pulling: {
    rotate: 0,
    scale: 1,
  },
  released: {
    rotate: 360,
    scale: [1, 1.1, 1],
    transition: {
      rotate: {
        duration: 0.6,
        ease: "linear",
        repeat: Infinity,
      },
      scale: {
        duration: 0.3,
        ease: "easeInOut",
      },
    },
  },
  complete: {
    rotate: 0,
    scale: 1.2,
    transition: {
      duration: 0.2,
    },
  },
};

// Debate vote bar fill
export const voteBarVariants: Variants = {
  initial: { scaleX: 0, originX: 0 },
  animate: (percentage: number) => ({
    scaleX: percentage / 100,
    transition: {
      duration: 0.8,
      ease: [0.4, 0.0, 0.2, 1],
    },
  }),
};

// Floating action button (composer)
export const fabVariants: Variants = {
  hidden: {
    y: 100,
    opacity: 0,
    scale: 0.8,
  },
  visible: {
    y: 0,
    opacity: 1,
    scale: 1,
    transition: {
      type: "spring",
      stiffness: 260,
      damping: 20,
    }
  },
  hover: {
    scale: 1.05,
    transition: {
      duration: 0.2,
    },
  },
  tap: {
    scale: 0.95,
  },
};

// Shimmer loading effect
export const shimmerVariants: Variants = {
  initial: { x: '-100%' },
  animate: {
    x: '100%',
    transition: {
      repeat: Infinity,
      duration: 1.5,
      ease: 'linear',
    },
  },
};

/**
 * Haptic feedback patterns
 */
export const hapticPatterns = {
  light: 10,
  medium: 30,
  heavy: 50,
  success: [10, 50, 10],
  error: [50, 100, 50],
  doubleTap: [10, 20, 10],
  longPress: [10, 50, 10, 50, 10],
} as const;

/**
 * Trigger haptic feedback if available
 */
export function triggerHaptic(pattern: number | number[] = hapticPatterns.medium) {
  if ('vibrate' in navigator) {
    navigator.vibrate(pattern);
  }
}

/**
 * Animation timing constants
 */
export const animationDuration = {
  instant: 0.1,
  fast: 0.2,
  normal: 0.3,
  slow: 0.5,
  verySlow: 0.8,
} as const;

/**
 * Spring configurations for smooth, natural motion
 */
export const springConfig = {
  gentle: { stiffness: 120, damping: 14 },
  default: { stiffness: 260, damping: 20 },
  wobbly: { stiffness: 180, damping: 12 },
  stiff: { stiffness: 400, damping: 30 },
  slow: { stiffness: 80, damping: 10 },
} as const;

/**
 * Easing curves (Material Design)
 */
export const easings = {
  easeOut: [0.4, 0.0, 0.2, 1],
  easeIn: [0.4, 0.0, 1, 1],
  easeInOut: [0.4, 0.0, 0.2, 1],
  sharp: [0.4, 0.0, 0.6, 1],
} as const;

/**
 * GPU-accelerated properties for optimal mobile performance
 * Use these properties in animations when possible
 */
export const gpuAccelerated = {
  // Use transform instead of top/left
  // Use opacity instead of visibility
  // Use scale instead of width/height when possible
  props: ['transform', 'opacity', 'filter'] as const,

  // Force hardware acceleration
  willChange: 'transform, opacity',
} as const;
