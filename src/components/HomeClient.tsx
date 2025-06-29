'use client';

import React, { useState, useEffect } from 'react'; // Import React hooks
import { InitiativeCard } from "@/components/InitiativeCard";
import { GeneralPostCard } from "@/components/GeneralPostCard";
import { MetaActionCard } from "@/components/MetaActionCard";
import CreatePostForm from "@/components/CreatePostForm";
import type { Initiative as PrismaInitiative, GeneralPost as PrismaGeneralPost, User as PrismaUser, MediaItem as PrismaMediaItem, Issue as PrismaIssue, Idea as PrismaIdea } from '@prisma/client';
import type { GeneralPost, Initiative, Role, SkillRoleType, InitiativeStatus, UserForDisplay } from '@/lib/types';
import { formatDistanceToNow, parseISO } from 'date-fns';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import Link from 'next/link';
import { Button } from "@/components/ui/button";
import { Star } from "lucide-react";
import { PostActions } from '@/components/PostActions';
import { IdeaCard } from "@/components/IdeaCard";
import ActivityFeed from "@/components/ActivityFeed";
import SuggestionsWidget from "@/components/SuggestionsWidget";
import TrendingWidget from "@/components/TrendingWidget";
import { TipsWidget } from "@/components/TipsWidget";
import ShortcutsWidget from "@/components/ShortcutsWidget";
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Menu } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import { Input } from '@/components/ui/input';
import { Pencil } from 'lucide-react';

// Temporary mock user avatars for fallback
const mockUserAvatars: Record<string, string | undefined> = {
  "user1": "https://i.pravatar.cc/40?u=user1",
  "user3": "https://i.pravatar.cc/40?u=user3",
  "user5": "https://i.pravatar.cc/40?u=user5",
  "user7": "https://i.pravatar.cc/40?u=user7",
};

// Define extended types that include the relations we'll fetch
type InitiativeWithCreator = PrismaInitiative & { creator: PrismaUser | null };
type GeneralPostWithCreatorAndMedia = PrismaGeneralPost & { creator: PrismaUser | null; media: PrismaMediaItem[] };
type IssueWithCreator = PrismaIssue & { creator: PrismaUser | null; media: PrismaMediaItem[]; championCount: number };
type IdeaWithCreator = PrismaIdea & { creator: PrismaUser | null; media: PrismaMediaItem[]; championCount: number };

// Meta action types that match the API response
interface UpdateWithUserAndInitiative {
  id: string;
  type: string;
  content: string;
  details?: any;
  createdAt: Date;
  user: {
    id: string;
    name: string | null;
    image: string | null;
  };
  initiative: {
    id: string;
    title: string;
  };
}

interface UserFollowWithUsers {
  id: string;
  createdAt: Date;
  follower: {
    id: string;
    name: string | null;
    image: string | null;
  };
  following: {
    id: string;
    name: string | null;
    image: string | null;
  };
}

interface InitiativeMembershipWithUserAndInitiative {
  id: string;
  createdAt: Date;
  role: string;
  customRole?: string | null;
  user: {
    id: string;
    name: string | null;
    image: string | null;
  };
  initiative: {
    id: string;
    title: string;
  };
}

// Unified feed item types
type FeedItemType = 'initiative' | 'generalPost' | 'issue' | 'idea' | 'update' | 'follow' | 'initiativeJoin';

interface UnifiedFeedItem {
  type: FeedItemType;
  id: string;
  timestamp: Date;
  data: InitiativeWithCreator | GeneralPostWithCreatorAndMedia | IssueWithCreator | IdeaWithCreator | UpdateWithUserAndInitiative | UserFollowWithUsers | InitiativeMembershipWithUserAndInitiative;
}

// Meta action types for the MetaActionCard component
interface UpdateAction {
  type: 'update';
  id: string;
  timestamp: Date;
  data: UpdateWithUserAndInitiative;
}

interface FollowAction {
  type: 'follow';
  id: string;
  timestamp: Date;
  data: UserFollowWithUsers;
}

