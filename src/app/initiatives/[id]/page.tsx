import { Initiative, Role, InitiativeMembershipClient, Update, ChatMessage, Goal, Milestone, InitiativeStatus, SkillRoleType, UserForDisplay, InitiativeRoleType as ClientInitiativeRoleType, GoalStatus, MilestoneStatus, EnhancedChatMessage, Priority } from '@/lib/types';
import { getInitiativeById } from '@/app/actions/initiativeActions';
import { InitiativeClientPage } from './InitiativeClientPage';
import Link from 'next/link';
import { Prisma } from '@prisma/client';
import { UpdateType as PrismaUpdateType } from '@prisma/client';
import { MediaType as PrismaMediaType } from '@prisma/client';

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


interface DatabaseInitiativeMembership {
  id: string;
  user: { id: string; name?: string | null; image?: string | null; };
  role: ClientInitiativeRoleType; // This should be InitiativeRoleType from Prisma schema, mapped to client type
  createdAt: any;
  initiativeId: string; // Added initiativeId based on type error
}

interface DatabaseUpdateMedia {
  id: string;
  url: string;
  type: string;
  updateId?: string | null;
  postId?: string | null;
}

interface DatabaseUpdate {
  id: string;
  content: string;
  userId: string;
  user: { id: string; name?: string | null; image?: string | null; };
  createdAt: any;
  updatedAt?: any; // Added for Update type
  media?: DatabaseUpdateMedia[] | null;
  // For Update type, reactionCount, commentCount, type might not be in raw DB response
  type?: string; // Assuming type might come as string from DB
  reactionCount?: number;
  commentCount?: number;
}

interface DatabaseChatMessage {
  id: string;
  content: string;
  senderId: string;
  sender: { id: string; name?: string | null; image?: string | null; };
  createdAt: any;
  initiativeId: string;
}

interface DatabaseGoal {
  id: string;
  title: string;
  description?: string | null;
  status: string;
  targetValue?: Prisma.Decimal | number | null;
  currentValue?: Prisma.Decimal | number | null;
  deadline?: any | null;
  initiativeId: string;
  ownerId?: string | null; // For mapping to Goal.owner
  createdAt?: any; // Added for Goal type
  updatedAt?: any; // Added for Goal type
  // Fields expected by client Goal type (from PrismaGoal via Omit)
  ownerName?: string | null; // Made nullable to be safe
  ownerAvatar?: string | null;
  progress?: number | null;
  priority?: string | null; // Assuming it comes as string from DB, maps to Priority enum
  tags?: string[] | null;
}

interface DatabaseMilestone {
  id: string;
  title: string;
  description?: string | null;
  status: string;
  deadline: any; // Maps to dueDate
  initiativeId: string;
  createdAt?: any; // Added for Milestone type
  updatedAt?: any; // Added for Milestone type
  // Fields expected by client Milestone type
  completedAt?: any | null;
  assignedTo?: string[] | null; // Assuming it might come as string[]
  order?: number | null;
  creatorId?: string | null; // For mapping to creator object
  // If creator object is fetched, it would be nested.
}

// Define a more specific type for the raw initiative data from the database action
interface DatabaseInitiative {
  id: string;
  title: string;
  description: string;
  status: string; 
  createdAt: any; 
  updatedAt?: any; 
  creatorId: string;
  imageUrl?: string | null;
  roles: string[]; // These are skill/tag strings
  creator?: { id: string; name?: string | null; image?: string | null; } | null;
  memberships?: DatabaseInitiativeMembership[] | null;
  updates?: DatabaseUpdate[] | null;
  chatMessages?: DatabaseChatMessage[] | null;
  goals?: DatabaseGoal[] | null;
  milestones?: DatabaseMilestone[] | null;
}

