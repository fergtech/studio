'use client';

import { InitiativeCard } from "@/components/InitiativeCard";
import { GeneralPostCard } from "@/components/GeneralPostCard";
import CreatePostForm from "@/components/CreatePostForm";
import type { Initiative as PrismaInitiative, GeneralPost as PrismaGeneralPost, User as PrismaUser, MediaItem as PrismaMediaItem } from '@prisma/client';
import type { GeneralPost, Initiative, Role, SkillRoleType, InitiativeStatus, UserForDisplay } from '@/lib/types';

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
type FeedItemDb = InitiativeWithCreator | GeneralPostWithCreatorAndMedia;

// Helper function to check if an item is a GeneralPost
function isGeneralPost(item: FeedItemDb): item is GeneralPostWithCreatorAndMedia {
  return 'content' in item && !('title' in item && 'status' in item);
}

interface HomeClientProps {
  feedItems: FeedItemDb[];
}

export function HomeClient({ feedItems }: HomeClientProps) {
  const handlePostCreated = async () => {
    // This will be handled by the server action in CreatePostForm
    window.location.reload(); // Simple refresh for now
  };

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
              <GeneralPostCard post={displayPost} />
            </div>
          );
        } else {
          const initiativeItem = item as InitiativeWithCreator;
          const initiativeCreatorName = initiativeItem.creator?.name || 'Unknown Creator';
          const initiativeCreatorAvatar = initiativeItem.creator?.image || mockUserAvatars[initiativeItem.creatorId] || "https://i.pravatar.cc/40?u=unknown";

          const processedRoles: Role[] = (initiativeItem.roles || []).map((roleString, index) => ({
            id: `feed-role-${initiativeItem.id}-${index}-${roleString.replace(/\s+/g, '-')}`,
            title: roleString,
            description: `Skill/Tag: ${roleString}`,
            type: 'other' as SkillRoleType,
          }));

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
            updatedAt: initiativeItem.createdAt, // Use createdAt as updatedAt is not in InitiativeWithCreator from feed query
            creatorId: initiativeItem.creatorId,
            roles: processedRoles,
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
              />
            </div>
          );
        }
      })}
      {feedItems.length === 0 && (
        <p className="text-center text-gray-500">No posts or initiatives yet. Be the first to create one!</p>
      )}
    </div>
  );
}