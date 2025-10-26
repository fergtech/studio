'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence, PanInfo } from 'framer-motion';
import { SimpleInitiativeCard } from './SimpleInitiativeCard';
import { Button } from '@/components/ui/button';
import { RefreshCw, Plus } from 'lucide-react';
// Use local Initiative interface from the initiatives page  
interface Initiative {
  id: string;
  title: string;
  description: string;
  imageUrl?: string;
  createdAt: string;
  updatedAt: string;
  category?: string;
  creator: {
    id: string;
    name: string;
    image?: string;
  };
  _count: {
    members: number;
  };
}
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';

interface TikTokStyleFeedProps {
  initiatives: Initiative[];
  onRefresh: () => void;
}

export function TikTokStyleFeed({ initiatives, onRefresh }: TikTokStyleFeedProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [direction, setDirection] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const router = useRouter();
  const containerRef = useRef<HTMLDivElement>(null);

  // Preload next/previous initiatives for smooth experience
  const visibleInitiatives = [
    initiatives[currentIndex - 1],
    initiatives[currentIndex],
    initiatives[currentIndex + 1]
  ].filter(Boolean);

  const handleSwipe = (dir: number) => {
    if (dir > 0 && currentIndex < initiatives.length - 1) {
      setDirection(1);
      setCurrentIndex(currentIndex + 1);
    } else if (dir < 0 && currentIndex > 0) {
      setDirection(-1);
      setCurrentIndex(currentIndex - 1);
    }
  };

  const handleDragEnd = (event: any, info: PanInfo) => {
    const swipeThreshold = 50;
    const swipeVelocityThreshold = 500;

    if (
      info.offset.y < -swipeThreshold || 
      info.velocity.y < -swipeVelocityThreshold
    ) {
      handleSwipe(1); // Swipe up - next initiative
    } else if (
      info.offset.y > swipeThreshold || 
      info.velocity.y > swipeVelocityThreshold
    ) {
      handleSwipe(-1); // Swipe down - previous initiative
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await onRefresh();
    setCurrentIndex(0);
    setIsRefreshing(false);
  };

  const handleInitiativeClick = (initiative: Initiative) => {
    router.push(`/initiatives/${initiative.id}`);
  };

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        handleSwipe(-1);
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        handleSwipe(1);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentIndex, initiatives.length]);

  if (initiatives.length === 0) {
    return (
      <div className="h-screen flex flex-col items-center justify-center bg-background p-6 text-center">
        <div className="max-w-md mx-auto space-y-4">
          <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto">
            <Plus className="w-8 h-8 text-muted-foreground" />
          </div>
          <h2 className="text-2xl font-bold">No Initiatives Yet</h2>
          <p className="text-muted-foreground">
            Be the first to create an initiative and start making change in your community!
          </p>
          <Button 
            onClick={() => router.push('/initiatives/create')}
            className="w-full"
          >
            Create First Initiative
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div 
      ref={containerRef}
      className="h-screen w-full overflow-hidden bg-black relative"
    >
      {/* Progress indicator */}
      <div className="absolute top-4 left-4 right-4 z-20">
        <div className="flex gap-1">
          {initiatives.map((_, index) => (
            <div
              key={index}
              className={cn(
                "flex-1 h-0.5 rounded-full transition-colors duration-300",
                index <= currentIndex ? "bg-white" : "bg-white/30"
              )}
            />
          ))}
        </div>
      </div>

      {/* Refresh button */}
      <Button
        variant="ghost"
        size="icon"
        onClick={handleRefresh}
        disabled={isRefreshing}
        className="absolute top-16 right-4 z-20 bg-black/20 hover:bg-black/40 text-white border-0"
      >
        <RefreshCw className={cn("w-4 h-4", isRefreshing && "animate-spin")} />
      </Button>

      {/* Initiative counter */}
      <div className="absolute top-16 left-4 z-20 bg-black/20 rounded-full px-3 py-1">
        <span className="text-white text-sm font-medium">
          {currentIndex + 1} / {initiatives.length}
        </span>
      </div>

      {/* Initiative feed */}
      <AnimatePresence mode="wait" custom={direction}>
        <motion.div
          key={currentIndex}
          custom={direction}
          initial={{ y: direction > 0 ? "100%" : "-100%", opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: direction > 0 ? "-100%" : "100%", opacity: 0 }}
          transition={{
            y: { type: "spring", stiffness: 300, damping: 30 },
            opacity: { duration: 0.2 }
          }}
          drag="y"
          dragConstraints={{ top: 0, bottom: 0 }}
          dragElastic={0.2}
          onDragEnd={handleDragEnd}
          className="absolute inset-0 cursor-grab active:cursor-grabbing"
        >
          <div 
            className="h-full w-full"
            onClick={() => handleInitiativeClick(initiatives[currentIndex])}
          >
            <SimpleInitiativeCard
              initiative={initiatives[currentIndex]}
              className="h-full w-full rounded-none"
            />
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Swipe instructions (show for first few seconds) */}
      <motion.div
        initial={{ opacity: 1 }}
        animate={{ opacity: 0 }}
        transition={{ delay: 3, duration: 1 }}
        className="absolute bottom-20 left-1/2 transform -translate-x-1/2 z-20 pointer-events-none"
      >
        <div className="bg-black/40 rounded-full px-4 py-2">
          <p className="text-white text-sm">Swipe up/down to browse initiatives</p>
        </div>
      </motion.div>

      {/* Navigation dots (for desktop) */}
      <div className="absolute right-6 top-1/2 transform -translate-y-1/2 z-20 hidden md:flex flex-col gap-2">
        {initiatives.map((_, index) => (
          <button
            key={index}
            onClick={() => {
              setDirection(index > currentIndex ? 1 : -1);
              setCurrentIndex(index);
            }}
            className={cn(
              "w-2 h-2 rounded-full transition-colors duration-200",
              index === currentIndex ? "bg-white" : "bg-white/40"
            )}
          />
        ))}
      </div>
    </div>
  );
}