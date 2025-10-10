'use client';

import React, { useState, useEffect, useCallback } from 'react'; // Import React hooks
import { InitiativeCard } from "@/components/InitiativeCard";
import { CompactInitiativeCard } from "@/components/CompactInitiativeCard";
import { GeneralPostCard } from "@/components/GeneralPostCard";
import { CompactPostCard } from "@/components/CompactPostCard";
import { MetaActionCard } from "@/components/MetaActionCard";
import { CollapsiblePostComposer } from "@/components/CollapsiblePostComposer";
import type { Initiative as PrismaInitiative, GeneralPost as PrismaGeneralPost, User as PrismaUser, MediaItem as PrismaMediaItem, Issue as PrismaIssue, Idea as PrismaIdea } from '@prisma/client';
import type { GeneralPost, Initiative, Role, SkillRoleType, InitiativeStatus, UserForDisplay } from '@/lib/types';
import { HotTakeStance } from '@prisma/client';
import { formatDistanceToNow, parseISO } from 'date-fns';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import Link from 'next/link';
import { Button } from "@/components/ui/button";
import { Star, Loader2, Target, Filter } from "lucide-react";
import { PostActions } from '@/components/PostActions';
import { IdeaCard } from "@/components/IdeaCard";
import { IssueCard } from "@/components/IssueCard";
import { CompactIdeaCard } from "@/components/CompactIdeaCard";
import { CompactIssueCard } from "@/components/CompactIssueCard";
import ActivityFeed from "@/components/ActivityFeed";
import AppSidebar, { getDefaultCollapsedState } from "@/components/AppSidebar";
import { useToast } from "@/hooks/use-toast";
import { useWindowScrollPosition } from "@/hooks/useScrollPosition";
import { restoreScrollPosition } from "@/utils/navigation";
// import { io, Socket } from 'socket.io-client'; // Temporarily disabled for Vercel deployment
import { MainFeedSocietyPostCard } from './MainFeedSocietyPostCard';
import { CompactSocietyPostCard } from './CompactSocietyPostCard';
import { DebateTopicCard } from './DebateTopicCard';
import { TrendingTopicsWidget } from './TrendingTopicsWidget';
import { HotTakeBattleCard } from './HotTakeBattleCard';
import { CompactHotTakeBattleCard } from './CompactHotTakeBattleCard';
import { NewsPostCard } from './NewsPostCard';
import { useModal } from '@/context/ModalContext';
import { NewsColumn } from './NewsColumn';
import LocationBasedWidget from './LocationBasedWidget';
import SmartSuggestionsWidget from './SmartSuggestionsWidget';

// Temporary mock user avatars for fallback
const mockUserAvatars: Record<string, string | undefined> = {
  "user1": "https://i.pravatar.cc/40?u=user1",
  "user3": "https://i.pravatar.cc/40?u=user3",
  "user5": "https://i.pravatar.cc/40?u=user5",
  "user7": "https://i.pravatar.cc/40?u=user7",
};

// Define extended types that include the relations we'll fetch
type InitiativeWithCreator = PrismaInitiative & {
  creator: PrismaUser | null;
  society: { id: string; name: string; image: string | null } | null;
};
type GeneralPostWithCreatorAndMedia = PrismaGeneralPost & { creator: PrismaUser | null; media: PrismaMediaItem[] };
type IssueWithCreator = PrismaIssue & { creator: PrismaUser | null; media: PrismaMediaItem[]; championCount: number };
type IdeaWithCreator = PrismaIdea & { creator: PrismaUser | null; media: PrismaMediaItem[]; championCount: number };

// Hot Take Battle type from the API
type HotTakeBattleWithCreator = {
  id: string;
  topic: string;
  title: string;
  description?: string;
  createdAt: Date;
  totalParticipants: number;
  post1Supporters: number;
  post2Supporters: number;
  neutralTakes: number;
  post1: {
    id: string;
    content: string;
    creatorName: string;
    creatorAvatar?: string;
    timestamp: Date;
  };
  post2: {
    id: string;
    content: string;
    creatorName: string;
    creatorAvatar?: string;
    timestamp: Date;
  };
  userStance?: HotTakeStance;
};

// Meta action types that match the API response
interface UpdateWithUserAndInitiative {
  id: string;
  type: string;
  content: string;
  details?: any;
  createdAt: Date;
  user: {
    id: string;
    name: string | null;
    image: string | null;
    username?: string | null; // Added for backward compatibility
  };
  initiative: {
    id: string;
    title: string;
  };
}

interface UserFollowWithUsers {
  id: string;
  createdAt: Date;
  follower: {
    id: string;
    name: string | null;
    image: string | null;
    username?: string | null; // Added for backward compatibility
  };
  following: {
    id: string;
    name: string | null;
    image: string | null;
    username?: string | null; // Added for backward compatibility
  };
}

