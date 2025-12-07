import { Initiative, Role, InitiativeMembershipClient, Update, ChatMessage, Goal, Milestone, InitiativeStatus, SkillRoleType, UserForDisplay, InitiativeRoleType as ClientInitiativeRoleType, GoalStatus, MilestoneStatus, EnhancedChatMessage, Priority } from '@/lib/types';
import { getInitiativeById } from '@/app/actions/initiativeActions';
import { InitiativeClientPage } from './InitiativeClientPage';
import Link from 'next/link';
import { Prisma } from '@prisma/client';
import { UpdateType as PrismaUpdateType } from '@prisma/client';
import { MediaType as PrismaMediaType } from '@prisma/client';
import { Metadata } from 'next';
import { prisma } from '@/lib/prisma';

// Force dynamic rendering to prevent static generation issues
export const dynamic = 'force-dynamic';

// Generate metadata for social sharing
export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;

  const initiative = await prisma.initiative.findUnique({
    where: { id },
    select: {
      title: true,
      description: true,
      imageUrl: true,
      creator: {
        select: {
          name: true,
        },
      },
    },
  });

  if (!initiative) {
    return {
      title: 'Initiative Not Found | Society Plus',
    };
  }

  const title = initiative.title;
  const description = initiative.description.length > 160
    ? initiative.description.substring(0, 157) + '...'
    : initiative.description;
  const imageUrl = initiative.imageUrl || `${process.env.NEXTAUTH_URL}/api/og?title=${encodeURIComponent(title)}&type=initiative`;

  return {
    title: `${title} | Society Plus`,
    description,
    openGraph: {
      title,
      description,
      images: [imageUrl],
      type: 'article',
      siteName: 'Society Plus',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [imageUrl],
    },
  };
}

// Helper function to convert Prisma's Decimal to number or keep as is
const toNumber = (value: any): number => {
  if (value instanceof Prisma.Decimal) {
    return value.toNumber();
  }
  return value as number; // Assuming it's already a number or can be treated as such
};

// Helper function to convert various timestamp formats to Date objects
const convertTimestampToDate = (timestamp: any): Date => {
  if (!timestamp) return new Date(); // Or handle as an error/default
  if (timestamp instanceof Date) return timestamp;
  if (typeof timestamp === 'string' || typeof timestamp === 'number') {
    const date = new Date(timestamp);
    if (!isNaN(date.getTime())) return date;
  }
  // For Prisma's DateTimeJsonValue (assuming it's an object with $date)
  if (typeof timestamp === 'object' && timestamp !== null && '$date' in timestamp) {
    const date = new Date(timestamp.$date);
    if (!isNaN(date.getTime())) return date;
  }
  console.warn('Unrecognized timestamp format:', timestamp);
  return new Date(); // Fallback or error
};

// Removed 'memberIds' from transformDatabaseInitiative as it does not exist in the Initiative type
function transformDatabaseInitiative(dbInitiative: any): Initiative {
  return {
    id: dbInitiative.id,
    title: dbInitiative.title,
    description: dbInitiative.description,
    imageUrl: dbInitiative.imageUrl || null,
    roles: dbInitiative.roles || [],
    status: dbInitiative.status,
    createdAt: new Date(dbInitiative.createdAt),
    updatedAt: new Date(dbInitiative.updatedAt || dbInitiative.createdAt),
    creator: dbInitiative.creator || { id: 'unknown', name: 'Unknown Creator', image: null },
    memberships: dbInitiative.memberships || [],
    updates: dbInitiative.updates || [],
    goals: dbInitiative.goals || [],
    milestones: dbInitiative.milestones || [],
    chatMessages: dbInitiative.chatMessages || [],
    aiGuidance: dbInitiative.aiGuidance || null,
    societyId: dbInitiative.societyId || null,
    society: dbInitiative.society || null,
  };
}

// This is the Server Component
export default async function InitiativePage({ params: incomingParams }: { params: Promise<{ id: string }> }) {
  const params = await incomingParams;
  const { id } = params;

  const initiativeResponse = await getInitiativeById(id);

  if (initiativeResponse.error || !initiativeResponse.initiative) {
    return (
      <div className="container mx-auto py-8 px-4 text-center">
        <h1 className="text-2xl font-bold">Initiative not found</h1>
        <p>{initiativeResponse.error || "Could not load the initiative details."}</p>
        <Link href="/" className="mt-4 inline-block text-primary hover:underline">
          Go back to homepage
        </Link>
      </div>
    );
  }

  const rawInit = initiativeResponse.initiative as any;

  if (!rawInit || !rawInit.id || !rawInit.title) {
    console.error("Fetched initiative data is missing essential fields (id or title):", rawInit);
    return (
      <div className="container mx-auto py-8 px-4 text-center">
        <h1 className="text-2xl font-bold">Error loading initiative data</h1>
        <p>The fetched initiative data is incomplete or malformed.</p>
        <Link href="/" className="mt-4 inline-block text-primary hover:underline">
          Go back to homepage
        </Link>
      </div>
    );
  }

  let transformedInitiative: Initiative;
  try {
    const initiativeDataForTransform = {
      id: rawInit.id,
      title: rawInit.title,
      description: rawInit.description || '',
      status: rawInit.status || 'draft',
      createdAt: rawInit.createdAt,
      updatedAt: rawInit.updatedAt,
      creatorId: rawInit.creatorId || 'unknown',
      imageUrl: rawInit.imageUrl,
      aiGuidance: rawInit.aiGuidance,
      roles: rawInit.roles || [],
      creator: rawInit.creator,
      memberships: rawInit.memberships,
      updates: rawInit.updates || [], // Real updates from database
      chatMessages: rawInit.chatMessages,
      goals: rawInit.goals,
      milestones: rawInit.milestones,
      societyId: rawInit.societyId,
      society: rawInit.society,
    };
    transformedInitiative = transformDatabaseInitiative(initiativeDataForTransform);
  } catch (err) {
    console.error("Error transforming initiative data:", err);
    return (
      <div className="container mx-auto py-8 px-4 text-center">
        <h1 className="text-2xl font-bold">Error processing initiative data</h1>
        <p>There was an issue preparing the initiative details for display. {(err as Error).message}</p> // Cast err to Error
        <Link href="/" className="mt-4 inline-block text-primary hover:underline">
          Go back to homepage
        </Link>
      </div>
    );
  }

  return <InitiativeClientPage initiative={transformedInitiative} initiativeId={id} />;
}
