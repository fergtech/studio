import { useParams } from 'next/navigation';
import type { 
  Initiative, 
  ChatMessage, 
  Update, 
  UpdateType, 
  Milestone, 
  Step, 
  StepStatus, 
  Goal,
  InitiativeStatus,
  InitiativeDetailPageProps,
  MediaItem,
  UserForDisplay,
  MilestoneStatus,
  GoalStatus,
  Priority,
  EnhancedChatMessage,
  Task,
  Role,
  RoleType // Added RoleType
} from "@/lib/types"; 
import { Prisma } from '@prisma/client';
import { Timestamp } from 'firebase/firestore';
import Link from 'next/link'; 
import { use } from 'react';
import { useRef } from 'react';

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Users, Clock, Send, Info, Plus, MessageSquare, X, FileText, CheckCircle, UserPlus, Tag, Flag, Edit, Paperclip, ExternalLink, Circle, ArrowRight, TrendingUp, Pin, ThumbsUp, PartyPopper, Heart, Lightbulb, Flame, Trophy, Award, Share2, Twitter, Facebook, Link2, Image as ImageIcon, Smile, Archive, User, Calendar, Upload } from 'lucide-react';
import { useState, useEffect } from 'react';
import { cn } from "@/lib/utils"; 
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"; 
import { Textarea } from "@/components/ui/textarea"; 
import { MilestoneList } from '@/components/MilestoneList'; 
import { formatDistanceToNow } from 'date-fns';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { motion, AnimatePresence } from 'framer-motion';
import { Skeleton } from "@/components/ui/skeleton";
import { getInitiativeById } from '@/app/actions/initiativeActions';
import Image from 'next/image';
import { useToast } from "@/components/ui/use-toast";

import { toast } from 'react-hot-toast';
import { InitiativeClientPage } from './InitiativeClientPage';

// --- MOCK DATA ---
// Mock data (replace with actual data fetching)
const mockInitiatives: Initiative[] = [
  {
    id: "1",
    title: "Community Garden Project",
    description: "Create a sustainable community garden in the downtown area",
    status: "draft" as InitiativeStatus, // Changed from "Planning"
    createdAt: new Date(),
    updatedAt: new Date(),
    imageUrl: null,
    roles: [
      {
        id: "role1",
        title: "Project Manager",
        description: "Lead the community garden project",
        type: 'admin' as RoleType, // Changed from status
        // requirements: [], // Optional
        // responsibilities: [], // Optional
      }
    ],
    creator: {
      id: "1",
      name: "Jane Smith",
      image: "https://i.pravatar.cc/40?u=user1"
    },
    milestones: [], // Populated by getMockMilestones
    goals: [], // Populated by mockGoals
    members: [
      {
        id: "1",
        name: "Jane Smith",
        image: "https://i.pravatar.cc/40?u=user1",
        role: 'admin' as RoleType,
        joinedAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000)
      },
      {
        id: "2",
        name: "John Doe",
        image: "https://i.pravatar.cc/40?u=user2",
        role: 'member' as RoleType,
        joinedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000)
      }
    ],
    updates: [
      {
        id: "update1",
        content: "Project kickoff meeting scheduled", // Changed from text
        author: { // Changed from creator
          id: "1",
          name: "Jane Smith",
          image: "https://i.pravatar.cc/40?u=user1"
        },
        reactionCount: 5, // Added
        commentCount: 2,  // Added
        createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
        updatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
        type: 'post' as UpdateType, // Added
        timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // Added
        // details: {}, // Optional
      }
    ],
    chatMessages: [] // Populated by mockChatMessages
  },
  {
    id: "2",
    title: "Tech Workshop Series",
    description: "Monthly workshops teaching coding and digital skills",
    status: "active" as InitiativeStatus, // Changed from "InProgress"
    createdAt: new Date(),
    updatedAt: new Date(),
    imageUrl: null,
    roles: [
      {
        id: "role2",
        title: "Workshop Instructor",
        description: "Lead coding workshops for community members",
        type: 'member' as RoleType, // Changed from status
      }
    ],
    creator: {
      id: "2",
      name: "John Doe",
      image: "https://i.pravatar.cc/40?u=user2"
    },
    milestones: [],
    goals: [],
    members: [
      {
        id: "2",
        name: "John Doe",
        image: "https://i.pravatar.cc/40?u=user2",
        role: 'member' as RoleType,
        joinedAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000)
      },
      {
        id: "3",
        name: "Alice Johnson",
        image: "https://i.pravatar.cc/40?u=user3",
        role: 'contributor' as RoleType,
        joinedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000)
      }
    ],
    updates: [
      {
        id: "update2",
        content: "First workshop materials prepared", // Changed from text
        author: { // Changed from creator
          id: "2",
          name: "John Doe",
          image: "https://i.pravatar.cc/40?u=user2"
        },
        reactionCount: 10,
        commentCount: 3,
        createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
        updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
        type: 'post' as UpdateType,
        timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
      }
    ],
    chatMessages: []
  }
];

// Update mock chat messages to match EnhancedChatMessage type
const mockChatMessages: EnhancedChatMessage[] = [
  {
    id: "msg1",
    text: "Welcome to the project!",
    createdAt: new Date(),
    updatedAt: new Date(),
    creator: {
      id: "1",
      name: "Jane Smith"
    }
  }
];

// Update mock updates to use proper Date objects and align with Update type
const mockUpdates: Update[] = [
  {
    id: "update1",
    content: "Project kickoff meeting scheduled", // Changed from text
    author: { // Changed from creator
      id: "1",
      name: "Jane Smith",
      image: "https://i.pravatar.cc/40?u=user1"
    },
    reactionCount: 5, // Added
    commentCount: 2,  // Added
    createdAt: new Date(),
    updatedAt: new Date(),
    type: 'post' as UpdateType, // Added
    timestamp: new Date(),      // Added
    // details: {}, // Optional
    // imageUrl: null // Optional
  }
];

// Mock User Profile Data
const mockUsers: Record<string, { name: string; avatar?: string }> = {
  "1": { name: "Jane Smith", avatar: "https://i.pravatar.cc/40?u=user1" },
  "2": { name: "John Doe", avatar: "https://i.pravatar.cc/40?u=user2" },
  "3": { name: "Alice Johnson", avatar: "https://i.pravatar.cc/40?u=user3" },
  "user1": { name: "Alice", avatar: "https://i.pravatar.cc/40?u=user1" },
  "user2": { name: "Bob" },
  "user3": { name: "Charlie", avatar: "https://i.pravatar.cc/40?u=user3" },
  "user4": { name: "Diana" },
  "user5": { name: "Eve", avatar: "https://i.pravatar.cc/40?u=user5" },
  "user6": { name: "Faythe" },
  "user7": { name: "Grace", avatar: "https://i.pravatar.cc/40?u=user7" },
  "user8": { name: "Frank" }
};

