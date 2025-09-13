'use client';

import React, { useState, useEffect, useCallback } from 'react'; // Import React hooks
import { InitiativeCard } from "@/components/InitiativeCard";
import { GeneralPostCard } from "@/components/GeneralPostCard";
import { MetaActionCard } from "@/components/MetaActionCard";
import CreatePostForm from "@/components/CreatePostForm";
import type { Initiative as PrismaInitiative, GeneralPost as PrismaGeneralPost, User as PrismaUser, MediaItem as PrismaMediaItem, Issue as PrismaIssue, Idea as PrismaIdea } from '@prisma/client';
import type { GeneralPost, Initiative, Role, SkillRoleType, InitiativeStatus, UserForDisplay } from '@/lib/types';
import { formatDistanceToNow, parseISO } from 'date-fns';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import Link from 'next/link';
import { Button } from "@/components/ui/button";
import { Star, Loader2, Target, Filter } from "lucide-react";
import { PostActions } from '@/components/PostActions';
import { IdeaCard } from "@/components/IdeaCard";
import { IssueCard } from "@/components/IssueCard";
import ActivityFeed from "@/components/ActivityFeed";
import AppSidebar from "@/components/AppSidebar";
import { useToast } from "@/hooks/use-toast";
import { useWindowScrollPosition } from "@/hooks/useScrollPosition";
// import { io, Socket } from 'socket.io-client'; // Temporarily disabled for Vercel deployment
import { MainFeedSocietyPostCard } from './MainFeedSocietyPostCard';
import { DebateTopicsWidget } from './DebateTopicsWidget';
import { DebateTopicCard } from './DebateTopicCard';

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
type FeedItemType = 'initiative' | 'generalPost' | 'societyPost' | 'issue' | 'idea' | 'debate' | 'update' | 'follow' | 'initiativeJoin';

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

interface UnifiedFeedItem {
  type: FeedItemType;
  id: string;
  timestamp: Date;
  data: InitiativeWithCreator | GeneralPostWithCreatorAndMedia | SocietyPostWithUserAndSociety | IssueWithCreator | IdeaWithCreator | DebateTopicWithCreatorAndStats | UpdateWithUserAndInitiative | UserFollowWithUsers | InitiativeMembershipWithUserAndInitiative;
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
type FeedItemDb = InitiativeWithCreator | GeneralPostWithCreatorAndMedia | SocietyPostWithUserAndSociety | IssueWithCreator | IdeaWithCreator | DebateTopicWithCreatorAndStats;

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

// Helper functions for unified feed items
function isMetaAction(item: UnifiedFeedItem): item is UnifiedFeedItem & { type: 'update' | 'follow' | 'initiativeJoin' } {
  return ['update', 'follow', 'initiativeJoin'].includes(item.type);
}

function isContentItem(item: UnifiedFeedItem): item is UnifiedFeedItem & { type: 'initiative' | 'generalPost' | 'societyPost' | 'issue' | 'idea' | 'debate' } {
  return ['initiative', 'generalPost', 'societyPost', 'issue', 'idea', 'debate'].includes(item.type);
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


export function HomeClient({ currentUserId, username }: HomeClientProps) {
  const [feedItems, setFeedItems] = useState<UnifiedFeedItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [feedFilter, setFeedFilter] = useState<'all' | 'initiatives' | 'generalPosts' | 'ideas' | 'issues' | 'community'>('all');
  const { toast } = useToast();
  

  // Filter feed items based on selected filter - Simple and straightforward
  const filteredFeedItems = feedItems.filter((item) => {
    switch (feedFilter) {
      case 'initiatives':
        return item.type === 'initiative' || (isMetaAction(item) && (item.type === 'update' || item.type === 'initiativeJoin'));
      case 'generalPosts':
        return item.type === 'generalPost' || item.type === 'societyPost' || item.type === 'debate';
      case 'ideas':
        return item.type === 'idea';
      case 'issues':
        return item.type === 'issue';
      case 'community':
        return isMetaAction(item) && item.type === 'follow';
      case 'all':
      default:
        return true;
    }
  });

  // Add this handler in HomeClient
  const handlePostDeleted = (postId: string) => {
    setFeedItems(prev => prev.filter(item => !(isContentItem(item) && isGeneralPost(item.data as any) && item.data.id === postId)));
  };

  useEffect(() => {
    const fetchFeedItems = async () => {
      try {
        setIsLoading(true);
        const response = await fetch('/api/feed?unified=true&limit=5');
        if (!response.ok) {
          throw new Error(`Failed to fetch feed items: ${response.statusText}`);
        }
        const data = await response.json();
        
        // Handle both new paginated format and legacy format for backward compatibility
        // Feed response received
        if (data.items && data.pagination) {
          // New cursor-based format
          // Using cursor-based pagination
          setFeedItems(data.items);
          setNextCursor(data.pagination.nextCursor);
          setHasMore(data.pagination.hasMore);
          // Initial state set
        } else {
          // Legacy format - assume it's the items directly
          // Using legacy format
          setFeedItems(Array.isArray(data) ? data : []);
          setHasMore(false); // No pagination info available
          // Legacy state set
        }
      } catch (err: any) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchFeedItems();
  }, []);

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
      // Infer type based on item shape
      let type: FeedItemType | undefined;
      if ('status' in item && 'roles' in item) type = 'initiative';
      else if ('tags' in item && !('content' in item) && !('status' in item)) type = item.title ? 'idea' : 'issue';
      else if ('tags' in item) type = 'issue';
      else if ('type' in item && item.type === 'societyPost') type = 'societyPost';
      else type = 'generalPost';
      const newFeedItem: UnifiedFeedItem = {
        type: type as FeedItemType,
        id: item.id,
        timestamp: new Date(item.createdAt || Date.now()),
        data: item,
      };
      setFeedItems(prev => [newFeedItem, ...prev]);
    };
    window.addEventListener('feed:itemCreated', handleFeedItemCreated as EventListener);
    return () => {
      window.removeEventListener('feed:itemCreated', handleFeedItemCreated as EventListener);
    };
  }, []);

