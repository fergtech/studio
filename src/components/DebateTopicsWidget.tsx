"use client";

import React, { useEffect, useState, useRef } from 'react';
import { DebateTopicCard } from './DebateTopicCard';
import { Skeleton } from '@/components/ui/skeleton';
import { MessageSquare, TrendingUp } from 'lucide-react';

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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showLeftFade, setShowLeftFade] = useState(false);
  const [showRightFade, setShowRightFade] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

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

  const fetchDebates = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/debates?pageSize=8'); // Get more for horizontal scroll
      if (!response.ok) {
        throw new Error('Failed to fetch debates');
      }
      const data = await response.json();
      setDebates(data);
      setError(null);
    } catch (error) {
      console.error('Error fetching debates:', error);
      setError('Failed to load debate topics');
    } finally {
      setLoading(false);
      // Update fade visibility after debates load
      updateFadeVisibility();
    }
  };

  useEffect(() => {
    fetchDebates();

    // Set up real-time updates listener
    const handleFeedItemCreated = (event: CustomEvent) => {
      const newItem = event.detail;
      // For now, just refresh the debates when any new item is created
      // Later we can make this more specific to debate topics
      fetchDebates();
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

  if (debates.length === 0) {
    return (
      <div className="space-y-4 w-full min-w-0">
        <div className="flex items-center gap-2">
          <MessageSquare className="w-5 h-5 text-primary" />
          <h2 className="text-lg font-semibold">Trending Debates</h2>
        </div>
        <div className="text-center py-8 text-muted-foreground">
          <div className="flex flex-col items-center gap-3">
            <MessageSquare className="w-12 h-12 text-muted-foreground/50" />
            <p>No debates yet. Be the first to start one!</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 w-full min-w-0">
      <div className="flex items-center gap-2">
        <MessageSquare className="w-5 h-5 text-primary" />
        <h2 className="text-lg font-semibold">Trending Debates</h2>
        <TrendingUp className="w-4 h-4 text-orange-500" />
      </div>
      
      <div className="relative">
        {/* Left fade mask */}
        <div 
          className={`absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-background to-transparent z-10 pointer-events-none transition-opacity duration-300 ${
            showLeftFade ? 'opacity-100' : 'opacity-0'
          }`}
        />
        
        {/* Scrollable content */}
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
        
        {/* Right fade mask */}
        <div 
          className={`absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-background to-transparent z-10 pointer-events-none transition-opacity duration-300 ${
            showRightFade ? 'opacity-100' : 'opacity-0'
          }`}
        />
      </div>
    </div>
  );
}