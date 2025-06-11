import type { User as PrismaUser, Initiative as PrismaInitiative, Milestone as PrismaMilestone, Goal as PrismaGoal, Update as PrismaUpdate, ChatMessage as PrismaChatMessage, MediaItem as PrismaMediaItem, InitiativeRoleType as PrismaInitiativeRoleType, UpdateType as PrismaUpdateType, MediaType as PrismaMediaType, InitiativeStatus as PrismaInitiativeStatus } from '@prisma/client';

// Re-export PrismaInitiativeRoleType as InitiativeRoleType for use in other modules
export type InitiativeRoleType = PrismaInitiativeRoleType;

export type MilestoneStatus = 'not_started' | 'in_progress' | 'completed';
export type InitiativeStatus = PrismaInitiativeStatus;
export type StepStatus = "ToDo" | "InProgress" | "Blocked" | "InReview" | "Done"; 
export type GoalStatus = 'NotStarted' | 'InProgress' | 'Completed' | 'Blocked';
export type Priority = 'Low' | 'Medium' | 'High';

// SkillRoleType is for categorizing SKILL roles (e.g., "Developer" skill role is 'technical').
// Distinct from user membership roles in an initiative.
export type SkillRoleType = 'technical' | 'creative' | 'organizational' | 'support' | 'leadership' | 'other';

// User-selectable membership roles, derived from Prisma's InitiativeRoleType, excluding ADMIN.
// These are the roles a user can choose when joining an initiative (e.g., "MEMBER", "CONTRIBUTOR").
export type UserSelectableMembershipRole = Exclude<PrismaInitiativeRoleType, 'ADMIN'>;
export const ALL_USER_SELECTABLE_MEMBERSHIP_ROLES: UserSelectableMembershipRole[] = ["MEMBER", "CONTRIBUTOR", "GUEST", "SPONSOR", "MENTOR"];

export interface UserForDisplay {
  id: string;
  name: string | null;
  image?: string | null;
  lastActive?: Date;
}

// Client-side representation of an initiative membership.
export interface InitiativeMembershipClient {
  user: UserForDisplay;
  role: PrismaInitiativeRoleType; // Actual Prisma enum string values (e.g., "ADMIN", "MEMBER")
  userId: string;
  initiativeId: string;
  // joinedAt?: Date; // Optional: if needed from Prisma model
}

export interface MediaItem extends Omit<PrismaMediaItem, 'initiativeId' | 'updateId' | 'chatMessageId' | 'postId' | 'issueId' | 'ideaId'> {
  // Prisma MediaItem is fine, just ensure it's used consistently
}

export interface Milestone {
  id: string;
  title: string;
  description: string;
  status: MilestoneStatus;
  dueDate?: Date;
  completedAt?: Date;
  assignedTo?: string[];
  order?: number; 
  creator?: UserForDisplay; 
  createdAt: Date; 
  updatedAt: Date; 
}

export interface Goal extends Omit<PrismaGoal, 
  'initiativeId' | 
  'ownerId' | 
  'createdAt' | 
  'updatedAt' | 
  'dueDate' | 
  'priority' | 
  'ownerName' | // No longer directly on PrismaGoal
  'ownerAvatar' | // No longer directly on PrismaGoal
  'progress' // No longer directly on PrismaGoal
> {
  // Client-specific transformations or additions:
  owner?: UserForDisplay | null; // Client-side object for display
  createdAt: Date; // Overridden for consistent Date type
  updatedAt: Date; // Overridden for consistent Date type
  dueDate?: Date | null; // Overridden for consistent Date type
  
  priority?: Priority | null; // Redefined: optional and nullable client-side priority
}

// UpdateType for activity feed items.
// REMOVE or REPLACE the custom UpdateType union:
// export type UpdateType = 
//   'join' | 
//   'status' | 
//   'post' | 
//   'role_add' | 
//   'step_creation' |   
//   'step_completion' | 
//   'endorsement' |     
//   'resource_share' |  
//   'milestone_creation' | 
//   'milestone_status' |   
//   'goal_creation' |      
//   'goal_status'; 

export interface Update {
  id: string;
  content: string;
  // imageUrl?: string; // Replaced by media array
  createdAt: Date; // Should be present on PrismaUpdate
  updatedAt: Date | null; // Corrected: Should be Date | null as per Prisma schema
  
  // Consistent with Prisma structure when user is included
  userId: string; 
  user: UserForDisplay; // Renamed from 'author' to 'user' for consistency with Prisma include
  
  media: PrismaMediaItem[]; // To hold images, videos, files etc.

  // type: UpdateType; // Will use PrismaUpdateType
  type: PrismaUpdateType; // Use the enum from @prisma/client
  
  details?: Record<string, any>; // Prisma's Json field

  // Optional client-side enhancements or aggregated data
  reactionCount?: number; 
  commentCount?: number;  
}

export interface ChatMessage extends Omit<PrismaChatMessage, 'initiativeId' | 'senderId' | 'timestamp'> {
  timestamp: Date;
  sender?: UserForDisplay | null;
  senderName: string; // Required
  senderImage?: string; // Optional
  // Prisma model already includes: id, text, media, reactions
  text: string; // Ensure 'text' is part of the type for clarity
}

// Represents SKILL roles/tags for an initiative (e.g., "Developer", "Designer").
export interface Role {
  id: string;
  title: string; // e.g., "Frontend Developer", "Marketing Lead"
  description: string;
  type: SkillRoleType; // Category of the skill role (e.g., 'technical', 'creative')
  requirements?: string[];
  responsibilities?: string[];
}

