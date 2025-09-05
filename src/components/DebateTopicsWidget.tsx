"use client";

import React, { useEffect, useState, useRef } from 'react';
import { DebateTopicCard } from './DebateTopicCard';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { MessageSquare, TrendingUp, ChevronLeft, ChevronRight } from 'lucide-react';
import { useLazyLoad } from '@/hooks/useLazyLoad';

interface DebateTopic {
  id: string;
  title: string;
  content: string;
  imageUrl?: string;
  creator: {
    id: string;
    name: string;
    image?: string;
    username?: string;
  };
  createdAt: string;
  stats: {
    proVotes: number;
    conVotes: number;
    totalVotes: number;
    proPercentage: number;
    conPercentage: number;
    argumentCount: number;
  };
}

export function DebateTopicsWidget() {
  const [debates, setDebates] = useState<DebateTopic[]>([]);
  const [showLeftFade, setShowLeftFade] = useState(false);
  const [showRightFade, setShowRightFade] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  
  // Lazy load debates
  const fetchDebates = async (): Promise<DebateTopic[]> => {
    const response = await fetch('/api/debates');
    if (!response.ok) {
      throw new Error('Failed to fetch debates');
    }
    return response.json();
  };

  const { ref, data: debatesData, loading, error } = useLazyLoad<DebateTopic[]>(fetchDebates);
  
  // Update debates when lazy loaded data is available
  useEffect(() => {
    if (debatesData) {
      setDebates(debatesData);
    }
  }, [debatesData]);

  const handleScroll = () => {
    if (!scrollContainerRef.current) return;
    
    const container = scrollContainerRef.current;
    const scrollLeft = container.scrollLeft;
    const scrollWidth = container.scrollWidth;
    const clientWidth = container.clientWidth;
    
    // Show left fade if scrolled past the beginning
    setShowLeftFade(scrollLeft > 0);
    
    // Show right fade if not scrolled to the end
    setShowRightFade(scrollLeft < scrollWidth - clientWidth - 10);
  };

  const updateFadeVisibility = () => {
    // Initial check for fade visibility
    setTimeout(handleScroll, 100);
  };

  const scrollLeft = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: -320, behavior: 'smooth' });
    }
  };

  const scrollRight = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: 320, behavior: 'smooth' });
    }
  };

  // Set up real-time updates and fade visibility after debates load
  useEffect(() => {
    if (debatesData) {
      // Update fade visibility after debates load
      updateFadeVisibility();
    }
    
    // Set up real-time updates listener
    const handleFeedItemCreated = (event: CustomEvent) => {
      const newItem = event.detail;
      // For now, just refresh the debates when any new item is created
      // Later we can make this more specific to debate topics
      if (debatesData) {
        // Re-trigger the lazy load
        window.location.reload();
      }
    };

    window.addEventListener('feed:itemCreated', handleFeedItemCreated as EventListener);

    return () => {
      window.removeEventListener('feed:itemCreated', handleFeedItemCreated as EventListener);
    };
  }, []);

  // Handle scroll and resize events for fade visibility
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    container.addEventListener('scroll', handleScroll);
    window.addEventListener('resize', updateFadeVisibility);

    // Initial fade check
    updateFadeVisibility();

    return () => {
      container.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', updateFadeVisibility);
    };
  }, [debates]);

  if (loading) {
    return (
      <div className="space-y-4 w-full min-w-0">
        <div className="flex items-center gap-2">
          <MessageSquare className="w-5 h-5 text-primary" />
          <h2 className="text-lg font-semibold">Trending Debates</h2>
        </div>
        <div className="relative">
          <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide min-w-0">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="flex-shrink-0 w-80 xl:w-96 h-48 rounded-lg" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-4 w-full min-w-0">
        <div className="flex items-center gap-2">
          <MessageSquare className="w-5 h-5 text-primary" />
          <h2 className="text-lg font-semibold">Trending Debates</h2>
        </div>
        <div className="text-center py-8 text-muted-foreground">
          <p>{error}</p>
        </div>
      </div>
    );
  }

  // Render the component with lazy loading ref
  // Only show "no debates" message if loading is complete and no data

  return (
    <div ref={ref} className="space-y-4 w-full min-w-0">
      <div className="flex items-center gap-2">
        <MessageSquare className="w-5 h-5 text-primary" />
        <h2 className="text-lg font-semibold">Trending Debates</h2>
        <TrendingUp className="w-4 h-4 text-orange-500" />
        {!loading && !error && debates.length > 0 && (
          <div className="flex gap-1 ml-auto">
            <Button
              variant="ghost"
              size="sm"
              onClick={scrollLeft}
              disabled={!showLeftFade}
              className="h-8 w-8 p-0 hidden sm:flex"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={scrollRight}
              disabled={!showRightFade}
              className="h-8 w-8 p-0 hidden sm:flex"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>
      
      <div className="relative">
        {/* Left fade mask - only show when there are debates */}
        {!loading && !error && debates.length > 0 && (
          <div 
            className={`absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-background to-transparent z-10 pointer-events-none transition-opacity duration-300 ${
              showLeftFade ? 'opacity-100' : 'opacity-0'
            }`}
          />
        )}
        
        {/* Loading state */}
        {loading && (
          <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide min-w-0">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="flex-shrink-0 w-80 xl:w-96 h-48 rounded-lg" />
            ))}
          </div>
        )}
        
        {/* Error state */}
        {error && (
          <div className="text-center py-8 text-muted-foreground">
            <p>Error loading debates: {error}</p>
          </div>
        )}
        
        {/* Empty state */}
        {!loading && !error && debates.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            <div className="flex flex-col items-center gap-3">
              <MessageSquare className="w-12 h-12 text-muted-foreground/50" />
              <p>No debates yet. Be the first to start one!</p>
            </div>
          </div>
        )}
        
        {/* Scrollable content */}
        {!loading && !error && debates.length > 0 && (
          <div 
            ref={scrollContainerRef}
            className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide min-w-0"
            style={{ scrollBehavior: 'smooth' }}
          >
            {debates.map((debate) => (
              <DebateTopicCard
                key={debate.id}
                id={debate.id}
                title={debate.title}
                content={debate.content}
                imageUrl={debate.imageUrl}
                creator={debate.creator}
                createdAt={debate.createdAt}
                stats={debate.stats}
                className="flex-shrink-0 w-80 xl:w-96"
              />
            ))}
          </div>
        )}
        
        {/* Right fade mask - only show when there are debates */}
        {!loading && !error && debates.length > 0 && (
          <div 
            className={`absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-background to-transparent z-10 pointer-events-none transition-opacity duration-300 ${
              showRightFade ? 'opacity-100' : 'opacity-0'
            }`}
          />
        )}
      </div>
    </div>
  );
}