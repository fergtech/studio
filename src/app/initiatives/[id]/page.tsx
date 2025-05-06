"use client";

import React from 'react';
import { useParams } from 'next/navigation';
// Added Milestone, Step, StepStatus types
import type { Initiative, ChatMessage, Update, UpdateType, Milestone, Step, StepStatus, Goal } from "@/lib/types"; 
import Link from 'next/link'; 

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area"; // Import ScrollBar
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Timestamp } from 'firebase/firestore'; 
import Image from 'next/image';
// Added Edit, Paperclip, Flag, CheckCircle, Tag, UserPlus, FileText, Info, MessageSquare, X, Send, Clock, Users, Plus
import { Users, Clock, Send, Info, Plus, MessageSquare, X, FileText, CheckCircle, UserPlus, Tag, Flag, Edit, Paperclip, ExternalLink, Circle, ArrowRight, TrendingUp, Pin, ThumbsUp, PartyPopper, Heart, Lightbulb, Flame, Trophy, Award, Share2, Twitter, Facebook, Link2, Image as ImageIcon, Smile, Archive, User, Calendar } from 'lucide-react'; 
import { useState, useEffect } from 'react';
import { cn } from "@/lib/utils"; 
// Added Tabs components
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"; 
// Added Textarea
import { Textarea } from "@/components/ui/textarea"; 
// Added MilestoneList
import { MilestoneList } from '@/components/MilestoneList'; 
import { formatDistanceToNow } from 'date-fns'; // <-- Import formatDistanceToNow
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { motion, AnimatePresence } from 'framer-motion';

// --- MOCK DATA ---
// Mock data (replace with actual data fetching)
const mockInitiatives: Record<string, Initiative> = {
  "init-1": {
    id: "init-1",
    title: "Community Garden Project",
    description: "Let's build a community garden together! We need volunteers for planting, watering, and maintenance. Our goal is to create a vibrant green space for everyone to enjoy and learn about sustainable gardening practices. We meet every Saturday morning.",
    imageUrl: "https://picsum.photos/seed/garden/800/400",
    roles: ["Gardener", "Volunteer", "Organizer", "Watering Crew", "Composter"],
    status: "Seeking Members",
    createdAt: Timestamp.fromDate(new Date(Date.now() - 2 * 24 * 60 * 60 * 1000)), // 2 days ago
    creatorId: "user1",
    memberIds: ["user1", "user2"],
  },
  "init-2": {
    id: "init-2",
    title: "Youth Tech Workshop",
    description: "Organizing a weekend workshop to teach local kids basic coding skills using Scratch and Python. Looking for instructors and helpers to mentor the students. No experience needed for helpers, just enthusiasm!",
    imageUrl: "https://picsum.photos/seed/tech/800/400",
    roles: ["Developer", "Instructor", "Mentor", "Volunteer", "Logistics"],
    status: "Planning",
    createdAt: Timestamp.fromDate(new Date(Date.now() - 5 * 24 * 60 * 60 * 1000)), // 5 days ago
    creatorId: "user3",
    memberIds: ["user3"],
  },
  "init-3": {
    id: "init-3",
    title: "Neighborhood Park Cleanup",
    description: "Join us this Saturday at 9 AM to clean up and beautify Miller Park. Bring gloves and enthusiasm! We'll provide trash bags and refreshments. Let's make our park shine!",
    imageUrl: "https://picsum.photos/seed/park/800/400",
    roles: ["Volunteer", "Community Member", "Team Lead"],
    status: "In Progress",
    createdAt: Timestamp.fromDate(new Date(Date.now() - 1 * 24 * 60 * 60 * 1000)), // 1 day ago
    creatorId: "user4",
    memberIds: ["user4", "user5", "user6", "user7"],
  },
   "init-4": {
    id: "init-4",
    title: "Local History Documentation",
    description: "Collecting stories and photos about the history of APG. Need researchers, writers, and interviewers to help preserve our local heritage. We aim to create a digital archive accessible to the public.",
    // No image provided for this one to test fallback
    roles: ["Researcher", "Writer", "Interviewer", "Historian", "Archivist"],
    status: "Idea",
    createdAt: Timestamp.fromDate(new Date(Date.now() - 10 * 24 * 60 * 60 * 1000)), // 10 days ago
    creatorId: "user8",
    memberIds: ["user8"],
  },
};

// Update mock chat messages to use EnhancedChatMessage
const mockChatMessages: Record<string, EnhancedChatMessage[]> = {
  "init-1": [
    { 
      id: 'm1', 
      initiativeId: 'init-1', 
      senderId: 'user1', 
      senderName: 'Alice', 
      text: 'Welcome everyone! Excited to get this garden started.', 
      timestamp: Timestamp.fromDate(new Date(Date.now() - 60 * 60 * 1000)),
      reactions: [
        { id: 'r1', emoji: '🌱', userId: 'user2', userName: 'Bob' },
        { id: 'r2', emoji: '👍', userId: 'user3', userName: 'Charlie' }
      ]
    },
    { 
      id: 'm2', 
      initiativeId: 'init-1', 
      senderId: 'user2', 
      senderName: 'Bob', 
      text: 'Me too! I can bring some tools on Saturday.', 
      timestamp: Timestamp.fromDate(new Date(Date.now() - 30 * 60 * 1000)),
      media: [
        { url: 'https://picsum.photos/seed/tools/400/300', type: 'image' }
      ]
    },
  ],
  "init-2": [
     { id: 'm3', initiativeId: 'init-2', senderId: 'user3', senderName: 'Charlie', text: 'Drafting the curriculum now. Anyone have suggestions for fun beginner projects?', timestamp: Timestamp.fromDate(new Date(Date.now() - 2 * 60 * 60 * 1000)) },
  ],
   "init-3": [
    { id: 'm4', initiativeId: 'init-3', senderId: 'user4', senderName: 'Diana', text: 'Reminder: Cleanup starts at 9 AM sharp tomorrow!', timestamp: Timestamp.fromDate(new Date(Date.now() - 10 * 60 * 1000)) },
    { id: 'm5', initiativeId: 'init-3', senderId: 'user5', senderName: 'Eve', text: 'Got my gloves ready!', timestamp: Timestamp.fromDate(new Date(Date.now() - 5 * 60 * 1000)) },
    { id: 'm6', initiativeId: 'init-3', senderId: 'user4', senderName: 'Diana', text: 'Great! See you all there.', timestamp: Timestamp.fromDate(new Date(Date.now() - 2 * 60 * 1000)) },
   ],
    "init-4": [
     { id: 'm7', initiativeId: 'init-4', senderId: 'user8', senderName: 'Frank', text: 'Anyone know good resources for finding old APG photos?', timestamp: Timestamp.fromDate(new Date(Date.now() - 3 * 60 * 60 * 1000)) },
  ]
};