export interface Initiative {
  id: string;
  title: string;
  description: string;
  status: InitiativeStatus; // Prisma's InitiativeStatus enum (e.g., 'active', 'draft')
  createdAt: Date;
  updatedAt: Date | null; // Added for consistency with Prisma model
  imageUrl: string | null;
  creator: UserForDisplay; // Creator of the initiative
  memberships: InitiativeMembershipClient[]; // Array of members with their roles
  roles: string[]; // These are the SKILL roles/tags the initiative is looking for (e.g., "Developer", "Designer")
  updates: Update[]; 
  goals: Goal[];
  milestones: Milestone[];
  chatMessages: EnhancedChatMessage[]; 
  aiGuidance?: string | null; // Add AI-generated getting started guidance
}

// --- Step Interface ---
export interface Step {
  id: string;
  initiativeId: string; 
  milestoneId: string; 
  title: string;
  description?: string; 
  status: StepStatus; 
  assigneeId?: string; 
  dueDate?: Date; 
  createdAt: Date;
  creatorId: string; 
  completedAt?: Date; 
}

export interface UserProfile {
  id: string;
  name: string;
  profession?: string;
  bio?: string;
  image?: string | null;
  bannerImageUrl?: string | null;
  dateCreated: Date;
  skills: string[];
  interests: string[];
  organization?: string;
  institution?: string;
  featuredItemType?: 'initiative' | 'post';
  featuredItemId?: string;
  isFollowing?: boolean; // Whether the viewing user follows this user
  followersCount?: number;
  followingCount?: number;
}

export interface ProfileTab {
  id: 'posts' | 'skills' | 'initiatives';
  label: string;
}

export interface FeaturedContent {
  type: 'initiative' | 'post';
  id: string;
  title: string;
  description: string;
  imageUrl?: string;
  createdAt: Date;
}

export interface ProfileFeedItem {
  id: string;
  type: 'initiative' | 'post';
  title?: string;
  content?: string;
  imageUrl?: string;
  timestamp: Date;
  isFeatured?: boolean;
}

export interface GeneralPost {
  id: string;
  creatorId: string;
  creatorName: string; 
  creatorAvatar?: string; 
  content: string;
  media?: MediaItem[];
  background?: string; 
  timestamp: Date;
  linkedInitiativeId?: string; 
}

export type ContributionType = 
  'commit' | 
  'post' | 
  'comment' | 
  'initiative_join' | 
  'initiative_creation' | 
  'pull_request' |        
  'issue_comment' |       
  'code_commit' |         
  'post_creation' |       
  'step_completion' | 
  'resource_share';

export interface ContributionItem {
  id: string;
  type: ContributionType;
  title: string; 
  date: Date; 
  link?: string; 
  details?: string; 
  relatedInitiativeId?: string; 
  relatedMilestoneId?: string; 
  relatedStepId?: string;      
}

export type FeedItem = GeneralPost | Initiative; 

export type Action = {
  id: string;
  initiativeId: string;
  goalId?: string; 
  title: string;
  description?: string;
  status: StepStatus;
  assignee?: { id: string; name: string; avatar?: string };
  dueDate?: Date;
  createdAt: Date;
  updatedAt: Date;
  completedAt?: Date;
  completedBy?: { id: string; name: string; avatar?: string };
  priority?: "Low" | "Medium" | "High";
};

export interface User {
  id: string;
  name: string;
  image: string | null;
  email?: string;
}

// Legacy Member type. Review if still needed with InitiativeMembershipClient.
export interface Member extends User {
  role: PrismaInitiativeRoleType; // Role is now a PrismaInitiativeRoleType string
  joinedAt: Date;
  lastActive?: Date;
}

export interface Comment {
  id: string;
  // Ensure other properties like content, author, createdAt are defined as needed
  content: string;
  author: UserForDisplay;
  createdAt: Date;
  updatedAt: Date;
}

// Placeholder for EnhancedChatMessage, assuming it extends ChatMessage or is defined elsewhere.
export interface EnhancedChatMessage extends ChatMessage {
  user: UserForDisplay; // Added user property
  // content: string; // Removed redundant content property, text from ChatMessage should be used
}

export interface OnlineMember {
  id: string;
  name: string;
  avatar?: string;
  lastActive: Date;
}

export interface InitiativeDetailPageProps {
  params: {
    id: string;
  };
}

export interface Task {
  id: string;
  title: string;
  description: string;
  status: MilestoneStatus;
  assignee?: UserForDisplay;
  dueDate: Date;
  order: number;
  createdAt: Date;
  updatedAt: Date;
  creator?: UserForDisplay | null;
}

export interface Issue {
  id: string;
  title: string;
  description: string;
  creatorId: string;
  creator: UserForDisplay; // Assuming UserForDisplay is the client-side representation of a user
  createdAt: Date;
  tags: string[];
  location?: string | null;
  media: MediaItem[]; // New: Array of media items
  championCount: number; // New: Number of champions
  championedBy?: UserForDisplay | null; // New: User who championed it
  championedByInitiativeId?: string | null; // Optional link to an initiative
}

export interface Idea {
  id: string;
  title: string;
  description: string;
  creatorId: string;
  creator: UserForDisplay; // Assuming UserForDisplay is the client-side representation of a user
  createdAt: Date;
  tags: string[];
  location?: string | null;
  media: MediaItem[]; // New: Array of media items
  championCount: number; // New: Number of champions
  championedBy?: UserForDisplay | null; // New: User who championed it
  championedByInitiativeId?: string | null; // Optional link to an initiative
}