// --- NEW: Mock Milestones & Steps ---
// (Copied and adapted from profile page mock data for consistency)

// --- NEW: Mock Milestones & Steps ---
// (Copied and adapted from profile page mock data for consistency)
const getMockMilestones = (initiativeId: string): Milestone[] => {
  const baseId = parseInt(initiativeId.split('-')[1] || '1') % 2; 
  if (baseId === 0) { // Corresponds to init-2, init-4
    return [
      { 
        id: `m-${initiativeId}-1`, 
        title: "Phase 1: Planning & Research", 
        description: "Initial planning and research phase", 
        status: "completed" as MilestoneStatus, // Changed
        order: 1, 
        createdAt: new Date('2025-01-10'),
        updatedAt: new Date('2025-01-10'),
        dueDate: new Date('2025-02-10'),
        creator: { id: 'user3', name: 'Charlie', image: "https://i.pravatar.cc/40?u=user3" } 
      },
      { 
        id: `m-${initiativeId}-2`, 
        title: "Phase 2: Initial Development", 
        description: "Development of core features", 
        status: "in_progress" as MilestoneStatus, // Changed
        order: 2, 
        createdAt: new Date('2025-02-01'),
        updatedAt: new Date('2025-02-01'),
        dueDate: new Date('2025-03-01'),
        creator: { id: 'user3', name: 'Charlie', image: "https://i.pravatar.cc/40?u=user3" } 
      },
      { 
        id: `m-${initiativeId}-3`, 
        title: "Phase 3: Community Testing", 
        description: "Testing with community members", 
        status: "not_started" as MilestoneStatus, // Changed from "Planned"
        order: 3, 
        createdAt: new Date('2025-02-01'),
        updatedAt: new Date('2025-02-01'),
        dueDate: new Date('2025-04-01'),
        creator: { id: 'user3', name: 'Charlie', image: "https://i.pravatar.cc/40?u=user3" } 
      },
    ];
  } else { // Corresponds to init-1, init-3
     return [
      { 
        id: `m-${initiativeId}-1`, 
        title: "Define Core Problem", 
        description: "Identify and document the core problem", 
        status: "completed" as MilestoneStatus, // Changed
        order: 1, 
        createdAt: new Date('2025-03-05'),
        updatedAt: new Date('2025-03-05'),
        dueDate: new Date('2025-04-05'),
        creator: { id: 'user1', name: 'Alice', image: "https://i.pravatar.cc/40?u=user1" } 
      },
      { 
        id: `m-${initiativeId}-2`, 
        title: "Gather Community Feedback", 
        description: "Collect feedback from community members", 
        status: "completed" as MilestoneStatus, // Changed
        order: 2, 
        createdAt: new Date('2025-03-20'),
        updatedAt: new Date('2025-03-20'),
        dueDate: new Date('2025-04-20'),
        creator: { id: 'user1', name: 'Alice', image: "https://i.pravatar.cc/40?u=user1" } 
      },
      { 
        id: `m-${initiativeId}-3`, 
        title: "Propose Solutions", 
        description: "Develop and propose potential solutions", 
        status: "in_progress" as MilestoneStatus, // Changed
        order: 3, 
        createdAt: new Date('2025-04-10'),
        updatedAt: new Date('2025-04-10'),
        dueDate: new Date('2025-05-10'),
        creator: { id: 'user4', name: 'Diana', image: "https://i.pravatar.cc/40?u=user4" } 
      },
      { 
        id: `m-${initiativeId}-4`, 
        title: "Implement Pilot", 
        description: "Implement pilot solution", 
        status: "not_started" as MilestoneStatus, // Changed from "Planned"
        order: 4, 
        createdAt: new Date('2025-04-10'),
        updatedAt: new Date('2025-04-10'),
        dueDate: new Date('2025-06-10'),
        creator: { id: 'user4', name: 'Diana', image: "https://i.pravatar.cc/40?u=user4" } 
      },
    ];
  }
};

const getMockSteps = (milestoneId: string): Step[] => {
  const initiativeId = milestoneId.split('-')[1]; 
  const allSteps: Step[] = [ 
      // Steps for init-1, init-3 milestones
      { id: `s-${milestoneId}-1`, initiativeId, milestoneId, title: "Research existing community gardens", description: "Research and document existing community gardens", status: "Done" as StepStatus, createdAt: new Date('2025-03-06'), creatorId: 'user1', assigneeId: 'user2', completedAt: new Date('2025-03-10') },
      { id: `s-${milestoneId}-2`, initiativeId, milestoneId, title: "Survey neighbors for interest", description: "Conduct survey of neighbors", status: "Done" as StepStatus, createdAt: new Date('2025-03-21'), creatorId: 'user1', assigneeId: 'user1', completedAt: new Date('2025-03-28') },
      { id: `s-${milestoneId}-3`, initiativeId, milestoneId, title: "Draft garden layout options", description: "Create layout options", status: "InProgress" as StepStatus, createdAt: new Date('2025-04-11'), creatorId: 'user4', assigneeId: 'user2' },
      { id: `s-${milestoneId}-4`, initiativeId, milestoneId, title: "Secure initial funding/donations", description: "Secure funding and donations", status: "ToDo" as StepStatus, createdAt: new Date('2025-04-11'), creatorId: 'user4' },
      { id: `s-${milestoneId}-5`, initiativeId, milestoneId, title: "Organize first cleanup day", description: "Plan and organize cleanup day", status: "ToDo" as StepStatus, createdAt: new Date('2025-04-15'), creatorId: 'user4' },
      // Steps for init-2, init-4 milestones
      { id: `s-${milestoneId}-6`, initiativeId, milestoneId, title: "Research existing tech workshops", description: "Research similar workshops", status: "Done" as StepStatus, createdAt: new Date('2025-01-12'), creatorId: 'user3', assigneeId: 'user3', completedAt: new Date('2025-01-20') },
      { id: `s-${milestoneId}-7`, initiativeId, milestoneId, title: "Define target age group", description: "Define target audience", status: "Done" as StepStatus, createdAt: new Date('2025-01-15'), creatorId: 'user3', assigneeId: 'user3', completedAt: new Date('2025-01-25') },
      { id: `s-${milestoneId}-8`, initiativeId, milestoneId, title: "Develop curriculum outline", description: "Create curriculum outline", status: "InProgress" as StepStatus, createdAt: new Date('2025-02-05'), creatorId: 'user3', assigneeId: 'user3' },
      { id: `s-${milestoneId}-9`, initiativeId, milestoneId, title: "Set up coding environment", description: "Set up development environment", status: "ToDo" as StepStatus, createdAt: new Date('2025-02-10'), creatorId: 'user3' },
      { id: `s-${milestoneId}-10`, initiativeId, milestoneId, title: "Recruit student testers", description: "Find students for testing", status: "ToDo" as StepStatus, createdAt: new Date('2025-02-15'), creatorId: 'user3' },
  ];
  return allSteps.filter(step => step.milestoneId === milestoneId);
};
// --- END MOCK DATA ---

