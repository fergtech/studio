'use client';

import React from 'react';
import { Loader2, ArrowDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface PullToRefreshIndicatorProps {
  isPulling: boolean;
  isRefreshing: boolean;
  pullDistance: number;
  progress: number;
}

export function PullToRefreshIndicator({
  isPulling,
  isRefreshing,
  pullDistance,
  progress,
}: PullToRefreshIndicatorProps) {
  return (
    <AnimatePresence>
      {(isPulling || isRefreshing) && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed top-0 left-0 right-0 z-50 pointer-events-none"
          style={{
            transform: `translateY(${Math.min(pullDistance, 80)}px)`,
            transition: isRefreshing ? 'transform 0.3s ease' : 'none',
          }}
        >
          <div className="flex justify-center items-center py-4">
            <div className="bg-background/95 backdrop-blur-sm rounded-full p-3 shadow-lg border border-border">
              {isRefreshing ? (
                <Loader2 className="w-6 h-6 text-primary animate-spin" />
              ) : (
                <motion.div
                  animate={{ rotate: progress >= 1 ? 180 : 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <ArrowDown
                    className="w-6 h-6 text-primary"
                    style={{ opacity: Math.min(progress, 1) }}
                  />
                </motion.div>
              )}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