// Mock Update/Activity Data
const mockUpdates: Record<string, Update[]> = {
  "init-1": [
    { id: 'u1', initiativeId: 'init-1', type: 'join', userId: 'user2', userName: 'Bob', content: 'joined the initiative.', timestamp: Timestamp.fromDate(new Date(Date.now() - 1.5 * 24 * 60 * 60 * 1000)), details: { memberName: 'Bob' } },
    { 
      id: 'u2', 
      initiativeId: 'init-1', 
      type: 'post', 
      userId: 'user1', 
      userName: 'Alice', 
      content: 'Finalized the initial planting schedule. Check the shared doc! Also, here is a pic of the plot.', 
      timestamp: Timestamp.fromDate(new Date(Date.now() - 1 * 24 * 60 * 60 * 1000)),
      media: [
        { url: 'https://picsum.photos/seed/plot/400/300', type: 'image' }
      ]
    },
    { id: 'u3', initiativeId: 'init-1', type: 'role_add', userId: 'user1', userName: 'Alice', content: 'added the role "Composter".', timestamp: Timestamp.fromDate(new Date(Date.now() - 12 * 60 * 60 * 1000)), details: { roleName: 'Composter' } },
  ],
  "init-2": [
    { id: 'u4', initiativeId: 'init-2', type: 'status', userId: 'user3', userName: 'Charlie', content: 'updated the status to "Planning".', timestamp: Timestamp.fromDate(new Date(Date.now() - 4 * 24 * 60 * 60 * 1000)), details: { newStatus: 'Planning' } },
    { id: 'u5', initiativeId: 'init-2', type: 'post', userId: 'user3', userName: 'Charlie', content: 'Looking for feedback on the workshop curriculum draft.', timestamp: Timestamp.fromDate(new Date(Date.now() - 2 * 24 * 60 * 60 * 1000)) },
  ],
  "init-3": [
     { id: 'u6', initiativeId: 'init-3', type: 'join', userId: 'user5', userName: 'Eve', content: 'joined the initiative.', timestamp: Timestamp.fromDate(new Date(Date.now() - 20 * 60 * 60 * 1000)), details: { memberName: 'Eve' } },
     { id: 'u7', initiativeId: 'init-3', type: 'join', userId: 'user6', userName: 'Faythe', content: 'joined the initiative.', timestamp: Timestamp.fromDate(new Date(Date.now() - 18 * 60 * 60 * 1000)), details: { memberName: 'Faythe' } },
     { id: 'u8', initiativeId: 'init-3', type: 'join', userId: 'user7', userName: 'Grace', content: 'joined the initiative.', timestamp: Timestamp.fromDate(new Date(Date.now() - 17 * 60 * 60 * 1000)), details: { memberName: 'Grace' } },
     { 
      id: 'u9', 
      initiativeId: 'init-3', 
      type: 'milestone', 
      userId: 'user4', 
      userName: 'Diana', 
      content: 'marked the first cleanup session as complete! Great job everyone.', 
      timestamp: Timestamp.fromDate(new Date(Date.now() - 2 * 60 * 60 * 1000)), 
      details: {}, 
      media: [
        { url: 'https://picsum.photos/seed/cleanup1/400/300', type: 'image' },
        { url: 'https://picsum.photos/seed/cleanup2/400/300', type: 'image' }
        // Example video (replace with actual video URL if needed)
        // { url: 'https://example.com/cleanup_video.mp4', type: 'video' }
      ]
    },
  ],
   "init-4": [
     { id: 'u10', initiativeId: 'init-4', type: 'post', userId: 'user8', userName: 'Frank', content: 'Created a shared drive for collecting historical photos and documents. Link in chat.', timestamp: Timestamp.fromDate(new Date(Date.now() - 5 * 24 * 60 * 60 * 1000)) },
  ]
};

// Mock User Profile Data (Simplified)
const mockUsers: Record<string, { name: string; avatar?: string }> = {
  "user1": { name: "Alice" , avatar: "https://i.pravatar.cc/40?u=user1"},
  "user2": { name: "Bob" },
  "user3": { name: "Charlie", avatar: "https://i.pravatar.cc/40?u=user3" },
  "user4": { name: "Diana" },
  "user5": { name: "Eve", avatar: "https://i.pravatar.cc/40?u=user5" },
  "user6": { name: "Faythe" },
  "user7": { name: "Grace", avatar: "https://i.pravatar.cc/40?u=user7" },
  "user8": { name: "Frank" },
};

// --- NEW: Mock Milestones & Steps ---
// (Copied and adapted from profile page mock data for consistency)
const getMockMilestones = (initiativeId: string): Milestone[] => {
  const baseId = parseInt(initiativeId.split('-')[1] || '1') % 2; 
  if (baseId === 0) { // Corresponds to init-2, init-4
    return [
      { id: `m-${initiativeId}-1`, initiativeId, title: "Phase 1: Planning & Research", status: "Completed", order: 1, createdAt: Timestamp.fromDate(new Date('2025-01-10')), creatorId: 'user3' },
      { id: `m-${initiativeId}-2`, initiativeId, title: "Phase 2: Initial Development", status: "In Progress", order: 2, createdAt: Timestamp.fromDate(new Date('2025-02-01')), creatorId: 'user3' },
      { id: `m-${initiativeId}-3`, initiativeId, title: "Phase 3: Community Testing", status: "Planned", order: 3, createdAt: Timestamp.fromDate(new Date('2025-02-01')), creatorId: 'user3' },
    ];
  } else { // Corresponds to init-1, init-3
     return [
      { id: `m-${initiativeId}-1`, initiativeId, title: "Define Core Problem", status: "Completed", order: 1, createdAt: Timestamp.fromDate(new Date('2025-03-05')), creatorId: 'user1' },
      { id: `m-${initiativeId}-2`, initiativeId, title: "Gather Community Feedback", status: "Completed", order: 2, createdAt: Timestamp.fromDate(new Date('2025-03-20')), creatorId: 'user1' },
      { id: `m-${initiativeId}-3`, initiativeId, title: "Propose Solutions", status: "In Progress", order: 3, createdAt: Timestamp.fromDate(new Date('2025-04-10')), creatorId: 'user4' },
      { id: `m-${initiativeId}-4`, initiativeId, title: "Implement Pilot", status: "Planned", order: 4, createdAt: Timestamp.fromDate(new Date('2025-04-10')), creatorId: 'user4' },
    ];
  }
};