// Function to transform the database initiative into the frontend Initiative type
function transformDatabaseInitiative(dbInitiative: DatabaseInitiative, currentUserId?: string): Initiative {
  const processedRoles: Role[] = (dbInitiative.roles || []).map((roleString, index) => ({
    id: `skill-role-${dbInitiative.id}-${index}-${Date.now()}`,
    title: roleString,
    description: `Skill/Tag: ${roleString}`,
    type: 'other' as SkillRoleType,
  }));

  const processedMemberships: InitiativeMembershipClient[] = (dbInitiative.memberships || []).map((mem: DatabaseInitiativeMembership) => ({
    id: mem.id,
    userId: mem.user.id,
    user: {
      id: mem.user.id,
      name: mem.user.name || 'Anonymous',
      image: mem.user.image || null,
    },
    role: mem.role,
    createdAt: convertTimestampToDate(mem.createdAt),
    initiativeId: mem.initiativeId || dbInitiative.id, 
  }));

  const processedUpdates: Update[] = (dbInitiative.updates || []).map((update: DatabaseUpdate) => ({
    id: update.id,
    content: update.content,
    userId: update.userId,
    user: {
      id: update.user.id,
      name: update.user.name || 'Unknown User',
      image: update.user.image || null,
    },
    media: (update.media || []).map(m => ({
      id: m.id,
      url: m.url,
      type: m.type as PrismaMediaType,
      updateId: m.updateId !== undefined ? m.updateId : null,
      postId: m.postId !== undefined ? m.postId : null,
    })),
    type: (update.type || PrismaUpdateType.post) as PrismaUpdateType,
    timestamp: convertTimestampToDate(update.createdAt),
    createdAt: convertTimestampToDate(update.createdAt),
    updatedAt: convertTimestampToDate(update.updatedAt || update.createdAt),
    reactionCount: update.reactionCount || 0,
    commentCount: update.commentCount || 0,
    details: {},
  }));

  const processedChatMessages: EnhancedChatMessage[] = (dbInitiative.chatMessages || []).map((msg: DatabaseChatMessage) => ({
    id: msg.id,
    text: msg.content,
    senderId: msg.senderId,
    timestamp: convertTimestampToDate(msg.createdAt),
    sender: msg.sender ? {
      id: msg.sender.id,
      name: msg.sender.name || 'Unknown Sender',
      image: msg.sender.image || undefined,
    } : null,
    senderName: msg.sender?.name || 'Unknown Sender',
    senderImage: msg.sender?.image || undefined,
    initiativeId: msg.initiativeId,
  }));

  const processedGoals: Goal[] = (dbInitiative.goals || []).map((goal: DatabaseGoal) => {
    const ownerNameString: string = goal.ownerName || 'Unknown Owner';
    const goalTags: string[] = goal.tags || [];
    const goalPriority: Priority | null = (goal.priority || null) as Priority | null;

    const clientGoal: Goal = {
      id: goal.id,
      title: goal.title,
      description: goal.description || '',
      status: goal.status as GoalStatus,
      ownerName: ownerNameString,
      ownerAvatar: goal.ownerAvatar || null,
      progress: goal.progress !== null && goal.progress !== undefined ? goal.progress : null,
      tags: goalTags,
      owner: goal.ownerId && ownerNameString ? { id: goal.ownerId, name: ownerNameString, image: goal.ownerAvatar || null } : null,
      createdAt: convertTimestampToDate(goal.createdAt || dbInitiative.createdAt),
      updatedAt: convertTimestampToDate(goal.updatedAt || goal.createdAt || dbInitiative.createdAt),
      dueDate: goal.deadline ? convertTimestampToDate(goal.deadline) : undefined,
      priority: goalPriority,
      // targetValue and currentValue removed as they are not in the client Goal type per previous error
    };
    return clientGoal;
  });

  const processedMilestones: Milestone[] = (dbInitiative.milestones || []).map((milestone: DatabaseMilestone) => {
    // Correctly return a Milestone object
    return {
      id: milestone.id,
      title: milestone.title,
      description: milestone.description || '',
      status: milestone.status as MilestoneStatus,
      dueDate: milestone.deadline ? convertTimestampToDate(milestone.deadline) : undefined,
      createdAt: convertTimestampToDate(milestone.createdAt || dbInitiative.createdAt),
      updatedAt: convertTimestampToDate(milestone.updatedAt || milestone.createdAt || dbInitiative.createdAt),
      completedAt: milestone.completedAt ? convertTimestampToDate(milestone.completedAt) : undefined,
      assignedTo: milestone.assignedTo || [],
      order: milestone.order !== null && milestone.order !== undefined ? milestone.order : 0,
      creator: milestone.creatorId ? { id: milestone.creatorId, name: 'Unknown' /* Placeholder */ } : undefined,
    };
  });

  // Ensure the main return for transformDatabaseInitiative is present
  return {
    id: dbInitiative.id,
    title: dbInitiative.title,
    description: dbInitiative.description,
    status: dbInitiative.status as InitiativeStatus,
    createdAt: convertTimestampToDate(dbInitiative.createdAt),
    updatedAt: dbInitiative.updatedAt ? convertTimestampToDate(dbInitiative.updatedAt) : convertTimestampToDate(dbInitiative.createdAt),
    imageUrl: dbInitiative.imageUrl || null,
    roles: processedRoles,
    creator: dbInitiative.creator ? {
      id: dbInitiative.creator.id,
      name: dbInitiative.creator.name || 'Unknown Creator',
      image: dbInitiative.creator.image || null,
    } : { id: dbInitiative.creatorId || 'unknown', name: 'Unknown Creator', image: null },
    memberships: processedMemberships,
    updates: processedUpdates,
    chatMessages: processedChatMessages,
    goals: processedGoals,
    milestones: processedMilestones,
  } as Initiative;
}

