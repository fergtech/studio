import type { Timestamp } from "firebase/firestore";

export type InitiativeStatus = "Idea" | "Planning" | "Seeking Members" | "In Progress" | "Completed";

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

export interface ChatMessage {
  id: string;
  initiativeId: string;
  senderId: string;
  senderName: string; // Denormalized for display
  text: string;
  timestamp: Timestamp;
}

export interface UserProfile {
  id: string;
  name: string;
  skills: string[];
  interests: string[];
  participatingInitiativeIds: string[];
}