interface InitiativeMembershipWithUserAndInitiative {
  id: string;
  createdAt: Date;
  role: string;
  customRole?: string | null;
  user: {
    id: string;
    name: string | null;
    image: string | null;
    username?: string | null; // Added for backward compatibility
  };
  initiative: {
    id: string;
    title: string;
  };
}

// Unified feed item types
type FeedItemType = 'initiative' | 'generalPost' | 'societyPost' | 'issue' | 'idea' | 'debate' | 'hotTakeBattle' | 'update' | 'follow' | 'initiativeJoin' | 'live-news';

interface SocietyPostWithUserAndSociety {
  id: string;
  type: string;
  content: string;
  createdAt: string;
  imageUrl?: string;
  user: {
    id: string;
    name: string;
    image?: string;
  };
  society: {
    id: string;
    name: string;
    image?: string;
  };
}

interface DebateTopicWithCreatorAndStats {
  id: string;
  title: string;
  content: string;
  creatorId: string;
  imageUrl?: string | null;
  createdAt: Date;
  updatedAt: Date;
  creator: {
    id: string;
    name: string | null;
    image: string | null;
  } | null;
  votes: {
    id: string;
    side: 'PRO' | 'CON';
  }[];
  arguments: {
    id: string;
  }[];
}

interface LiveNewsPost {
  id: string;
  title: string;
  summary: string;
  source: string;
  sourceUrl: string;
  imageUrl?: string;
  publishedAt: string;
  location?: string;
  city?: string;
  urgencyLevel: number;
  tags: string[];
  createdAt: string;
  type: 'live-news';
}

interface UnifiedFeedItem {
  type: FeedItemType;
  id: string;
  timestamp: Date;
  data: InitiativeWithCreator | GeneralPostWithCreatorAndMedia | SocietyPostWithUserAndSociety | IssueWithCreator | IdeaWithCreator | DebateTopicWithCreatorAndStats | UpdateWithUserAndInitiative | UserFollowWithUsers | InitiativeMembershipWithUserAndInitiative | LiveNewsPost;
}

// Meta action types for the MetaActionCard component
interface UpdateAction {
  type: 'update';
  id: string;
  timestamp: Date;
  data: UpdateWithUserAndInitiative;
}

interface FollowAction {
  type: 'follow';
  id: string;
  timestamp: Date;
  data: UserFollowWithUsers;
}

interface InitiativeJoinAction {
  type: 'initiativeJoin';
  id: string;
  timestamp: Date;
  data: InitiativeMembershipWithUserAndInitiative;
}

type MetaAction = UpdateAction | FollowAction | InitiativeJoinAction;

// Legacy types for backward compatibility
type FeedItemDb = InitiativeWithCreator | GeneralPostWithCreatorAndMedia | SocietyPostWithUserAndSociety | IssueWithCreator | IdeaWithCreator | DebateTopicWithCreatorAndStats | HotTakeBattleWithCreator;

// Helper function to check if an item is a GeneralPost
function isGeneralPost(item: FeedItemDb): item is GeneralPostWithCreatorAndMedia {
  // GeneralPost has 'content', but not 'status' (initiatives) or 'tags' (issues/ideas)
  return 'content' in item && !('status' in item) && !('tags' in item);
}

// Helper function to check if an item is an Initiative
function isInitiative(item: FeedItemDb): item is InitiativeWithCreator {
  // Initiative has 'status' and 'roles'
  return 'status' in item && 'roles' in item;
}

// New helper to identify items that are either Issue or Idea
function isTaggedContent(item: FeedItemDb): item is IssueWithCreator | IdeaWithCreator {
    return 'tags' in item && !('content' in item) && !('status' in item);
}

// Helper function to check if an item is a Debate
function isDebate(item: FeedItemDb): item is DebateTopicWithCreatorAndStats {
  return 'votes' in item && 'arguments' in item && 'title' in item && 'content' in item && !('status' in item) && !('tags' in item);
}

// Helper function to check if an item is live news
function isLiveNews(item: UnifiedFeedItem): boolean {
  return item.type === 'live-news';
}

// Helper functions for unified feed items
function isMetaAction(item: UnifiedFeedItem): item is UnifiedFeedItem & { type: 'update' | 'follow' | 'initiativeJoin' } {
  return ['update', 'follow', 'initiativeJoin'].includes(item.type);
}

function isContentItem(item: UnifiedFeedItem): item is UnifiedFeedItem & { type: 'initiative' | 'generalPost' | 'societyPost' | 'issue' | 'idea' | 'debate' | 'hotTakeBattle' } {
  return ['initiative', 'generalPost', 'societyPost', 'issue', 'idea', 'debate', 'hotTakeBattle'].includes(item.type);
}

