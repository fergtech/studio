'use client';

import React, { useState, useEffect } from 'react'; // Import React hooks
import { InitiativeCard } from "@/components/InitiativeCard";
import { GeneralPostCard } from "@/components/GeneralPostCard";
import CreatePostForm from "@/components/CreatePostForm";
import type { Initiative as PrismaInitiative, GeneralPost as PrismaGeneralPost, User as PrismaUser, MediaItem as PrismaMediaItem, Issue as PrismaIssue, Idea as PrismaIdea } from '@prisma/client';
import type { GeneralPost, Initiative, Role, SkillRoleType, InitiativeStatus, UserForDisplay } from '@/lib/types';
import { formatDistanceToNow, parseISO } from 'date-fns';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import Link from 'next/link';
import { Button } from "@/components/ui/button";
import { Star } from "lucide-react";
import { PostActions } from '@/components/PostActions';
import { IdeaCard } from "@/components/IdeaCard";

// Temporary mock user avatars for fallback
const mockUserAvatars: Record<string, string | undefined> = {
  "user1": "https://i.pravatar.cc/40?u=user1",
  "user3": "https://i.pravatar.cc/40?u=user3",
  "user5": "https://i.pravatar.cc/40?u=user5",
  "user7": "https://i.pravatar.cc/40?u=user7",
};

// Define extended types that include the relations we'll fetch
type InitiativeWithCreator = PrismaInitiative & { creator: PrismaUser | null };
type GeneralPostWithCreatorAndMedia = PrismaGeneralPost & { creator: PrismaUser | null; media: PrismaMediaItem[] };
type IssueWithCreator = PrismaIssue & { creator: PrismaUser | null; media: PrismaMediaItem[]; championCount: number };
type IdeaWithCreator = PrismaIdea & { creator: PrismaUser | null; media: PrismaMediaItem[]; championCount: number };

type FeedItemDb = InitiativeWithCreator | GeneralPostWithCreatorAndMedia | IssueWithCreator | IdeaWithCreator;

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

interface HomeClientProps {
  // feedItems: FeedItemDb[]; // Removed as HomeClient will fetch its own data
  currentUserId?: string; // Add currentUserId prop
}

