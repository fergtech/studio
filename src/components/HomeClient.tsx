'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react'; // Import React hooks
import ResourcesWidget from '@/components/ResourcesWidget';
import AppSidebar from '@/components/AppSidebar';
import { useRouter } from 'next/navigation';
import { InitiativeCard } from "@/components/InitiativeCard";
import { CompactInitiativeCard } from "@/components/CompactInitiativeCard";
import { GeneralPostCard } from "@/components/GeneralPostCard";
import { CompactPostCard } from "@/components/CompactPostCard";
import { MobileFeedCard } from "@/components/MobileFeedCard";
import { MobileFeedCardWrapper } from "@/components/MobileFeedCardWrapper";
import { MobileDebateCard } from "@/components/MobileDebateCard";
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
import { Star, Loader2, Target, Filter, Users } from "lucide-react";
import { PostActions } from '@/components/PostActions';
import { IdeaCard } from "@/components/IdeaCard";
import { IssueCard } from "@/components/IssueCard";
import { CompactIdeaCard } from "@/components/CompactIdeaCard";
import { CompactIssueCard } from "@/components/CompactIssueCard";
import ActivityFeed from "@/components/ActivityFeed";
import { useToast } from "@/hooks/use-toast";
import { useWindowScrollPosition } from "@/hooks/useScrollPosition";
import { restoreScrollPosition } from "@/utils/navigation";
// import { io, Socket } from 'socket.io-client'; // Temporarily disabled for Vercel deployment
import { MainFeedSocietyPostCard } from './MainFeedSocietyPostCard';
import { CompactSocietyPostCard } from './CompactSocietyPostCard';
import { SocietyCard } from './SocietyCard';
import { DebateTopicCard } from './DebateTopicCard';
import { TrendingTopicsWidget } from './TrendingTopicsWidget';
import { HotTakeBattleCard } from './HotTakeBattleCard';
import { CompactHotTakeBattleCard } from './CompactHotTakeBattleCard';
import { useModal } from '@/context/ModalContext';
import LocationBasedWidget from './LocationBasedWidget';
import SmartSuggestionsWidget from './SmartSuggestionsWidget';
import { TikTokHomeFeed } from './TikTokHomeFeed';
import { useIsMobile } from '@/hooks/useIsMobile';
import { TikTokPostDetail } from './TikTokPostDetail';
import { TikTokIssueDetail } from './TikTokIssueDetail';
import { TikTokIdeaDetail } from './TikTokIdeaDetail';
import { usePullToRefresh } from '@/hooks/usePullToRefresh';
import { PullToRefreshIndicator } from './PullToRefresh';
import { PostStatsProvider } from '@/context/PostStatsContext';
import { OnboardingModal } from './OnboardingModal';
import { useSnapScroll } from '@/hooks/useSnapScroll';

// Define extended types that include the relations we'll fetch
type InitiativeWithCreator = PrismaInitiative & {
  creator: PrismaUser | null;
  society: { id: string; name: string; image: string | null } | null;
  memberships?: any[];
  updates?: any[];
  chatMessages?: any[];
  goals?: any[];
  milestones?: any[];
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
    username: string | null; // Match MetaActionCard type
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
    username: string | null; // Match MetaActionCard type
  };
  following: {
    id: string;
    name: string | null;
    image: string | null;
    username: string | null; // Match MetaActionCard type
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
    username: string | null; // Match MetaActionCard type
  };
  initiative: {
    id: string;
    title: string;
  };
}

// Unified feed item types
type FeedItemType = 'initiative' | 'generalPost' | 'societyPost' | 'issue' | 'idea' | 'debate' | 'hotTakeBattle' | 'update' | 'follow' | 'initiativeJoin' | 'societyCreate' | 'live-news';

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