function isSocietyPost(item: any): item is SocietyPostWithUserAndSociety {
  return (
    item &&
    typeof item.type === 'string' &&
    typeof item.content === 'string' &&
    item.user && typeof item.user.id === 'string' &&
    item.society && typeof item.society.id === 'string'
  );
}

// Helper function to convert UnifiedFeedItem to MetaAction
function convertToMetaAction(item: UnifiedFeedItem & { type: 'update' | 'follow' | 'initiativeJoin' }): MetaAction {
  return {
    type: item.type,
    id: item.id,
    timestamp: item.timestamp,
    data: item.data as any
  };
}

// Patch: ensure all meta action user objects include username
function patchMetaActionUsernames(action: any): any {
  if (action.type === 'update' && action.data && action.data.user) {
    if (typeof action.data.user.username === 'undefined') {
      action.data.user.username = null;
    }
  }
  if (action.type === 'follow' && action.data) {
    if (action.data.follower && typeof action.data.follower.username === 'undefined') {
      action.data.follower.username = null;
    }
    if (action.data.following && typeof action.data.following.username === 'undefined') {
      action.data.following.username = null;
    }
  }
  if (action.type === 'initiativeJoin' && action.data && action.data.user) {
    if (typeof action.data.user.username === 'undefined') {
      action.data.user.username = null;
    }
  }
  return action;
}

interface HomeClientProps {
  currentUserId?: string;
  username?: string | null;
}


type FeedFilterType = 'all' | 'initiatives' | 'generalPosts' | 'ideas' | 'issues' | 'community';