// Add new types for comments and reactions
interface Comment {
  id: string;
  userId: string;
  userName: string;
  content: string;
  timestamp: Date;
}

interface Reaction {
  id: string;
  userId: string;
  type: 'like' | 'celebrate' | 'support' | 'insightful';
}

// Update the EnhancedUpdate interface to include all required properties
// and align with potential structure from src/lib/types.ts
interface EnhancedUpdate extends Update { // Assuming Update is from @/lib/types
  content: string; // Added: based on error "missing content"
  author: UserForDisplay; // Added: based on error "missing author", assuming UserForDisplay or similar
  // likes: Reaction[] | number; // Added: based on error "missing likes", could be Reaction[] or likeCount

  type: UpdateType;
  timestamp: Date;
  details?: Record<string, any>;
  // userId?: string; // Covered by author.id
  // userName?: string; // Covered by author.name
  media?: MediaItem[];
  comments?: Comment[]; // Array of comment objects
  reactions?: Reaction[]; // Array of reaction objects
  isPinned?: boolean;
  reactionCount?: number; // Count of reactions
  commentCount?: number; // Count of comments - Assuming Update from types.ts has this or similar for count
}

// Add new types for leaderboard, streaks, and badges
interface LeaderboardEntry {
  userId: string;
  name: string;
  avatar?: string;
  points: number;
  rank: number;
}

interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  earnedAt?: Date;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
}

interface StreakInfo {
  currentStreak: number;
  longestStreak: number;
  lastActive: Date;
  xp: number;
  level: number;
}

// Mock data for leaderboard, badges, and streaks
const mockLeaderboard: LeaderboardEntry[] = [
  { userId: 'user1', name: 'Alice', avatar: 'https://i.pravatar.cc/40?u=user1', points: 1250, rank: 1 },
  { userId: 'user2', name: 'Bob', points: 980, rank: 2 },
  { userId: 'user3', name: 'Charlie', avatar: 'https://i.pravatar.cc/40?u=user3', points: 750, rank: 3 },
  { userId: 'user4', name: 'Diana', points: 620, rank: 4 },
  { userId: 'user5', name: 'Eve', avatar: 'https://i.pravatar.cc/40?u=user5', points: 500, rank: 5 },
];

const mockBadges: Badge[] = [
  { id: 'b1', name: 'Early Adopter', description: 'Joined in the first week', icon: '🚀', rarity: 'rare', earnedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
  { id: 'b2', name: 'Milestone Master', description: 'Completed 5 milestones', icon: '🏆', rarity: 'epic', earnedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000) },
  { id: 'b3', name: 'Community Builder', description: 'Invited 3 members', icon: '👥', rarity: 'common', earnedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000) },
];

const mockStreakInfo: StreakInfo = {
  currentStreak: 5,
  longestStreak: 7,
  lastActive: new Date(Date.now() - 12 * 60 * 60 * 1000),
  xp: 1250,
  level: 3,
};

// Add new types for online status
interface OnlineMember {
  id: string;
  name: string;
  avatar?: string;
  lastActive: Date;
}

// Mock data for online members
const mockOnlineMembers: OnlineMember[] = [
  { id: 'user1', name: 'Alice', avatar: 'https://i.pravatar.cc/40?u=user1', lastActive: new Date() },
  { id: 'user2', name: 'Bob', lastActive: new Date(Date.now() - 5 * 60 * 1000) },
  { id: 'user3', name: 'Charlie', avatar: 'https://i.pravatar.cc/40?u=user3', lastActive: new Date(Date.now() - 2 * 60 * 1000) },
];

// Add new types for chat enhancements
interface ChatReaction {
  id: string;
  emoji: string;
  userId: string;
  userName: string;
}