// This is the Server Component
export default async function InitiativePage({ params: incomingParams }: { params: { id: string } }) {
  // Speculative fix: Await the params object itself based on the error message.
  const params = await incomingParams;
  const { id } = params; // Destructure id from the (potentially resolved) params

  const initiativeResponse = await getInitiativeById(id); // Use destructured id

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
  
  // Cast the initiative to 'any' to bypass strict type checking for the raw data structure,
  // then cast to DatabaseInitiative for transformation.
  const rawInit = initiativeResponse.initiative as any; 

  // Basic check to ensure essential fields are present before transformation
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
    // Ensure all expected fields for DatabaseInitiative are passed, even if undefined from rawInit
    const initiativeDataForTransform: DatabaseInitiative = {
      id: rawInit.id,
      title: rawInit.title,
      description: rawInit.description || '',
      status: rawInit.status || 'draft',
      createdAt: rawInit.createdAt, // Let convertTimestampToDate handle various formats
      updatedAt: rawInit.updatedAt,
      creatorId: rawInit.creatorId || 'unknown',
      imageUrl: rawInit.imageUrl,
      roles: rawInit.roles || [], // Expecting string[] from DB action
      creator: rawInit.creator,
      memberships: rawInit.memberships,
      updates: rawInit.updates,
      chatMessages: rawInit.chatMessages,
      goals: rawInit.goals,
      milestones: rawInit.milestones,
    };
    // TODO: Get currentUserId if needed for isMember/isAdmin, or handle in ClientComponent
    transformedInitiative = transformDatabaseInitiative(initiativeDataForTransform, /* currentUserId */);
  } catch (err) { // Changed 'error' to 'err'
    console.error("Error transforming initiative data:", err);
    return (
      <div className="container mx-auto py-8 px-4 text-center">
        <h1 className="text-2xl font-bold">Error processing initiative data</h1>
        {/* @ts-ignore */}
        <p>There was an issue preparing the initiative details for display. {err.message}</p>
        <Link href="/" className="mt-4 inline-block text-primary hover:underline">
          Go back to homepage
        </Link>
      </div>
    );
  }

  return <InitiativeClientPage initiative={transformedInitiative} initiativeId={id} />; // Use destructured id
}