const getMockSteps = (milestoneId: string): Step[] => {
  const initiativeId = milestoneId.split('-')[1]; 
  const allSteps: Step[] = [ 
      // Steps for init-1, init-3 milestones
      { id: `s-${milestoneId}-1`, initiativeId, milestoneId, title: "Research existing community gardens", status: "Done" as StepStatus, createdAt: Timestamp.fromDate(new Date('2025-03-06')), creatorId: 'user1', assigneeId: 'user2', completedAt: Timestamp.fromDate(new Date('2025-03-10')) },
      { id: `s-${milestoneId}-2`, initiativeId, milestoneId, title: "Survey neighbors for interest", status: "Done" as StepStatus, createdAt: Timestamp.fromDate(new Date('2025-03-21')), creatorId: 'user1', assigneeId: 'user1', completedAt: Timestamp.fromDate(new Date('2025-03-28')) },
      { id: `s-${milestoneId}-3`, initiativeId, milestoneId, title: "Draft garden layout options", status: "In Progress" as StepStatus, createdAt: Timestamp.fromDate(new Date('2025-04-11')), creatorId: 'user4', assigneeId: 'user2' },
      { id: `s-${milestoneId}-4`, initiativeId, milestoneId, title: "Secure initial funding/donations", status: "To Do" as StepStatus, createdAt: Timestamp.fromDate(new Date('2025-04-11')), creatorId: 'user4' },
      { id: `s-${milestoneId}-5`, initiativeId, milestoneId, title: "Organize first cleanup day", status: "To Do" as StepStatus, createdAt: Timestamp.fromDate(new Date('2025-04-15')), creatorId: 'user4' },
      // Steps for init-2, init-4 milestones
      { id: `s-${milestoneId}-6`, initiativeId, milestoneId, title: "Research existing tech workshops", status: "Done" as StepStatus, createdAt: Timestamp.fromDate(new Date('2025-01-12')), creatorId: 'user3', assigneeId: 'user3', completedAt: Timestamp.fromDate(new Date('2025-01-20')) },
      { id: `s-${milestoneId}-7`, initiativeId, milestoneId, title: "Define target age group", status: "Done" as StepStatus, createdAt: Timestamp.fromDate(new Date('2025-01-15')), creatorId: 'user3', assigneeId: 'user3', completedAt: Timestamp.fromDate(new Date('2025-01-25')) },
      { id: `s-${milestoneId}-8`, initiativeId, milestoneId, title: "Develop curriculum outline", status: "In Progress" as StepStatus, createdAt: Timestamp.fromDate(new Date('2025-02-05')), creatorId: 'user3', assigneeId: 'user3' },
      { id: `s-${milestoneId}-9`, initiativeId, milestoneId, title: "Set up coding environment", status: "To Do" as StepStatus, createdAt: Timestamp.fromDate(new Date('2025-02-10')), creatorId: 'user3' },
      { id: `s-${milestoneId}-10`, initiativeId, milestoneId, title: "Recruit student testers", status: "To Do" as StepStatus, createdAt: Timestamp.fromDate(new Date('2025-02-15')), creatorId: 'user3' },
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
  timestamp: Timestamp;
}

interface Reaction {
  id: string;
  userId: string;
  type: 'like' | 'celebrate' | 'support' | 'insightful';
}

interface EnhancedUpdate extends Update {
  comments?: Comment[];
  reactions?: Reaction[];
  isPinned?: boolean;
  reactionCount?: number;
  commentCount?: number;
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
  earnedAt?: Timestamp;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
}

interface StreakInfo {
  currentStreak: number;
  longestStreak: number;
  lastActive: Timestamp;
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
  { id: 'b1', name: 'Early Adopter', description: 'Joined in the first week', icon: '🚀', rarity: 'rare', earnedAt: Timestamp.fromDate(new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)) },
  { id: 'b2', name: 'Milestone Master', description: 'Completed 5 milestones', icon: '🏆', rarity: 'epic', earnedAt: Timestamp.fromDate(new Date(Date.now() - 3 * 24 * 60 * 60 * 1000)) },
  { id: 'b3', name: 'Community Builder', description: 'Invited 3 members', icon: '👥', rarity: 'common', earnedAt: Timestamp.fromDate(new Date(Date.now() - 1 * 24 * 60 * 60 * 1000)) },
];

const mockStreakInfo: StreakInfo = {
  currentStreak: 5,
  longestStreak: 7,
  lastActive: Timestamp.fromDate(new Date(Date.now() - 12 * 60 * 60 * 1000)),
  xp: 1250,
  level: 3,
};

// Add new types for online status
interface OnlineMember {
  id: string;
  name: string;
  avatar?: string;
  lastActive: Timestamp;
}

// Mock data for online members
const mockOnlineMembers: OnlineMember[] = [
  { id: 'user1', name: 'Alice', avatar: 'https://i.pravatar.cc/40?u=user1', lastActive: Timestamp.fromDate(new Date()) },
  { id: 'user2', name: 'Bob', lastActive: Timestamp.fromDate(new Date(Date.now() - 5 * 60 * 1000)) },
  { id: 'user3', name: 'Charlie', avatar: 'https://i.pravatar.cc/40?u=user3', lastActive: Timestamp.fromDate(new Date(Date.now() - 2 * 60 * 1000)) },
];

// Add new types for chat enhancements
interface ChatReaction {
  id: string;
  emoji: string;
  userId: string;
  userName: string;
}

// Update the ChatMessage interface to avoid conflict
interface EnhancedChatMessage {
  id: string;
  initiativeId: string;
  senderId: string;
  senderName: string;
  text: string;
  timestamp: Timestamp;
  reactions?: ChatReaction[];
  media?: {
    url: string;
    type: 'image' | 'gif';
  }[];
}