export function HomeClient({ currentUserId, username }: HomeClientProps) {
  const [allFeedItems, setAllFeedItems] = useState<UnifiedFeedItem[]>([]);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => getDefaultCollapsedState({ type: 'home' }));
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [feedFilter, setFeedFilter] = useState<FeedFilterType>(() => {
    // Restore filter state if returning from a post
    if (typeof window !== 'undefined') {
      const savedFilter = sessionStorage.getItem('feedFilter');
      if (savedFilter && ['all', 'initiatives', 'generalPosts', 'ideas', 'issues', 'community'].includes(savedFilter)) {
        return savedFilter as FeedFilterType;
      }
    }
    return 'all';
  });
  const [filterSwitching, setFilterSwitching] = useState(false);
  const { toast } = useToast();
  const { openCreateBattleResponseModal } = useModal();
  const [showMoreNews, setShowMoreNews] = useState(false);


  // Filter feed items based on selected filter - Instant client-side filtering
  const filteredFeedItems = allFeedItems.filter((item) => {
    switch (feedFilter) {
      case 'initiatives':
        return item.type === 'initiative' || (isMetaAction(item) && (item.type === 'update' || item.type === 'initiativeJoin'));
      case 'generalPosts':
        return item.type === 'generalPost' || item.type === 'societyPost' || item.type === 'debate' || item.type === 'hotTakeBattle';
      case 'ideas':
        return item.type === 'idea';
      case 'issues':
        return item.type === 'issue';
      case 'community':
        return isMetaAction(item) && (item.type === 'follow' || item.type === 'initiativeJoin');
      case 'all':
      default:
        return true;
    }
  });

  // Add this handler in HomeClient
  const handlePostDeleted = (postId: string) => {
    setAllFeedItems(prev => prev.filter(item => !(isContentItem(item) && isGeneralPost(item.data as any) && item.data.id === postId)));
  };

  // Handle tab switching with smooth UX
  const handleTabSwitch = (newFilter: typeof feedFilter) => {
    if (newFilter === feedFilter) return;

    setFilterSwitching(true);
    setFeedFilter(newFilter);

    // Save the new filter state
    sessionStorage.setItem('feedFilter', newFilter);

    // Quick feedback - stop loading state after a short delay
    setTimeout(() => setFilterSwitching(false), 150);
  };

  // Load initial feed data once - no more refetching on tab switches
  useEffect(() => {
    const fetchInitialFeedItems = async () => {
      try {
        setIsInitialLoading(true);

        // Always fetch 'all' content including news for initial load
        const response = await fetch(`/api/feed?unified=true&limit=20&type=all`);
        if (!response.ok) {
          throw new Error(`Failed to fetch feed items: ${response.statusText}`);
        }
        const data = await response.json();

        // Handle both new paginated format and legacy format for backward compatibility
        if (data.items && data.pagination) {
          // New cursor-based format
          setAllFeedItems(data.items);
          setNextCursor(data.pagination.nextCursor);
          setHasMore(data.pagination.hasMore);
        } else {
          // Legacy format - assume it's the items directly
          setAllFeedItems(Array.isArray(data) ? data : []);
          setHasMore(false); // No pagination info available
        }
      } catch (err: any) {
        setError(err.message);
      } finally {
        setIsInitialLoading(false);
      }
    };

    fetchInitialFeedItems();
  }, []); // Only run once on mount

  useEffect(() => {
    // Show welcome toast if just registered
    if (window && window.localStorage && localStorage.getItem('showWelcomeToast') === 'true') {
      toast({
        title: `Welcome to society+! 🎉`,
        description: `You're now part of a community of changemakers.`,
        duration: 8000,
      });
      localStorage.removeItem('showWelcomeToast');
    }
  }, [toast]);

  useEffect(() => {
    // Socket connection temporarily disabled for Vercel deployment
    // TODO: Re-enable heartbeat after implementing polling system
    // if (!currentUserId) return;
    // const socket: Socket = io(process.env.NEXT_PUBLIC_SOCKET_SERVER_URL || 'http://localhost:9003', {
    //   path: '/api/socketio',
    //   transports: ['websocket'],
    // });
    // socket.emit('userHeartbeat', currentUserId);
    // const interval = setInterval(() => {
    //   socket.emit('userHeartbeat', currentUserId);
    // }, 30000);
    // return () => {
    //   clearInterval(interval);
    //   socket.disconnect();
    // };
  }, [currentUserId]);

  useEffect(() => {
    const handleFeedItemCreated = (event: CustomEvent) => {
      const item = event.detail;

      // Infer type based on item shape - improve the logic to correctly distinguish ideas from issues
      let type: FeedItemType | undefined;
      if ('status' in item && 'roles' in item) {
        type = 'initiative';
      } else if ('tags' in item && 'title' in item && 'description' in item && !('content' in item) && !('status' in item)) {
        // Both ideas and issues have tags, title, and description, but not content or status
        // Check for specific fields that distinguish ideas from issues
        if ('addressingIssueId' in item || 'societyId' in item) {
          type = 'idea'; // Ideas can have societyId or address issues
        } else if ('location' in item && item.location) {
          // Issues typically have location, ideas might too, so this is not definitive
          // For now, assume it's an issue if we can't determine it's an idea
          type = 'issue';
        } else {
          // Default to idea if we can't determine
          type = 'idea';
        }
      } else if ('tags' in item) {
        type = 'issue';
      } else if ('type' in item && item.type === 'societyPost') {
        type = 'societyPost';
      } else {
        type = 'generalPost';
      }

      const newFeedItem: UnifiedFeedItem = {
        type: type as FeedItemType,
        id: item.id, // Use original database ID to match API format
        timestamp: new Date(item.createdAt || Date.now()),
        data: item,
      };

      setAllFeedItems(prev => [newFeedItem, ...prev]);
    };
    window.addEventListener('feed:itemCreated', handleFeedItemCreated as EventListener);
    return () => {
      window.removeEventListener('feed:itemCreated', handleFeedItemCreated as EventListener);
    };
  }, []);

  // Restore scroll position when returning from a post
  useEffect(() => {
    restoreScrollPosition();
  }, []);

  // Load more posts function - improved to load more items at once
  const loadMorePosts = useCallback(async () => {
    if (!hasMore || loadingMore || !nextCursor) {
      return;
    }

    setLoadingMore(true);
    try {
      // Always load from 'all' since we filter client-side
      const url = `/api/feed?unified=true&limit=20&cursor=${nextCursor}&type=all`;
      const response = await fetch(url);

      if (response.ok) {
        const data = await response.json();

        if (data.items && data.pagination) {
          // New cursor-based format - filter out duplicates
          setAllFeedItems(prev => {
            const existingIds = new Set(prev.map(item => {
              if (isContentItem(item) && item.data) {
                return item.data.id;
              }
              return item.id;
            }));

            const newItems = data.items.filter((item: UnifiedFeedItem) => {
              const itemId = isContentItem(item) && item.data ? item.data.id : item.id;
              return !existingIds.has(itemId);
            });

            return [...prev, ...newItems];
          });

          // Update pagination state
          setNextCursor(data.pagination.nextCursor);
          setHasMore(data.pagination.hasMore);
        }
      } else {
        console.error('Failed to load more posts:', response.status, response.statusText);
      }
    } catch (error) {
      console.error('Error loading more posts:', error);
    } finally {
      setLoadingMore(false);
    }
  }, [hasMore, loadingMore, nextCursor, allFeedItems]);

  // Basic scroll position saving (auto-restore disabled due to performance issues)
  const saveScrollPosition = () => {
    const position = {
      scrollTop: window.scrollY,
      scrollLeft: window.scrollX,
      timestamp: Date.now()
    };
    // Scroll position saved for future enhancement
  };


  const handlePostCreated = async () => {
    // This will be handled by the server action in CreatePostForm
    window.location.reload(); // Simple refresh for now
  };

  if (isInitialLoading) {
    return <div className="flex justify-center items-center min-h-screen">Loading feed...</div>;
  }

  if (error) {
    return <div className="flex justify-center items-center min-h-screen text-red-500">Error loading feed: {error}</div>;
  }

  return (
    <div className="w-full min-w-0 overflow-hidden">
      {/* Sidebar */}
      <AppSidebar
        widgets={['userControls', 'navigation', 'resources', 'footer']}
        context={{ type: 'home' }}
        onCollapseChange={setSidebarCollapsed}
      />

      {/* Main Content Area - with dynamic left margin based on sidebar state and top padding for mobile sidebar toggle */}
      <div className={`min-w-0 transition-all duration-300 pt-20 lg:pt-6 ${
        sidebarCollapsed ? 'lg:ml-16' : 'lg:ml-80 xl:ml-96'
      }`}>
        {/* Trending Topics Widget - Full width */}
        <div className="w-full px-2 sm:px-4 lg:px-6 mb-6">
          <div className="max-w-7xl mx-auto">
            <TrendingTopicsWidget />
          </div>
        </div>

        {/* Main Layout: Feed centered, News pushed to far right */}
        <div className="flex w-full justify-center">
          {/* Main Feed - Centered */}
          <div className="flex-shrink-0 w-full max-w-3xl px-4 pb-24">
            <div className="flex flex-col space-y-6">
          {/* Feed Filter Controls - Horizontal Scrollable Tabs */}
          <div className="w-full">
            <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide pb-2">
              <Filter className="h-4 w-4 text-muted-foreground flex-shrink-0" />
              <button
                onClick={() => handleTabSwitch('all')}
                disabled={filterSwitching}
                className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all duration-200 flex-shrink-0 ${
                  feedFilter === 'all'
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : 'bg-muted/50 text-muted-foreground hover:bg-muted border border-border/50'
                }`}
              >
                All Activity
              </button>
              <button
                onClick={() => handleTabSwitch('initiatives')}
                disabled={filterSwitching}
                className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all duration-200 flex items-center gap-2 flex-shrink-0 ${
                  feedFilter === 'initiatives'
                    ? 'bg-blue-500/10 text-blue-600 border border-blue-500/20 shadow-sm'
                    : 'bg-muted/50 text-muted-foreground hover:bg-muted border border-border/50'
                }`}
              >
                <Target className="h-3.5 w-3.5" />
                Initiatives
              </button>
              <button
                onClick={() => handleTabSwitch('generalPosts')}
                disabled={filterSwitching}
                className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all duration-200 flex-shrink-0 ${
                  feedFilter === 'generalPosts'
                    ? 'bg-green-500/10 text-green-600 border border-green-500/20 shadow-sm'
                    : 'bg-muted/50 text-muted-foreground hover:bg-muted border border-border/50'
                }`}
              >
                Posts
              </button>
              <button
                onClick={() => handleTabSwitch('ideas')}
                disabled={filterSwitching}
                className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all duration-200 flex-shrink-0 ${
                  feedFilter === 'ideas'
                    ? 'bg-yellow-500/10 text-yellow-600 border border-yellow-500/20 shadow-sm'
                    : 'bg-muted/50 text-muted-foreground hover:bg-muted border border-border/50'
                }`}
              >
                Ideas
              </button>
              <button
                onClick={() => handleTabSwitch('issues')}
                disabled={filterSwitching}
                className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all duration-200 flex-shrink-0 ${
                  feedFilter === 'issues'
                    ? 'bg-red-500/10 text-red-600 border border-red-500/20 shadow-sm'
                    : 'bg-muted/50 text-muted-foreground hover:bg-muted border border-border/50'
                }`}
              >
                Issues
              </button>
              <button
                onClick={() => handleTabSwitch('community')}
                disabled={filterSwitching}
                className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all duration-200 flex-shrink-0 ${
                  feedFilter === 'community'
                    ? 'bg-purple-500/10 text-purple-600 border border-purple-500/20 shadow-sm'
                    : 'bg-muted/50 text-muted-foreground hover:bg-muted border border-border/50'
                }`}
              >
                Community
              </button>
            </div>
          </div>

          {filteredFeedItems.map((item, index) => {
            // Generate a safe key that works for all item types
            const itemKey = item.id || `item-${index}-${item.type || 'unknown'}`;

            // Skip live news items - they're handled in the dedicated news column
            if (isLiveNews(item)) {
              return null;
            }

            // Handle meta actions
            if (isMetaAction(item)) {
              const metaAction = patchMetaActionUsernames(convertToMetaAction(item));
              return (
                <div key={`${item.type}-${itemKey}`} className="w-full">
                  <MetaActionCard action={metaAction} currentUserId={currentUserId} />
                </div>
              );
            }

            // Handle content items
            if (isContentItem(item)) {
              const contentData = item.data as FeedItemDb;

              if (item.type === 'societyPost' && isSocietyPost(item.data)) {
                return (
                  <CompactSocietyPostCard key={`${item.type}-${itemKey}`} post={item.data as SocietyPostWithUserAndSociety} showTimeline={true} />
                );
              } else if (item.type === 'hotTakeBattle') {
                const battleItem = contentData as HotTakeBattleWithCreator;
                return (
                  <div key={`${item.type}-${itemKey}`} className="w-full">
                    <HotTakeBattleCard
                      battle={battleItem}
                      onJoinBattle={async (battleId: string, stance: any) => {
                        try {
                          const response = await fetch(`/api/hot-take-battles/${battleId}/join`, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ stance }),
                          });

                          if (!response.ok) throw new Error('Failed to join battle');

                          // Refresh the specific battle in feed
                          const updatedResponse = await fetch(`/api/hot-take-battles/${battleId}`);
                          if (updatedResponse.ok) {
                            const updatedBattle = await updatedResponse.json();
                            setAllFeedItems(prev => prev.map(feedItem =>
                              feedItem.type === 'hotTakeBattle' && feedItem.data.id === battleId
                                ? { ...feedItem, data: updatedBattle }
                                : feedItem
                            ));
                          }
                        } catch (error) {
                          console.error('Error joining battle:', error);
                        }
                      }}
                      onCreateTake={(battleId: string) => {
                        openCreateBattleResponseModal(battleId, battleItem.title);
                      }}
                      variant="feed"
                    />
                  </div>
                );
              } else if (contentData && isDebate(contentData)) {
                const debateItem = contentData; // Type is DebateTopicWithCreatorAndStats

                // Calculate stats for the debate
                const proVotes = debateItem.votes.filter(v => v.side === 'PRO').length;
                const conVotes = debateItem.votes.filter(v => v.side === 'CON').length;
                const totalVotes = proVotes + conVotes;
                const proPercentage = totalVotes > 0 ? Math.round((proVotes / totalVotes) * 100) : 0;
                const conPercentage = totalVotes > 0 ? Math.round((conVotes / totalVotes) * 100) : 0;
                const argumentCount = debateItem.arguments.length;

                const stats = {
                  proVotes,
                  conVotes,
                  totalVotes,
                  proPercentage,
                  conPercentage,
                  argumentCount,
                };

                const creatorForDebate = debateItem.creator
                  ? {
                      id: debateItem.creator.id,
                      name: debateItem.creator.name || 'Anonymous',
                      image: debateItem.creator.image || undefined,
                      username: undefined,
                    }
                  : {
                      id: debateItem.creatorId || 'anonymous-creator',
                      name: 'Anonymous',
                      image: undefined,
                      username: undefined,
                    };

                return (
                  <div key={`${item.type}-${itemKey}`} className="w-full">
                    <DebateTopicCard
                      id={debateItem.id}
                      title={debateItem.title}
                      content={debateItem.content}
                      imageUrl={debateItem.imageUrl || undefined}
                      creator={creatorForDebate}
                      createdAt={debateItem.createdAt}
                      stats={stats}
                    />
                  </div>
                );
              } else if (contentData && isGeneralPost(contentData)) {
                const postCreatorName = contentData.creator?.name || 'Anonymous';
                const postCreatorAvatar = contentData.creator?.image || mockUserAvatars[contentData.creatorId] || "https://i.pravatar.cc/40?u=anonymous";
                const displayPost: GeneralPost = {
                  id: contentData.id,
                  creatorId: contentData.creatorId,
                  creatorName: postCreatorName,
                  creatorAvatar: postCreatorAvatar,
                  content: contentData.content,
                  topics: contentData.topics || [], // Add topics field
                  timestamp: contentData.timestamp,
                  background: contentData.background || undefined,
                  linkedInitiativeId: contentData.linkedInitiativeId || undefined,
                  media: contentData.media,
                };
                return (
                  <div key={`${item.type}-${itemKey}`} className="w-full">
                    <CompactPostCard post={displayPost} currentUserId={currentUserId} showTimeline={true} />
                  </div>
                );
              } else if (contentData && isInitiative(contentData)) {
                const initiativeItem = contentData;
                const initiativeCreatorName = initiativeItem.creator?.name || 'Unknown Creator';
                const initiativeCreatorAvatar = initiativeItem.creator?.image || mockUserAvatars[initiativeItem.creatorId] || "https://i.pravatar.cc/40?u=unknown";

                const processedRoles: string[] = initiativeItem.roles || []; // roles is already string[] from PrismaInitiative

                // Ensure creatorForCard is always UserForDisplay, providing a default if initiativeItem.creator is null
                const creatorForCard: UserForDisplay = initiativeItem.creator
                  ? {
                      id: initiativeItem.creator.id,
                      name: initiativeItem.creator.name, // PrismaUser.name is string | null, compatible
                      image: initiativeItem.creator.image, // PrismaUser.image is string | null, compatible
                    }
                  : {
                      id: initiativeItem.creatorId || 'unknown-creator', // Use creatorId if available, else a fallback
                      name: 'Unknown Creator',
                      image: null,
                    };

                const initiativeForCard: Initiative & { creatorId?: string } = {
                  id: initiativeItem.id,
                  title: initiativeItem.title,
                  description: initiativeItem.description || '',
                  imageUrl: initiativeItem.imageUrl,
                  status: initiativeItem.status as InitiativeStatus,
                  createdAt: initiativeItem.createdAt,
                  updatedAt: initiativeItem.updatedAt, // Use updatedAt from initiativeItem
                  creatorId: initiativeItem.creatorId,
                  roles: processedRoles, // Now correctly typed as string[]
                  creator: creatorForCard, // Now always a UserForDisplay object
                  memberships: [],
                  updates: [],
                  chatMessages: [],
                  goals: [],
                  milestones: [],
                  societyId: initiativeItem.societyId || null,
                  society: initiativeItem.society || null,
                };

                return (
                  <div key={`${item.type}-${itemKey}`} className="w-full">
                    <CompactInitiativeCard
                      initiative={initiativeForCard}
                      creatorName={initiativeCreatorName}
                      creatorAvatarUrl={initiativeCreatorAvatar}
                      currentUserId={currentUserId}
                      showTimeline={true}
                    />
                  </div>
                );
              } else if (contentData && isTaggedContent(contentData)) {
                const taggedItem = contentData; // Type is now IssueWithCreator | IdeaWithCreator
                const taggedItemCreatorName = taggedItem.creator?.name || 'Anonymous';
                const taggedItemCreatorAvatar = taggedItem.creator?.image || mockUserAvatars[taggedItem.creatorId] || "https://i.pravatar.cc/40?u=anonymous";
                const timeAgo = taggedItem.createdAt ?
                  formatDistanceToNow(
                    typeof taggedItem.createdAt === 'string'
                      ? parseISO(taggedItem.createdAt)
                      : taggedItem.createdAt instanceof Date
                        ? taggedItem.createdAt
                        : new Date(taggedItem.createdAt as any),
                  { addSuffix: true }
                ) : '';

                // Use the item.type to determine if it's an issue or idea
                const isCurrentItemAnIssue = item.type === 'issue';

                const hasMedia = taggedItem.media && taggedItem.media.length > 0 && taggedItem.media[0].url; // Check for media
                const mediaUrl = hasMedia ? taggedItem.media![0].url : undefined;

                // Transform taggedItem to conform to the expected type for PostActions
                const creatorForPostActions: UserForDisplay = taggedItem.creator
                ? {
                    id: taggedItem.creator.id,
                    name: taggedItem.creator.name || 'Anonymous', // Handle null name
                    image: taggedItem.creator.image,
                  }
                : {
                    id: taggedItem.creatorId || 'anonymous-creator',
                    name: 'Anonymous',
                    image: null,
                  };

                const postForActions = {
                  ...taggedItem,
                  creator: creatorForPostActions,
                  // Ensure all fields expected by Initiative | Issue | Idea are present
                  // For Issue:
                  ...(isCurrentItemAnIssue && {
                    // Assuming 'location' and other Issue-specific fields are already in taggedItem
                  }),
                  // For Idea:
                  ...(!isCurrentItemAnIssue && {
                    // Assuming Idea-specific fields are already in taggedItem
                  }),
                  // Fields potentially missing or needing type adjustment for PostActions:
                  // Add any other fields required by the union type Initiative | Issue | Idea
                  // that might not be directly on taggedItem or need transformation.
                  // For example, if PostActions expects a specific structure for 'tags' or other properties.
                  // Based on the error, the primary issue is 'creator', which is addressed above.
                };


                // Transform the data to match the expected types for the card components
                if (isCurrentItemAnIssue) {
                  const creatorForDisplay: UserForDisplay = taggedItem.creator
                    ? {
                        id: taggedItem.creator.id,
                        name: taggedItem.creator.name,
                        image: taggedItem.creator.image,
                      }
                    : {
                        id: taggedItem.creatorId || 'anonymous',
                        name: 'Anonymous',
                        image: null,
                      };

                  const issueData = {
                    id: taggedItem.id,
                    title: taggedItem.title,
                    description: taggedItem.description,
                    creatorId: taggedItem.creatorId,
                    createdAt: taggedItem.createdAt,
                    tags: taggedItem.tags || [],
                    location: taggedItem.location,
                    media: taggedItem.media || [],
                    championCount: taggedItem.championCount || 0,
                    championedBy: null, // Will be populated if needed
                    championedByInitiativeId: taggedItem.championedByInitiativeId,
                    creator: creatorForDisplay,
                  };

                  return (
                    <div key={`issue-${itemKey}`} className="w-full">
                      <CompactIssueCard
                        issue={issueData}
                        currentUserId={currentUserId}
                        showTimeline={true}
                      />
                    </div>
                  );
                } else {
                  const creatorForDisplay: UserForDisplay = taggedItem.creator
                    ? {
                        id: taggedItem.creator.id,
                        name: taggedItem.creator.name,
                        image: taggedItem.creator.image,
                      }
                    : {
                        id: taggedItem.creatorId || 'anonymous',
                        name: 'Anonymous',
                        image: null,
                      };

                  const ideaData = {
                    id: taggedItem.id,
                    title: taggedItem.title,
                    description: taggedItem.description,
                    creatorId: taggedItem.creatorId,
                    createdAt: taggedItem.createdAt,
                    tags: taggedItem.tags || [],
                    location: taggedItem.location,
                    media: taggedItem.media || [],
                    championCount: taggedItem.championCount || 0,
                    championedBy: null, // Will be populated if needed
                    championedByInitiativeId: taggedItem.championedByInitiativeId,
                    creator: creatorForDisplay,
                  };

                  return (
                    <div key={`idea-${itemKey}`} className="w-full">
                      <CompactIdeaCard
                        idea={ideaData}
                        currentUserId={currentUserId}
                        showTimeline={true}
                      />
                    </div>
                  );
                }
              }
            }

            // Fallback for any other unexpected item types
            console.warn("Unknown feed item type:", item);
            return null;
          })}
          {/* Show loading state for filter switching */}
          {filterSwitching && (
            <div className="flex justify-center items-center py-4">
              <Loader2 className="h-5 w-5 animate-spin mr-2" />
              <span className="text-sm text-muted-foreground">Filtering...</span>
            </div>
          )}

          {filteredFeedItems.length === 0 && !isInitialLoading && !filterSwitching && (
            <div className="text-center py-12">
              <div className="text-muted-foreground mb-2">
                {feedFilter === 'all' && "No activity yet. Be the first to create something!"}
                {feedFilter === 'initiatives' && "No initiatives found. Create your first initiative!"}
                {feedFilter === 'generalPosts' && "No posts found. Share something with the community!"}
                {feedFilter === 'ideas' && "No ideas found. Submit your first idea!"}
                {feedFilter === 'issues' && "No issues found. Report your first issue!"}
                {feedFilter === 'community' && "No community activity yet."}
              </div>
              {feedFilter !== 'all' && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleTabSwitch('all')}
                  className="text-xs mt-2"
                >
                  Show all activity
                </Button>
              )}
            </div>
          )}

          {/* Load More Button */}
          {hasMore && allFeedItems.length > 0 && !filterSwitching && (
            <div className="flex justify-center py-8 w-full">
              <Button
                onClick={loadMorePosts}
                disabled={loadingMore}
                variant="outline"
                className="min-w-32"
              >
                {loadingMore ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Loading...
                  </>
                ) : (
                  'Load More Posts'
                )}
              </Button>
            </div>
          )}
            </div>
          </div>

          {/* Right Sidebar - Local Content & Smart Suggestions */}
          <aside className="hidden xl:block flex-shrink-0 w-80 xl:w-96 pl-6 pr-6">
            {/* NewsColumn TEMPORARILY DISABLED - Will be re-enabled with improved MVP news (actionable local/global news) */}
            {/* <NewsColumn limit={5} showMore={showMoreNews} onShowMore={() => setShowMoreNews(!showMoreNews)} /> */}

            {/* Local Content Section */}
            <div>
              <LocationBasedWidget />
            </div>

            {/* Smart Suggestions Section */}
            <div className="mt-6">
              <SmartSuggestionsWidget />
            </div>
          </aside>
        </div>
      </div>

      {/* Collapsible Post Composer - Fixed at bottom */}
      <CollapsiblePostComposer
        onPostCreated={handlePostCreated}
        onSuccess={handlePostCreated}
        context="general"
      />
    </div>
  );
}