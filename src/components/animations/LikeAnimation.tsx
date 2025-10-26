'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { Heart } from 'lucide-react';
import { useEffect, useState } from 'react';

interface LikeAnimationProps {
  show: boolean;
  onComplete?: () => void;
}

/**
 * LikeAnimation - Displays a heart burst animation when user double-taps to like
 * Similar to Instagram/TikTok double-tap feedback
 */
export function LikeAnimation({ show, onComplete }: LikeAnimationProps) {
  const [particles, setParticles] = useState<Array<{ id: number; angle: number }>>([]);

  useEffect(() => {
    if (show) {
      // Generate particle positions in a circle
      const newParticles = Array.from({ length: 12 }, (_, i) => ({
        id: i,
        angle: (i * 360) / 12,
      }));
      setParticles(newParticles);
    }
  }, [show]);

  return (
    <AnimatePresence mode="wait">
      {show && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-50">
          {/* Main heart */}
          <motion.div
            initial={{ scale: 0, rotate: -30, opacity: 0 }}
            animate={{
              scale: [0, 1.3, 1],
              rotate: [0, 15, 0],
              opacity: [0, 1, 0],
            }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{
              duration: 0.8,
              ease: [0.4, 0.0, 0.2, 1],
            }}
            onAnimationComplete={onComplete}
            className="relative"
          >
            <Heart
              className="w-24 h-24 fill-vibrant-like text-vibrant-like drop-shadow-[0_0_20px_rgba(244,114,182,0.6)]"
              strokeWidth={0}
            />
          </motion.div>

          {/* Particle burst */}
          {particles.map(({ id, angle }) => (
            <motion.div
              key={id}
              initial={{ scale: 0, x: 0, y: 0, opacity: 1 }}
              animate={{
                scale: [0, 1, 0.8],
                x: Math.cos((angle * Math.PI) / 180) * 80,
                y: Math.sin((angle * Math.PI) / 180) * 80,
                opacity: [1, 1, 0],
              }}
              transition={{
                duration: 0.7,
                ease: 'easeOut',
                delay: 0.1,
              }}
              className="absolute"
            >
              <Heart
                className="w-4 h-4 fill-vibrant-like text-vibrant-like"
                strokeWidth={0}
              />
            </motion.div>
          ))}

          {/* Ripple effect */}
          <motion.div
            initial={{ scale: 0.8, opacity: 0.6 }}
            animate={{
              scale: 2,
              opacity: 0,
            }}
            transition={{
              duration: 0.6,
              ease: 'easeOut',
            }}
            className="absolute w-32 h-32 rounded-full border-4 border-vibrant-like"
          />
        </div>
      )}
    </AnimatePresence>
  );
}

interface FloatingHeartProps {
  x: number;
  y: number;
  onComplete?: () => void;
}

/**
 * FloatingHeart - Single heart that floats up and fades (for reactions)
 */
export function FloatingHeart({ x, y, onComplete }: FloatingHeartProps) {
  // Random slight horizontal drift
  const drift = (Math.random() - 0.5) * 30;

  return (
    <motion.div
      initial={{ scale: 0, x, y, opacity: 0, rotate: 0 }}
      animate={{
        scale: [0, 1.2, 1],
        y: y - 100,
        x: x + drift,
        opacity: [0, 1, 1, 0],
        rotate: drift > 0 ? 15 : -15,
      }}
      transition={{
        duration: 1.5,
        ease: [0.4, 0.0, 0.2, 1],
      }}
      onAnimationComplete={onComplete}
      className="fixed pointer-events-none z-50"
      style={{ left: 0, top: 0 }}
    >
      <Heart
        className="w-8 h-8 fill-vibrant-like text-vibrant-like drop-shadow-lg"
        strokeWidth={0}
      />
    </motion.div>
  );
}

interface PulseRingProps {
  show: boolean;
}

/**
 * PulseRing - Expanding ring for interaction feedback
 */
export function PulseRing({ show }: PulseRingProps) {
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ scale: 1, opacity: 0.5 }}
          animate={{ scale: 1.5, opacity: 0 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.4, ease: 'easeOut' }}
          className="absolute inset-0 rounded-full border-2 border-vibrant-like pointer-events-none"
        />
      )}
    </AnimatePresence>
  );
}

interface SwipeIndicatorProps {
  direction: 'left' | 'right';
  icon: React.ReactNode;
  color: string;
  show: boolean;
}

/**
 * SwipeIndicator - Visual feedback for swipe gestures
 */
export function SwipeIndicator({ direction, icon, color, show }: SwipeIndicatorProps) {
  const isLeft = direction === 'left';

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{
            opacity: 0,
            x: isLeft ? 20 : -20,
            scale: 0.8
          }}
          animate={{
            opacity: 1,
            x: 0,
            scale: 1
          }}
          exit={{
            opacity: 0,
            x: isLeft ? -20 : 20,
            scale: 0.8
          }}
          transition={{ duration: 0.2 }}
          className={`absolute ${isLeft ? 'left-4' : 'right-4'} top-1/2 -translate-y-1/2 pointer-events-none z-40`}
        >
          <div
            className={`w-16 h-16 rounded-full flex items-center justify-center ${color} shadow-lg`}
          >
            {icon}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
