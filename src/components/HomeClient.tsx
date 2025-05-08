'use client';

import { InitiativeCard } from "@/components/InitiativeCard";
import { GeneralPostCard } from "@/components/GeneralPostCard";
import CreatePostForm from "@/components/CreatePostForm";
import type { Initiative as PrismaInitiative, GeneralPost as PrismaGeneralPost, User as PrismaUser, MediaItem as PrismaMediaItem } from '@prisma/client';
import type { GeneralPost } from '@/lib/types';

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
          const initiativeCreatorName = item.creator?.name || 'Unknown Creator';
          const initiativeCreatorAvatar = item.creator?.image || mockUserAvatars[item.creatorId] || "https://i.pravatar.cc/40?u=unknown";
          const initiativeImageUrl = item.imageUrl || `https://picsum.photos/seed/${item.id}/600/800`;
          
          const displayInitiative = {
            ...item,
            imageUrl: initiativeImageUrl,
          };

          return (
            <div key={item.id} className="w-full">
              <InitiativeCard
                initiative={displayInitiative}
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