export function HomeClient({ /* feedItems, */ currentUserId }: HomeClientProps) {
  const [feedItems, setFeedItems] = useState<FeedItemDb[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchFeedItems = async () => {
      try {
        setIsLoading(true);
        const response = await fetch('/api/feed'); // Adjust if pagination is needed
        if (!response.ok) {
          throw new Error(`Failed to fetch feed items: ${response.statusText}`);
        }
        const data = await response.json();
        setFeedItems(data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchFeedItems();
  }, []);

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
    <div className="flex flex-col items-center space-y-6 w-full max-w-xl mx-auto">
      <div className="w-full">
        <CreatePostForm onPostCreated={handlePostCreated} />
      </div>

      {feedItems.map((item) => {
        if (isGeneralPost(item)) {
          const postCreatorName = item.creator?.name || 'Anonymous';
          const postCreatorAvatar = item.creator?.image || mockUserAvatars[item.creatorId] || "https://i.pravatar.cc/40?u=anonymous";
          const displayPost: GeneralPost = {
            id: item.id,
            creatorId: item.creatorId,
            creatorName: postCreatorName,
            creatorAvatar: postCreatorAvatar,
            content: item.content,
            timestamp: item.timestamp,
            background: item.background || undefined,
            linkedInitiativeId: item.linkedInitiativeId || undefined,
            media: item.media,
          };
          return (
            <div key={item.id} className="w-full">
              <GeneralPostCard post={displayPost} currentUserId={currentUserId} />
            </div>
          );
        } else if (isInitiative(item)) { // Added this else if for Initiatives
          const initiativeItem = item;
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
          };

          return (
            <div key={initiativeItem.id} className="w-full">
              <InitiativeCard
                initiative={initiativeForCard}
                creatorName={initiativeCreatorName}
                creatorAvatarUrl={initiativeCreatorAvatar}
                currentUserId={currentUserId}
              />
            </div>
          );
        } else if (isTaggedContent(item)) { // This block handles both Issue and Idea
            const taggedItem = item; // Type is now IssueWithCreator | IdeaWithCreator
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

            const isCurrentItemAnIssue = ('location' in taggedItem) && (taggedItem.location !== null) && (taggedItem.location !== undefined);
            
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


            return (
              <div key={taggedItem.id} className="relative mb-4 rounded-lg overflow-hidden shadow-lg flex flex-col text-card-foreground aspect-[9/12]">
                {/* Media Layer (or background if no media) */}
                {hasMedia && mediaUrl ? (
                  <div
                    className="absolute inset-0 bg-cover bg-center z-0"
                    style={{ backgroundImage: `url(${mediaUrl})` }}
                  >
                    <div className="absolute inset-0 bg-black/30 z-10"></div>
                  </div>
                ) : (
                  <div className="absolute inset-0 bg-gradient-to-r from-purple-500 to-blue-500 z-0">
                    <div className="absolute inset-0 bg-black/30 z-10"></div>
                  </div>
                )}

                {/* Content Layer */}
                <div className="relative z-20 flex flex-col flex-grow p-4">
                  {/* Header (Creator Info + Type Badge) */}
                  <div className="flex items-center justify-between mb-auto">
                    <div className="flex items-center space-x-2">
                      <Link 
                        href={`/profile/${taggedItem.creatorId}`}
                        className="relative hover:opacity-80 transition-opacity"
                      >
                        <Avatar className="h-9 w-9 border-2 border-white/80">
                          <AvatarImage src={taggedItemCreatorAvatar} alt={taggedItemCreatorName} />
                          <AvatarFallback>{taggedItemCreatorName.substring(0, 2).toUpperCase()}</AvatarFallback>
                        </Avatar>
                      </Link>
                      <div>
                        <Link 
                          href={`/profile/${taggedItem.creatorId}`}
                          className="hover:underline"
                        >
                          <p className="text-sm font-medium text-white/90">{taggedItemCreatorName}</p>
                        </Link>
                        <p className="text-xs text-white/70">{timeAgo}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge variant={isCurrentItemAnIssue ? "destructive" : "default"} className="bg-white/20 text-white border-none backdrop-blur-sm">
                        {isCurrentItemAnIssue ? "Issue" : "Idea"}
                      </Badge>
                      {currentUserId && taggedItem.creatorId === currentUserId && (
                        <PostActions
                          postId={taggedItem.id}
                          postType={isCurrentItemAnIssue ? "issue" : "idea"}
                          onEdit={() => console.log("Edit", isCurrentItemAnIssue ? "issue" : "idea", taggedItem.id)}
                          onDelete={async () => console.log("Delete", isCurrentItemAnIssue ? "issue" : "idea", taggedItem.id)}
                          className="ml-2"
                          post={postForActions}
                        />
                      )}
                    </div>
                  </div>

                  {/* Main Content Text (Title + Description) */}
                  <div className="my-4 text-center text-white">
                    <h3 className="text-xl font-bold mb-1 line-clamp-2">{taggedItem.title}</h3>
                    <p className="text-sm opacity-90 line-clamp-3">{taggedItem.description}</p>
                  </div>

                  {/* Footer (Champion Count, etc.) */}
                  <div className="mt-auto flex justify-center items-center space-x-4 text-white">
                    <div className="flex items-center space-x-1">
                      <Button variant="ghost" size="icon" className="text-white/80 hover:text-white hover:bg-white/10" onClick={() => console.log('Champion clicked')}>
                        <Star className="h-5 w-5 fill-current" />
                      </Button>
                      <span className="text-sm font-medium">{taggedItem.championCount || 0}</span>
                    </div>
                    {/* You can add more actions like comments/share here if needed */}
                  </div>
                </div>
              </div>
            );

        } else {
          // Fallback for any other unexpected item types
          console.warn("Unknown feed item type:", item);
          return null; // Or render a generic error card
        }
      })}
      {feedItems.length === 0 && (
        <p className="text-center text-gray-500">No posts or initiatives yet. Be the first to create one!</p>
      )}
    </div>
  );
}