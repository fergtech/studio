import { PrismaClient, InitiativeStatus } from '@prisma/client'; // Import PrismaClient and necessary enums
import { InitiativeCard } from "@/components/InitiativeCard";
import { GeneralPostCard } from "@/components/GeneralPostCard";
import CreatePostForm from "@/components/CreatePostForm";
// FeedItem type might need adjustment or can be inferred if not too complex
import type { Initiative as PrismaInitiative, GeneralPost as PrismaGeneralPost, User as PrismaUser, MediaItem as PrismaMediaItem } from '@prisma/client';
import { prisma } from '@/lib/prisma';

// Temporary mock user avatars for fallback
const mockUserAvatars: Record<string, string | undefined> = {
  "user1": "https://i.pravatar.cc/40?u=user1",
  "user3": "https://i.pravatar.cc/40?u=user3",
  "user5": "https://i.pravatar.cc/40?u=user5",
  "user7": "https://i.pravatar.cc/40?u=user7",
  // Add more if you have specific IDs you want to mock for users who might not have DB images yet
};

// Define extended types that include the relations we'll fetch
type InitiativeWithCreator = PrismaInitiative & { creator: PrismaUser | null };
type GeneralPostWithCreatorAndMedia = PrismaGeneralPost & { creator: PrismaUser | null; media: PrismaMediaItem[] };

// Union type for feed items from the database
type FeedItemDb = InitiativeWithCreator | GeneralPostWithCreatorAndMedia;

async function getFeedItems(): Promise<FeedItemDb[]> {
  const initiatives = await prisma.initiative.findMany({
    include: {
      creator: true, // Include the creator user data
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  const generalPosts = await prisma.generalPost.findMany({
    include: {
      creator: true, // Include the creator user data
      media: true,   // Include associated media items
    },
    orderBy: {
      timestamp: 'desc',
    },
  });

  // Combine and sort. Prisma Date objects can be compared directly or using getTime()
  const feedItems: FeedItemDb[] = [...initiatives, ...generalPosts].sort((a, b) => {
    const timeA = 'createdAt' in a ? a.createdAt.getTime() : a.timestamp.getTime();
    const timeB = 'createdAt' in b ? b.createdAt.getTime() : b.timestamp.getTime();
    return timeB - timeA;
  });

  return feedItems;
}

// Helper function to check if an item is a GeneralPost (adjust for Prisma types)
function isGeneralPost(item: FeedItemDb): item is GeneralPostWithCreatorAndMedia {
  return 'content' in item && !('title' in item && 'status' in item); // Differentiate based on unique fields
}

// Create a new client component for the feed
import { HomeClient } from '@/components/HomeClient';

export default async function Home() {
  const feedItems = await getFeedItems();

  return <HomeClient feedItems={feedItems} />;
}
