'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Hash, ChevronLeft, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { getTopicIcons, TopicIconResult } from '@/services/topicIcons';
import { DynamicIcon } from './DynamicIcon';
import { TopicCard } from './TopicCard';
import { Button } from '@/components/ui/button';
import { useSwipeGestures } from '@/hooks/useSwipeGestures';
import { cn } from '@/lib/utils';

// Map topic names to icon names (same as in TopicCard)
function getIconForTopic(topicName: string): { name: string } {
  const topicToIcon: Record<string, string> = {
    'housing': 'Home',
    'transportation': 'Car',
    'transit': 'Bus',
    'aviation': 'Plane',
    'cycling': 'Bike',
    'rail': 'Train',
    'environment': 'Leaf',
    'parks': 'TreePine',
    'waste': 'Recycle',
    'energy': 'Sun',
    'utilities': 'Droplets',
    'business': 'Store',
    'employment': 'Briefcase',
    'economy': 'DollarSign',
    'education': 'GraduationCap',
    'healthcare': 'Hospital',
    'safety': 'Shield',
    'justice': 'Scale',
    'community': 'Users',
    'development': 'Building',
    'infrastructure': 'Hammer',
    'technology': 'Wifi',
    'media': 'Camera',
    'arts': 'Music',
    'recreation': 'Gamepad2',
    'general': 'Hash'
  };

  return { name: topicToIcon[topicName.toLowerCase()] || 'Hash' };
}

interface TopicStats {
  topic: string;
  count: number;
  category?: string;
  latestPost?: {
    id: string;
    content: string;
    timestamp: Date | string;
    thumbnail?: {
      url: string;
      type: string;
    } | null;
    author: {
      name: string;
      username: string;
      image?: string | null;
    };
  } | null;
}

interface TrendingTopicsWidgetProps {
  limit?: number;
  showHeader?: boolean;
}

