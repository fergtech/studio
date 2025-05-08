import type { User as PrismaUser, Initiative as PrismaInitiative, Milestone as PrismaMilestone, Goal as PrismaGoal, Update as PrismaUpdate, ChatMessage as PrismaChatMessage, MediaItem as PrismaMediaItem } from '@prisma/client';

export type MilestoneStatus = 'not_started' | 'in_progress' | 'completed';
export type InitiativeStatus = 'draft' | 'active' | 'completed' | 'archived';
export type StepStatus = "ToDo" | "InProgress" | "Blocked" | "InReview" | "Done"; 
export type GoalStatus = 'NotStarted' | 'InProgress' | 'Completed' | 'Blocked';
export type Priority = 'Low' | 'Medium' | 'High';
export type RoleType = 'admin' | 'member' | 'contributor' | 'viewer';

export interface UserForDisplay {
  id: string;
  name: string | null;
  image?: string | null;
  lastActive?: Date;
}

export interface MediaItem extends Omit<PrismaMediaItem, 'initiativeId' | 'updateId' | 'chatMessageId'> {
  // Prisma MediaItem is fine, just ensure it's used consistently
  // Omitting foreign keys as they might not be needed directly in the frontend type for display purposes
}

export interface Milestone {
  id: string;
  title: string;
  description: string;
  status: MilestoneStatus;
  dueDate?: Date;
  completedAt?: Date;
  assignedTo?: string[];
  order?: number; // Added order
  creator?: UserForDisplay; // Added creator
}

export interface Goal extends Omit<PrismaGoal, 'initiativeId' | 'ownerId' | 'createdAt' | 'updatedAt' | 'dueDate'> {
  owner?: UserForDisplay | null;
  createdAt: Date;
  updatedAt: Date;
  dueDate?: Date | null;
  // Prisma model already includes: title, description, status, priority, progress, tags
}

export type UpdateType = 
  'join' | 
  'status' | 
  'post' | 
  'role_add' | 
  'step_creation' |   
  'step_completion' | 
  'endorsement' |     
  'resource_share' |  
  'milestone_creation' | 
  'milestone_status' |   
  'goal_creation' |      
  'goal_status'; 

export interface Update {
  id: string;
  content: string;
  imageUrl?: string;
  createdAt: Date;
  updatedAt: Date;
  author: UserForDisplay;
  reactionCount: number; // Changed from likes
  commentCount: number;  // Changed from comments
  type: UpdateType; // Added type based on usage in page.tsx
  timestamp: Date; // Added timestamp based on usage in page.tsx
  details?: Record<string, any>; // Added details based on usage in page.tsx
}

export interface ChatMessage extends Omit<PrismaChatMessage, 'initiativeId' | 'senderId' | 'timestamp'> {
  timestamp: Date;
  sender?: UserForDisplay | null;
  // Prisma model already includes: id, text, media, reactions
}

export interface Role {
  id: string;
  title: string;
  description: string;
  type: RoleType;
  requirements?: string[];
  responsibilities?: string[];
}

export interface Initiative {
  id: string;
  title: string;
  description: string;
  status: InitiativeStatus;
  createdAt: Date;
  updatedAt: Date;
  imageUrl: string | null;
  creator: UserForDisplay;
  members: Member[];
  roles: Role[];
  updates: Update[]; // Should this be EnhancedUpdate[] if that's what's used? For now, keeping as Update.
  goals: Goal[];
  milestones: Milestone[];
  chatMessages: EnhancedChatMessage[]; // Changed from ChatMessage[] to EnhancedChatMessage[]
}

// --- Step Interface (if still used, ensure Date types) ---
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
// --- END NEW ---

export interface UserProfile {
  id: string;
  name: string;
  bio?: string; 
  skills: string[];
  interests: string[];
  profession?: string; 
  organization?: string; 
  institution?: string; 
  participatingInitiativeIds: string[];
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

export interface Member extends User {
  role: RoleType;
  joinedAt: Date;
  lastActive?: Date;
}

export interface Comment {
  id: string;
  userId: string;
  userName: string;
  content: string;
  timestamp: Date;
}

export interface Reaction {
  id: string;
  userId: string;
  type: 'like' | 'celebrate' | 'support' | 'insightful';
}

export interface EnhancedUpdate extends Update {
  // content, author, reactionCount, commentCount, type, timestamp, details are inherited from Update
  comments?: Comment[]; // This is fine now
  reactions?: Reaction[]; // This is fine now
  isPinned?: boolean;
  // reactionCount and commentCount can be optionally overridden if needed, but usually inherited.
}

export interface EnhancedChatMessage {
  id: string;
  text: string;
  createdAt: Date;
  updatedAt: Date;
  creator: UserForDisplay;
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