interface InitiativeJoinAction {
  type: 'initiativeJoin';
  id: string;
  timestamp: Date;
  data: InitiativeMembershipWithUserAndInitiative;
}

type MetaAction = UpdateAction | FollowAction | InitiativeJoinAction;

// Legacy types for backward compatibility
type FeedItemDb = InitiativeWithCreator | GeneralPostWithCreatorAndMedia | IssueWithCreator | IdeaWithCreator;

// Helper function to check if an item is a GeneralPost
function isGeneralPost(item: FeedItemDb): item is GeneralPostWithCreatorAndMedia {
  // GeneralPost has 'content', but not 'status' (initiatives) or 'tags' (issues/ideas)
  return 'content' in item && !('status' in item) && !('tags' in item);
}

// Helper function to check if an item is an Initiative
function isInitiative(item: FeedItemDb): item is InitiativeWithCreator {
  // Initiative has 'status' and 'roles'
  return 'status' in item && 'roles' in item;
}

// New helper to identify items that are either Issue or Idea
function isTaggedContent(item: FeedItemDb): item is IssueWithCreator | IdeaWithCreator {
    return 'tags' in item && !('content' in item) && !('status' in item);
}

// Helper functions for unified feed items
function isMetaAction(item: UnifiedFeedItem): item is UnifiedFeedItem & { type: 'update' | 'follow' | 'initiativeJoin' } {
  return ['update', 'follow', 'initiativeJoin'].includes(item.type);
}

function isContentItem(item: UnifiedFeedItem): item is UnifiedFeedItem & { type: 'initiative' | 'generalPost' | 'issue' | 'idea' } {
  return ['initiative', 'generalPost', 'issue', 'idea'].includes(item.type);
}

// Helper function to convert UnifiedFeedItem to MetaAction
function convertToMetaAction(item: UnifiedFeedItem & { type: 'update' | 'follow' | 'initiativeJoin' }): MetaAction {
  return {
    type: item.type,
    id: item.id,
    timestamp: item.timestamp,
    data: item.data as any
  };
}

interface HomeClientProps {
  currentUserId?: string;
}

const MAIN_REASONS = [
  { value: 'spot_issues', label: 'Spot Issues', icon: '🎯' },
  { value: 'share_ideas', label: 'Share Ideas', icon: '💡' },
  { value: 'join_initiatives', label: 'Join Initiatives', icon: '🤝' },
  { value: 'learn_skills', label: 'Learn Skills', icon: '❤️' },
  { value: 'organize_communities', label: 'Organize Communities', icon: '🧑‍🤝‍🧑' },
];
const ALL_INTERESTS = [
  'Environment', 'Education', 'Technology', 'Community Health', 'Arts & Culture', 'Social Justice', 'Economic Development', 'Mental Health', 'Youth Development', 'Senior Care', 'Food Security', 'Housing', 'Transportation', 'Public Safety', 'Digital Literacy'
];
const ALL_SKILLS = [
  'Project Management', 'Design', 'Development', 'Marketing', 'Research', 'Writing', 'Public Speaking', 'Event Planning', 'Fundraising', 'Teaching', 'Mentoring', 'Data Analysis', 'Community Organizing', 'Grant Writing', 'Social Media', 'Photography', 'Videography', 'Translation', 'Legal', 'Healthcare', 'Engineering', 'Architecture', 'Finance', 'Education'
];

