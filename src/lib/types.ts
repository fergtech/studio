import type { Timestamp } from "firebase/firestore";

export type InitiativeStatus = "Idea" | "Planning" | "Seeking Members" | "In Progress" | "Completed";
// --- NEW: Milestone & Step Statuses ---
export type MilestoneStatus = "Planned" | "In Progress" | "Completed" | "On Hold";
export type StepStatus = "To Do" | "In Progress" | "Blocked" | "In Review" | "Done"; 
// --- END NEW ---

export interface Initiative {
  id: string;
  title: string;
  description: string;
  imageUrl?: string; // URL to the featured image
  roles: string[]; // Array of roles/skills needed (tags)
  status: InitiativeStatus;
  createdAt: Timestamp;
  creatorId: string;
  memberIds: string[]; // List of user IDs participating
}

// --- NEW: Milestone Interface ---
export interface Milestone {
  id: string;
  initiativeId: string; 
  title: string;
  description?: string;
  status: MilestoneStatus; 
  order?: number; // Optional: To define sequence in visualization
  createdAt: Timestamp;
  creatorId: string;
  dueDate?: Timestamp; 
}
// --- END NEW ---

// --- NEW: Step Interface ---
export interface Step {
  id: string;
  initiativeId: string; 
  milestoneId: string; // Link to the parent Milestone
  title: string;
  description?: string; 
  status: StepStatus; 
  assigneeId?: string; // User ID of the person assigned/volunteered
  dueDate?: Timestamp; 
  createdAt: Timestamp;
  creatorId: string; 
  completedAt?: Timestamp; 
}
// --- END NEW ---

export interface ChatMessage {
  id: string;
  initiativeId?: string; // Made optional for direct messages
  senderId: string;
  senderName: string; // Denormalized for display
  text: string;
  timestamp: Timestamp;
}

export interface UserProfile {
  id: string;
  name: string;
  bio?: string; // Added bio
  skills: string[];
  interests: string[];
  profession?: string; // Added profession
  organization?: string; // Added organization
  institution?: string; // Added institution
  participatingInitiativeIds: string[];
}

export interface MediaItem {
  url: string; // URL of the uploaded image or video
  type: 'image' | 'video';
  // Optional: add dimensions, alt text, etc.
  // alt?: string;
  // width?: number;
  // height?: number;
}

// Updated UpdateType with new terminology
export type UpdateType = 
  'join' | 
  'status' | // Initiative status
  'post' | 
  'role_add' | 
  'milestone' | // Keep generic milestone for now, or remove if specific ones cover all cases
  'step_creation' |   // Added
  'step_completion' | // Added
  'endorsement' |     // Added
  'resource_share' |  // Added
  'milestone_creation' | // Added
  'milestone_status';    // Added

export interface Update {
  id: string;
  initiativeId: string;
  type: UpdateType;
  timestamp: Timestamp;
  userId?: string; // User who triggered the update (optional for system updates)
  userName?: string; // Name of the user
  content: string; // Main text describing the update
  media?: MediaItem[]; // Optional array for media attachments
  details?: {
    newStatus?: string; // Can be InitiativeStatus or MilestoneStatus
    roleName?: string;
    memberName?: string; // For join events
    stepTitle?: string; // Added for step updates
    stepUrl?: string; // Added for step links
    resourceTitle?: string; // Added for resource sharing
    resourceUrl?: string; // Added for resource links
    milestoneTitle?: string; // Added for milestone updates
    milestoneUrl?: string; // Added for milestone links
  };
}

// New type for standalone posts in the main feed
export interface GeneralPost {
  id: string;
  creatorId: string;
  creatorName: string; // Denormalized
  creatorAvatar?: string; // Denormalized
  content: string;
  media?: MediaItem[];
  background?: string; // Optional: Background color/gradient if no media
  timestamp: Timestamp;
  linkedInitiativeId?: string; // Optional: Link if an initiative is created from this post
  // Optional: Add fields for likes, comments count etc. later
  // likeCount?: number;
  // commentCount?: number;
}

// Updated ContributionType to include more specific types used in mock data
export type ContributionType = 
  'commit' | 
  'post' | 
  'comment' | 
  'initiative_join' | 
  'initiative_creation' | 
  'pull_request' |        // Added
  'issue_comment' |       // Added
  'code_commit' |         // Added (Note: 'commit' already exists, maybe rename for clarity? Using 'code_commit' for now)
  'post_creation' |       // Added
  'step_completion' | // Added
  'resource_share';   // Added

export interface ContributionItem {
  id: string;
  type: ContributionType;
  title: string; // e.g., "Commented on 'Project Phoenix'", "Joined 'Community Garden'", "Created 'Local Cleanup Drive'"
  date: Timestamp; // Or Date if not using Firestore Timestamps for mock data
  link?: string; // Optional link to the contribution (e.g., post URL, initiative URL, commit URL)
  details?: string; // Optional short description or excerpt
  // Removed userId as it's not typically part of a generic contribution item fetched this way
  relatedInitiativeId?: string; // Added for context
  relatedMilestoneId?: string; // Added for milestone reference
  relatedStepId?: string;      // Added for step reference
}

// Union type for the combined feed
export type FeedItem = GeneralPost | Initiative; // Changed Update to Initiative

// --- NEW: Goal & Task Types ---
export type GoalStatus = 'Not Started' | 'In Progress' | 'Completed' | 'Blocked';

export interface Goal {
  id: string;
  initiativeId: string;
  title: string;
  description: string;
  owner: { id: string; name: string; avatar?: string };
  status: GoalStatus;
  dueDate?: Timestamp;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  progress?: number; // Optional: 0-100 percentage
  priority?: 'Low' | 'Medium' | 'High';
  tags?: string[];
}

// Removed unused TaskStatus type
// export type TaskStatus = 'To Do' | 'In Progress' | 'Done' | 'Blocked';

// Renamed from Task to Action
export type Action = {
  id: string;
  initiativeId: string;
  goalId?: string; // Actions might not always be tied to a specific goal
  title: string;
  description?: string;
  status: StepStatus;
  assignee?: { id: string; name: string; avatar?: string };
  dueDate?: Timestamp;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  completedAt?: Timestamp;
  completedBy?: { id: string; name: string; avatar?: string };
  priority?: "Low" | "Medium" | "High";
  // Add any other relevant fields for an action
};

// Add or ensure User type exists
export interface User {
  id: string;
  name?: string | null | undefined; // Optional based on next-auth Session['user']
  email: string; // Changed to non-optional as it's required for login/registration
  image?: string | null | undefined; // Optional based on next-auth Session['user']
  passwordHash: string; // Added for storing hashed password
  dateCreated: Date; // Added for user creation timestamp
  // Add any other fields relevant to your user model
}
// --- END NEW ---