  // Load more posts function (following LazyPostsFeed pattern)
  const loadMorePosts = useCallback(async () => {
    // Loading more posts
    if (!hasMore || loadingMore || !nextCursor) {
      // Cannot load more
      return;
    }
    
    setLoadingMore(true);
    try {
      const url = `/api/feed?unified=true&limit=5&cursor=${nextCursor}`;
      // Fetching more posts
      const response = await fetch(url);
      
      if (response.ok) {
        const data = await response.json();
        // More posts received
        
        if (data.items && data.pagination) {
          // New cursor-based format - filter out duplicates
          setFeedItems(prev => {
            const existingIds = new Set(prev.map(item => {
              if (isContentItem(item) && item.data) {
                return item.data.id;
              }
              return item.id;
            }));
            
            const newItems = data.items.filter(item => {
              const itemId = isContentItem(item) && item.data ? item.data.id : item.id;
              return !existingIds.has(itemId);
            });
            
            // Items added, duplicates filtered
            // Pagination updated
            
            return [...prev, ...newItems];
          });
          
          // Update pagination state
          setNextCursor(data.pagination.nextCursor);
          
          // If no new items after filtering, we've reached the end regardless of API hasMore
          if (data.items.length > 0) {
            const existingIds = new Set(feedItems.map(item => {
              if (isContentItem(item) && item.data) {
                return item.data.id;
              }
              return item.id;
            }));
            
            const newItemsCount = data.items.filter(item => {
              const itemId = isContentItem(item) && item.data ? item.data.id : item.id;
              return !existingIds.has(itemId);
            }).length;
            
            if (newItemsCount === 0) {
              // No new items, reached end
              setHasMore(false);
            } else {
              setHasMore(data.pagination.hasMore);
            }
          } else {
            setHasMore(data.pagination.hasMore);
          }
        }
      } else {
        console.error('Failed to load more posts:', response.status, response.statusText);
      }
    } catch (error) {
      console.error('Error loading more posts:', error);
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


  const handlePostCreated = async () => {
    // This will be handled by the server action in CreatePostForm
    window.location.reload(); // Simple refresh for now
  };

  if (isLoading) {
    return <div className="flex justify-center items-center min-h-screen">Loading feed...</div>;
  }

  if (error) {
    return <div className="flex justify-center items-center min-h-screen text-red-500">Error loading feed: {error}</div>;
  }

  return (
    <div className="w-full min-w-0 overflow-hidden">
      {/* Sidebar */}
      <AppSidebar 
        widgets={['userControls', 'navigation', 'suggestions', 'location', 'resources', 'footer']}
        context={{ type: 'home' }}
        onCollapseChange={setSidebarCollapsed}
      />
      {/* Main Feed - with dynamic left margin based on sidebar state and top padding for mobile sidebar toggle */}
      <div className={`flex flex-col items-center space-y-6 px-4 lg:px-6 min-w-0 transition-all duration-300 pt-20 lg:pt-6 ${
        sidebarCollapsed ? 'lg:ml-16' : 'lg:ml-80 xl:ml-96'
      }`}>
        {/* Debate Topics Widget - Full width with larger max width */}
        <div className="w-full max-w-7xl px-2 lg:px-6 min-w-0">
          <DebateTopicsWidget />
        </div>
        
        <div className="w-full max-w-3xl flex flex-col items-center space-y-6">
          <div className="w-full max-w-[500px]">
            <CreatePostForm onPostCreated={handlePostCreated} />
          </div>
          
          {/* Feed Filter Controls - Modern Pill Style */}
          <div className="w-full max-w-[500px] px-1">
            <div className="flex items-center gap-1 flex-wrap">
              <Filter className="h-4 w-4 text-muted-foreground mr-2" />
              <button
                onClick={() => setFeedFilter('all')}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                  feedFilter === 'all'
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : 'bg-muted/50 text-muted-foreground hover:bg-muted border border-border/50'
                }`}
              >
                All Activity
              </button>
              <button
                onClick={() => setFeedFilter('initiatives')}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 flex items-center gap-2 ${
                  feedFilter === 'initiatives'
                    ? 'bg-blue-500/10 text-blue-600 border border-blue-500/20 shadow-sm'
                    : 'bg-muted/50 text-muted-foreground hover:bg-muted border border-border/50'
                }`}
              >
                <Target className="h-3.5 w-3.5" />
                Initiatives
              </button>
              <button
                onClick={() => setFeedFilter('generalPosts')}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                  feedFilter === 'generalPosts'
                    ? 'bg-green-500/10 text-green-600 border border-green-500/20 shadow-sm'
                    : 'bg-muted/50 text-muted-foreground hover:bg-muted border border-border/50'
                }`}
              >
                Posts
              </button>
              <button
                onClick={() => setFeedFilter('ideas')}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                  feedFilter === 'ideas'
                    ? 'bg-yellow-500/10 text-yellow-600 border border-yellow-500/20 shadow-sm'
                    : 'bg-muted/50 text-muted-foreground hover:bg-muted border border-border/50'
                }`}
              >
                Ideas
              </button>
              <button
                onClick={() => setFeedFilter('issues')}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                  feedFilter === 'issues'
                    ? 'bg-red-500/10 text-red-600 border border-red-500/20 shadow-sm'
                    : 'bg-muted/50 text-muted-foreground hover:bg-muted border border-border/50'
                }`}
              >
                Issues
              </button>
              <button
                onClick={() => setFeedFilter('community')}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                  feedFilter === 'community'
                    ? 'bg-purple-500/10 text-purple-600 border border-purple-500/20 shadow-sm'
                    : 'bg-muted/50 text-muted-foreground hover:bg-muted border border-border/50'
                }`}
              >
                Community
              </button>
            </div>
          </div>
          
          {filteredFeedItems.map((item) => {
            // Handle meta actions
            if (isMetaAction(item)) {
              const metaAction = patchMetaActionUsernames(convertToMetaAction(item));
              return (
                <div key={item.id} className="w-full max-w-[500px]">
                  <MetaActionCard action={metaAction} currentUserId={currentUserId} />
                </div>
              );
            }
            
            // Handle content items
            if (isContentItem(item)) {
              const contentData = item.data as FeedItemDb;
              
              if (item.type === 'societyPost' && isSocietyPost(item.data)) {
                return (
                  <MainFeedSocietyPostCard key={item.id} post={item.data as SocietyPostWithUserAndSociety} />
                );
              } else if (isDebate(contentData)) {
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
                  <div key={debateItem.id} className="w-full max-w-[500px]">
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
              } else if (isGeneralPost(contentData)) {
                const postCreatorName = contentData.creator?.name || 'Anonymous';
                const postCreatorAvatar = contentData.creator?.image || mockUserAvatars[contentData.creatorId] || "https://i.pravatar.cc/40?u=anonymous";
                const displayPost: GeneralPost = {
                  id: contentData.id,
                  creatorId: contentData.creatorId,
                  creatorName: postCreatorName,
                  creatorAvatar: postCreatorAvatar,
                  content: contentData.content,
                  timestamp: contentData.timestamp,
                  background: contentData.background || undefined,
                  linkedInitiativeId: contentData.linkedInitiativeId || undefined,
                  media: contentData.media,
                };
                return (
                  <div key={contentData.id} className="w-full max-w-[500px]">
                    <GeneralPostCard post={displayPost} currentUserId={currentUserId} onPostDeleted={handlePostDeleted} />
                  </div>
                );
              } else if (isInitiative(contentData)) {
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
                  <div key={initiativeItem.id} className="w-full max-w-[500px]">
                    <InitiativeCard
                      initiative={initiativeForCard}
                      creatorName={initiativeCreatorName}
                      creatorAvatarUrl={initiativeCreatorAvatar}
                      currentUserId={currentUserId}
                    />
                  </div>
                );
              } else if (isTaggedContent(contentData)) {
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
                    <div key={taggedItem.id} className="w-full max-w-[500px]">
                      <IssueCard
                        issue={issueData}
                        currentUserId={currentUserId}
                        onIssueDeleted={(issueId) => {
                          // Remove the issue from the feed
                          setFeedItems(prev => prev.filter(item => 
                            !(item.type === 'issue' && item.data.id === issueId)
                          ));
                        }}
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
                    <div key={taggedItem.id} className="w-full max-w-[500px]">
                      <IdeaCard
                        idea={ideaData}
                        currentUserId={currentUserId}
                        onIdeaDeleted={(ideaId) => {
                          // Remove the idea from the feed
                          setFeedItems(prev => prev.filter(item => 
                            !(item.type === 'idea' && item.data.id === ideaId)
                          ));
                        }}
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
          {filteredFeedItems.length === 0 && !isLoading && (
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
                  onClick={() => setFeedFilter('all')}
                  className="text-xs mt-2"
                >
                  Show all activity
                </Button>
              )}
            </div>
          )}
          
          {/* Load More Button */}
          {hasMore && feedItems.length > 0 && (
            <div className="flex justify-center py-8 w-full max-w-[500px]">
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
    </div>
  );
}
