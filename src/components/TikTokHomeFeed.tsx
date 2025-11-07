'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence, PanInfo } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { RefreshCw, Plus } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { MobileFeedCard } from '@/components/MobileFeedCard';
import { MobileDebateCard } from '@/components/MobileDebateCard';
import { CompactSocietyPostCard } from '@/components/CompactSocietyPostCard';
import { CompactInitiativeCard } from '@/components/CompactInitiativeCard';
import { HotTakeBattleCard } from '@/components/HotTakeBattleCard';

// Import types from HomeClient
type FeedItemType = 'initiative' | 'generalPost' | 'societyPost' | 'issue' | 'idea' | 'debate' | 'hotTakeBattle' | 'update' | 'follow' | 'initiativeJoin' | 'societyCreate' | 'live-news';

interface UnifiedFeedItem {
  type: FeedItemType;
  id: string;
  timestamp: Date;
  data: any; // We'll handle type checking in the component
}

interface TikTokHomeFeedProps {
  feedItems: UnifiedFeedItem[];
  currentUserId?: string;
  onRefresh: () => void;
  onLoadMore: () => void;
  hasMore: boolean;
  isLoading: boolean;
}

export function TikTokHomeFeed({ 
  feedItems, 
  currentUserId, 
  onRefresh, 
  onLoadMore, 
  hasMore, 
  isLoading 
}: TikTokHomeFeedProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [direction, setDirection] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const router = useRouter();
  const containerRef = useRef<HTMLDivElement>(null);

  // Auto-load more when approaching end of feed
  useEffect(() => {
    const needsMoreContent = currentIndex >= feedItems.length - 3;
    if (needsMoreContent && hasMore && !isLoading) {
      onLoadMore();
    }
  }, [currentIndex, feedItems.length, hasMore, isLoading, onLoadMore]);

  const handleSwipe = (dir: number) => {
    if (dir > 0 && currentIndex < feedItems.length - 1) {
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
      handleSwipe(1); // Swipe up - next post
    } else if (
      info.offset.y > swipeThreshold || 
      info.velocity.y > swipeVelocityThreshold
    ) {
      handleSwipe(-1); // Swipe down - previous post
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await onRefresh();
    setCurrentIndex(0);
    setIsRefreshing(false);
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
  }, [currentIndex, feedItems.length]);

  if (feedItems.length === 0) {
    return (
      <div className="h-screen flex flex-col items-center justify-center bg-background p-6 text-center">
        <div className="max-w-md mx-auto space-y-4">
          <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto">
            <Plus className="w-8 h-8 text-muted-foreground" />
          </div>
          <h2 className="text-2xl font-bold">No Posts Yet</h2>
          <p className="text-muted-foreground">
            Start following people and joining projects to see content here!
          </p>
          <Button 
            onClick={() => router.push('/explore')}
            className="w-full"
          >
            Explore Communities
          </Button>
        </div>
      </div>
    );
  }

  const currentItem = feedItems[currentIndex];

  // Render the appropriate card component based on feed item type
  const renderFeedItem = (item: UnifiedFeedItem) => {
    switch (item.type) {
      case 'generalPost':
        return (
          <MobileFeedCard
            post={item.data}
            currentUserId={currentUserId}
          />
        );
      
      case 'debate':
        // Handle debate posts
        const debateItem = item.data;
        const proVotes = debateItem.votes?.filter((v: any) => v.side === 'PRO').length || 0;
        const conVotes = debateItem.votes?.filter((v: any) => v.side === 'CON').length || 0;
        const totalVotes = proVotes + conVotes;
        const stats = {
          proVotes,
          conVotes,
          totalVotes,
          proPercentage: totalVotes > 0 ? Math.round((proVotes / totalVotes) * 100) : 0,
          conPercentage: totalVotes > 0 ? Math.round((conVotes / totalVotes) * 100) : 0,
          argumentCount: debateItem.arguments?.length || 0,
        };

        return (
          <MobileDebateCard
            id={debateItem.id}
            title={debateItem.title}
            content={debateItem.content}
            imageUrl={debateItem.imageUrl}
            creator={debateItem.creator || { id: 'unknown', name: 'Anonymous' }}
            createdAt={debateItem.createdAt}
            stats={stats}
            currentUserId={currentUserId}
          />
        );

      case 'societyPost':
        return (
          <div className="h-screen flex items-center justify-center p-4">
            <CompactSocietyPostCard 
              post={item.data} 
              showTimeline={false}
            />
          </div>
        );

      case 'initiative':
        return (
          <div 
            className="h-screen flex items-center justify-center p-4 cursor-pointer"
            onClick={() => router.push(`/initiatives/${item.data.id}`)}
          >
            <CompactInitiativeCard 
              initiative={item.data}
            />
          </div>
        );

      case 'hotTakeBattle':
        return (
          <div className="h-screen flex items-center justify-center p-4">
            <HotTakeBattleCard
              battle={item.data}
              onJoinBattle={async (battleId: string, stance: any) => {
                // Handle battle join logic
                console.log('Join battle:', battleId, stance);
              }}
              onCreateTake={(battleId: string) => {
                // Handle create take logic
                console.log('Create take for battle:', battleId);
              }}
              variant="feed"
            />
          </div>
        );

      default:
        // Fallback for other content types
        return (
          <div className="h-screen flex items-center justify-center p-6 text-center">
            <div className="max-w-md mx-auto space-y-4">
              <h3 className="text-lg font-semibold">Unsupported Content</h3>
              <p className="text-muted-foreground">
                This type of content ({item.type}) is not yet supported in TikTok mode.
              </p>
            </div>
          </div>
        );
    }
  };

  return (
    <div 
      ref={containerRef}
      className="h-screen w-full overflow-hidden bg-black relative"
    >
      {/* Progress indicator */}
      <div className="absolute top-4 left-4 right-4 z-20">
        <div className="flex gap-1">
          {feedItems.slice(0, 20).map((_, index) => (
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

      {/* Post counter */}
      <div className="absolute top-16 left-4 z-20 bg-black/20 rounded-full px-3 py-1">
        <span className="text-white text-sm font-medium">
          {currentIndex + 1} / {feedItems.length}
        </span>
      </div>

      {/* Feed content */}
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
          {currentItem && renderFeedItem(currentItem)}
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
          <p className="text-white text-sm">Swipe up/down to browse posts</p>
        </div>
      </motion.div>

      {/* Navigation dots (for desktop) */}
      <div className="absolute right-6 top-1/2 transform -translate-y-1/2 z-20 hidden md:flex flex-col gap-2 max-h-96 overflow-y-auto">
        {feedItems.slice(0, 20).map((_, index) => (
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

      {/* Loading indicator for more content */}
      {isLoading && (
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 z-20">
          <div className="bg-black/40 rounded-full px-4 py-2">
            <p className="text-white text-sm">Loading more posts...</p>
          </div>
        </div>
      )}
    </div>
  );
}