// --- NEW: Update Creation Form Component ---
export function CreateUpdateForm({ initiativeId, onPostUpdate }: { initiativeId: string; onPostUpdate: (updateData: any) => void }) {
  const [updateContent, setUpdateContent] = useState('');
  const [resourceTitle, setResourceTitle] = useState('');
  const [resourceUrl, setResourceUrl] = useState('');
  const [isSharingResource, setIsSharingResource] = useState(false);
  const [isPosting, setIsPosting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!updateContent.trim() && !isSharingResource) return; // Need content or resource

    setIsPosting(true);
    const updateData = {
      initiativeId,
      type: isSharingResource ? 'resource_share' : 'post',
      userId: 'currentUser', // Replace with actual user ID
      userName: 'You', // Replace with actual user name
      content: updateContent,
      timestamp: new Date(),
      details: isSharingResource ? { title: resourceTitle, url: resourceUrl } : {},
      // media: [] // Add media handling later if needed
    };

    console.log("Posting update:", updateData);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 500));

    onPostUpdate(updateData); // Callback to update parent state (optional)

    // Reset form
    setUpdateContent('');
    setResourceTitle('');
    setResourceUrl('');
    setIsSharingResource(false);
    setIsPosting(false);
  };

  return (
    <Card className="mt-4 border-dashed">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">Post an Update</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Textarea
            placeholder="Share progress, ask questions, or post an update..."
            value={updateContent}
            onChange={(e) => setUpdateContent(e.target.value)}
            rows={3}
            disabled={isPosting}
          />
          {isSharingResource && (
            <div className="space-y-2 p-3 border rounded-md bg-muted/50">
              <p className="text-sm font-medium">Share a Resource</p>
              <Input
                placeholder="Resource Title (e.g., Helpful Article)"
                value={resourceTitle}
                onChange={(e) => setResourceTitle(e.target.value)}
                disabled={isPosting}
                required
              />
              <Input
                type="url"
                placeholder="Resource URL (https://...)"
                value={resourceUrl}
                onChange={(e) => setResourceUrl(e.target.value)}
                disabled={isPosting}
                required
              />
            </div>
          )}
          <div className="flex justify-between items-center">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setIsSharingResource(!isSharingResource)}
              disabled={isPosting}
              className="text-muted-foreground"
            >
              <Paperclip className="h-4 w-4 mr-2" />
              {isSharingResource ? 'Cancel Resource' : 'Share Resource'}
            </Button>
            <Button type="submit" disabled={isPosting || (!updateContent.trim() && (!isSharingResource || !resourceTitle.trim() || !resourceUrl.trim()))}>
              {isPosting ? 'Posting...' : 'Post Update'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
// --- END Update Creation Form Component ---

// --- Activity Feed Component ---
export function ActivityFeed({ updates, onLoadMore, hasMore }: { updates: Update[]; onLoadMore: () => void; hasMore: boolean }) {
  const [enhancedUpdates, setEnhancedUpdates] = useState<EnhancedUpdate[]>(
    updates.map(update => ({
      ...update,
      // type, timestamp, comments, reactions, isPinned, reactionCount, commentCount are already part of Update or will be set by transformUpdates
      // If Update from types.ts is fully aligned, direct use might be possible or minimal mapping needed here.
      // For now, assuming `update` objects are already EnhancedUpdate or very close after transformation
      // Ensure author is correctly mapped if it's not directly on `update` as `UserForDisplay`
      author: update.author || { id: 'unknown', name: 'Unknown', image: null }, // Ensure author is present
      // reactionCount and commentCount should come from the Update type directly
      // If they are not on Update, they need to be initialized or calculated here
      reactionCount: update.reactionCount || 0,
      commentCount: update.commentCount || 0,
      // Ensure all other EnhancedUpdate specific fields are handled if not on Update
      comments: (update as EnhancedUpdate).comments || [], // Cast if necessary
      reactions: (update as EnhancedUpdate).reactions || [], // Cast if necessary
      isPinned: (update as EnhancedUpdate).isPinned || false, // Cast if necessary
    }))
  );

  const trendingUpdates = enhancedUpdates
    .filter(update => (update.reactionCount || 0) > 0)
    .sort((a, b) => ((b.reactionCount || 0) + (b.commentCount || 0)) - ((a.reactionCount || 0) + (a.commentCount || 0)))
    .slice(0, 3);

  const sortedUpdates = [...enhancedUpdates].sort((a, b) => {
    if (a.isPinned && !b.isPinned) return -1;
    if (!a.isPinned && b.isPinned) return 1;
    return b.timestamp.getTime() - a.timestamp.getTime();
  });

  const handleReaction = (updateId: string, reactionType: Reaction['type']) => {
    setEnhancedUpdates(prev => prev.map(update => {
      if (update.id === updateId) {
        const existingReactions = update.reactions || [];
        const newReaction = {
          id: `r${Date.now()}`,
          userId: 'currentUser',
          type: reactionType
        };
        return {
          ...update,
          reactions: [...existingReactions, newReaction],
          reactionCount: (update.reactionCount || 0) + 1
        };
      }
      return update;
    }));
  };

  const handleComment = (updateId: string, content: string) => {
    setEnhancedUpdates(prev => prev.map(update => {
      if (update.id === updateId) {
        const existingComments = update.comments || [];
        const newComment = {
          id: `c${Date.now()}`,
          userId: 'currentUser',
          userName: 'Current User',
          content,
          timestamp: new Date()
        };
        return {
          ...update,
          comments: [...existingComments, newComment],
          commentCount: (update.commentCount || 0) + 1
        };
      }
      return update;
    }));
  };

  const renderUpdateContent = (update: EnhancedUpdate) => {
    switch (update.type) {
      case 'status':
        return <>changed the status to <Badge variant="outline">{update.details?.newStatus}</Badge></>;
      case 'join':
        return <>joined the initiative.</>;
      case 'role_add':
        const memberLink = update.details?.memberName ? (
          <Link href={`/profile/${update.userId}`} className="font-medium text-primary hover:underline">
            {update.details.memberName}
          </Link>
        ) : (
          <span className="font-medium">a member</span>
        );
        return <>assigned the role <span className="font-medium">{update.details?.roleName}</span> to {memberLink}</>;
      case 'step_completion':
        return (
          <>
            completed the step:{' '}
            <Link href={update.details?.stepUrl || '#'} className="font-medium text-primary hover:underline">
              {update.details?.stepTitle || 'Unnamed Step'}
            </Link>
          </>
        );
      case 'resource_share':
        return (
          <>
            added a resource:{' '}
            <Link href={update.details?.resourceUrl || '#'} target="_blank" rel="noopener noreferrer" className="font-medium text-primary hover:underline inline-flex items-center">
              {update.details?.resourceTitle || 'Unnamed Resource'} <ExternalLink className="ml-1 h-3 w-3" />
            </Link>
          </>
        );
      case 'milestone_creation':
        return (
          <div className="flex items-center gap-2">
            <span>Created a new milestone:</span>
            <span className="font-semibold">{update.details?.title}</span>
          </div>
        );
      case 'milestone_status':
        return (
          <div className="flex items-center gap-2">
            <span>Updated milestone status:</span>
            <span className="font-semibold">{update.details?.title}</span>
            <span>to</span>
            <Badge variant="outline">{update.details?.status}</Badge>
          </div>
        );
      default:
        return <>posted an update.</>;
    }
  };

  return (
    <div className="space-y-8">
      {/* Trending Section */}
      {trendingUpdates.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <Card className="bg-card/80 backdrop-blur-sm shadow-lg rounded-2xl border-0">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <TrendingUp className="text-orange-500" /> Trending Updates
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {trendingUpdates.map(update => (
                  <motion.div
                    key={update.id}
                    whileHover={{ scale: 1.02 }}
                    className="flex items-center gap-3 p-3 hover:bg-muted/30 rounded-xl transition-colors"
                  >
                    <Avatar className="h-10 w-10 ring-2 ring-background">
                      <AvatarImage src={update.author.image || undefined} />
                      <AvatarFallback>{update.author.name?.[0] || '?'}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{update.author.name || 'Unknown User'}</p>
                      <p className="text-xs text-muted-foreground truncate">{renderUpdateContent(update)}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">{update.reactionCount} reactions</span>
                      <span className="text-xs text-muted-foreground">{update.commentCount} comments</span>
                    </div>
                  </motion.div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Main Updates Feed */}
      <div className="space-y-8">
        <AnimatePresence>
          {sortedUpdates.map((update, index) => (
            <motion.div
              key={update.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <Card className={cn(
                "bg-card/80 backdrop-blur-sm shadow-lg rounded-2xl border-0 relative overflow-hidden",
                update.isPinned && "ring-2 ring-primary"
              )}>
                {update.isPinned && (
                  <div className="absolute top-4 right-4">
                    <Pin className="h-5 w-5 text-primary" />
                  </div>
                )}
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <Link href={`/profile/${update.author.id}`}>
                      <Avatar className="h-12 w-12 ring-2 ring-background">
                        <AvatarImage src={update.author.image || undefined} />
                        <AvatarFallback>{update.author.name?.[0] || '?'}</AvatarFallback>
                      </Avatar>
                    </Link>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <Link href={`/profile/${update.author.id}`}>
                          <p className="font-semibold text-base">{update.author.name || 'Unknown User'}</p>
                        </Link>
                        <span className="text-xs text-muted-foreground">
                          {formatDistanceToNow(update.timestamp, { addSuffix: true })}
                        </span>
                      </div>
                      <div className="text-sm mt-2">{renderUpdateContent(update)}</div>

                      {/* Media rendering */}
                      {update.media && update.media.length > 0 && (
                        <div className="mt-4 -mx-6">
                          <div className="flex gap-1 overflow-x-auto pb-4 px-6">
                            {update.media.map((item, index) => (
                              <motion.div
                                key={index}
                                whileHover={{ scale: 1.02 }}
                                className="flex-none"
                              >
                                {item.type === 'image' ? (
                                  <Image
                                    src={item.url}
                                    alt={`Media ${index + 1}`}
                                    width={300}
                                    height={200}
                                    className="rounded-xl object-cover"
                                  />
                                ) : item.type === 'video' ? (
                                  <video
                                    controls
                                    className="rounded-xl"
                                    style={{ width: '300px', height: '200px', objectFit: 'cover' }}
                                  >
                                    <source src={item.url} type="video/mp4" />
                                    Your browser does not support the video tag.
                                  </video>
                                ) : null}
                              </motion.div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Reactions */}
                      <div className="flex items-center gap-2 mt-4">
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-muted/50 hover:bg-muted transition-colors"
                          onClick={() => handleReaction(update.id, 'like')}
                        >
                          <ThumbsUp className="h-4 w-4" />
                          <span className="text-xs">{update.reactionCount || 0}</span>
                        </motion.button>
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          className="p-1.5 rounded-full bg-muted/50 hover:bg-muted transition-colors"
                          onClick={() => handleReaction(update.id, 'celebrate')}
                        >
                          <PartyPopper className="h-4 w-4" />
                        </motion.button>
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          className="p-1.5 rounded-full bg-muted/50 hover:bg-muted transition-colors"
                          onClick={() => handleReaction(update.id, 'support')}
                        >
                          <Heart className="h-4 w-4" />
                        </motion.button>
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          className="p-1.5 rounded-full bg-muted/50 hover:bg-muted transition-colors"
                          onClick={() => handleReaction(update.id, 'insightful')}
                        >
                          <Lightbulb className="h-4 w-4" />
                        </motion.button>
                      </div>

                      {/* Comments */}
                      {update.comments && update.comments.length > 0 && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          className="mt-4 space-y-3"
                        >
                          {update.comments.map(comment => (
                            <motion.div
                              key={comment.id}
                              initial={{ opacity: 0, x: -20 }}
                              animate={{ opacity: 1, x: 0 }}
                              className="flex items-start gap-3"
                            >
                              <Avatar className="h-8 w-8">
                                <AvatarImage src={mockUsers[comment.userId]?.avatar} />
                                <AvatarFallback>{comment.userName[0]}</AvatarFallback>
                              </Avatar>
                              <div className="flex-1 bg-muted/50 rounded-xl p-3">
                                <p className="text-xs font-medium">{comment.userName}</p>
                                <p className="text-sm mt-1">{comment.content}</p>
                              </div>
                            </motion.div>
                          ))}
                        </motion.div>
                      )}

                      {/* Comment Input */}
                      <motion.div
                        layout
                        className="mt-4 flex gap-2"
                      >
                        <Input
                          placeholder="Add a comment..."
                          className="flex-1 h-10 rounded-full bg-muted/50 border-0 focus-visible:ring-1"
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' && e.currentTarget.value.trim()) {
                              handleComment(update.id, e.currentTarget.value);
                              e.currentTarget.value = '';
                            }
                          }}
                        />
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          className="h-10 w-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center"
                        >
                          <Send className="h-4 w-4" />
                        </motion.button>
                      </motion.div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
      
      {hasMore && (
        <Button 
          variant="outline" 
          className="w-full"
          onClick={onLoadMore}
        >
          Load More
        </Button>
      )}
    </div>
  );
}

// --- Sidebar Component ---
export function InitiativeSidebar({ 
  initiative, 
  members 
}: { 
  initiative: Initiative;
  members: UserForDisplay[];
}) {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-sm font-medium mb-3">Members</h3>
        <div className="space-y-4">
          {members.map((member) => (
            <div key={member.id} className="flex items-center gap-3">
              <Avatar>
                <AvatarImage src={member.image || undefined} />
                <AvatarFallback>{member.name?.[0] || '?'}</AvatarFallback>
              </Avatar>
              <div>
                <p className="text-sm font-medium">{member.name || 'Anonymous'}</p>
                <p className="text-xs text-muted-foreground">
                  Last active: {member.lastActive ? new Date(member.lastActive).toLocaleDateString() : 'Never'}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// --- Mission Progress Banner Component ---
export function MissionProgressBanner({ 
  initiative, 
  milestones,
  onContributeClick 
}: { 
  initiative: Initiative;
  milestones: Milestone[];
  onContributeClick: () => void;
}) {
  const completedMilestones = milestones.filter(m => m.status === "completed" as MilestoneStatus).length; // Changed
  const totalMilestones = milestones.length;
  const nextMilestoneIdx = milestones.findIndex(m => m.status !== ("completed" as MilestoneStatus)); // Changed
  const nextMilestone = nextMilestoneIdx !== -1 ? milestones[nextMilestoneIdx] : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="mb-6"
    >
      <Card className="bg-card/90 backdrop-blur-sm shadow-lg rounded-xl border-0">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
            {/* Status & Progress */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 mb-3">
                <div className={cn(
                  "h-2 w-2 rounded-full",
                  initiative.status === ("completed" as InitiativeStatus) ? "bg-accent" : // Changed
                  initiative.status === ("active" as InitiativeStatus) ? "bg-primary" : // Changed from InProgress
                  initiative.status === ("draft" as InitiativeStatus) ? "bg-yellow-500" : // Changed from Planning
                  "bg-muted"
                )} />
                <span className="text-sm font-medium text-muted-foreground">
                  {initiative.status}
                </span>
              </div>
              
              <h2 className="text-xl font-semibold mb-2">
                {nextMilestone ? nextMilestone.title : "All Milestones Complete!"}
              </h2>
              
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <div className="w-full bg-muted/30 rounded-full h-1.5">
                    <div
                      className="bg-primary h-1.5 rounded-full transition-all"
                      style={{ width: `${(completedMilestones/totalMilestones)*100}%` }}
                    />
                  </div>
                  <span className="text-sm text-muted-foreground whitespace-nowrap">
                    {completedMilestones}/{totalMilestones} complete
                  </span>
                </div>
                
                {nextMilestone && (
                  <p className="text-sm text-muted-foreground">
                    Next: {nextMilestone.title}
                  </p>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-2">
              {initiative.status === ("completed" as InitiativeStatus) ? ( // Changed
                <>
                  <Button variant="outline" size="sm" className="gap-2">
                    <Share2 className="h-4 w-4" />
                    Share
                  </Button>
                  <Button variant="outline" size="sm" className="gap-2">
                    <Archive className="h-4 w-4" />
                    Archive
                  </Button>
                </>
              ) : (
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="gap-2"
                  onClick={onContributeClick}
                >
                  <CheckCircle className="h-4 w-4" />
                  Contribute
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

// Update mockGoals to match the Goal type from types.ts
const mockGoals: Goal[] = [
  {
    id: "goal1",
    title: "Implement Core Features",
    description: "Complete implementation of core platform features",
    owner: { id: "user1", name: "Alice" } as UserForDisplay,
    ownerName: "Alice",
    ownerAvatar: null,
    status: "InProgress" as GoalStatus,
    dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
    updatedAt: new Date(),
    progress: 45,
    priority: "High" as Priority,
    tags: ["Backend", "API", "Core"]
  },
  {
    id: "goal2",
    title: "User Dashboard",
    description: "Design and implement user dashboard interface",
    owner: { id: "user2", name: "Bob" } as UserForDisplay,
    ownerName: "Bob",
    ownerAvatar: null,
    status: "NotStarted" as GoalStatus,
    dueDate: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000),
    createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
    updatedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
    progress: 0,
    priority: "Medium" as Priority,
    tags: ["UI/UX", "Frontend", "Dashboard"]
  },
  {
    id: "goal3",
    title: "Real-time Chat",
    description: "Implement real-time chat functionality",
    owner: { id: "user3", name: "Charlie" } as UserForDisplay,
    ownerName: "Charlie",
    ownerAvatar: null,
    status: "NotStarted" as GoalStatus,
    dueDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
    createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
    updatedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
    progress: 0,
    priority: "High" as Priority,
    tags: ["Backend", "Real-time", "WebSocket"]
  }
];

// Update mockTasks with correct status values
const mockTasks = [
  {
    id: "task1",
    title: "Design Homepage Mockup",
    description: "Create initial mockups for the homepage design",
    status: "ToDo" as StepStatus,
    assignee: { id: "user1", name: "Alice" },
    dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
  },
  {
    id: "task2",
    title: "Setup Development Environment",
    description: "Configure development tools and dependencies",
    status: "ToDo" as StepStatus,
    assignee: { id: "user2", name: "Bob" },
    dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000)
  },
  {
    id: "task3",
    title: "Database Schema Design",
    description: "Design initial database schema for core features",
    status: "ToDo" as StepStatus,
    dueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000)
  }
];

// Update GoalsSection component to handle goals array
export function GoalsSection({ initiativeId }: { initiativeId: string }) {
  const [isAddingGoal, setIsAddingGoal] = useState(false);
  const [newGoalTitle, setNewGoalTitle] = useState('');
  const [newGoalDescription, setNewGoalDescription] = useState('');
  const [selectedPriority, setSelectedPriority] = useState<Priority>('Medium');

  // Use mockGoals directly as an array
  const goals = mockGoals;

  const handleAddGoal = () => {
    // Add goal logic here
    setIsAddingGoal(false);
    setNewGoalTitle('');
    setNewGoalDescription('');
  };

  return (
    <div className="space-y-4">
      {/* ... rest of the component remains unchanged ... */}
    </div>
  );
}

// Update EditInitiativeDialog component
export function EditInitiativeDialog({ 
  initiative, 
  isOpen, 
  onClose, 
  onSave 
}: { 
  initiative: Initiative;
  isOpen: boolean;
  onClose: () => void;
  onSave: (updatedInitiative: Partial<Initiative>) => void;
}) {
  const [title, setTitle] = useState(initiative.title);
  const [description, setDescription] = useState(initiative.description);
  const [imageUrl, setImageUrl] = useState(initiative.imageUrl || '');
  const [status, setStatus] = useState<InitiativeStatus>(initiative.status);
  const [roles, setRoles] = useState<Role[]>(initiative.roles);
  const [isSaving, setIsSaving] = useState(false);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(initiative.imageUrl || null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleImageSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedImage(file);
      // Create preview URL
      const previewUrl = URL.createObjectURL(file);
      setImagePreview(previewUrl);
    }
  };

  const handleRemoveImage = () => {
    setSelectedImage(null);
    setImagePreview(null);
    setImageUrl('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      // If there's a new image selected, upload it first
      let finalImageUrl = imageUrl;
      if (selectedImage) {
        const formData = new FormData();
        formData.append('file', selectedImage);
        formData.append('initiativeId', initiative.id);

        const response = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        });

        if (!response.ok) {
          throw new Error('Failed to upload image');
        }

        const data = await response.json();
        finalImageUrl = data.url;
      }

      onSave({
        title,
        description,
        imageUrl: finalImageUrl || undefined,
        status,
        roles
      });
      onClose();
    } catch (error) {
      console.error('Error saving initiative:', error);
      toast({
        title: "Error",
        description: "Failed to save initiative. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={() => onClose()}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Edit Initiative</DialogTitle>
          <DialogDescription>
            Make changes to your initiative here. Click save when you're done.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          {/* Image Upload Section */}
          <div className="space-y-2">
            <Label>Initiative Image</Label>
            <div className="flex flex-col gap-4">
              {imagePreview ? (
                <div className="relative aspect-[16/9] w-full overflow-hidden rounded-lg border bg-muted">
                  <Image
                    src={imagePreview}
                    alt="Initiative preview"
                    fill
                    className="object-cover"
                  />
                  <Button
                    variant="destructive"
                    size="sm"
                    className="absolute top-2 right-2"
                    onClick={handleRemoveImage}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <div className="flex aspect-[16/9] w-full items-center justify-center rounded-lg border border-dashed bg-muted">
                  <div className="flex flex-col items-center gap-2">
                    <ImageIcon className="h-8 w-8 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">No image selected</p>
                  </div>
                </div>
              )}
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <ImageIcon className="h-4 w-4 mr-2" />
                  {imagePreview ? 'Change Image' : 'Upload Image'}
                </Button>
                {imagePreview && (
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full"
                    onClick={handleRemoveImage}
                  >
                    <X className="h-4 w-4 mr-2" />
                    Remove Image
                  </Button>
                )}
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleImageSelect}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter initiative title"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe your initiative"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="status">Status</Label>
            <select
              id="status"
              value={status}
              onChange={(e) => setStatus(e.target.value as InitiativeStatus)}
              className="w-full rounded-md border border-input bg-background px-3 py-2"
            >
              <option value="Idea">Idea</option>
              <option value="Planning">Planning</option>
              <option value="SeekingMembers">Seeking Members</option>
              <option value="InProgress">In Progress</option>
              <option value="Completed">Completed</option>
            </select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="roles">Roles</Label>
            <Input
              id="roles"
              value={roles.map(role => role.title).join(', ')}
              onChange={(e) => {
                const roleTitles = e.target.value.split(',').map(title => title.trim()).filter(Boolean);
                setRoles(roleTitles.map(title => ({
                  id: `role-${Date.now()}-${title}`,
                  title,
                  description: `Role: ${title}`,
                  type: 'member' as RoleType, // Changed from status and MilestoneStatus
                  // Add other required fields for Role if any, e.g., requirements, responsibilities
                  // createdAt: new Date(), // Not part of Role type
                  // updatedAt: new Date(), // Not part of Role type
                  // creator: { ... } // Not part of Role type
                })));
              }}
              placeholder="e.g., Developer, Designer, Project Manager"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? 'Saving...' : 'Save Changes'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

interface DatabaseInitiative {
  id: string;
  title: string;
  description: string;
  imageUrl?: string;
  // Assuming roles from DB might be simpler, e.g., just titles or a simplified Role object
  // For this example, let's assume it's an array of objects that can be mapped to Role
  roles: Array<{
    id: string;
    title: string;
    description?: string;
    type?: string; // Or RoleType if defined
    // Add other fields if they come from DB, otherwise they'll be defaulted in transformation
  }>;
  status: string;
  createdAt: Date;
  updatedAt: Date; // Added updatedAt to DatabaseInitiative
  creatorId: string;
  creator?: UserForDisplay; // Added creator object
  // Assuming members from DB might be UserForDisplay or a simplified Member object
  members?: Array<UserForDisplay & { role?: string; joinedAt?: Date | string }>; // Allow role and joinedAt to come from DB
  updates?: Array<{
    id: string;
    initiativeId: string;
    type: string;
    timestamp: Date;
    userId?: string;
    userName?: string;
    user?: UserForDisplay; // Added user object for author
    content: string; // Changed from text to content
    media?: any[];
    details?: any;
    // Add fields for likes if they come from DB update object
  }>;
  chatMessages?: Array<{
    id: string;
    timestamp: Date;
    senderId: string;
    senderName: string;
    text: string;
    sender?: UserForDisplay;
    media?: MediaItem[];
    reactions?: Array<{ id: string; emoji: string; userId: string; userName: string; }>;
  }>;
  goals?: any[]; // Define more strictly if possible
  milestones?: any[]; // Define more strictly if possible
}

interface InitiativeResponse {
  initiative?: DatabaseInitiative;
  error?: string;
}

// Add helper functions for data transformation
const transformTimestamp = (timestamp: Date | Timestamp): Date => {
  if (timestamp instanceof Date) {
    return timestamp;
  }
  return timestamp.toDate();
};

type DatabaseMessage = {
  id: string;
  senderId: string;
  senderName: string;
  text: string;
  timestamp: Date;
  media?: MediaItem[];
  reactions?: Array<{
    id: string;
    emoji: string;
    userId: string;
    userName: string;
  }>;
};

type DatabaseUpdate = {
  id: string;
  type: string;
  timestamp: Date;
  userId: string | null;
  userName: string | null;
  content: string; // Changed from text to content
  media?: MediaItem[];
  details?: Record<string, any> | null;
  user?: UserForDisplay | null; // For author
  reactions?: Reaction[]; // Or a raw format for reactions
  likesCount?: number; // Example for likes
};

// Update transformMessages function to match EnhancedChatMessage type
const transformMessages = (messages: DatabaseMessage[], targetInitiativeId: string): EnhancedChatMessage[] => {
  return messages.map(msg => ({
    id: msg.id,
    text: msg.text,
    createdAt: msg.timestamp,
    updatedAt: msg.timestamp,
    creator: {
      id: msg.senderId,
      name: msg.senderName
    }
  }));
};

// Update transformUpdates function to match EnhancedUpdate type
const transformUpdates = (updates: DatabaseUpdate[], targetInitiativeId: string): EnhancedUpdate[] => {
  return updates.map(update => ({
    id: update.id,
    content: update.content, 
    type: update.type as UpdateType,
    timestamp: update.timestamp instanceof Date ? update.timestamp : new Date(update.timestamp),
    createdAt: update.timestamp instanceof Date ? update.timestamp : new Date(update.timestamp), 
    updatedAt: update.timestamp instanceof Date ? update.timestamp : new Date(update.timestamp), 
    author: update.user ? {
      id: update.user.id,
      name: update.user.name || 'Unknown User',
      image: update.user.image
    } : {
      id: update.userId || 'unknown',
      name: update.userName || 'Unknown User',
      image: null
    },
    // reactionCount and commentCount are now part of the base Update type in types.ts
    // So, they should come directly from the DatabaseUpdate if available, or default here.
    reactionCount: update.likesCount || update.reactions?.length || 0, // Use likesCount or calculate from reactions
    commentCount: 0, // Assuming this needs to be calculated or fetched separately if not on DatabaseUpdate
    details: update.details || {},
    media: update.media || [],
    // EnhancedUpdate specific fields, default if not on DatabaseUpdate
    comments: [], // Default to empty, or transform if comments come from DB update object
    reactions: update.reactions || [], 
    isPinned: false, 
    // Remove redundant creator if author is already set and matches UserForDisplay
    // creator: update.user ? { id: update.user.id, name: update.user.name || 'Unknown User', image: update.user.image } : { id: 'unknown', name: 'Unknown' },
  }));
};

// Update transformDbGoalToGoal function to include all required properties
function transformDbGoalToGoal(dbGoal: any): Goal {
  return {
    id: dbGoal.id,
    title: dbGoal.title,
    description: dbGoal.description,
    status: convertStatus(dbGoal.status) as GoalStatus,
    priority: dbGoal.priority as Priority,
    dueDate: dbGoal.dueDate ? convertTimestampToDate(dbGoal.dueDate) : undefined,
    tags: dbGoal.tags || [],
    owner: dbGoal.owner ? {
      id: dbGoal.owner.id,
      name: dbGoal.owner.name || null,
      image: dbGoal.owner.image
    } : null,
    ownerName: dbGoal.owner?.name || 'Unknown User',
    ownerAvatar: dbGoal.owner?.image || null,
    progress: dbGoal.progress || 0,
    createdAt: convertTimestampToDate(dbGoal.createdAt),
    updatedAt: convertTimestampToDate(dbGoal.updatedAt)
  };
}

// Update transformDbMilestoneToMilestone function to handle UserForDisplay type
function transformDbMilestoneToMilestone(dbMilestone: any): Milestone {
  return {
    id: dbMilestone.id,
    title: dbMilestone.title,
    description: dbMilestone.description || '',
    status: convertStatus(dbMilestone.status) as MilestoneStatus,
    dueDate: dbMilestone.dueDate ? convertTimestampToDate(dbMilestone.dueDate) : undefined,
    creator: dbMilestone.creator ? {
      id: dbMilestone.creator.id,
      name: dbMilestone.creator.name || null,
      image: dbMilestone.creator.image
    } : undefined,
    createdAt: convertTimestampToDate(dbMilestone.createdAt),
    updatedAt: convertTimestampToDate(dbMilestone.updatedAt)
  };
}

// Helper function to convert status values
function convertStatus(status: string): InitiativeStatus | MilestoneStatus | GoalStatus {
  const statusMap: Record<string, string> = {
    "In Progress": "InProgress",
    "Not Started": "NotStarted",
    "On Hold": "OnHold",
    "Seeking Members": "SeekingMembers",
    "To Do": "ToDo",
    "In Review": "InReview"
  };
  return (statusMap[status] || status) as InitiativeStatus | MilestoneStatus | GoalStatus;
}

// Helper function to convert Timestamp to Date
function convertTimestampToDate(timestamp: Date | string | number): Date {
  if (timestamp instanceof Date) return timestamp;
  if (typeof timestamp === 'string') return new Date(timestamp);
  if (typeof timestamp === 'number') return new Date(timestamp);
  return new Date(timestamp);
}

function transformDatabaseInitiative(dbInitiative: DatabaseInitiative, initiativeId: string): Initiative {
  const initiative: Initiative = {
    id: initiativeId,
    title: dbInitiative.title,
    description: dbInitiative.description || '',
    status: convertStatus(dbInitiative.status) as InitiativeStatus,
    createdAt: convertTimestampToDate(dbInitiative.createdAt),
    updatedAt: convertTimestampToDate(dbInitiative.updatedAt || dbInitiative.createdAt), 
    imageUrl: dbInitiative.imageUrl || null,
    roles: (dbInitiative.roles || []).map((dbRole: any) => ({
      id: dbRole.id || `role-${Date.now()}-${dbRole.title}`,
      title: dbRole.title,
      description: dbRole.description || `Role: ${dbRole.title}`,
      type: (dbRole.type || 'member') as RoleType, // Ensure RoleType is imported and used
      // requirements: dbRole.requirements || [], // Add if in your Role type
      // responsibilities: dbRole.responsibilities || [], // Add if in your Role type
    })),
    creator: dbInitiative.creator ? {
      id: dbInitiative.creator.id,
      name: dbInitiative.creator.name || 'Unknown User',
      image: dbInitiative.creator.image
    } : (dbInitiative.creatorId ? { id: dbInitiative.creatorId, name: 'Unknown User', image: null} : {
      id: 'unknown',
      name: 'Unknown User',
      image: null
    }),
    members: (dbInitiative.members || []).map((dbMember: any) => ({
      id: dbMember.id,
      name: dbMember.name || null,
      image: dbMember.image || null,
      role: (dbMember.role || 'contributor') as RoleType, // Ensure RoleType
      joinedAt: dbMember.joinedAt ? convertTimestampToDate(dbMember.joinedAt) : new Date(),
      // lastActive: dbMember.lastActive ? convertTimestampToDate(dbMember.lastActive) : undefined // Add if in your Member type
    })),
    // Use the refined transformUpdates function for consistency if Initiative.updates expects EnhancedUpdate[]
    // If Initiative.updates expects Update[], the direct mapping below is fine but ensure it matches Update type.
    updates: dbInitiative.updates ? transformUpdates(dbInitiative.updates.map(u => ({...u, userId: u.userId || null, userName: u.userName || null, content: u.content || ''})), initiativeId) : [],
    goals: (dbInitiative.goals || []).map(transformDbGoalToGoal),
    milestones: (dbInitiative.milestones || []).map(transformDbMilestoneToMilestone),
    // Ensure chatMessages are transformed to EnhancedChatMessage as per Initiative type
    chatMessages: (dbInitiative.chatMessages || []).map((msg: any) => ({
      id: msg.id,
      text: msg.text, 
      createdAt: convertTimestampToDate(msg.timestamp),
      updatedAt: convertTimestampToDate(msg.timestamp), 
      creator: msg.sender ? {
        id: msg.sender.id,
        name: msg.sender.name || 'Unknown User',
        image: msg.sender.image
      } : {
        id: msg.senderId,
        name: msg.senderName || 'Unknown User',
        image: null // Assuming sender might not always have an image
      },
      // media: msg.media || [], // Add if in your EnhancedChatMessage type
      // reactions: msg.reactions || [] // Add if in your EnhancedChatMessage type
    } as EnhancedChatMessage))
  };
  return initiative;
}

// Main page component
export default async function InitiativePage({ params }: { params: { id: string } }) {
  const initiative = await getInitiativeById(params.id);
  const transformedInitiative = initiative.initiative 
    ? transformDatabaseInitiative(initiative.initiative, params.id)
    : null;

  if (initiative.error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-red-600">Error</h2>
          <p className="mt-2">{initiative.error}</p>
        </div>
      </div>
    );
  }

  if (!transformedInitiative) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold">Initiative Not Found</h2>
          <p className="mt-2">The initiative you're looking for doesn't exist.</p>
        </div>
      </div>
    );
  }

  return (
    <InitiativeClientPage 
      initiative={transformedInitiative} 
      initiativeId={params.id} 
    />
  );
}