export function TrendingTopicsWidget({ limit = 8, showHeader = true }: TrendingTopicsWidgetProps) {
  const [topics, setTopics] = useState<TopicStats[]>([]);
  const [topicIcons, setTopicIcons] = useState<Map<string, TopicIconResult>>(new Map());
  const [loading, setLoading] = useState(true);
  const [showLeftFade, setShowLeftFade] = useState(false);
  const [showRightFade, setShowRightFade] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState(0);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchTrendingTopics();
  }, [limit]);

  const fetchTrendingTopics = async () => {
    try {
      const response = await fetch(`/api/trending-topics?limit=${limit}`);
      if (response.ok) {
        const data = await response.json();
        const topicsData = data.topics || [];
        setTopics(topicsData);

        // Get AI-powered icons for all topics
        if (topicsData.length > 0) {
          const topicNames = topicsData.map((t: TopicStats) => t.topic);
          const icons = await getTopicIcons(topicNames);
          setTopicIcons(icons);
        }
      }
    } catch (error) {
      console.error('Error fetching trending topics:', error);
    } finally {
      setLoading(false);
      // Update fade visibility after loading
      updateFadeVisibility();
    }
  };

  const handleScroll = () => {
    if (!scrollContainerRef.current) return;
    
    const container = scrollContainerRef.current;
    const scrollLeft = container.scrollLeft;
    const scrollWidth = container.scrollWidth;
    const clientWidth = container.clientWidth;
    
    // Show left fade if scrolled past the beginning (with small threshold)
    setShowLeftFade(scrollLeft > 5);
    
    // Show right fade if not scrolled to the end (with small threshold)
    setShowRightFade(scrollLeft < scrollWidth - clientWidth - 5);
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

  // Enhanced click handlers that prevent event bubbling
  const handleScrollLeft = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (showLeftFade) {
      scrollLeft();
    }
  }, [showLeftFade]);

  const handleScrollRight = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (showRightFade) {
      scrollRight();
    }
  }, [showRightFade]);

  // Handle mouse drag scrolling for desktop
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (!scrollContainerRef.current) return;
    setIsDragging(true);
    setDragStart(e.pageX - scrollContainerRef.current.offsetLeft);
    e.preventDefault();
  }, []);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDragging || !scrollContainerRef.current) return;
    e.preventDefault();
    const x = e.pageX - scrollContainerRef.current.offsetLeft;
    const walk = (x - dragStart) * 2; // Multiply by 2 for faster scrolling
    scrollContainerRef.current.scrollLeft = scrollContainerRef.current.scrollLeft - walk;
    setDragStart(x);
    // Update fade visibility during drag
    handleScroll();
  }, [isDragging, dragStart]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
    // Update fade visibility after drag operation
    setTimeout(handleScroll, 50);
  }, []);

  const handleMouseLeave = useCallback(() => {
    setIsDragging(false);
    // Update fade visibility after drag operation
    setTimeout(handleScroll, 50);
  }, []);

  // Add swipe gesture support for mobile
  const { ref: swipeRef } = useSwipeGestures({
    onSwipeLeft: scrollRight,
    onSwipeRight: scrollLeft,
    minSwipeDistance: 30,
  });

  // Combined ref callback for both scroll container and swipe gestures
  const combinedRef = useCallback((el: HTMLDivElement | null) => {
    // Set scroll container ref
    (scrollContainerRef as React.MutableRefObject<HTMLDivElement | null>).current = el;
    // Set swipe ref
    (swipeRef as React.MutableRefObject<HTMLDivElement | null>).current = el;
  }, [swipeRef]);

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
  }, [topics]);

  // Generate colors for topics
  const getTopicColor = (index: number) => {
    const colors = [
      'bg-blue-100 text-blue-700 border-blue-300',
      'bg-green-100 text-green-700 border-green-300',
      'bg-purple-100 text-purple-700 border-purple-300',
      'bg-orange-100 text-orange-700 border-orange-300',
      'bg-pink-100 text-pink-700 border-pink-300',
      'bg-indigo-100 text-indigo-700 border-indigo-300',
      'bg-yellow-100 text-yellow-700 border-yellow-300',
      'bg-red-100 text-red-700 border-red-300',
    ];
    return colors[index % colors.length];
  };

  if (loading) {
    return (
      <div>
        {/* {showHeader && (
          <div className="pb-4 px-4">
            <h2 className="text-base font-medium flex items-center gap-1.5 text-foreground opacity-80">
              <div className="p-1 rounded-full bg-gradient-to-r from-blue-500 to-purple-500">
                <Hash className="h-3 w-3 text-white" />
              </div>
              Topics
            </h2>
          </div>
        )} */}
        <div className="px-4">
          <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-3">
            {[...Array(limit)].map((_, i) => (
              <div key={i} className="flex-shrink-0">
                <div className="flex items-center gap-2.5 px-4 py-2.5 rounded-full bg-muted/50 animate-pulse">
                  <div className="w-4 h-4 bg-muted rounded-full" />
                  <div className="w-16 h-4 bg-muted rounded-full" />
                  <div className="w-4 h-4 bg-muted rounded-full" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (topics.length === 0) {
    return (
      <div>
        {/* {showHeader && (
          <div className="pb-4 px-4">
            <h2 className="text-base font-medium flex items-center gap-1.5 text-foreground opacity-80">
              <div className="p-1 rounded-full bg-gradient-to-r from-blue-500 to-purple-500">
                <Hash className="h-3 w-3 text-white" />
              </div>
              Topics
            </h2>
          </div>
        )} */}
        <div className="px-4">
          <div className="text-center py-8 text-muted-foreground">
            <div className="p-3 rounded-full bg-gradient-to-r from-muted/20 to-muted/10 inline-block mb-3">
              <Hash className="h-8 w-8 opacity-50" />
            </div>
            <p className="text-sm font-medium">No topics yet</p>
            <p className="text-xs">Start conversations to create topics!</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* {showHeader && (
        <div className="pb-4 px-4">
          <h2 className="text-base font-medium flex items-center gap-1.5 text-foreground opacity-80">
            <div className="p-1 rounded-full bg-gradient-to-r from-blue-500 to-purple-500">
              <Hash className="h-3 w-3 text-white" />
            </div>
            Trending Topics
          </h2>
        </div>
      )} */}
      <div className="px-4 relative group">
        {/* Left Navigation Arrow - Desktop */}
        {topics.length > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleScrollLeft}
            className={cn(
              "absolute left-6 top-1/2 -translate-y-1/2 z-30 h-8 w-8 p-0 bg-background/90 backdrop-blur-sm border shadow-lg",
              "hidden lg:flex transition-all duration-200",
              "hover:bg-background hover:scale-110",
              showLeftFade 
                ? "opacity-70 hover:opacity-100" 
                : "opacity-0 pointer-events-none"
            )}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
        )}

        {/* Right Navigation Arrow - Desktop */}
        {topics.length > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleScrollRight}
            className={cn(
              "absolute right-6 top-1/2 -translate-y-1/2 z-30 h-8 w-8 p-0 bg-background/90 backdrop-blur-sm border shadow-lg",
              "hidden lg:flex transition-all duration-200",
              "hover:bg-background hover:scale-110",
              showRightFade 
                ? "opacity-70 hover:opacity-100" 
                : "opacity-0 pointer-events-none"
            )}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        )}

        {/* Left fade mask */}
        {topics.length > 0 && (
          <div 
            className={cn(
              "absolute left-4 top-0 bottom-0 w-8 bg-gradient-to-r from-background via-background/60 to-transparent z-10 pointer-events-none transition-opacity duration-300",
              showLeftFade ? "opacity-100" : "opacity-0"
            )}
          />
        )}

        {/* Right fade mask */}
        {topics.length > 0 && (
          <div 
            className={cn(
              "absolute right-4 top-0 bottom-0 w-8 bg-gradient-to-l from-background via-background/60 to-transparent z-10 pointer-events-none transition-opacity duration-300",
              showRightFade ? "opacity-100" : "opacity-0"
            )}
          />
        )}

        {/* Compact pill-style topics row */}
        <div 
          ref={combinedRef}
          className={cn(
            "flex gap-2 overflow-x-auto pb-3 scrollbar-hide touch-pan-x",
            isDragging ? "cursor-grabbing select-none" : "cursor-grab"
          )}
          style={{ scrollBehavior: isDragging ? 'auto' : 'smooth' }}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseLeave}
        >
          {topics.map((topicStat, index) => {
            const iconName = getIconForTopic(topicStat.topic).name;
            const gradients = [
              'from-blue-500 to-cyan-500',
              'from-purple-500 to-pink-500', 
              'from-green-500 to-emerald-500',
              'from-orange-500 to-red-500',
              'from-indigo-500 to-purple-500',
              'from-pink-500 to-rose-500',
              'from-teal-500 to-green-500',
              'from-yellow-500 to-orange-500',
            ];
            const gradient = gradients[index % gradients.length];
            
            return (
              <Link 
                key={topicStat.topic} 
                href={`/topics/${encodeURIComponent(topicStat.topic)}`}
                className="group flex-shrink-0"
              >
                <div className={`
                  relative flex items-center gap-1.5 px-3 py-1.5 rounded-full
                  bg-gradient-to-r ${gradient}
                  hover:shadow-lg hover:shadow-current/25 hover:scale-105
                  transition-all duration-300 ease-out
                  cursor-pointer overflow-hidden
                  border border-white/20
                `}>
                  {/* Animated background shimmer */}
                  <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-topic-shimmer" />
                  </div>
                  
                  {/* Icon with bounce animation */}
                  <div className="relative z-10 group-hover:animate-bounce">
                    <DynamicIcon
                      name={iconName}
                      size={18}
                      className="text-white drop-shadow-sm"
                    />
                  </div>
                  
                  {/* Topic content */}
                  <div className="relative z-10 flex items-center gap-1.5">
                    <span className="text-white font-normal text-xs capitalize drop-shadow-sm">
                      {topicStat.topic}
                    </span>
                    <div className="flex items-center gap-0.5">
                      <div className="w-1 h-1 bg-white/60 rounded-full" />
                      <span className="text-white/90 text-[10px] font-normal">
                        {topicStat.count}
                      </span>
                    </div>
                  </div>
                  
                  {/* Floating particles effect */}
                  <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                    <div className="absolute top-1 left-4 w-1 h-1 bg-white/40 rounded-full animate-ping animation-delay-100" />
                    <div className="absolute top-3 right-6 w-0.5 h-0.5 bg-white/30 rounded-full animate-ping animation-delay-300" />
                    <div className="absolute bottom-2 left-8 w-1 h-1 bg-white/20 rounded-full animate-ping animation-delay-500" />
                  </div>
                </div>
              </Link>
            );
          })}

          {/* Browse All Topics - Sleek CTA */}
          <Link href="/topics/browse" className="group flex-shrink-0">
            <div className="
              relative flex items-center gap-1.5 px-3 py-1.5 rounded-full
              bg-gradient-to-r from-slate-600 to-slate-800 dark:from-slate-300 dark:to-slate-100
              hover:from-primary hover:to-primary/80
              hover:shadow-lg hover:shadow-primary/25 hover:scale-105
              transition-all duration-300 ease-out
              cursor-pointer overflow-hidden
              border border-white/10 hover:border-white/20
            ">
              {/* Animated background */}
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-topic-shimmer" />
              </div>
              
              {/* Plus icon with rotation */}
              <div className="relative z-10 group-hover:rotate-90 transition-transform duration-300">
                <Hash className="h-4 w-4 text-white dark:text-slate-800 group-hover:text-white drop-shadow-sm" />
              </div>
              
              <div className="relative z-10 flex items-center gap-1.5">
                <span className="text-white dark:text-slate-800 group-hover:text-white font-normal text-xs drop-shadow-sm">
                  Browse All
                </span>
                <div className="flex items-center gap-0.5">
                  <div className="w-1 h-1 bg-white/60 dark:bg-slate-600/60 group-hover:bg-white/60 rounded-full" />
                  <span className="text-white/90 dark:text-slate-700/90 group-hover:text-white/90 text-[10px] font-normal">
                    28
                  </span>
                </div>
              </div>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}