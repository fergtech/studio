import { PrismaClient, InitiativeStatus } from '@prisma/client'; // Import PrismaClient and necessary enums
import { InitiativeCard } from "@/components/InitiativeCard";
import { GeneralPostCard } from "@/components/GeneralPostCard";
import CreatePostForm from "@/components/CreatePostForm";
// FeedItem type might need adjustment or can be inferred if not too complex
import type { Initiative as PrismaInitiative, GeneralPost as PrismaGeneralPost, User as PrismaUser, MediaItem as PrismaMediaItem } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { getServerSession } from "next-auth/next"; // Import getServerSession
import { authOptions } from "@/app/api/auth/[...nextauth]/route"; // Import authOptions

// Temporary mock user avatars for fallback
const mockUserAvatars: Record<string, string | undefined> = {
  "user1": "https://i.pravatar.cc/40?u=user1",
  "user3": "https://i.pravatar.cc/40?u=user3",
  "user5": "https://i.pravatar.cc/40?u=user5",
  "user7": "https://i.pravatar.cc/40?u=user7",
  // Add more if you have specific IDs you want to mock for users who might not have DB images yet
};

// Define extended types that include the relations we'll fetch
interface InitiativeWithCreator extends PrismaInitiative {
  creator: PrismaUser | null;
}

interface GeneralPostWithCreatorAndMedia extends PrismaGeneralPost {
  creator: PrismaUser | null;
  media: PrismaMediaItem[];
}

type FeedItemDb = InitiativeWithCreator | GeneralPostWithCreatorAndMedia;

async function getFeedItems(page: number = 1, pageSize: number = 10): Promise<FeedItemDb[]> {
  const initiatives = await prisma.initiative.findMany({
    include: {
      creator: {
        select: {
          id: true,
          name: true,
          email: true,
          passwordHash: true,
          image: true,
          bannerImageUrl: true,
          dateCreated: true,
          bio: true,
          skills: true,
          interests: true,
          profession: true,
          organization: true,
          institution: true,
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
    skip: (page - 1) * pageSize,
    take: pageSize,
  });

  const generalPosts = await prisma.generalPost.findMany({
    include: {
      creator: {
        select: {
          id: true,
          name: true,
          email: true,
          passwordHash: true,
          image: true,
          bannerImageUrl: true,
          dateCreated: true,
          bio: true,
          skills: true,
          interests: true,
          profession: true,
          organization: true,
          institution: true,
        },
      },
      media: {
        select: {
          id: true,
          url: true,
          type: true,
          updateId: true,
          postId: true,
        },
      },
    },
    orderBy: {
      timestamp: 'desc',
    },
    skip: (page - 1) * pageSize,
    take: pageSize,
  });

  const feedItems: FeedItemDb[] = [...initiatives, ...generalPosts].sort((a, b) => {
    const timeA = 'createdAt' in a ? new Date(a.createdAt).getTime() : new Date(a.timestamp).getTime();
    const timeB = 'createdAt' in b ? new Date(b.createdAt).getTime() : new Date(b.timestamp).getTime();
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
  const page = 1; // Example: Default to page 1
  const pageSize = 10; // Example: Default page size
  const feedItems = await getFeedItems(page, pageSize);
  const session = await getServerSession(authOptions); // Get the current session using getServerSession
  const currentUserId = session?.user?.id; // Extract currentUserId

  // Pass currentUserId to HomeClient
  return <HomeClient feedItems={feedItems} currentUserId={currentUserId} />;
}