// --- NEW: Update Creation Form Component ---
function CreateUpdateForm({ initiativeId, onPostUpdate }: { initiativeId: string; onPostUpdate: (updateData: any) => void }) {
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
      timestamp: Timestamp.now(),
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
function ActivityFeed({ updates }: { updates: Update[] }) {
  const [enhancedUpdates, setEnhancedUpdates] = useState<EnhancedUpdate[]>(
    updates.map(update => ({
      ...update,
      comments: [],
      reactions: [],
      isPinned: false,
      reactionCount: 0,
      commentCount: 0
    }))
  );

  const trendingUpdates = enhancedUpdates
    .filter(update => (update.reactionCount || 0) > 0)
    .sort((a, b) => ((b.reactionCount || 0) + (b.commentCount || 0)) - ((a.reactionCount || 0) + (a.commentCount || 0)))
    .slice(0, 3);

  const sortedUpdates = [...enhancedUpdates].sort((a, b) => {
    if (a.isPinned && !b.isPinned) return -1;
    if (!a.isPinned && b.isPinned) return 1;
    return b.timestamp.toMillis() - a.timestamp.toMillis();
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
          timestamp: Timestamp.fromDate(new Date())
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

  const renderUpdateContent = (update: Update) => {
    const details = update.details || {};

    switch (update.type) {
      case 'status':
        return <>changed the status to <Badge variant="outline">{details.newStatus}</Badge></>;
      case 'join':
        return <>joined the initiative.</>;
      case 'role_add':
        const memberLink = details.memberName ? (
          <Link href={`/profile/${update.userId}`} className="font-medium text-primary hover:underline">
            {details.memberName}
          </Link>
        ) : (
          <span className="font-medium">a member</span>
        );
        return <>assigned the role <span className="font-medium">{details.roleName}</span> to {memberLink}</>;
      case 'step_completion':
        return (
          <>
            completed the step:{' '}
            <Link href={details.stepUrl || '#'} className="font-medium text-primary hover:underline">
              {details.stepTitle || 'Unnamed Step'}
            </Link>
          </>
        );
      case 'resource_share':
        return (
          <>
            added a resource:{' '}
            <Link href={details.resourceUrl || '#'} target="_blank" rel="noopener noreferrer" className="font-medium text-primary hover:underline inline-flex items-center">
              {details.resourceTitle || 'Unnamed Resource'} <ExternalLink className="ml-1 h-3 w-3" />
            </Link>
          </>
        );
      case 'milestone':
      case 'milestone_creation':
      case 'milestone_status':
        return (
          <>
            achieved the milestone:{' '}
            <Link href={details.milestoneUrl || '#'} className="font-medium text-primary hover:underline">
              {details.milestoneTitle || 'Unnamed Milestone'}
            </Link>
          </>
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
                    <Link href={`/profile/${update.userId}`}>
                      <Avatar className="h-10 w-10 ring-2 ring-background">
                        <AvatarImage src={mockUsers[update.userId || '']?.avatar} />
                        <AvatarFallback>{update.userName?.[0] || '?'}</AvatarFallback>
                      </Avatar>
                    </Link>
                    <div className="flex-1 min-w-0">
                      <Link href={`/profile/${update.userId}`}>
                        <p className="text-sm font-medium truncate hover:underline">{update.userName}</p>
                      </Link>
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
                    <Link href={`/profile/${update.userId}`}>
                      <Avatar className="h-12 w-12 ring-2 ring-background">
                        <AvatarImage src={mockUsers[update.userId || '']?.avatar} />
                        <AvatarFallback>{update.userName?.[0] || '?'}</AvatarFallback>
                      </Avatar>
                    </Link>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <Link href={`/profile/${update.userId}`}>
                          <p className="font-semibold text-base hover:underline">{update.userName}</p>
                        </Link>
                        <span className="text-xs text-muted-foreground">
                          {formatDistanceToNow(update.timestamp.toDate(), { addSuffix: true })}
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
                              <Link href={`/profile/${comment.userId}`}>
                                <Avatar className="h-8 w-8">
                                  <AvatarImage src={mockUsers[comment.userId]?.avatar} />
                                  <AvatarFallback>{comment.userName[0]}</AvatarFallback>
                                </Avatar>
                              </Link>
                              <div className="flex-1 bg-muted/50 rounded-xl p-3">
                                <Link href={`/profile/${comment.userId}`}>
                                  <p className="text-xs font-medium hover:underline">{comment.userName}</p>
                                </Link>
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
    </div>
  );
}

// --- Sidebar Component ---
function InitiativeSidebar({ initiative, members }: { 
  initiative: Initiative; 
  members: { id: string; name: string; avatar?: string }[] 
}) {
  const [showFullDescription, setShowFullDescription] = useState(false);
  const isLongDescription = initiative.description.length > 180; // Adjust threshold as needed

  return (
    <div className="space-y-4">
      {/* About Card */}
      <Card className="bg-card/50 backdrop-blur-sm border-0 shadow-sm">
        <CardContent className="p-4 space-y-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Info className="h-4 w-4 text-purple-500" />
              <span>About</span>
            </div>
            <div className="space-y-2">
              <p className={showFullDescription ? "text-sm text-muted-foreground" : "text-sm text-muted-foreground line-clamp-3"}>
                {initiative.description}
              </p>
              {isLongDescription && (
                <button
                  className="text-xs text-primary hover:underline focus:outline-none"
                  onClick={() => setShowFullDescription((prev) => !prev)}
                >
                  {showFullDescription ? 'Show less' : 'Show more'}
                </button>
              )}
              <div className="flex flex-wrap gap-1">
                {initiative.roles.map((role) => (
                  <Badge key={role} variant="outline" className="text-xs">
                    {role}
                  </Badge>
                ))}
              </div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Clock className="h-3 w-3" />
                <span>Created {formatDistanceToNow(initiative.createdAt.toDate(), { addSuffix: true })}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      {/* Personal Stats Card */}
      <Card className="bg-card/50 backdrop-blur-sm border-0 shadow-sm">
        <CardContent className="p-4 space-y-4">
          {/* Your Activity */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Flame className="h-4 w-4 text-orange-500" />
              <span>Your Activity</span>
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">Current Streak</p>
                  <p className="text-lg font-semibold">{mockStreakInfo.currentStreak} days</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-muted-foreground">Level {mockStreakInfo.level}</p>
                  <p className="text-sm font-medium">{mockStreakInfo.xp} XP</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex-1 h-1.5 bg-muted/30 rounded-full">
                  <div 
                    className="h-1.5 bg-primary rounded-full" 
                    style={{ width: `${(mockStreakInfo.xp % 1000) / 10}%` }}
                  />
                </div>
                <span className="text-xs text-muted-foreground">
                  {1000 - (mockStreakInfo.xp % 1000)} XP to next level
                </span>
              </div>
            </div>
          </div>

          {/* Your Role */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <UserPlus className="h-4 w-4 text-blue-500" />
              <span>Your Role</span>
            </div>
            <div className="flex flex-wrap gap-1">
              {initiative.roles.slice(0, 2).map((role) => (
                <Badge key={role} variant="secondary" className="text-xs">
                  {role}
                </Badge>
              ))}
              {initiative.roles.length > 2 && (
                <Badge variant="secondary" className="text-xs">
                  +{initiative.roles.length - 2}
                </Badge>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      

      {/* Community Card */}
      <Card className="bg-card/50 backdrop-blur-sm border-0 shadow-sm">
        <CardContent className="p-4 space-y-4">
          {/* Active Members */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Users className="h-4 w-4 text-blue-500" />
              <span>Active Members</span>
            </div>
            <div className="flex -space-x-2">
              {members.slice(0, 5).map((member) => (
                <Link key={member.id} href={`/profile/${member.id}`}>
                  <Avatar className="h-6 w-6 border-2 border-background">
                    <AvatarImage src={member.avatar} />
                    <AvatarFallback>{member.name[0]}</AvatarFallback>
                  </Avatar>
                </Link>
              ))}
              {members.length > 5 && (
                <div className="h-6 w-6 rounded-full bg-muted/30 flex items-center justify-center text-xs text-muted-foreground">
                  +{members.length - 5}
                </div>
              )}
            </div>
          </div>

          {/* Top Contributors */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Trophy className="h-4 w-4 text-yellow-500" />
              <span>Top Contributors</span>
            </div>
            <div className="space-y-2">
              {mockLeaderboard.slice(0, 3).map((entry) => (
                <div key={entry.userId} className="flex items-center gap-2">
                  <Link href={`/profile/${entry.userId}`}>
                    <Avatar className="h-6 w-6">
                      <AvatarImage src={entry.avatar} />
                      <AvatarFallback>{entry.name[0]}</AvatarFallback>
                    </Avatar>
                  </Link>
                  <div className="flex-1 min-w-0">
                    <Link href={`/profile/${entry.userId}`}>
                      <p className="text-sm truncate hover:underline">{entry.name}</p>
                    </Link>
                    <p className="text-xs text-muted-foreground">{entry.points} points</p>
                  </div>
                  {entry.rank <= 3 && (
                    <div className="text-xs font-medium text-yellow-500">#{entry.rank}</div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions Card */}
      <Card className="bg-card/50 backdrop-blur-sm border-0 shadow-sm">
        <CardContent className="p-4 space-y-4">
          <div className="flex flex-wrap gap-2">
            <Button variant="ghost" size="sm" className="text-xs h-7">
              <FileText className="h-3 w-3 mr-1" />
              Docs
            </Button>
            <Button variant="ghost" size="sm" className="text-xs h-7">
              <ExternalLink className="h-3 w-3 mr-1" />
              Links
            </Button>
            <Button variant="ghost" size="sm" className="text-xs h-7">
              <Flag className="h-3 w-3 mr-1" />
              Report
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// --- Mission Progress Banner Component ---
function MissionProgressBanner({ initiative, milestones, onContributeClick }: { 
  initiative: Initiative;
  milestones: Milestone[];
  onContributeClick: () => void; // <-- Add prop type
}) {
  const completedMilestones = milestones.filter(m => m.status === 'Completed').length;
  const totalMilestones = milestones.length;
  const nextMilestoneIdx = milestones.findIndex(m => m.status !== 'Completed');
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
                  initiative.status === 'Completed' ? "bg-accent" : // Use accent for completed
                  initiative.status === 'In Progress' ? "bg-primary" : // Use primary for in progress
                  initiative.status === 'Planning' ? "bg-yellow-500" : // Keep yellow for planning (or define a theme color)
                  "bg-muted" // Use muted for other statuses (like Idea, Seeking Members)
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
              {initiative.status === 'Completed' ? (
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
                  onClick={onContributeClick} // <-- Add onClick handler
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

// --- Task Preview Component ---
function ActionPreview({ 
  role, 
  onClaimAction, // Renamed prop
  onSuggestAction // Renamed prop
}: { 
  role: string;
  onClaimAction: (actionId: string) => void; // Renamed prop and type
  onSuggestAction: (action: { title: string; description: string }) => void; // Renamed prop and type
}) {
  const [isSuggesting, setIsSuggesting] = useState(false);
  const [suggestedAction, setSuggestedAction] = useState({ title: '', description: '' }); // Renamed state

  // Mock actions for the role (Renamed variable)
  const roleActions: Record<string, { id: string; title: string; description: string; status: StepStatus }[]> = { // Renamed variable
    "Gardener": [
      { id: "a1", title: "Plant Spring Vegetables", description: "Plant seeds for carrots, lettuce, and radishes in the designated plots", status: "To Do" }, // Changed ID prefix
      { id: "a2", title: "Water Garden Beds", description: "Water all garden beds and check irrigation system", status: "To Do" }, // Changed ID prefix
      { id: "a3", title: "Weed Control", description: "Remove weeds from the main garden area", status: "To Do" } // Changed ID prefix
    ],
    "Developer": [
      { id: "a4", title: "Fix Login Bug", description: "Address the authentication issue in the mobile app", status: "To Do" }, // Changed ID prefix
      { id: "a5", title: "Add Dark Mode", description: "Implement dark mode support across the application", status: "To Do" }, // Changed ID prefix
      { id: "a6", title: "Optimize Database Queries", description: "Review and optimize slow database queries", status: "To Do" } // Changed ID prefix
    ],
    "Organizer": [
      { id: "a7", title: "Schedule Weekly Meeting", description: "Set up the next team meeting and send out invites", status: "To Do" }, // Changed ID prefix
      { id: "a8", title: "Update Project Timeline", description: "Review and update the project timeline based on current progress", status: "To Do" }, // Changed ID prefix
      { id: "a9", title: "Prepare Status Report", description: "Create a status report for stakeholders", status: "To Do" } // Changed ID prefix
    ]
  };

  const actions = roleActions[role] || []; // Renamed variable

  const handleSuggestAction = () => { // Renamed handler
    if (suggestedAction.title && suggestedAction.description) { // Use renamed state
      onSuggestAction(suggestedAction); // Call renamed prop
      setSuggestedAction({ title: '', description: '' }); // Reset renamed state
      setIsSuggesting(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium">Starting Actions for {role}</h3> {/* Updated text */}
        <Button 
          variant="ghost" 
          size="sm" 
          className="text-xs"
          onClick={() => setIsSuggesting(!isSuggesting)}
        >
          <Plus className="h-3 w-3 mr-1" />
          Suggest Action {/* Updated text */}
        </Button>
      </div>

      {isSuggesting && (
        <Card className="bg-muted/50">
          <CardContent className="p-4 space-y-3">
            <div className="space-y-2">
              <Label className="text-xs">Action Title</Label> {/* Updated text */}
              <Input 
                value={suggestedAction.title} // Use renamed state
                onChange={(e) => setSuggestedAction(prev => ({ ...prev, title: e.target.value }))} // Use renamed state setter
                placeholder="Enter action title" // Updated placeholder
                className="h-8 text-sm"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs">Description</Label>
              <Textarea 
                value={suggestedAction.description} // Use renamed state
                onChange={(e) => setSuggestedAction(prev => ({ ...prev, description: e.target.value }))} // Use renamed state setter
                placeholder="Describe the action" // Updated placeholder
                className="h-20 text-sm"
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setIsSuggesting(false)}
              >
                Cancel
              </Button>
              <Button 
                size="sm"
                onClick={handleSuggestAction} // Call renamed handler
                disabled={!suggestedAction.title || !suggestedAction.description} // Use renamed state
              >
                Suggest
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="space-y-2">
        {actions.map((action) => ( // Use renamed variable
          <Card 
            key={action.id} // Use action.id
            className="bg-card/50 backdrop-blur-sm border-0 shadow-sm hover:shadow-md transition-shadow"
          >
            <CardContent className="p-3">
              <div className="flex items-start justify-between gap-2">
                <div className="space-y-1 flex-1">
                  <p className="text-sm font-medium">{action.title}</p> {/* Use action.title */}
                  <p className="text-xs text-muted-foreground line-clamp-2">{action.description}</p> {/* Use action.description */}
                </div>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="h-7 text-xs"
                  onClick={() => onClaimAction(action.id)} // Call renamed prop with action.id
                >
                  Claim {/* Button text can remain "Claim" or change to "Take Action" etc. */}
                </Button>
              </div>
              <div className="flex items-center gap-2 mt-2">
                <Badge variant="outline" className="text-xs">
                  {action.status} {/* Use action.status */}
                </Badge>
              </div>
            </CardContent>
          </Card>
        ))}
        {actions.length === 0 && ( // Check renamed variable length
          <p className="text-muted-foreground text-center py-4">No suggested actions for this role yet.</p> // Updated text
        )}
      </div>
    </div>
  );
}

// Update RoleSelectionModal to include TaskPreview
function RoleSelectionModal({ 
  initiative, 
  isOpen, 
  onClose, 
  onRoleSelect 
}: { 
  initiative: Initiative;
  isOpen: boolean;
  onClose: () => void;
  onRoleSelect: (role: string) => void;
}) {
  const [selectedRole, setSelectedRole] = useState<string | null>(null);
  const [claimedActions, setClaimedActions] = useState<string[]>([]); // Renamed state

  const roleDescriptions: Record<string, { description: string }> = {
    // ... (role descriptions remain the same) ...
    "Gardener": {
      description: "Help maintain and grow the community garden through planting, weeding, and harvesting."
    },
    "Volunteer": {
      description: "Support the initiative through various tasks and activities."
    },
    "Organizer": {
      description: "Coordinate activities and manage the initiative's progress."
    },
    "Developer": {
      description: "Contribute technical skills to build and maintain digital tools."
    },
    "Instructor": {
      description: "Teach and guide others in learning new skills."
    },
    "Mentor": {
      description: "Provide guidance and support to other members."
    },
    "Researcher": {
      description: "Gather and analyze information to support the initiative."
    },
    "Writer": {
      description: "Create and edit content for the initiative."
    }
  };

  const handleClaimAction = (actionId: string) => { // Renamed handler
    setClaimedActions(prev => [...prev, actionId]); // Use renamed state setter
    // In a real app, this would make an API call to assign the action
    console.log(`Claimed action: ${actionId}`); // Updated log message
  };

  const handleSuggestAction = (action: { title: string; description: string }) => { // Renamed handler
    // In a real app, this would make an API call to create the action
    console.log('Suggested action:', action); // Updated log message
  };

  const handleRoleSelect = (role: string) => {
    setSelectedRole(role);
    setClaimedActions([]); // Reset claimed actions when role changes
  };

  const handleConfirm = () => {
    if (selectedRole) {
      onRoleSelect(selectedRole);
      // Potentially pass claimedActions back up as well if needed
      console.log("Confirmed role:", selectedRole, "with actions:", claimedActions);
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Select Your Role & Starting Action(s)</DialogTitle> {/* Updated title */}
          <DialogDescription>
            Choose a role and claim one or more initial actions to get started.
          </DialogDescription> {/* Updated description */}
        </DialogHeader>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
          <div className="space-y-4">
            {/* Role selection remains the same */}
            {initiative.roles.map((role) => (
              <div
                key={role}
                className={cn(
                  "p-4 rounded-lg border cursor-pointer transition-colors",
                  selectedRole === role ? "border-primary bg-primary/5" : "hover:bg-muted/50"
                )}
                onClick={() => handleRoleSelect(role)}
              >
                <div className="flex items-center gap-2">
                  <div className="flex-1">
                    <h3 className="font-medium">{role}</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      {roleDescriptions[role]?.description || "No description available"}
                    </p>
                  </div>
                  {selectedRole === role && (
                    <CheckCircle className="h-5 w-5 text-primary" />
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="space-y-4">
            {selectedRole ? (
              <ActionPreview // Use renamed component
                role={selectedRole}
                onClaimAction={handleClaimAction} // Pass renamed prop
                onSuggestAction={handleSuggestAction} // Pass renamed prop
              />
            ) : (
              <div className="h-full flex items-center justify-center text-muted-foreground">
                Select a role to see available actions {/* Updated text */}
              </div>
            )}
          </div>
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button 
            onClick={handleConfirm}
            disabled={!selectedRole} // Confirmation only requires a role for now
          >
            Confirm & Begin {/* Updated button text */}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Update mock goals data with more goals
const mockGoals: Record<string, Goal[]> = {
  "init-1": [
    {
      id: "goal1",
      initiativeId: "init-1",
      title: "Implement User Authentication",
      description: "Set up secure user authentication system with email/password and social login options.",
      owner: { id: "user1", name: "Alice", avatar: "https://i.pravatar.cc/40?u=user1" },
      status: "In Progress",
      dueDate: Timestamp.fromDate(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)),
      createdAt: Timestamp.fromDate(new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)),
      updatedAt: Timestamp.fromDate(new Date()),
      progress: 45,
      priority: "High",
      tags: ["Authentication", "Security", "Frontend"]
    },
    {
      id: "goal2",
      initiativeId: "init-1",
      title: "Design Community Dashboard",
      description: "Create an intuitive dashboard for community members to track progress and engage with initiatives.",
      owner: { id: "user2", name: "Bob", avatar: "https://i.pravatar.cc/40?u=user2" },
      status: "Not Started",
      dueDate: Timestamp.fromDate(new Date(Date.now() + 45 * 24 * 60 * 60 * 1000)),
      createdAt: Timestamp.fromDate(new Date(Date.now() - 5 * 24 * 60 * 60 * 1000)),
      updatedAt: Timestamp.fromDate(new Date(Date.now() - 5 * 24 * 60 * 60 * 1000)),
      priority: "Medium",
      tags: ["UI/UX", "Frontend", "Dashboard"]
    },
    {
      id: "goal3",
      initiativeId: "init-1",
      title: "Implement Real-time Chat",
      description: "Add real-time chat functionality with message history and file sharing capabilities.",
      owner: { id: "user3", name: "Charlie", avatar: "https://i.pravatar.cc/40?u=user3" },
      status: "Not Started",
      dueDate: Timestamp.fromDate(new Date(Date.now() + 60 * 24 * 60 * 60 * 1000)),
      createdAt: Timestamp.fromDate(new Date(Date.now() - 3 * 24 * 60 * 60 * 1000)),
      updatedAt: Timestamp.fromDate(new Date(Date.now() - 3 * 24 * 60 * 60 * 1000)),
      priority: "High",
      tags: ["Backend", "Real-time", "WebSocket"]
    },
    {
      id: "goal4",
      initiativeId: "init-1",
      title: "Mobile App Development",
      description: "Create a mobile app version of the platform with core features and push notifications.",
      owner: { id: "user4", name: "Diana", avatar: "https://i.pravatar.cc/40?u=user4" },
      status: "Not Started",
      dueDate: Timestamp.fromDate(new Date(Date.now() + 90 * 24 * 60 * 60 * 1000)),
      createdAt: Timestamp.fromDate(new Date(Date.now() - 2 * 24 * 60 * 60 * 1000)),
      updatedAt: Timestamp.fromDate(new Date(Date.now() - 2 * 24 * 60 * 60 * 1000)),
      priority: "Medium",
      tags: ["Mobile", "React Native", "Push Notifications"]
    }
  ],
  "init-2": [
    {
      id: "goal5",
      initiativeId: "init-2",
      title: "Develop Workshop Curriculum",
      description: "Create comprehensive curriculum for teaching coding basics to youth.",
      owner: { id: "user3", name: "Charlie", avatar: "https://i.pravatar.cc/40?u=user3" },
      status: "In Progress",
      dueDate: Timestamp.fromDate(new Date(Date.now() + 20 * 24 * 60 * 60 * 1000)),
      createdAt: Timestamp.fromDate(new Date(Date.now() - 10 * 24 * 60 * 60 * 1000)),
      updatedAt: Timestamp.fromDate(new Date()),
      progress: 60,
      priority: "High",
      tags: ["Education", "Curriculum", "Planning"]
    },
    {
      id: "goal6",
      initiativeId: "init-2",
      title: "Setup Learning Environment",
      description: "Configure development environment and tools for workshop participants.",
      owner: { id: "user2", name: "Bob", avatar: "https://i.pravatar.cc/40?u=user2" },
      status: "Not Started",
      dueDate: Timestamp.fromDate(new Date(Date.now() + 15 * 24 * 60 * 60 * 1000)),
      createdAt: Timestamp.fromDate(new Date(Date.now() - 5 * 24 * 60 * 60 * 1000)),
      updatedAt: Timestamp.fromDate(new Date(Date.now() - 5 * 24 * 60 * 60 * 1000)),
      priority: "High",
      tags: ["Setup", "Tools", "Environment"]
    }
  ]
};

// Update GoalsSection component to be horizontally scrollable
function GoalsSection({ initiativeId }: { initiativeId: string }) {
  const goals = mockGoals[initiativeId] || [];

  return (
    <Card className="mb-8">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Goals</CardTitle>
          <Button variant="outline" size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Add Goal
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {/* Use ScrollArea for horizontal scrolling */}
        <ScrollArea className="w-full whitespace-nowrap rounded-md">
          <div className="flex space-x-4 pb-4"> {/* Use flex and space-x for horizontal layout */}
            {goals.map((goal) => (
              <Link
                key={goal.id}
                href={`/initiatives/${initiativeId}/goals/${goal.id}`}
                className="inline-block" // Make link inline-block
              >
                {/* Set a fixed width for each goal card */}
                <Card className="hover:bg-accent/50 transition-colors w-72 md:w-80 flex-shrink-0">
                  <CardHeader className="p-4">
                    <div className="flex items-start justify-between"> {/* Changed items-center to items-start */}
                      <div className="flex-1 space-y-1 overflow-hidden"> {/* Added overflow-hidden */}
                        <CardTitle className="text-base line-clamp-2 whitespace-normal">{goal.title}</CardTitle> {/* Adjusted text size and added line-clamp, whitespace-normal */}
                        <CardDescription className="text-xs line-clamp-3 whitespace-normal">{goal.description}</CardDescription> {/* Adjusted text size and added line-clamp, whitespace-normal */}
                      </div>
                      <Badge variant={goal.status === 'Completed' ? 'default' : 'secondary'} className="ml-2 flex-shrink-0"> {/* Added ml-2 and flex-shrink-0 */}
                        {goal.status}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="p-4 pt-0">
                    <div className="flex flex-col gap-2 text-xs text-muted-foreground"> {/* Changed to flex-col and adjusted gap/text size */}
                      <div className="flex items-center gap-2">
                        <Avatar className="h-4 w-4">
                          <AvatarImage src={goal.owner.avatar} />
                          <AvatarFallback>{goal.owner.name[0]}</AvatarFallback>
                        </Avatar>
                        {/* Ensure span is correctly interpreted as JSX */}
                        <span className="hover:underline">{goal.owner.name}</span>
                      </div>
                      {goal.dueDate && (
                        <div className="flex items-center gap-2">
                          <Calendar className="h-3 w-3" /> {/* Adjusted icon size */}
                          <span>Due: {goal.dueDate.toDate().toLocaleDateString()}</span>
                        </div>
                      )}
                      {goal.priority && (
                        <div className="flex items-center gap-2">
                          <Flag className="h-3 w-3" /> {/* Adjusted icon size */}
                          <span>{goal.priority} Priority</span>
                        </div>
                      )}
                      {goal.progress !== undefined && (
                        <div className="flex items-center gap-2">
                          <CheckCircle className="h-3 w-3" /> {/* Adjusted icon size */}
                          <span>{goal.progress}% Complete</span>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
            {goals.length === 0 && (
              <p className="text-muted-foreground text-center py-4 w-full">No goals defined yet.</p>
            )}
          </div>
          {/* Add ScrollBar component */}
          <ScrollBar orientation="horizontal" /> 
          {/* ScrollBar might need specific import/setup depending on your ScrollArea implementation */}
        </ScrollArea>
      </CardContent>
    </Card>
  );
}

export default function InitiativeDetailPage() {
  const params = useParams();
  const initiativeId = params.id as string;
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [newMessage, setNewMessage] = useState('');
  const [updates, setUpdates] = useState<Update[]>([]);
  const [chatMessages, setChatMessages] = useState<EnhancedChatMessage[]>([]);
  const [initiative, setInitiative] = useState<Initiative | null>(null);
  const [members, setMembers] = useState<{ id: string; name: string; avatar?: string }[]>([]);
  const [isShareOpen, setIsShareOpen] = useState(false);
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [isRoleSelectionOpen, setIsRoleSelectionOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  useEffect(() => {
    // Simulate data fetching
    const fetchData = async () => {
      const fetchedInitiative = mockInitiatives[initiativeId];
      const fetchedUpdates = mockUpdates[initiativeId] || [];
      const fetchedChatMessages = mockChatMessages[initiativeId] || [];
      
      setInitiative(fetchedInitiative);
      setUpdates(fetchedUpdates);
      setChatMessages(fetchedChatMessages);

      // Get member details
      const memberDetails = fetchedInitiative.memberIds.map(id => ({
        id,
        name: mockUsers[id]?.name || 'Unknown User',
        avatar: mockUsers[id]?.avatar
      }));
      setMembers(memberDetails);
    };

    fetchData();
  }, [initiativeId]);

  const handlePostUpdate = (newUpdateData: any) => {
    setUpdates(prev => [newUpdateData, ...prev]);
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    const message: EnhancedChatMessage = {
      id: `msg-${Date.now()}`,
      initiativeId,
      senderId: 'currentUser',
      senderName: 'You',
      text: newMessage,
      timestamp: Timestamp.now(),
    };

    setChatMessages(prev => [...prev, message]);
    setNewMessage('');
  };

  const handleRoleSelect = (role: string) => {
    // In a real app, this would make an API call to assign the role
    console.log(`Selected role: ${role}`);
    // For now, just show a success message
    setUpdates(prev => [{
      id: `update-${Date.now()}`,
      initiativeId,
      type: 'role_add',
      userId: 'currentUser',
      userName: 'You',
      content: `assigned the role ${role} to yourself`,
      timestamp: Timestamp.now(),
      details: { roleName: role, memberName: 'You' }
    }, ...prev]);
  };

  if (!initiative) {
    return <div>Loading...</div>;
  }

  return (
    <div className="container mx-auto py-8 px-4">
      {/* Header Card */}
      <Card className="mb-6 rounded-none border-x-0 border-t-0">
        <div className="relative w-full aspect-[16/9] md:aspect-[21/9]">
          {initiative.imageUrl && (
            <Image
              src={initiative.imageUrl}
              alt={initiative.title}
              fill
              className="object-cover"
              priority
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/70 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 p-3 md:p-6">
            <div className="flex flex-col gap-3">
              {/* Title and Status Section */}
              <div className="space-y-1.5">
                <h1 className="text-lg md:text-3xl font-bold text-foreground line-clamp-2 pr-2">
                  {initiative.title}
                </h1>
                <div className="flex flex-wrap gap-1.5">
                  <Badge variant="secondary" className="bg-card/30 text-foreground text-xs backdrop-blur-sm">
                    {initiative.status}
                  </Badge>
                  <Badge variant="secondary" className="bg-card/30 text-foreground text-xs backdrop-blur-sm">
                    {members.length} members
                  </Badge>
                  <Badge variant="secondary" className="bg-accent/20 text-accent text-xs backdrop-blur-sm">
                    {mockOnlineMembers.length} online now
                  </Badge>
                </div>
              </div>

              {/* Online Members */}
              <div className="flex items-center gap-1.5">
                <div className="flex -space-x-2">
                  {mockOnlineMembers.map((member) => (
                    <Link key={member.id} href={`/profile/${member.id}`}>
                      <div className="relative">
                        <Avatar className="h-6 w-6 md:h-8 md:w-8 border-2 border-background">
                          <AvatarImage src={member.avatar} />
                          <AvatarFallback>{member.name[0]}</AvatarFallback>
                        </Avatar>
                        <div className="absolute bottom-0 right-0 h-1.5 w-1.5 md:h-2 md:w-2 bg-accent rounded-full border border-background" />
                      </div>
                    </Link>
                  ))}
                </div>
                {members.length > mockOnlineMembers.length && (
                  <span className="text-xs md:text-sm text-muted-foreground">
                    +{members.length - mockOnlineMembers.length} more
                  </span>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap gap-1.5">
                <Button
                  variant="outline"
                  size="sm"
                  className="bg-card/30 text-foreground hover:bg-card/50 h-8 text-xs backdrop-blur-sm"
                  onClick={() => setIsShareOpen(true)}
                >
                  <Share2 className="h-3 w-3 mr-1" />
                  Share
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="bg-card/30 text-foreground hover:bg-card/50 h-8 text-xs backdrop-blur-sm"
                  onClick={() => setIsInviteOpen(true)}
                >
                  <UserPlus className="h-3 w-3 mr-1" />
                  Invite
                </Button>
                <Button 
                  size="sm"
                  className="bg-primary text-white font-medium h-8 text-xs"
                  onClick={() => setIsRoleSelectionOpen(true)}
                >
                  <UserPlus className="h-3 w-3 mr-1" />
                  Join
                </Button>
                <Button variant="ghost" size="sm" className="text-foreground hover:text-foreground hover:bg-card/30 h-8 w-8 p-0">
                  <Edit className="h-3 w-3" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Share Dialog */}
      <Dialog open={isShareOpen} onOpenChange={setIsShareOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Share Initiative</DialogTitle>
            <DialogDescription>
              Share this initiative with others to grow the community.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1">
                <Twitter className="h-4 w-4 mr-2" />
                Twitter
              </Button>
              <Button variant="outline" className="flex-1">
                <Facebook className="h-4 w-4 mr-2" />
                Facebook
              </Button>
              <Button variant="outline" className="flex-1">
                <Link2 className="h-4 w-4 mr-2" />
                Copy Link
              </Button>
            </div>
            <div className="space-y-2">
              <Label>Custom Message</Label>
              <Textarea
                placeholder="Add a message to your share..."
                defaultValue={`Check out this initiative: ${initiative.title}`}
              />
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Invite Dialog */}
      <Dialog open={isInviteOpen} onOpenChange={setIsInviteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Invite Members</DialogTitle>
            <DialogDescription>
              Invite others to join this initiative.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Email Addresses</Label>
              <Textarea
                placeholder="Enter email addresses, separated by commas"
                className="h-24"
              />
            </div>
            <div className="space-y-2">
              <Label>Custom Message</Label>
              <Textarea
                placeholder="Add a personal message..."
                defaultValue={`I'd like to invite you to join our initiative: ${initiative.title}`}
              />
            </div>
            <Button className="w-full">
              <Send className="h-4 w-4 mr-2" />
              Send Invitations
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add Role Selection Modal */}
      <RoleSelectionModal
        initiative={initiative}
        isOpen={isRoleSelectionOpen}
        onClose={() => setIsRoleSelectionOpen(false)}
        onRoleSelect={handleRoleSelect}
      />

      {/* Mobile Sidebar Toggle Button */}
      <div className="md:hidden fixed bottom-4 left-4 z-50">
        <Button
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className="rounded-full h-12 w-12 shadow-lg"
        >
          <Users className="h-5 w-5" />
        </Button>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Main Content Column */}
        <div className="md:col-span-2 space-y-6">
        <MissionProgressBanner 
          initiative={initiative} 
          milestones={getMockMilestones(initiativeId)} 
          onContributeClick={() => setIsRoleSelectionOpen(true)} // <-- Add this prop
        />
        <GoalsSection initiativeId={initiative.id} />
        <CreateUpdateForm initiativeId={initiativeId} onPostUpdate={handlePostUpdate} />
        <ActivityFeed updates={updates} />
      </div>

        {/* Sidebar Column - Now with mobile overlay */}
        <div className={cn(
          "md:col-span-1",
          "md:block",
          "fixed md:relative inset-0 z-40",
          "transform transition-transform duration-300 ease-in-out",
          isSidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0",
          "bg-background md:bg-transparent",
          "w-72 md:w-auto"
        )}>
          <div className="h-full overflow-y-auto p-4 md:p-0">
            <div className="flex justify-end md:hidden mb-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsSidebarOpen(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            <InitiativeSidebar initiative={initiative} members={members} />
          </div>
        </div>

        {/* Overlay for mobile sidebar */}
        {isSidebarOpen && (
          <div 
            className="fixed inset-0 bg-black/50 z-30 md:hidden"
            onClick={() => setIsSidebarOpen(false)}
          />
        )}
      </div>

      {/* Chat Panel */}
      <div className="fixed bottom-4 right-4 z-50">
        <Button
          onClick={() => setIsChatOpen(!isChatOpen)}
          className="rounded-full h-12 w-12 shadow-lg"
        >
          <MessageSquare className="h-5 w-5" />
        </Button>
      </div>

      {isChatOpen && (
        <div className="fixed bottom-20 right-4 md:right-80 w-80 bg-background rounded-lg shadow-lg border z-50">
          <div className="p-4 border-b">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <h3 className="font-semibold">Chat</h3>
                <Badge variant="secondary" className="bg-accent/20 text-accent">
                  {mockOnlineMembers.length} online
                </Badge>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsChatOpen(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            {/* Online Members */}
            <div className="flex -space-x-2 mt-2">
              {mockOnlineMembers.map((member) => (
                <Link key={member.id} href={`/profile/${member.id}`}>
                  <div className="relative">
                    <Avatar className="h-6 w-6 border-2 border-background">
                      <AvatarImage src={member.avatar} />
                      <AvatarFallback>{member.name[0]}</AvatarFallback>
                    </Avatar>
                    <div className="absolute bottom-0 right-0 h-2 w-2 bg-accent rounded-full border border-background" />
                  </div>
                </Link>
              ))}
            </div>
          </div>
          <ScrollArea className="h-96 p-4">
            <div className="space-y-4">
              {chatMessages.map((message: EnhancedChatMessage) => (
                <div
                  key={message.id}
                  className={cn(
                    "flex gap-2",
                    message.senderId === "currentUser" ? "justify-end" : "justify-start"
                  )}
                >
                  {message.senderId !== "currentUser" && (
                    <Link href={`/profile/${message.senderId}`}>
                      <Avatar className="h-6 w-6">
                        <AvatarImage src={mockUsers[message.senderId]?.avatar} />
                        <AvatarFallback>{message.senderName?.[0] || '?'}</AvatarFallback>
                      </Avatar>
                    </Link>
                  )}
                  <div
                    className={cn(
                      "rounded-lg p-3 max-w-[80%]",
                      message.senderId === "currentUser"
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted"
                    )}
                  >
                    {message.senderId !== "currentUser" && (
                      <Link href={`/profile/${message.senderId}`}>
                        <p className="text-xs font-medium mb-1 hover:underline">{message.senderName}</p>
                      </Link>
                    )}
                    <p className="text-sm">{message.text}</p>
                    
                    {/* Media Content */}
                    {message.media && message.media.length > 0 && (
                      <div className="mt-2 space-y-2">
                        {message.media.map((item: { url: string; type: 'image' | 'gif' }, index: number) => (
                          <div key={index} className="rounded-md overflow-hidden">
                            {item.type === 'image' ? (
                              <Image
                                src={item.url}
                                alt="Shared image"
                                width={200}
                                height={150}
                                className="object-cover"
                              />
                            ) : (
                              <video
                                src={item.url}
                                autoPlay
                                loop
                                muted
                                className="max-w-[200px] rounded-md"
                              />
                            )}
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Reactions */}
                    {message.reactions && message.reactions.length > 0 && (
                      <div className="flex gap-1 mt-2">
                        {message.reactions.map((reaction: ChatReaction) => (
                          <div
                            key={reaction.id}
                            className="text-xs bg-background/50 rounded-full px-2 py-0.5"
                          >
                            {reaction.emoji}
                          </div>
                        ))}
                      </div>
                    )}

                    <p className="text-xs mt-1 opacity-70">
                      {formatTimestamp(message.timestamp)}
                    </p>
                  </div>
                  {message.senderId === "currentUser" && (
                    // No need to link "You" to a profile
                    <Avatar className="h-6 w-6">
                      {/* Placeholder for current user avatar if needed */}
                      <AvatarFallback>Y</AvatarFallback>
                    </Avatar>
                  )}
                </div>
              ))}
            </div>
          </ScrollArea>
          <form onSubmit={handleSendMessage} className="p-4 border-t">
            <div className="space-y-2">
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => {
                    // TODO: Implement image picker
                    console.log("Open image picker");
                  }}
                >
                  <ImageIcon className="h-4 w-4" />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => {
                    // TODO: Implement emoji picker
                    console.log("Open emoji picker");
                  }}
                >
                  <Smile className="h-4 w-4" />
                </Button>
                <Input
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Type a message..."
                  className="flex-1"
                />
                <Button type="submit">
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

// Helper function to format timestamp (optional, can use built-in Date methods)
function formatTimestamp(timestamp: Timestamp): string {
  return timestamp.toDate().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
}