function UserHighlightsCard({ userInfo: initialUserInfo, toast }: { userInfo: any, toast: any }) {
  const [editMode, setEditMode] = useState(false);
  const [userInfo, setUserInfo] = useState(initialUserInfo);
  const [mainReason, setMainReason] = useState(userInfo.primaryIntent);
  const [interests, setInterests] = useState(userInfo.interests || []);
  const [skills, setSkills] = useState(userInfo.skills || []);
  const [saving, setSaving] = useState(false);
  const [customInterest, setCustomInterest] = useState('');
  const [customSkill, setCustomSkill] = useState('');

  const handleToggleInterest = (interest: string) => {
    setInterests((prev: string[]) => prev.includes(interest) ? prev.filter(i => i !== interest) : [...prev, interest]);
  };
  const handleToggleSkill = (skill: string) => {
    setSkills((prev: string[]) => prev.includes(skill) ? prev.filter(s => s !== skill) : [...prev, skill]);
  };
  const handleAddCustomInterest = () => {
    const value = customInterest.trim();
    if (value && !interests.includes(value)) {
      setInterests([...interests, value]);
      setCustomInterest('');
    }
  };
  const handleAddCustomSkill = () => {
    const value = customSkill.trim();
    if (value && !skills.includes(value)) {
      setSkills([...skills, value]);
      setCustomSkill('');
    }
  };
  const handleCustomInterestKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddCustomInterest();
    }
  };
  const handleCustomSkillKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddCustomSkill();
    }
  };
  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/auth/me', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          primaryIntent: mainReason,
          interests,
          skills,
        }),
      });
      if (!res.ok) throw new Error('Failed to update profile');
      const updated = await res.json();
      setUserInfo(updated);
      setEditMode(false);
      toast({ title: 'Profile updated!', description: 'Your highlights have been saved.' });
    } catch (e) {
      toast({ title: 'Update failed', description: 'Could not save changes.', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };
  const handleCancel = () => {
    setMainReason(userInfo.primaryIntent);
    setInterests(userInfo.interests || []);
    setSkills(userInfo.skills || []);
    setEditMode(false);
    setCustomInterest('');
    setCustomSkill('');
  };

  if (!editMode) {
    const main = MAIN_REASONS.find(r => r.value === userInfo.primaryIntent);
    return (
      <div className="space-y-4 relative">
        <button className="absolute top-2 right-2 p-1 rounded hover:bg-muted" aria-label="Edit highlights" onClick={() => setEditMode(true)}>
          <Pencil className="w-4 h-4 text-gray-400" />
        </button>
        <div className="bg-white dark:bg-gray-900 rounded-xl shadow p-4 mb-2">
          <div className="flex items-center gap-3 mb-2">
            <span className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-blue-100 text-blue-600 text-2xl">{main?.icon}</span>
            <div>
              <div className="font-semibold text-lg capitalize">{main?.label || 'Member'}</div>
              <div className="text-xs text-gray-500">Your main reason for joining</div>
            </div>
          </div>
          {userInfo.interests && userInfo.interests.length > 0 && (
            <div className="mb-2">
              <div className="text-xs font-medium text-gray-500 mb-1">Interests</div>
              <div className="flex flex-wrap gap-1 mb-2">
                {userInfo.interests.map((interest: string, idx: number) => (
                  <span key={"interest-"+interest+idx} className="bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full text-xs font-medium">{interest}</span>
                ))}
              </div>
            </div>
          )}
          {userInfo.skills && userInfo.skills.length > 0 && (
            <div>
              <div className="text-xs font-medium text-gray-500 mb-1">Skills</div>
              <div className="flex flex-wrap gap-1 mb-2">
                {userInfo.skills.map((skill: string, idx: number) => (
                  <span key={"skill-"+skill+idx} className="bg-green-50 text-green-700 px-2 py-0.5 rounded-full text-xs font-medium">{skill}</span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Edit mode
  return (
    <div className="space-y-4 bg-white dark:bg-gray-900 rounded-xl shadow p-4 mb-2">
      <div className="mb-2">
        <div className="text-xs font-medium text-gray-500 mb-1">Main Reason</div>
        <div className="flex flex-wrap gap-2">
          {MAIN_REASONS.map(r => (
            <button
              key={r.value}
              type="button"
              className={`flex items-center gap-1 px-3 py-1 rounded-full border text-sm font-medium transition-all ${mainReason === r.value ? 'bg-blue-600 text-white border-blue-600' : 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100'}`}
              onClick={() => setMainReason(r.value)}
            >
              <span>{r.icon}</span> {r.label}
            </button>
          ))}
        </div>
      </div>
      <div className="mb-2">
        <div className="text-xs font-medium text-gray-500 mb-1">Interests</div>
        <div className="flex flex-wrap gap-1 mb-2">
          {ALL_INTERESTS.map(interest => (
            <button
              key={interest}
              type="button"
              className={`px-2 py-0.5 rounded-full text-xs font-medium border transition-all ${interests.includes(interest) ? 'bg-blue-600 text-white border-blue-600' : 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100'}`}
              onClick={() => handleToggleInterest(interest)}
            >
              {interest}
            </button>
          ))}
          {/* Custom interests as badges */}
          {interests.filter((i: string) => !ALL_INTERESTS.includes(i)).map((interest: string, idx: number) => (
            <span key={"custom-"+interest+idx} className="bg-blue-600 text-white px-2 py-0.5 rounded-full text-xs font-medium border border-blue-600">{interest}</span>
          ))}
        </div>
        <div className="flex gap-2 mt-1">
          <Input
            value={customInterest}
            onChange={e => setCustomInterest(e.target.value)}
            onKeyDown={handleCustomInterestKeyDown}
            placeholder="Add your own..."
            className="h-7 text-xs w-32"
            maxLength={32}
          />
          <Button size="sm" type="button" onClick={handleAddCustomInterest} disabled={!customInterest.trim() || interests.includes(customInterest.trim())}>Add</Button>
        </div>
      </div>
      <div className="mb-2">
        <div className="text-xs font-medium text-gray-500 mb-1">Skills</div>
        <div className="flex flex-wrap gap-1 mb-2">
          {ALL_SKILLS.map(skill => (
            <button
              key={skill}
              type="button"
              className={`px-2 py-0.5 rounded-full text-xs font-medium border transition-all ${skills.includes(skill) ? 'bg-green-600 text-white border-green-600' : 'bg-green-50 text-green-700 border-green-200 hover:bg-green-100'}`}
              onClick={() => handleToggleSkill(skill)}
            >
              {skill}
            </button>
          ))}
          {/* Custom skills as badges */}
          {skills.filter((s: string) => !ALL_SKILLS.includes(s)).map((skill: string, idx: number) => (
            <span key={"custom-"+skill+idx} className="bg-green-600 text-white px-2 py-0.5 rounded-full text-xs font-medium border border-green-600">{skill}</span>
          ))}
        </div>
        <div className="flex gap-2 mt-1">
          <Input
            value={customSkill}
            onChange={e => setCustomSkill(e.target.value)}
            onKeyDown={handleCustomSkillKeyDown}
            placeholder="Add your own..."
            className="h-7 text-xs w-32"
            maxLength={32}
          />
          <Button size="sm" type="button" onClick={handleAddCustomSkill} disabled={!customSkill.trim() || skills.includes(customSkill.trim())}>Add</Button>
        </div>
      </div>
      <div className="flex gap-2 mt-4">
        <Button size="sm" onClick={handleSave} disabled={saving} className="bg-blue-600 text-white hover:bg-blue-700">{saving ? 'Saving...' : 'Save'}</Button>
        <Button size="sm" variant="outline" onClick={handleCancel} disabled={saving}>Cancel</Button>
      </div>
    </div>
  );
}

export function HomeClient({ currentUserId }: HomeClientProps) {
  const [feedItems, setFeedItems] = useState<UnifiedFeedItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [userInfo, setUserInfo] = useState<any>(null);
  const { toast } = useToast();

  useEffect(() => {
    const fetchFeedItems = async () => {
      try {
        setIsLoading(true);
        const response = await fetch('/api/feed?unified=true');
        if (!response.ok) {
          throw new Error(`Failed to fetch feed items: ${response.statusText}`);
        }
        const data = await response.json();
        setFeedItems(data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchFeedItems();
  }, []);

  useEffect(() => {
    // Fetch user info for sidebar and welcome toast
    const fetchUserInfo = async () => {
      try {
        const res = await fetch('/api/auth/me');
        if (res.ok) {
          const data = await res.json();
          setUserInfo(data);
          // Show welcome toast if just registered
          if (window && window.localStorage && localStorage.getItem('showWelcomeToast') === 'true') {
            toast({
              title: `Welcome to society+, ${data.name || 'Community Member'}! 🎉`,
              description: `You're now part of a community of changemakers.`,
              duration: 8000,
            });
            localStorage.removeItem('showWelcomeToast');
          }
        }
      } catch (e) {}
    };
    fetchUserInfo();
  }, [toast]);

  const handlePostCreated = async () => {
    // This will be handled by the server action in CreatePostForm
    window.location.reload(); // Simple refresh for now
  };

  if (isLoading) {
    return <div className="flex justify-center items-center min-h-screen">Loading feed...</div>;
  }

  if (error) {
    return <div className="flex justify-center items-center min-h-screen text-red-500">Error loading feed: {error}</div>;
  }

  return (
    <div className="flex flex-col lg:flex-row gap-8 w-full max-w-6xl mx-auto">
      {/* Sidebar (left) */}
      <aside className="hidden lg:block w-80 flex-shrink-0 space-y-6 sticky top-20 self-start h-fit overflow-y-auto max-h-[calc(100vh-5rem)] order-1 lg:order-none">
        {userInfo && (
          <div className="space-y-4">
            <UserHighlightsCard userInfo={userInfo} toast={toast} />
          </div>
        )}
        <SuggestionsWidget />
        <TrendingWidget />
        <TipsWidget />
        <ShortcutsWidget />
      </aside>
      {/* Main Feed (centered) */}
      <div className="flex-1 flex flex-col items-center space-y-6 order-2 lg:order-none">
        {/* Mobile sidebar toggle */}
        <div className="w-full flex lg:hidden justify-start mb-2">
          <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
            <SheetTrigger asChild>
              <button
                className="inline-flex items-center px-3 py-2 rounded-md text-sm font-medium text-primary bg-muted hover:bg-muted/80 focus:outline-none"
                aria-label="Open sidebar"
              >
                <Menu className="h-5 w-5 mr-2" />
                Sidebar
              </button>
            </SheetTrigger>
            <SheetContent side="left" className="w-80 p-0 max-h-screen overflow-y-auto">
              <div className="space-y-6 p-4">
                <UserHighlightsCard userInfo={userInfo} toast={toast} />
                <SuggestionsWidget />
                <TrendingWidget />
                <TipsWidget />
                <ShortcutsWidget />
              </div>
            </SheetContent>
          </Sheet>
        </div>
        <div className="w-full flex flex-col items-center space-y-6">
          <div className="w-full max-w-[500px]">
            <CreatePostForm onPostCreated={handlePostCreated} />
          </div>
          {feedItems.map((item) => {
            // Handle meta actions
            if (isMetaAction(item)) {
              const metaAction = convertToMetaAction(item);
              return (
                <div key={item.id} className="w-full max-w-[500px]">
                  <MetaActionCard action={metaAction} currentUserId={currentUserId} />
                </div>
              );
            }
            
            // Handle content items
            if (isContentItem(item)) {
              const contentData = item.data as FeedItemDb;
              
              if (isGeneralPost(contentData)) {
                const postCreatorName = contentData.creator?.name || 'Anonymous';
                const postCreatorAvatar = contentData.creator?.image || mockUserAvatars[contentData.creatorId] || "https://i.pravatar.cc/40?u=anonymous";
                const displayPost: GeneralPost = {
                  id: contentData.id,
                  creatorId: contentData.creatorId,
                  creatorName: postCreatorName,
                  creatorAvatar: postCreatorAvatar,
                  content: contentData.content,
                  timestamp: contentData.timestamp,
                  background: contentData.background || undefined,
                  linkedInitiativeId: contentData.linkedInitiativeId || undefined,
                  media: contentData.media,
                };
                return (
                  <div key={contentData.id} className="w-full max-w-[500px]">
                    <GeneralPostCard post={displayPost} currentUserId={currentUserId} />
                  </div>
                );
              } else if (isInitiative(contentData)) {
                const initiativeItem = contentData;
                const initiativeCreatorName = initiativeItem.creator?.name || 'Unknown Creator';
                const initiativeCreatorAvatar = initiativeItem.creator?.image || mockUserAvatars[initiativeItem.creatorId] || "https://i.pravatar.cc/40?u=unknown";

                const processedRoles: string[] = initiativeItem.roles || []; // roles is already string[] from PrismaInitiative

                // Ensure creatorForCard is always UserForDisplay, providing a default if initiativeItem.creator is null
                const creatorForCard: UserForDisplay = initiativeItem.creator
                  ? {
                      id: initiativeItem.creator.id,
                      name: initiativeItem.creator.name, // PrismaUser.name is string | null, compatible
                      image: initiativeItem.creator.image, // PrismaUser.image is string | null, compatible
                    }
                  : {
                      id: initiativeItem.creatorId || 'unknown-creator', // Use creatorId if available, else a fallback
                      name: 'Unknown Creator',
                      image: null,
                    };

                const initiativeForCard: Initiative & { creatorId?: string } = {
                  id: initiativeItem.id,
                  title: initiativeItem.title,
                  description: initiativeItem.description || '',
                  imageUrl: initiativeItem.imageUrl,
                  status: initiativeItem.status as InitiativeStatus,
                  createdAt: initiativeItem.createdAt,
                  updatedAt: initiativeItem.updatedAt, // Use updatedAt from initiativeItem
                  creatorId: initiativeItem.creatorId,
                  roles: processedRoles, // Now correctly typed as string[]
                  creator: creatorForCard, // Now always a UserForDisplay object
                  memberships: [],
                  updates: [],
                  chatMessages: [],
                  goals: [],
                  milestones: [],
                };

                return (
                  <div key={initiativeItem.id} className="w-full max-w-[500px]">
                    <InitiativeCard
                      initiative={initiativeForCard}
                      creatorName={initiativeCreatorName}
                      creatorAvatarUrl={initiativeCreatorAvatar}
                      currentUserId={currentUserId}
                    />
                  </div>
                );
              } else if (isTaggedContent(contentData)) {
                const taggedItem = contentData; // Type is now IssueWithCreator | IdeaWithCreator
                const taggedItemCreatorName = taggedItem.creator?.name || 'Anonymous';
                const taggedItemCreatorAvatar = taggedItem.creator?.image || mockUserAvatars[taggedItem.creatorId] || "https://i.pravatar.cc/40?u=anonymous";
                const timeAgo = taggedItem.createdAt ? 
                  formatDistanceToNow(
                    typeof taggedItem.createdAt === 'string' 
                      ? parseISO(taggedItem.createdAt) 
                      : taggedItem.createdAt instanceof Date
                        ? taggedItem.createdAt
                        : new Date(taggedItem.createdAt as any),
                  { addSuffix: true }
                ) : '';

                const isCurrentItemAnIssue = ('location' in taggedItem) && (taggedItem.location !== null) && (taggedItem.location !== undefined);
                
                const hasMedia = taggedItem.media && taggedItem.media.length > 0 && taggedItem.media[0].url; // Check for media
                const mediaUrl = hasMedia ? taggedItem.media![0].url : undefined;

                // Transform taggedItem to conform to the expected type for PostActions
                const creatorForPostActions: UserForDisplay = taggedItem.creator
                ? {
                    id: taggedItem.creator.id,
                    name: taggedItem.creator.name || 'Anonymous', // Handle null name
                    image: taggedItem.creator.image,
                  }
                : {
                    id: taggedItem.creatorId || 'anonymous-creator',
                    name: 'Anonymous',
                    image: null,
                  };

                const postForActions = {
                  ...taggedItem,
                  creator: creatorForPostActions,
                  // Ensure all fields expected by Initiative | Issue | Idea are present
                  // For Issue:
                  ...(isCurrentItemAnIssue && {
                    // Assuming 'location' and other Issue-specific fields are already in taggedItem
                  }),
                  // For Idea:
                  ...(!isCurrentItemAnIssue && {
                    // Assuming Idea-specific fields are already in taggedItem
                  }),
                  // Fields potentially missing or needing type adjustment for PostActions:
                  // Add any other fields required by the union type Initiative | Issue | Idea
                  // that might not be directly on taggedItem or need transformation.
                  // For example, if PostActions expects a specific structure for 'tags' or other properties.
                  // Based on the error, the primary issue is 'creator', which is addressed above.
                };


                return (
                  <div key={taggedItem.id} className="relative mb-4 rounded-lg overflow-hidden shadow-lg flex flex-col text-card-foreground aspect-[9/12]">
                    {/* Media Layer (or background if no media) */}
                    {hasMedia && mediaUrl ? (
                      <div
                        className="absolute inset-0 bg-cover bg-center z-0"
                        style={{ backgroundImage: `url(${mediaUrl})` }}
                      >
                        <div className="absolute inset-0 bg-black/30 z-10"></div>
                      </div>
                    ) : (
                      <div className="absolute inset-0 bg-gradient-to-r from-purple-500 to-blue-500 z-0">
                        <div className="absolute inset-0 bg-black/30 z-10"></div>
                      </div>
                    )}

                    {/* Content Layer */}
                    <div className="relative z-20 flex flex-col flex-grow p-4">
                      {/* Header (Creator Info + Type Badge) */}
                      <div className="flex items-center justify-between mb-auto">
                        <div className="flex items-center space-x-2">
                          <Link 
                            href={`/profile/${taggedItem.creatorId}`}
                            className="relative hover:opacity-80 transition-opacity"
                          >
                            <Avatar className="h-9 w-9 border-2 border-white/80">
                              <AvatarImage src={taggedItemCreatorAvatar} alt={taggedItemCreatorName} />
                              <AvatarFallback>{taggedItemCreatorName.substring(0, 2).toUpperCase()}</AvatarFallback>
                            </Avatar>
                          </Link>
                          <div>
                            <Link 
                              href={`/profile/${taggedItem.creatorId}`}
                              className="hover:underline"
                            >
                              <p className="text-sm font-medium text-white/90">{taggedItemCreatorName}</p>
                            </Link>
                            <p className="text-xs text-white/70">{timeAgo}</p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Badge variant={isCurrentItemAnIssue ? "destructive" : "default"} className="bg-white/20 text-white border-none backdrop-blur-sm">
                            {isCurrentItemAnIssue ? "Issue" : "Idea"}
                          </Badge>
                          {currentUserId && taggedItem.creatorId === currentUserId && (
                            <PostActions
                              postId={taggedItem.id}
                              postType={isCurrentItemAnIssue ? "issue" : "idea"}
                              onEdit={() => console.log("Edit", isCurrentItemAnIssue ? "issue" : "idea", taggedItem.id)}
                              onDelete={async () => console.log("Delete", isCurrentItemAnIssue ? "issue" : "idea", taggedItem.id)}
                              className="ml-2"
                              post={postForActions}
                            />
                          )}
                        </div>
                      </div>

                      {/* Main Content Text (Title + Description) */}
                      <div className="my-4 text-center text-white">
                        <h3 className="text-xl font-bold mb-1 line-clamp-2">{taggedItem.title}</h3>
                        <p className="text-sm opacity-90 line-clamp-3">{taggedItem.description}</p>
                      </div>

                      {/* Footer (Champion Count, etc.) */}
                      <div className="mt-auto flex justify-center items-center space-x-4 text-white">
                        <div className="flex items-center space-x-1">
                          <Button variant="ghost" size="icon" className="text-white/80 hover:text-white hover:bg-white/10" onClick={() => console.log('Champion clicked')}>
                            <Star className="h-5 w-5 fill-current" />
                          </Button>
                          <span className="text-sm font-medium">{taggedItem.championCount || 0}</span>
                        </div>
                        {/* You can add more actions like comments/share here if needed */}
                      </div>
                    </div>
                  </div>
                );
              }
            }
            
            // Fallback for any other unexpected item types
            console.warn("Unknown feed item type:", item);
            return null;
          })}
          {feedItems.length === 0 && (
            <p className="text-center text-gray-500">No posts or initiatives yet. Be the first to create one!</p>
          )}
        </div>
      </div>
    </div>
  );
}