function isContentItem(item: UnifiedFeedItem): item is UnifiedFeedItem & { type: 'initiative' | 'generalPost' | 'societyPost' | 'societyCreate' | 'issue' | 'idea' | 'debate' | 'hotTakeBattle' } {
  return ['initiative', 'generalPost', 'societyPost', 'societyCreate', 'issue', 'idea', 'debate', 'hotTakeBattle'].includes(item.type);
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


type FeedFilterType = 'all' | 'initiatives' | 'societies' | 'generalPosts' | 'debates' | 'ideas' | 'issues' | 'community';

export function HomeClient({ currentUserId, username }: HomeClientProps) {

  const router = useRouter();
  const [allFeedItems, setAllFeedItems] = useState<UnifiedFeedItem[]>([]);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [feedFilter, setFeedFilter] = useState<FeedFilterType>('debates');
  const [filterSwitching, setFilterSwitching] = useState(false);
  const { toast } = useToast();
  const { openCreateBattleResponseModal, openCreateSocietyModal, openCreateInitiativeModal } = useModal();
  const [showMoreNews, setShowMoreNews] = useState(false);

  // Sidebar collapsed state for desktop
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    // Use 'home' context for HomeClient
    if (typeof window !== 'undefined' && window.localStorage) {
      const stored = localStorage.getItem('sidebarCollapsed:home');
      if (stored !== null) return stored === 'true';
    }
    // Default to AppSidebar logic
    return false;
  });

  // TikTok Post Detail Modal State
  const [selectedPost, setSelectedPost] = useState<any>(null);
  const [isTikTokDetailOpen, setIsTikTokDetailOpen] = useState(false);

  // TikTok Issue Detail Modal State
  const [selectedIssue, setSelectedIssue] = useState<any>(null);
  const [isTikTokIssueDetailOpen, setIsTikTokIssueDetailOpen] = useState(false);

  // TikTok Idea Detail Modal State
  const [selectedIdea, setSelectedIdea] = useState<any>(null);
  const [isTikTokIdeaDetailOpen, setIsTikTokIdeaDetailOpen] = useState(false);

  // Onboarding Modal State
  const [showOnboarding, setShowOnboarding] = useState(false);

  // Infinite scroll ref
  const infiniteScrollRef = useRef<HTMLDivElement | null>(null);

  // Snap scroll for feed container
  const feedContainerRef = useRef<HTMLDivElement | null>(null);
  const { onScroll } = useSnapScroll(feedContainerRef);

  // Desktop app-shell mode: keep the feed as the primary scroll target.
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const html = document.documentElement;
    const body = document.body;
    const previousHtmlOverflowY = html.style.overflowY;
    const previousBodyOverflowY = body.style.overflowY;
    const mediaQuery = window.matchMedia('(min-width: 1024px)');

    const updateDesktopScrollLock = (isDesktop: boolean) => {
      if (isDesktop) {
        html.style.overflowY = 'hidden';
        body.style.overflowY = 'hidden';
      } else {
        html.style.overflowY = previousHtmlOverflowY;
        body.style.overflowY = previousBodyOverflowY;
      }
    };

    updateDesktopScrollLock(mediaQuery.matches);

    const handleMediaQueryChange = (event: MediaQueryListEvent) => {
      updateDesktopScrollLock(event.matches);
    };

    if (typeof mediaQuery.addEventListener === 'function') {
      mediaQuery.addEventListener('change', handleMediaQueryChange);
    } else {
      mediaQuery.addListener(handleMediaQueryChange);
    }

    return () => {
      if (typeof mediaQuery.removeEventListener === 'function') {
        mediaQuery.removeEventListener('change', handleMediaQueryChange);
      } else {
        mediaQuery.removeListener(handleMediaQueryChange);
      }

      html.style.overflowY = previousHtmlOverflowY;
      body.style.overflowY = previousBodyOverflowY;
    };
  }, []);

  // Check onboarding status on mount (only for authenticated users)
  useEffect(() => {
    if (!currentUserId) return;

    const checkOnboardingStatus = async () => {
      try {
        const response = await fetch('/api/user/onboarding');
        if (response.ok) {
          const data = await response.json();
          // Show onboarding if not complete
          if (!data.isOnboardingComplete) {
            setShowOnboarding(true);
          }
        }
      } catch (error) {
        console.error('Error checking onboarding status:', error);
      }
    };

    checkOnboardingStatus();
  }, [currentUserId]);

  // Deduplicate feed items by ID (keep first occurrence)
  const deduplicatedFeedItems = allFeedItems.reduce((acc, item) => {
    const isDuplicate = acc.some(existingItem => existingItem.id === item.id);
    if (!isDuplicate) {
      acc.push(item);
    }
    return acc;
  }, [] as UnifiedFeedItem[]);

  // Filter feed items based on selected filter - Instant client-side filtering
  const filteredFeedItems = deduplicatedFeedItems.filter((item) => {
    // Show all content types in mixed feed
    return true;
  });

  // Add this handler in HomeClient
  const handlePostDeleted = (postId: string) => {
    setAllFeedItems(prev => prev.filter(item => !(isContentItem(item) && isGeneralPost(item.data as any) && item.data.id === postId)));
  };

  // Handle opening posts in TikTok-style detail modal
  const handlePostClick = (post: any) => {
    // Extract media URL from the media array
    const mediaUrl = post.media && post.media.length > 0 ? post.media[0].url :
                    (post.mediaUrl && typeof post.mediaUrl === 'string') ? post.mediaUrl :
                    undefined;

    // Extract media type from the media array
    const mediaType = post.media && post.media.length > 0 ? post.media[0].type :
                     post.mediaType;

    // Transform GeneralPost to TikTokPost format
    const transformedPost = {
      id: post.id,
      content: post.content,
      title: post.title,
      type: post.type || 'general' as const,
      mediaUrl: mediaUrl,
      mediaType: mediaType,
      userId: post.creatorId,
      user: {
        id: post.creatorId,
        name: post.creatorName || 'Anonymous',
        username: post.creatorName?.toLowerCase().replace(/\s+/g, '') || 'anonymous',
        image: post.creatorAvatar
      },
      createdAt: post.timestamp || post.createdAt || new Date().toISOString(),
      likes: post.likes || post._count?.likes || 0,
      shares: post.shares || post._count?.shares || 0,
      comments: post.comments || [],
      isLiked: post.isLiked || false,
      isShared: post.isShared || false,
      // Pass society/initiative information
      linkedInitiativeId: post.linkedInitiativeId,
      society: post.society ? {
        id: post.society.id || post.societyId,
        name: post.society.name
      } : null,
      initiative: post.linkedInitiativeId && post.initiative ? {
        id: post.initiative.id || post.linkedInitiativeId,
        name: post.initiative.name
      } : null
    };

    setSelectedPost(transformedPost);
    setIsTikTokDetailOpen(true);
  };

  // Handle opening issues in TikTok-style detail modal
  const handleIssueClick = (issue: any) => {
    // Extract media URL from the media array
    const mediaUrl = issue.media && issue.media.length > 0 ? issue.media[0].url : undefined;
    const mediaType = issue.media && issue.media.length > 0 ? issue.media[0].type : undefined;

    // Transform Issue to TikTokIssue format
    const transformedIssue = {
      id: issue.id,
      title: issue.title,
      description: issue.description,
      location: issue.location,
      tags: issue.tags || [],
      mediaUrl: mediaUrl,
      mediaType: mediaType,
      userId: issue.creatorId,
      user: {
        id: issue.creatorId,
        name: issue.creator?.name || 'Anonymous',
        username: issue.creator?.name?.toLowerCase().replace(/\s+/g, '') || 'anonymous',
        image: issue.creator?.image
      },
      createdAt: issue.createdAt || new Date().toISOString(),
      interests: 0, // Will be loaded from API
      shares: 0, // Will be loaded from API
      comments: [], // Will be loaded from API
      championCount: issue.championCount || 0,
      isInterested: false,
      isShared: false,
      championedBy: issue.championedBy,
      championedByInitiativeId: issue.championedByInitiativeId
    };

    setSelectedIssue(transformedIssue);
    setIsTikTokIssueDetailOpen(true);
  };

  // Handle opening ideas in TikTok-style detail modal
  const handleIdeaClick = (idea: any) => {
    // Extract media URL from the media array
    const mediaUrl = idea.media && idea.media.length > 0 ? idea.media[0].url : undefined;
    const mediaType = idea.media && idea.media.length > 0 ? idea.media[0].type : undefined;

    // Transform Idea to TikTokIdea format (similar to Issue)
    const transformedIdea = {
      id: idea.id,
      title: idea.title,
      description: idea.description,
      location: idea.location,
      tags: idea.tags || [],
      mediaUrl: mediaUrl,
      mediaType: mediaType,
      userId: idea.creatorId,
      user: {
        id: idea.creatorId,
        name: idea.creator?.name || 'Anonymous',
        username: idea.creator?.name?.toLowerCase().replace(/\s+/g, '') || 'anonymous',
        image: idea.creator?.image
      },
      createdAt: idea.createdAt || new Date().toISOString(),
      likes: 0, // Will be loaded from API
      shares: 0, // Will be loaded from API
      comments: [], // Will be loaded from API
      championCount: idea.championCount || 0,
      isLiked: false,
      isShared: false,
      championedBy: idea.championedBy,
      championedByInitiativeId: idea.championedByInitiativeId
    };

    setSelectedIdea(transformedIdea);
    setIsTikTokIdeaDetailOpen(true);
  };

  // Pull-to-refresh handler
  const handleRefresh = useCallback(async () => {
    try {
      const response = await fetch(`/api/feed?unified=true&limit=20&type=content`);
      if (!response.ok) {
        throw new Error(`Failed to fetch feed items: ${response.statusText}`);
      }
      const data = await response.json();

      // Handle both new paginated format and legacy format
      if (data.items && data.pagination) {
        setAllFeedItems(data.items);
        setNextCursor(data.pagination.nextCursor);
        setHasMore(data.pagination.hasMore);
      } else {
        setAllFeedItems(Array.isArray(data) ? data : []);
        setHasMore(false);
      }
    } catch (err: any) {
      console.error('Error refreshing feed:', err);
    }
  }, []);

  // Pull-to-refresh hook (only on mobile) - DISABLED due to scroll conflicts
  const isMobile = useIsMobile();
  // const { isPulling, isRefreshing, pullDistance, progress } = usePullToRefresh({
  //   onRefresh: handleRefresh,
  //   threshold: 120,
  // });
  const isPulling = false;
  const isRefreshing = false;
  const pullDistance = 0;
  const progress = 0;

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

        // Fetch all content but exclude news (news column is disabled)
        const response = await fetch(`/api/feed?unified=true&limit=20&type=content`);
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
    const handleScrollToTop = () => {
      if (feedContainerRef.current) {
        feedContainerRef.current.scrollTo({ top: 0, behavior: 'smooth' });
      }
    };

    const handleFeedItemCreated = (event: CustomEvent) => {
      const item = event.detail;
      console.log('[HomeClient] feed:itemCreated event received:', item);

      // Infer type based on item shape - improve the logic to correctly distinguish all content types
      let type: FeedItemType | undefined;

      // Check for debate topics first (they have votes/arguments arrays, title, and content)
      // More robust check: votes and arguments should be arrays, not just present
      if (
        'votes' in item &&
        'arguments' in item &&
        'title' in item &&
        'content' in item &&
        !('status' in item) &&
        Array.isArray(item.votes) &&
        Array.isArray(item.arguments)
      ) {
        type = 'debate';
      } else if ('status' in item && 'roles' in item) {
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

    const handleFeedItemDeleted = (event: CustomEvent) => {
      const { id } = event.detail;
      setAllFeedItems(prev => prev.filter(item => item.id !== id));
    };

    window.addEventListener('feed:scrollToTop', handleScrollToTop);
    window.addEventListener('feed:itemCreated', handleFeedItemCreated as EventListener);
    window.addEventListener('feed:itemDeleted', handleFeedItemDeleted as EventListener);

    return () => {
      window.removeEventListener('feed:scrollToTop', handleScrollToTop);
      window.removeEventListener('feed:itemCreated', handleFeedItemCreated as EventListener);
      window.removeEventListener('feed:itemDeleted', handleFeedItemDeleted as EventListener);
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
      // Load content without news since we filter client-side
      const url = `/api/feed?unified=true&limit=20&cursor=${nextCursor}&type=content`;
      
      // Add timeout to prevent hanging
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
      
      const response = await fetch(url, { 
        signal: controller.signal,
        cache: 'no-store' // Prevent stale data on mobile
      });
      
      clearTimeout(timeoutId);

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
        setHasMore(false); // Stop trying if request fails
      }
    } catch (error) {
      // Handle abort errors gracefully
      if (error instanceof Error && error.name === 'AbortError') {
        console.warn('Feed request timed out - network may be slow');
      } else {
        console.error('Error loading more posts:', error);
      }
      setHasMore(false); // Stop trying on network error
    } finally {
      setLoadingMore(false);
    }
  }, [hasMore, loadingMore, nextCursor]);

  // Basic scroll position saving (auto-restore disabled due to performance issues)
  const saveScrollPosition = () => {
    const position = {
      scrollTop: window.scrollY,
      scrollLeft: window.scrollX,
      timestamp: Date.now()
    };
    // Scroll position saved for future enhancement
  };

  // Infinite scroll observer - auto-load more when sentinel is visible
  useEffect(() => {
    if (!hasMore || loadingMore || filterSwitching) return;

    let timeout: NodeJS.Timeout | null = null;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !loadingMore) {
          // Debounce to prevent rapid-fire loads
          if (timeout) clearTimeout(timeout);
          timeout = setTimeout(() => {
            loadMorePosts();
          }, 300);
        }
      },
      { root: null, rootMargin: '400px', threshold: 0 }
    );

    const target = infiniteScrollRef.current;
    if (target) observer.observe(target);

    return () => {
      if (timeout) clearTimeout(timeout);
      if (target) observer.unobserve(target);
    };
  }, [hasMore, loadingMore, filterSwitching, loadMorePosts]);

  const handlePostCreated = async (post?: any) => {
    console.log('[HomeClient] handlePostCreated called with post:', post);

    // Dispatch custom event to immediately add post to feed
    if (post) {
      // Ensure userId is set (post already has creator info from server)
      const enrichedPost = {
        ...post,
        creatorId: post.creatorId || currentUserId,
        authorId: post.authorId || currentUserId,
      };

      console.log('[HomeClient] Dispatching feed:itemCreated event with enriched post:', enrichedPost.id);
      window.dispatchEvent(new CustomEvent('feed:itemCreated', { detail: enrichedPost }));
    } else {
      console.warn('[HomeClient] No post data received, only refreshing router');
    }

    // Also refresh server data for widgets and counts
    router.refresh();
  };

  if (isInitialLoading) {
    return <div className="flex justify-center items-center min-h-screen">Loading feed...</div>;
  }

  if (error) {
    return <div className="flex justify-center items-center min-h-screen text-red-500">Error loading feed: {error}</div>;
  }

  return (
    <div className="w-full min-w-0 overflow-hidden relative lg:h-[100dvh] lg:max-h-[100dvh]">
      {/* AppSidebar for desktop (hidden on mobile) */}
      <AppSidebar
        className="hidden lg:flex"
        widgets={['userControls', 'navigation', 'resources', 'footer']}
        context={{ type: 'home' }}
        onCollapseChange={(collapsed: boolean) => {
          setSidebarCollapsed(collapsed);
          if (typeof window !== 'undefined' && window.localStorage) {
            localStorage.setItem('sidebarCollapsed:home', String(collapsed));
          }
        }}
      />

      {/* Main Content Area - with top padding for mobile navigation, and left margin for sidebar on desktop */}
      <div
        className={`min-w-0 transition-all duration-300 pt-3 lg:pt-2 lg:h-full lg:overflow-hidden ${sidebarCollapsed ? 'lg:ml-16' : 'lg:ml-72 xl:ml-80'}`}
      >
        {/* Pull-to-refresh indicator (mobile only) */}
        {isMobile && (
          <PullToRefreshIndicator
        isPulling={isPulling}
        isRefreshing={isRefreshing}
        pullDistance={pullDistance}
        progress={progress}
          />
        )}

        {/* Trending Topics Widget - Full width */}
        <div className="w-full px-2 sm:px-4 lg:px-6 mb-6 hidden">
          <div className="max-w-7xl mx-auto">
        <TrendingTopicsWidget />
          </div>
        </div>

        {/* Main Layout: Feed centered */}
        <div className="flex w-full justify-center h-[calc(100dvh-2rem)] lg:h-full lg:min-h-0">
          {/* Main Feed - Centered */}
          <div className="flex-shrink-0 w-full max-w-3xl h-full">
        <div className="flex flex-col h-full">
          {/* Hero Section - Within feed column - HIDDEN */}
          <div className="w-full mb-2 hidden">
            <div className="relative isolate overflow-hidden rounded-3xl px-6 py-12 sm:py-16 text-center shadow-2xl">
          {/* Background Image with reduced opacity */}
          <div
            className="absolute inset-0 -z-20 bg-cover bg-center opacity-30"
            style={{ backgroundImage: "url('/brooke-cagle-xcgh5_-QIXc-unsplash.jpg')" }}
          />
          {/* Gradient Overlay */}
          <div className="absolute inset-0 -z-10 bg-gradient-to-br from-primary/40 via-purple-500/30 to-blue-500/40" />
          {/* Animated gradient blobs for extra depth */}
          <div className="absolute inset-0 -z-10 transform-gpu overflow-hidden blur-3xl" aria-hidden="true">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[48rem] aspect-[1155/678] bg-gradient-to-tr from-primary to-purple-500 opacity-20"></div>
          </div>
          <div className="mx-auto max-w-2xl relative z-10">
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-white drop-shadow-lg">Turn Ideas into Real Impact</h1>
            <p className="mt-3 sm:mt-4 text-sm sm:text-base leading-6 sm:leading-7 text-white/90 max-w-xl mx-auto drop-shadow-md">
              Connect with neighbors, solve local problems, and build stronger communities together - virtually or in person. Share ideas, raise issues, and create real change.
            </p>
          </div>
            </div>
          </div>
          {/* Feed Filter Controls - Centered Tabs - HIDDEN */}
          <div className="hidden">
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-border scrollbar-track-transparent hover:scrollbar-thumb-primary/50">
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
            className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all duration-200 flex-shrink-0 ${
          feedFilter === 'initiatives'
            ? 'bg-blue-500/10 text-blue-600 border border-blue-500/20 shadow-sm'
            : 'bg-muted/50 text-muted-foreground hover:bg-muted border border-border/50'
            }`}
          >
            Initiatives
          </button>
          <button
            onClick={() => handleTabSwitch('societies')}
            disabled={filterSwitching}
            className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all duration-200 flex-shrink-0 ${
          feedFilter === 'societies'
            ? 'bg-purple-500/10 text-purple-600 border border-purple-500/20 shadow-sm'
            : 'bg-muted/50 text-muted-foreground hover:bg-muted border border-border/50'
            }`}
          >
            Societies
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
            onClick={() => handleTabSwitch('debates')}
            disabled={filterSwitching}
            className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all duration-200 flex-shrink-0 ${
          feedFilter === 'debates'
            ? 'bg-purple-500/10 text-purple-600 border border-purple-500/20 shadow-sm'
            : 'bg-muted/50 text-muted-foreground hover:bg-muted border border-border/50'
            }`}
          >
            Debates
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
            className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all duration-200 flex-shrink-0 hidden ${
          feedFilter === 'community'
            ? 'bg-cyan-500/10 text-cyan-600 border border-cyan-500/20 shadow-sm'
            : 'bg-muted/50 text-muted-foreground hover:bg-muted border border-border/50'
            }`}
          >
            Community
          </button>
        </div>
          </div>

          {/* Mobile-First Feed Container */}
            <div
            ref={feedContainerRef}
            onScroll={onScroll}
            className="flex-1 w-full overflow-y-auto overflow-x-hidden overscroll-contain scroll-smooth px-4 pt-2 lg:pt-6 pb-32 space-y-6 scrollbar-hide"
            style={{
              scrollbarWidth: 'none',
              msOverflowStyle: 'none',
              // WebkitMaskImage: 'linear-gradient(to bottom, rgba(0,0,0,1) 80%, rgba(0,0,0,0) 100%)',
              // maskImage: 'linear-gradient(to bottom, rgba(0,0,0,1) 80%, rgba(0,0,0,0) 100%)'
            }}
            >
            {filteredFeedItems.map((item, index) => {
          // Generate a safe key that works for all item types
          const itemKey = item.id || `item-${index}-${item.type || 'unknown'}`;

          // Handle content items
          if (isContentItem(item)) {
            const contentData = item.data as FeedItemDb;

            // SOCIETY POSTS - Transform to MobileFeedCard
            if (item.type === 'societyPost' && isSocietyPost(item.data)) {
            const societyPostData = item.data as SocietyPostWithUserAndSociety;
            const displayPost: GeneralPost = {
            id: societyPostData.id,
            creatorId: societyPostData.user.id,
            creatorName: societyPostData.user.name,
            creatorAvatar: societyPostData.user.image,
            content: societyPostData.content,
            timestamp: new Date(societyPostData.createdAt),
            media: societyPostData.imageUrl ? [{
            id: `${societyPostData.id}-media`,
            url: societyPostData.imageUrl,
            type: 'image' as const,
            issueId: null,
            ideaId: null
            }] : [],
            society: societyPostData.society,
            };
            return (
            <div key={`${item.type}-${itemKey}`} className="w-full">
            <MobileFeedCard
              post={displayPost}
              currentUserId={currentUserId}
              onPostClick={handlePostClick}
              society={societyPostData.society}
              type="society"
            />
            </div>
            );
            }

            // SOCIETY CREATIONS - SocietyCard
            else if (item.type === 'societyCreate') {
            const societyData = item.data as any;
            return (
            <div key={`${item.type}-${itemKey}`} className="w-full max-w-full">
            <SocietyCard
              society={societyData}
              creatorName={societyData.creator?.name || 'Anonymous'}
              creatorAvatarUrl={societyData.creator?.image || undefined}
              currentUserId={currentUserId || undefined}
              className="mb-4 w-full max-w-full"
            />
            </div>
            );
            }

            // DEBATES - MobileDebateCard
            else if (contentData && isDebate(contentData)) {
            const debateItem = contentData;
            const proVotes = debateItem.votes.filter(v => v.side === 'PRO').length;
            const conVotes = debateItem.votes.filter(v => v.side === 'CON').length;
            const totalVotes = proVotes + conVotes;
            const stats = {
            proVotes,
            conVotes,
            totalVotes,
            proPercentage: totalVotes > 0 ? Math.round((proVotes / totalVotes) * 100) : 0,
            conPercentage: totalVotes > 0 ? Math.round((conVotes / totalVotes) * 100) : 0,
            argumentCount: debateItem.arguments.length,
            };

            const creatorForDebate = debateItem.creator
            ? {
              id: debateItem.creator.id,
              name: debateItem.creator.name || 'Anonymous',
              image: debateItem.creator.image || undefined,
            }
            : {
              id: debateItem.creatorId || 'anonymous-creator',
              name: 'Anonymous',
              image: undefined,
            };

            return (
            <div key={`${item.type}-${itemKey}`} className="w-full">
            <MobileDebateCard
              id={debateItem.id}
              title={debateItem.title}
              content={debateItem.content}
              imageUrl={debateItem.imageUrl || undefined}
              creator={creatorForDebate}
              createdAt={debateItem.createdAt}
              stats={stats}
              currentUserId={currentUserId}
            />
            </div>
            );
            }

            // GENERAL POSTS - MobileFeedCard
            else if (contentData && isGeneralPost(contentData)) {
            const displayPost: GeneralPost = {
            id: contentData.id,
            creatorId: contentData.creatorId,
            creatorName: contentData.creator?.name || 'Anonymous',
            creatorAvatar: contentData.creator?.image || undefined,
            content: contentData.content,
            topics: contentData.topics || [],
            timestamp: contentData.timestamp,
            background: contentData.background || undefined,
            linkedInitiativeId: contentData.linkedInitiativeId || undefined,
            media: contentData.media,
            };
            return (
            <div key={`${item.type}-${itemKey}`} className="w-full">
            <MobileFeedCard
              post={displayPost}
              currentUserId={currentUserId}
              onPostClick={handlePostClick}
              type="general"
            />
            </div>
            );
            }

            // INITIATIVES - InitiativeCard (TikTok-style)
            else if (contentData && isInitiative(contentData)) {
            const initiativeItem = contentData;
            const creatorForCard: UserForDisplay = initiativeItem.creator
            ? {
              id: initiativeItem.creator.id,
              name: initiativeItem.creator.name,
              image: initiativeItem.creator.image,
            }
            : {
              id: initiativeItem.creatorId || 'unknown-creator',
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
            updatedAt: initiativeItem.updatedAt,
            creatorId: initiativeItem.creatorId,
            roles: initiativeItem.roles || [],
            creator: creatorForCard,
            memberships: initiativeItem.memberships || [],
            updates: initiativeItem.updates || [],
            chatMessages: initiativeItem.chatMessages || [],
            goals: initiativeItem.goals || [],
            milestones: initiativeItem.milestones || [],
            societyId: initiativeItem.societyId || null,
            society: initiativeItem.society || null,
            };

            return (
            <div key={`${item.type}-${itemKey}`} className="w-full">
            <InitiativeCard
              initiative={initiativeForCard}
              creatorName={initiativeItem.creator?.name || 'Unknown Creator'}
              creatorAvatarUrl={initiativeItem.creator?.image || undefined}
              currentUserId={currentUserId}
              className="w-full h-[calc(100vh-8rem)] md:h-[600px] md:max-w-md md:mx-auto md:mb-6"
            />
            </div>
            );
            }

            // IDEAS & ISSUES - Transform to MobileFeedCard
            else if (contentData && isTaggedContent(contentData)) {
            const taggedItem = contentData;
            const isCurrentItemAnIssue = item.type === 'issue';
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

            const transformedData = {
            id: taggedItem.id,
            title: taggedItem.title,
            description: taggedItem.description,
            creatorId: taggedItem.creatorId,
            createdAt: taggedItem.createdAt,
            tags: taggedItem.tags || [],
            location: taggedItem.location,
            media: taggedItem.media || [],
            championCount: taggedItem.championCount || 0,
            championedBy: null,
            championedByInitiativeId: taggedItem.championedByInitiativeId,
            creator: creatorForDisplay,
            };

            const displayPost: GeneralPost = {
            id: transformedData.id,
            creatorId: transformedData.creatorId,
            creatorName: transformedData.creator.name || 'Anonymous',
            creatorAvatar: transformedData.creator.image || undefined,
            content: `${transformedData.title}\n\n${transformedData.description}`,
            topics: transformedData.tags,
            timestamp: transformedData.createdAt,
            media: transformedData.media,
            };

            return (
            <div key={`${item.type}-${itemKey}`} className="w-full">
            <MobileFeedCard
              post={displayPost}
              currentUserId={currentUserId}
              onPostClick={() => isCurrentItemAnIssue ? handleIssueClick(transformedData) : handleIdeaClick(transformedData)}
              type={isCurrentItemAnIssue ? "issue" : "idea"}
            />
            </div>
            );
            }
          }

          // Fallback for unknown types
          return null;
            })}
            </div>
          {/* End Mobile-First Scroll Snap Container */}

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
            {feedFilter === 'societies' && "No society activity found. Create your first society!"}
            {feedFilter === 'generalPosts' && "No posts found. Share something with the community!"}
            {feedFilter === 'debates' && "No debates found. Start the first debate!"}
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

          {/* Infinite Scroll Sentinel */}
          {hasMore && allFeedItems.length > 0 && !filterSwitching && (
        <div ref={infiniteScrollRef} className="flex flex-col items-center justify-center py-8 w-full gap-3">
          {loadingMore ? (
            <div className="flex items-center gap-2 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" />
          <span className="text-sm">Loading more...</span>
            </div>
          ) : (
            <>
          <span className="text-sm text-muted-foreground">Scroll to load more</span>
          {/* Fallback manual button */}
          <Button
            onClick={loadMorePosts}
            variant="ghost"
            size="sm"
            className="text-xs text-muted-foreground hover:text-foreground"
          >
            Or click to load
          </Button>
            </>
          )}
        </div>
          )}
          </div>
          </div>

          {/* Right Sidebar - only for logged in users */}
          {currentUserId && (
        <aside className="hidden xl:block flex-shrink-0 w-80 xl:w-96 pl-6 pr-6">
          <div className="border border-border/40 rounded-2xl bg-background/80 backdrop-blur-xl shadow-none p-4 mb-6">
            <LocationBasedWidget />
          </div>
          <div className="border border-border/40 rounded-2xl bg-background/80 backdrop-blur-xl shadow-none p-4">
            <SmartSuggestionsWidget flatStyle />
          </div>
        </aside>
          )}
        </div>
      </div>

      {/* Collapsible Post Composer - Fixed at bottom - HIDDEN FOR V1 */}
      <div className="hidden">
        <CollapsiblePostComposer
          onPostCreated={handlePostCreated}
          onSuccess={handlePostCreated}
          context="general"
          onOpenSocietyModal={openCreateSocietyModal}
          onOpenInitiativeModal={() => openCreateInitiativeModal()}
          onOpenDebateTopicModal={() => router.push('/debates/create')}
        />
      </div>

      {/* TikTok-style Post Detail Modal */}
      {selectedPost && (
        <PostStatsProvider>
          <TikTokPostDetail
            post={selectedPost}
            isOpen={isTikTokDetailOpen}
            onClose={() => {
              setIsTikTokDetailOpen(false);
              setSelectedPost(null);
            }}
          />
        </PostStatsProvider>
      )}

      {/* TikTok-style Issue Detail Modal */}
      {selectedIssue && (
        <TikTokIssueDetail
          issue={selectedIssue}
          isOpen={isTikTokIssueDetailOpen}
          onClose={() => {
            setIsTikTokIssueDetailOpen(false);
            setSelectedIssue(null);
          }}
        />
      )}

      {/* TikTok-style Idea Detail Modal */}
      {selectedIdea && (
        <TikTokIdeaDetail
          idea={selectedIdea}
          isOpen={isTikTokIdeaDetailOpen}
          onClose={() => {
            setIsTikTokIdeaDetailOpen(false);
            setSelectedIdea(null);
          }}
        />
      )}

      {/* Onboarding Modal - shown after registration if not completed */}
      {currentUserId && (
        <OnboardingModal
          open={showOnboarding}
          onClose={() => setShowOnboarding(false)}
          userId={currentUserId}
        />
      )}
    </div>
  );
}
