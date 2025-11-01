"use client";

import React, { useState } from 'react';
import Image from 'next/image';
import { formatDistanceToNow } from 'date-fns';
import { ArrowLeft, ThumbsUp, ThumbsDown, MessageCircle, Users, Loader2, X, Edit, Save, Trash2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';
import { cn } from '@/lib/utils';
import { VideoPlayer } from '@/components/ui/video-player';
import { AudioPlayer } from '@/components/ui/audio-player';
import { updateDebateTopicContent } from '@/app/actions/debateActions';

// Helper function to detect video files
const isVideoFile = (url: string) => {
  if (!url) return false;
  const videoExtensions = ['.mp4', '.webm', '.mov', '.avi', '.mkv', '.wmv', '.flv', '.m4v'];
  const lowerUrl = url.toLowerCase();
  return videoExtensions.some(ext => lowerUrl.includes(ext));
};

// Helper function to detect audio files
const isAudioFile = (url: string) => {
  if (!url) return false;
  const audioExtensions = ['.mp3', '.wav', '.m4a', '.aac', '.ogg', '.flac'];
  const lowerUrl = url.toLowerCase();
  return audioExtensions.some(ext => lowerUrl.includes(ext));
};

interface User {
  id: string;
  name: string;
  image?: string;
  username?: string;
}

interface DebateArgument {
  id: string;
  content: string;
  side: 'PRO' | 'CON';
  createdAt: string;
  updatedAt: string;
  user: User;
  parentId?: string | null;
  replies: DebateArgument[];
  votes: any[];
}

interface DebateDetailClientProps {
  debateTopic: {
    id: string;
    title: string;
    content: string;
    imageUrl?: string;
    createdAt: string;
    updatedAt: string;
    creator: User;
  };
  stats: {
    proVotes: number;
    conVotes: number;
    totalVotes: number;
    proPercentage: number;
    conPercentage: number;
  };
  userVote: { side: 'PRO' | 'CON' } | null;
  proArguments: DebateArgument[];
  conArguments: DebateArgument[];
  currentUserId?: string | null;
}

export default function DebateDetailClient({
  debateTopic,
  stats: initialStats,
  userVote: initialUserVote,
  proArguments: initialProArguments,
  conArguments: initialConArguments,
  currentUserId,
}: DebateDetailClientProps) {
  const router = useRouter();
  const { toast } = useToast();
  
  const [stats, setStats] = useState(initialStats);
  const [userVote, setUserVote] = useState(initialUserVote);
  const [votingLoading, setVotingLoading] = useState(false);
  const [newProArgument, setNewProArgument] = useState('');
  const [newConArgument, setNewConArgument] = useState('');
  const [proArgumentLoading, setProArgumentLoading] = useState(false);
  const [conArgumentLoading, setConArgumentLoading] = useState(false);
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');
  const [allProArguments, setAllProArguments] = useState<DebateArgument[]>(initialProArguments);
  const [allConArguments, setAllConArguments] = useState<DebateArgument[]>(initialConArguments);
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState<'PRO' | 'CON' | null>(null);

  
  // Edit functionality state
  const [editMode, setEditMode] = useState(false);
  const [editTitle, setEditTitle] = useState(debateTopic.title);
  const [editContent, setEditContent] = useState(debateTopic.content);
  const [editLoading, setEditLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  // Helper to find an argument by id in the flat list
  const findArgumentByIdFlat = (id: string | null, side: 'PRO' | 'CON'): DebateArgument | null => {
    if (!id) return null;
    const argumentsList = side === 'PRO' ? allProArguments : allConArguments;
    return argumentsList.find((arg) => arg.id === id) || null;
  };

  // Helper: get all descendants of a parent argument, sorted by createdAt
  const getAllRepliesFlat = (parentId: string, side: 'PRO' | 'CON'): DebateArgument[] => {
    const argumentsList = side === 'PRO' ? allProArguments : allConArguments;
    // Get all replies (direct or indirect) to this parentId
    const replies = argumentsList.filter((arg) => arg.parentId === parentId);
    // Sort by createdAt (oldest first)
    replies.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    // For each reply, recursively get its own replies (flattened)
    let flat: DebateArgument[] = [];
    for (const reply of replies) {
      flat.push(reply);
      flat = flat.concat(getAllRepliesFlat(reply.id, side));
    }
    return flat;
  };

  const handleVote = async (side: 'PRO' | 'CON') => {
    if (!currentUserId) {
      toast({
        title: "Sign in Required",
        description: "You need to be signed in to vote on debates.",
        variant: "destructive",
      });
      return;
    }

    setVotingLoading(true);
    try {
      const response = await fetch(`/api/debates/${debateTopic.id}/vote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ side }),
      });

      if (!response.ok) {
        throw new Error('Failed to vote');
      }

      const data = await response.json();
      setStats(data.stats);
      setUserVote({ side });
      
      toast({
        title: "Vote Recorded!",
        description: `You voted ${side} on this debate.`,
      });
    } catch (error) {
      console.error('Error voting:', error);
      toast({
        title: "Voting Failed",
        description: "Could not record your vote. Please try again.",
        variant: "destructive",
      });
    } finally {
      setVotingLoading(false);
    }
  };

  const handleAddReply = async (parentId: string, side: 'PRO' | 'CON') => {
    if (!currentUserId) {
      toast({
        title: "Sign in Required",
        description: "You need to be signed in to reply to arguments.",
        variant: "destructive",
      });
      return;
    }

    if (!replyText.trim()) {
      toast({
        title: "Missing Information",
        description: "Please write your reply.",
        variant: "destructive",
      });
      return;
    }

    const setLoading = side === 'PRO' ? setProArgumentLoading : setConArgumentLoading;
    setLoading(true);
    
    try {
      const response = await fetch(`/api/debates/${debateTopic.id}/arguments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: replyText.trim(),
          side: side,
          parentId: parentId,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to add reply');
      }

      const newReplyData = await response.json();
      
      // Refresh the page to show the new reply
      router.refresh();
      
      setReplyText('');
      setReplyingTo(null);
      
      toast({
        title: "Reply Added!",
        description: `Your ${side} reply has been posted.`,
      });
    } catch (error) {
      console.error('Error adding reply:', error);
      toast({
        title: "Failed to Add Reply",
        description: "Could not post your reply. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAddArgument = async (side: 'PRO' | 'CON') => {
    if (!currentUserId) {
      toast({
        title: "Sign in Required",
        description: "You need to be signed in to add arguments.",
        variant: "destructive",
      });
      return;
    }

    const argumentText = side === 'PRO' ? newProArgument : newConArgument;
    if (!argumentText.trim()) {
      toast({
        title: "Missing Information",
        description: "Please write your argument.",
        variant: "destructive",
      });
      return;
    }

    const setLoading = side === 'PRO' ? setProArgumentLoading : setConArgumentLoading;
    setLoading(true);
    
    try {
      const response = await fetch(`/api/debates/${debateTopic.id}/arguments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: argumentText.trim(),
          side: side,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to add argument');
      }

      const newArgumentData = await response.json();
      
      // Refresh the page to show the new argument
      // In a production app, you'd want to add it to state instead
      router.refresh();
      
      if (side === 'PRO') {
        setNewProArgument('');
      } else {
        setNewConArgument('');
      }
      
      toast({
        title: "Argument Added!",
        description: `Your ${side} argument has been posted.`,
      });
    } catch (error) {
      console.error('Error adding argument:', error);
      toast({
        title: "Failed to Add Argument",
        description: "Could not post your argument. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEditSubmit = async () => {
    if (!editTitle.trim() || !editContent.trim()) {
      toast({
        title: "Missing Information",
        description: "Please fill in both title and content.",
        variant: "destructive",
      });
      return;
    }

    if (editTitle === debateTopic.title && editContent === debateTopic.content) {
      setEditMode(false);
      return;
    }

    setEditLoading(true);
    try {
      const result = await updateDebateTopicContent(debateTopic.id, editContent, editTitle);
      if (result.success) {
        setEditMode(false);
        toast({
          title: "Debate Updated!",
          description: "Your debate topic has been updated successfully.",
        });
        // Refresh the page to show updated content
        router.refresh();
      } else {
        toast({
          title: "Update Failed",
          description: result.error || 'Failed to update debate topic',
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error updating debate topic:', error);
      toast({
        title: "Update Failed",
        description: "Could not update debate topic. Please try again.",
        variant: "destructive",
      });
    } finally {
      setEditLoading(false);
    }
  };

  // Delete debate topic handler
  const handleDelete = async () => {
    if (deleteLoading) return;

    if (!confirm(`Are you sure you want to delete "${debateTopic.title}"? This action cannot be undone.`)) {
      return;
    }

    setDeleteLoading(true);

    try {
      const response = await fetch(`/api/debates/${debateTopic.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete debate topic');
      }

      toast({
        title: 'Debate Deleted',
        description: 'Your debate topic has been successfully deleted.',
      });

      // Navigate back to home/debates page
      router.push('/');
    } catch (error) {
      console.error('Error deleting debate topic:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete debate topic. Please try again.',
        variant: 'destructive',
      });
      setDeleteLoading(false);
    }
  };

  // Safely handle timestamp formatting
  let timeAgo = 'recently';
  try {
    const timestamp = new Date(debateTopic.createdAt);
    if (!isNaN(timestamp.getTime())) {
      timeAgo = formatDistanceToNow(timestamp, { addSuffix: true });
    }
  } catch (error) {
    console.error('Invalid timestamp for debate topic:', debateTopic.id, debateTopic.createdAt);
  }

  // Determine media type
  const isVideo = debateTopic.imageUrl ? isVideoFile(debateTopic.imageUrl) : false;
  const isAudio = debateTopic.imageUrl ? isAudioFile(debateTopic.imageUrl) : false;
  const isImage = debateTopic.imageUrl && !isVideo && !isAudio;

  // Helper functions to check if user has already posted arguments
  const getUserProArgument = () => {
    return allProArguments.find(arg => !arg.parentId && arg.user.id === currentUserId);
  };

  const getUserConArgument = () => {
    return allConArguments.find(arg => !arg.parentId && arg.user.id === currentUserId);
  };

  const hasUserProArgument = currentUserId ? !!getUserProArgument() : false;
  const hasUserConArgument = currentUserId ? !!getUserConArgument() : false;

  // Delete argument function
  const handleDeleteArgument = async (argumentId: string, side: 'PRO' | 'CON') => {
    if (!currentUserId) return;

    try {
      const response = await fetch(`/api/debates/${debateTopic.id}/arguments/${argumentId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
      });

      if (response.ok) {
        // Remove the argument and all its replies from local state
        if (side === 'PRO') {
          setAllProArguments(prev => prev.filter(arg => arg.id !== argumentId && arg.parentId !== argumentId));
        } else {
          setAllConArguments(prev => prev.filter(arg => arg.id !== argumentId && arg.parentId !== argumentId));
        }
        
        toast({
          title: "Argument Deleted",
          description: "Your argument and all replies have been removed.",
        });
      } else {
        toast({
          title: "Delete Failed", 
          description: "Could not delete your argument. Please try again.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error deleting argument:', error);
      toast({
        title: "Delete Failed",
        description: "Could not delete your argument. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Render a single argument (parent or reply)
  const RenderArgument = ({ argument, side, isReply = false }: { argument: DebateArgument; side: 'PRO' | 'CON'; isReply?: boolean }) => {
    // If this is a reply to another reply, show a reference line
    let reference: null | { user: string; snippet: string; parentId: string } = null;
    if (isReply && argument.parentId) {
      const parent = findArgumentByIdFlat(argument.parentId, side);
      if (parent) {
        reference = {
          user: parent.user.name,
          snippet: parent.content.length > 40 ? parent.content.slice(0, 40) + '…' : parent.content,
          parentId: parent.id,
        };
      }
    }

    const sideColors = side === 'PRO' 
      ? {
          border: 'border-green-200 dark:border-green-800',
          bg: 'bg-green-50 dark:bg-green-950/30',
          replyBg: 'bg-green-25 dark:bg-green-975/20'
        }
      : {
          border: 'border-red-200 dark:border-red-800', 
          bg: 'bg-red-50 dark:bg-red-950/30',
          replyBg: 'bg-red-25 dark:bg-red-975/20'
        };

    return (
      <div
        className={cn(
          "mb-3",
          isReply ? `ml-6 border-l-2 ${sideColors.border} pl-4 mt-2` : '',
          `bg-card ${sideColors.border} rounded-lg p-4 hover:shadow-sm transition-shadow`
        )}
        id={`argument-${argument.id}`}
      >
        {reference && (
          <div className="text-xs text-muted-foreground mb-2">
            Replying to{' '}
            <button
              className="underline hover:text-primary"
              onClick={() => {
                const element = document.getElementById(`argument-${reference.parentId}`);
                if (element) {
                  element.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }
              }}
              type="button"
            >
              {reference.user}
            </button>
            : <span className="italic">{reference.snippet}</span>
          </div>
        )}
        <div className="flex items-start gap-3">
          <Avatar className={cn("", isReply ? "w-6 h-6" : "w-8 h-8")}>
            <AvatarImage src={argument.user.image} alt={argument.user.name} />
            <AvatarFallback className="text-xs">
              {getInitials(argument.user.name)}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className={cn("font-medium", isReply ? "text-xs" : "text-sm")}>{argument.user.name}</span>
              <span className="text-xs text-muted-foreground">
                {(() => {
                  try {
                    const timestamp = new Date(argument.createdAt);
                    return !isNaN(timestamp.getTime())
                      ? formatDistanceToNow(timestamp, { addSuffix: true })
                      : 'recently';
                  } catch {
                    return 'recently';
                  }
                })()}
              </span>
            </div>
            <p className={cn("text-foreground leading-relaxed", isReply ? "text-xs" : "text-sm")}>
              {argument.content}
            </p>
            <div className="flex items-center gap-2 mt-2">
              {currentUserId && (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="text-xs h-6 px-2"
                  onClick={() => {
                    if (replyingTo === argument.id) {
                      // Cancel reply if clicking same argument
                      setReplyingTo(null);
                      setReplyText('');
                    } else {
                      setReplyingTo(argument.id);
                      setReplyText('');
                    }
                    // Close mobile drawer when replying
                    setMobileDrawerOpen(null);
                  }}
                >
                  <MessageCircle className="w-3 h-3 mr-1" />
                  {replyingTo === argument.id ? 'Cancel' : 'Reply'}
                </Button>
              )}
            </div>
            
            {/* Inline Reply Form - Only show for the argument being replied to */}
            {replyingTo === argument.id && currentUserId && (
              <div className="mt-3 pt-3 border-t border-border">
                <div className="space-y-3">
                  <div className="text-xs text-muted-foreground">
                    Replying to <span className="font-medium">{argument.user.name}</span>
                  </div>
                  <Textarea
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    placeholder={`Write your ${side} reply...`}
                    rows={3}
                    maxLength={500}
                    disabled={proArgumentLoading || conArgumentLoading}
                    className={cn(
                      "text-sm",
                      side === 'PRO' 
                        ? "border-green-200 dark:border-green-800 focus:border-green-400" 
                        : "border-red-200 dark:border-red-800 focus:border-red-400"
                    )}
                    autoFocus
                  />
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-muted-foreground">
                      {replyText.length}/500 characters
                    </span>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setReplyingTo(null);
                          setReplyText('');
                        }}
                        className="text-xs h-7"
                      >
                        Cancel
                      </Button>
                      <Button
                        onClick={() => handleAddReply(argument.id, side)}
                        disabled={proArgumentLoading || conArgumentLoading || !replyText.trim()}
                        size="sm"
                        className={cn(
                          "text-xs h-7",
                          side === 'PRO' 
                            ? "bg-green-600 hover:bg-green-700 text-white" 
                            : "bg-red-600 hover:bg-red-700 text-white"
                        )}
                      >
                        {(proArgumentLoading || conArgumentLoading) ? (
                          <>
                            <Loader2 className="w-3 h-3 animate-spin mr-1" />
                            Replying...
                          </>
                        ) : (
                          `Reply to ${side}`
                        )}
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="w-full min-w-0 overflow-hidden">
      
      <div className="px-4 lg:px-6 pt-20 lg:pt-6 pb-24">
        <div className="min-h-screen bg-background">
      {/* Back Button */}
      <div className="max-w-7xl mx-auto pt-4 px-4 flex items-start">
        <button
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground text-sm px-2 py-1 rounded hover:bg-muted/40 transition"
          onClick={() => router.back()}
        >
          <ArrowLeft className="h-4 w-4" />
          <span className="hidden sm:inline">Back</span>
        </button>
      </div>

      <div className="max-w-7xl mx-auto py-6 px-4">
        {/* Mobile Layout */}
        <div className="lg:hidden">
          {/* Main Topic Content - Priority on mobile */}
          <div className="mb-6">
            <div className="bg-card border border-border rounded-xl shadow-lg overflow-hidden">
              {/* Header */}
              <div className="p-6 border-b border-border">
                <div className="flex items-center gap-3 mb-4">
                  <Avatar className="w-10 h-10">
                    <AvatarImage src={debateTopic.creator.image} alt={debateTopic.creator.name} />
                    <AvatarFallback>{getInitials(debateTopic.creator.name)}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium">{debateTopic.creator.name}</p>
                    <p className="text-sm text-muted-foreground">{timeAgo}</p>
                  </div>
                  <div className="ml-auto flex items-center gap-2">
                    <Badge variant="secondary">Debate Topic</Badge>
                    {currentUserId === debateTopic.creator.id && (
                      <>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setEditMode(!editMode)}
                          className="h-8 w-8 p-0"
                          title="Edit debate topic"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={handleDelete}
                          disabled={deleteLoading}
                          className="h-8 w-8 p-0 hover:text-destructive"
                          title="Delete debate topic"
                        >
                          {deleteLoading ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Trash2 className="h-4 w-4" />
                          )}
                        </Button>
                      </>
                    )}
                  </div>
                </div>
                
                {/* Title - Edit or Display Mode */}
                {editMode ? (
                  <div className="mb-3 space-y-2">
                    <input
                      type="text"
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      className="w-full text-xl font-bold bg-transparent border-b border-border focus:outline-none focus:border-primary"
                      placeholder="Debate title..."
                    />
                  </div>
                ) : (
                  <h1 className="text-xl font-bold mb-3">{debateTopic.title}</h1>
                )}
                
                {/* Topic Media */}
                {isVideo && (
                  <div className="mb-4">
                    <VideoPlayer 
                      src={debateTopic.imageUrl!}
                      className="w-full max-h-64 rounded-lg"
                      controls={true}
                      autoPlay={false}
                      muted={false}
                    />
                  </div>
                )}
                {isAudio && (
                  <div className="mb-4">
                    <AudioPlayer 
                      src={debateTopic.imageUrl!}
                      className="w-full"
                    />
                  </div>
                )}
                {isImage && (
                  <div className="mb-4 relative">
                    <Image 
                      src={debateTopic.imageUrl!} 
                      alt="Debate topic" 
                      width={600}
                      height={256}
                      className="w-full max-h-64 object-cover rounded-lg border"
                      priority
                    />
                  </div>
                )}
                
                {/* Content - Edit or Display Mode */}
                {editMode ? (
                  <div className="space-y-3">
                    <Textarea
                      value={editContent}
                      onChange={(e) => setEditContent(e.target.value)}
                      className="min-h-[120px] resize-none"
                      placeholder="Describe your debate topic..."
                    />
                    <div className="flex gap-2">
                      <Button
                        onClick={handleEditSubmit}
                        disabled={editLoading}
                        size="sm"
                        className="bg-primary hover:bg-primary/90"
                      >
                        {editLoading ? (
                          <>
                            <Loader2 className="w-3 h-3 animate-spin mr-2" />
                            Saving...
                          </>
                        ) : (
                          <>
                            <Save className="w-3 h-3 mr-2" />
                            Save
                          </>
                        )}
                      </Button>
                      <Button
                        onClick={() => {
                          setEditMode(false);
                          setEditTitle(debateTopic.title);
                          setEditContent(debateTopic.content);
                        }}
                        variant="outline"
                        size="sm"
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <p className="text-muted-foreground leading-relaxed whitespace-pre-line">{debateTopic.content}</p>
                )}
              </div>

              {/* Voting Section */}
              <div className="p-6 space-y-4">
                {/* Progress Bar */}
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-green-600 font-medium">PRO {stats.proPercentage}%</span>
                    <span className="text-red-600 font-medium">CON {stats.conPercentage}%</span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-3 overflow-hidden">
                    <div className="h-full flex">
                      <div 
                        className="bg-green-500 transition-all duration-500"
                        style={{ width: `${stats.proPercentage}%` }}
                      />
                      <div 
                        className="bg-red-500 transition-all duration-500"
                        style={{ width: `${stats.conPercentage}%` }}
                      />
                    </div>
                  </div>
                  <div className="flex items-center justify-center gap-4 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Users className="w-3 h-3" />
                      {stats.totalVotes} total votes
                    </span>
                  </div>
                </div>

                {/* Vote Buttons */}
                {currentUserId && (
                  <div className="flex gap-3">
                    <Button
                      onClick={() => handleVote('PRO')}
                      disabled={votingLoading}
                      variant={userVote?.side === 'PRO' ? "default" : "outline"}
                      className={cn(
                        "flex-1 bg-green-600 hover:bg-green-700 text-white",
                        userVote?.side === 'PRO' && "bg-green-700"
                      )}
                    >
                      {votingLoading ? (
                        <Loader2 className="w-4 h-4 animate-spin mr-2" />
                      ) : (
                        <ThumbsUp className="w-4 h-4 mr-2" />
                      )}
                      Vote PRO
                    </Button>
                    <Button
                      onClick={() => handleVote('CON')}
                      disabled={votingLoading}
                      variant={userVote?.side === 'CON' ? "default" : "outline"}
                      className={cn(
                        "flex-1 bg-red-600 hover:bg-red-700 text-white",
                        userVote?.side === 'CON' && "bg-red-700"
                      )}
                    >
                      {votingLoading ? (
                        <Loader2 className="w-4 h-4 animate-spin mr-2" />
                      ) : (
                        <ThumbsDown className="w-4 h-4 mr-2" />
                      )}
                      Vote CON
                    </Button>
                  </div>
                )}

                {!currentUserId && (
                  <div className="text-center py-4">
                    <p className="text-muted-foreground text-sm mb-2">
                      Sign in to vote and add arguments
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Mobile Summary Cards */}
          <div className="grid grid-cols-2 gap-4 mb-6 pb-20">
            <div className="bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-green-600 mb-1">
                {stats.proPercentage}%
              </div>
              <div className="text-sm text-green-700 dark:text-green-400 font-medium">PRO</div>
              <div className="text-xs text-muted-foreground">
                {stats.proVotes} votes • {allProArguments.filter(arg => !arg.parentId).length} arguments
              </div>
            </div>
            <div className="bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-red-600 mb-1">
                {stats.conPercentage}%
              </div>
              <div className="text-sm text-red-700 dark:text-red-400 font-medium">CON</div>
              <div className="text-xs text-muted-foreground">
                {stats.conVotes} votes • {allConArguments.filter(arg => !arg.parentId).length} arguments
              </div>
            </div>
          </div>

          {/* Mobile Floating Action Buttons */}
          {!replyingTo && (
            <div className="fixed bottom-6 left-4 right-4 flex gap-3 z-40">
              <Button
                onClick={() => setMobileDrawerOpen('PRO')}
                className="flex-1 bg-green-600 hover:bg-green-700 text-white h-12 shadow-lg"
                size="lg"
              >
                <ThumbsUp className="w-5 h-5 mr-2" />
                PRO Arguments
              </Button>
              <Button
                onClick={() => setMobileDrawerOpen('CON')}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white h-12 shadow-lg"
                size="lg"
              >
                <ThumbsDown className="w-5 h-5 mr-2" />
                CON Arguments
              </Button>
            </div>
          )}

          {/* Mobile Drawers */}
          {mobileDrawerOpen && (
            <>
              {/* Overlay */}
              <div 
                className="lg:hidden fixed inset-0 bg-black/50 z-50"
                onClick={() => setMobileDrawerOpen(null)}
              />
              
              {/* Side Drawer */}
              <div 
                className={cn(
                  "lg:hidden fixed top-0 bottom-0 w-80 max-w-[85vw] bg-card border-border z-50 transform transition-transform duration-300 ease-in-out",
                  mobileDrawerOpen === 'PRO' ? "left-0 border-r" : "right-0 border-l"
                )}
            >
              {/* Drawer Header */}
              <div className={cn(
                "flex items-center justify-between p-4 border-b border-border",
                mobileDrawerOpen === 'PRO' 
                  ? "bg-green-50 dark:bg-green-950/30" 
                  : "bg-red-50 dark:bg-red-950/30"
              )}>
                <div className="flex items-center gap-2">
                  {mobileDrawerOpen === 'PRO' ? (
                    <ThumbsUp className="w-5 h-5 text-green-600" />
                  ) : (
                    <ThumbsDown className="w-5 h-5 text-red-600" />
                  )}
                  <h2 className={cn(
                    "text-lg font-bold",
                    mobileDrawerOpen === 'PRO' 
                      ? "text-green-700 dark:text-green-400" 
                      : "text-red-700 dark:text-red-400"
                  )}>
                    {mobileDrawerOpen} Arguments
                  </h2>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setMobileDrawerOpen(null)}
                  className="h-8 w-8 p-0"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>

              {/* Drawer Content */}
              <div className="flex flex-col h-full overflow-hidden">
                {/* Stats */}
                <div className={cn(
                  "p-4 border-b border-border",
                  mobileDrawerOpen === 'PRO' 
                    ? "bg-green-50/50 dark:bg-green-950/20" 
                    : "bg-red-50/50 dark:bg-red-950/20"
                )}>
                  <div className="text-center">
                    <div className={cn(
                      "text-2xl font-bold mb-1",
                      mobileDrawerOpen === 'PRO' ? "text-green-600" : "text-red-600"
                    )}>
                      {mobileDrawerOpen === 'PRO' ? stats.proPercentage : stats.conPercentage}%
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {mobileDrawerOpen === 'PRO' 
                        ? `${stats.proVotes} votes supporting` 
                        : `${stats.conVotes} votes opposing`
                      }
                    </div>
                  </div>
                </div>

                {/* Add Argument Form */}
                {currentUserId && (
                  <div className={cn(
                    "p-4 border-b border-border space-y-3",
                    mobileDrawerOpen === 'PRO' 
                      ? "bg-green-50/30 dark:bg-green-950/10" 
                      : "bg-red-50/30 dark:bg-red-950/10"
                  )}>
                    <h4 className={cn(
                      "font-medium text-sm",
                      mobileDrawerOpen === 'PRO' 
                        ? "text-green-700 dark:text-green-400" 
                        : "text-red-700 dark:text-red-400"
                    )}>
                      Add {mobileDrawerOpen} Argument
                    </h4>
                    
                    <Textarea
                      value={mobileDrawerOpen === 'PRO' ? newProArgument : newConArgument}
                      onChange={(e) => mobileDrawerOpen === 'PRO' 
                        ? setNewProArgument(e.target.value) 
                        : setNewConArgument(e.target.value)
                      }
                      placeholder={`Share your ${mobileDrawerOpen === 'PRO' ? 'supporting' : 'opposing'} reasoning, evidence, or perspective...`}
                      rows={3}
                      maxLength={500}
                      disabled={proArgumentLoading || conArgumentLoading}
                      className={cn(
                        mobileDrawerOpen === 'PRO' 
                          ? "border-green-200 dark:border-green-800 focus:border-green-400" 
                          : "border-red-200 dark:border-red-800 focus:border-red-400"
                      )}
                    />
                    
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-muted-foreground">
                        {mobileDrawerOpen === 'PRO' ? newProArgument.length : newConArgument.length}/500 characters
                      </span>
                      <Button
                        onClick={() => handleAddArgument(mobileDrawerOpen)}
                        disabled={
                          proArgumentLoading || 
                          conArgumentLoading || 
                          !(mobileDrawerOpen === 'PRO' ? newProArgument.trim() : newConArgument.trim())
                        }
                        size="sm"
                        className={cn(
                          "text-white",
                          mobileDrawerOpen === 'PRO' 
                            ? "bg-green-600 hover:bg-green-700" 
                            : "bg-red-600 hover:bg-red-700"
                        )}
                      >
                        {(proArgumentLoading || conArgumentLoading) ? (
                          <>
                            <Loader2 className="w-3 h-3 animate-spin mr-2" />
                            Adding...
                          </>
                        ) : (
                          `Add ${mobileDrawerOpen} Argument`
                        )}
                      </Button>
                    </div>
                  </div>
                )}

                {/* Arguments List */}
                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                  {(() => {
                    const argumentsList = mobileDrawerOpen === 'PRO' ? allProArguments : allConArguments;
                    const parentArguments = argumentsList.filter(arg => !arg.parentId);
                    
                    if (parentArguments.length === 0) {
                      return (
                        <div className="text-center py-8 text-muted-foreground">
                          {mobileDrawerOpen === 'PRO' ? (
                            <ThumbsUp className="w-8 h-8 mx-auto mb-2 opacity-50" />
                          ) : (
                            <ThumbsDown className="w-8 h-8 mx-auto mb-2 opacity-50" />
                          )}
                          <p className="text-sm">No {mobileDrawerOpen.toLowerCase()} arguments yet.</p>
                          {!currentUserId && (
                            <p className="text-xs">Sign in to be the first to argue {mobileDrawerOpen}!</p>
                          )}
                        </div>
                      );
                    }
                    
                    return parentArguments.map((argument) => {
                      const allReplies = getAllRepliesFlat(argument.id, mobileDrawerOpen);
                      return (
                        <div key={argument.id} className="space-y-2">
                          <RenderArgument argument={argument} side={mobileDrawerOpen} isReply={false} />
                          {allReplies.map((reply) => (
                            <RenderArgument key={reply.id} argument={reply} side={mobileDrawerOpen} isReply={true} />
                          ))}
                        </div>
                      );
                    });
                  })()}
                </div>
              </div>
            </div>
          </>
        )}
        </div>

        {/* Desktop Layout - New Stacked Approach */}
        <div className="hidden lg:block space-y-8">
          
          {/* Full Width Topic Card Section */}
          <div className="bg-card border border-border rounded-xl shadow-lg overflow-hidden">
            {/* Header */}
            <div className="p-8 border-b border-border">
              <div className="flex items-center gap-4 mb-6">
                <Avatar className="w-12 h-12">
                  <AvatarImage src={debateTopic.creator.image} alt={debateTopic.creator.name} />
                  <AvatarFallback>{getInitials(debateTopic.creator.name)}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-semibold text-lg">{debateTopic.creator.name}</p>
                  <p className="text-sm text-muted-foreground">{timeAgo}</p>
                </div>
                <div className="ml-auto flex items-center gap-2">
                  <Badge variant="secondary" className="text-sm">Debate Topic</Badge>
                  {currentUserId === debateTopic.creator.id && (
                    <>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setEditMode(!editMode)}
                        className="h-8 w-8 p-0"
                        title="Edit debate topic"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleDelete}
                        disabled={deleteLoading}
                        className="h-8 w-8 p-0 hover:text-destructive"
                        title="Delete debate topic"
                      >
                        {deleteLoading ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Trash2 className="h-4 w-4" />
                        )}
                      </Button>
                    </>
                  )}
                </div>
              </div>
              
              {/* Title - Edit or Display Mode */}
              {editMode ? (
                <div className="mb-6 space-y-2">
                  <input
                    type="text"
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    className="w-full text-2xl font-bold bg-transparent border-b border-border focus:outline-none focus:border-primary"
                    placeholder="Debate title..."
                  />
                </div>
              ) : (
                <h1 className="text-2xl font-bold mb-6">{debateTopic.title}</h1>
              )}
              
              {/* Topic Media */}
              {isVideo && (
                <div className="mb-6">
                  <VideoPlayer 
                    src={debateTopic.imageUrl!}
                    className="w-full max-h-96 rounded-lg"
                    controls={true}
                    autoPlay={false}
                    muted={false}
                  />
                </div>
              )}
              {isAudio && (
                <div className="mb-6">
                  <AudioPlayer 
                    src={debateTopic.imageUrl!}
                    className="w-full"
                  />
                </div>
              )}
              {isImage && (
                <div className="mb-6 relative">
                  <Image 
                    src={debateTopic.imageUrl!} 
                    alt="Debate topic" 
                    width={800}
                    height={384}
                    className="w-full max-h-96 object-cover rounded-lg border"
                    priority
                  />
                </div>
              )}
              
              {/* Content - Edit or Display Mode */}
              {editMode ? (
                <div className="space-y-4">
                  <Textarea
                    value={editContent}
                    onChange={(e) => setEditContent(e.target.value)}
                    className="min-h-[150px] resize-none text-base"
                    placeholder="Describe your debate topic..."
                  />
                  <div className="flex gap-2">
                    <Button
                      onClick={handleEditSubmit}
                      disabled={editLoading}
                      size="sm"
                      className="bg-primary hover:bg-primary/90"
                    >
                      {editLoading ? (
                        <>
                          <Loader2 className="w-3 h-3 animate-spin mr-2" />
                          Saving...
                        </>
                      ) : (
                        <>
                          <Save className="w-3 h-3 mr-2" />
                          Save
                        </>
                      )}
                    </Button>
                    <Button
                      onClick={() => {
                        setEditMode(false);
                        setEditTitle(debateTopic.title);
                        setEditContent(debateTopic.content);
                      }}
                      variant="outline"
                      size="sm"
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <p className="text-muted-foreground leading-relaxed whitespace-pre-line text-base">{debateTopic.content}</p>
              )}
            </div>

            {/* Voting Section */}
            <div className="p-8 space-y-6">
              {/* Progress Bar */}
              <div className="space-y-3">
                <div className="flex justify-between text-base font-medium">
                  <span className="text-green-600">PRO {stats.proPercentage}%</span>
                  <span className="text-red-600">CON {stats.conPercentage}%</span>
                </div>
                <div className="w-full bg-muted rounded-full h-4 overflow-hidden">
                  <div className="h-full flex">
                    <div 
                      className="bg-green-500 transition-all duration-500"
                      style={{ width: `${stats.proPercentage}%` }}
                    />
                    <div 
                      className="bg-red-500 transition-all duration-500"
                      style={{ width: `${stats.conPercentage}%` }}
                    />
                  </div>
                </div>
                <div className="flex items-center justify-center gap-6 text-sm text-muted-foreground">
                  <span className="flex items-center gap-2">
                    <Users className="w-4 h-4" />
                    {stats.totalVotes} total votes
                  </span>
                  <span className="flex items-center gap-2">
                    <MessageCircle className="w-4 h-4" />
                    {allProArguments.filter(arg => !arg.parentId).length + allConArguments.filter(arg => !arg.parentId).length} arguments
                  </span>
                </div>
              </div>

              {/* Vote Buttons */}
              {currentUserId && (
                <div className="flex gap-4 max-w-md mx-auto">
                  <Button
                    onClick={() => handleVote('PRO')}
                    disabled={votingLoading}
                    variant={userVote?.side === 'PRO' ? "default" : "outline"}
                    className={cn(
                      "flex-1 h-12 text-base bg-green-600 hover:bg-green-700 text-white",
                      userVote?.side === 'PRO' && "bg-green-700"
                    )}
                  >
                    {votingLoading ? (
                      <Loader2 className="w-5 h-5 animate-spin mr-2" />
                    ) : (
                      <ThumbsUp className="w-5 h-5 mr-2" />
                    )}
                    Vote PRO
                  </Button>
                  <Button
                    onClick={() => handleVote('CON')}
                    disabled={votingLoading}
                    variant={userVote?.side === 'CON' ? "default" : "outline"}
                    className={cn(
                      "flex-1 h-12 text-base bg-red-600 hover:bg-red-700 text-white",
                      userVote?.side === 'CON' && "bg-red-700"
                    )}
                  >
                    {votingLoading ? (
                      <Loader2 className="w-5 h-5 animate-spin mr-2" />
                    ) : (
                      <ThumbsDown className="w-5 h-5 mr-2" />
                    )}
                    Vote CON
                  </Button>
                </div>
              )}

              {!currentUserId && (
                <div className="text-center py-6">
                  <p className="text-muted-foreground text-base mb-2">
                    Sign in to vote and add arguments
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Two-Column Arguments Section */}
          <div className="lg:grid lg:grid-cols-2 gap-8">
            
            {/* PRO Arguments Column */}
            <div className="space-y-6">
              <div className="bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-lg p-6">
                <div className="flex items-center justify-center gap-2 mb-4">
                  <ThumbsUp className="w-6 h-6 text-green-600" />
                  <h2 className="text-xl font-bold text-green-700 dark:text-green-400">PRO Arguments</h2>
                </div>
                <div className="text-center text-3xl font-bold text-green-600 mb-2">
                  {stats.proPercentage}%
                </div>
                <div className="text-center text-base text-muted-foreground">
                  {stats.proVotes} votes supporting
                </div>
              </div>

              {/* Add PRO Argument Form or Confirmation Message */}
              {currentUserId && (!userVote || userVote.side === 'PRO') && (
                hasUserProArgument ? (
                  // Show confirmation message if user already posted
                  <div className="bg-green-50 dark:bg-green-950/50 border border-green-200 dark:border-green-800 rounded-lg p-6">
                    <div className="flex items-center gap-3 mb-3">
                      <ThumbsUp className="w-5 h-5 text-green-600" />
                      <h4 className="font-semibold text-green-700 dark:text-green-400">Thank you for your PRO argument!</h4>
                    </div>
                    <p className="text-sm text-green-600 dark:text-green-300 mb-4">
                      You've already shared your supporting perspective on this debate. You can still reply to other arguments to continue the discussion.
                    </p>
                    <Button
                      onClick={() => {
                        const userArg = getUserProArgument();
                        if (userArg) {
                          handleDeleteArgument(userArg.id, 'PRO');
                        }
                      }}
                      variant="outline"
                      size="sm"
                      className="text-red-600 border-red-200 hover:bg-red-50 hover:border-red-300"
                    >
                      Delete My Argument
                    </Button>
                  </div>
                ) : (
                  // Show add argument form if user hasn't posted yet
                  <div className="bg-card border border-green-200 dark:border-green-800 rounded-lg p-6 space-y-4">
                    <h4 className="font-semibold text-green-700 dark:text-green-400">Add PRO Argument</h4>
                    
                    <Textarea
                      value={newProArgument}
                      onChange={(e) => setNewProArgument(e.target.value)}
                      placeholder="Share your supporting reasoning, evidence, or perspective..."
                      rows={4}
                      maxLength={500}
                      disabled={proArgumentLoading}
                      className="border-green-200 dark:border-green-800 focus:border-green-400"
                    />
                    
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-muted-foreground">
                        {newProArgument.length}/500 characters
                      </span>
                      <Button
                        onClick={() => handleAddArgument('PRO')}
                        disabled={proArgumentLoading || !newProArgument.trim()}
                        size="sm"
                        className="bg-green-600 hover:bg-green-700 text-white"
                      >
                        {proArgumentLoading ? (
                          <>
                            <Loader2 className="w-3 h-3 animate-spin mr-2" />
                            Adding...
                          </>
                        ) : (
                          'Add PRO Argument'
                        )}
                      </Button>
                    </div>
                  </div>
                )
              )}
              
              {/* PRO Arguments List */}
              <div className="space-y-4">
                {(() => {
                  const parentArguments = allProArguments.filter(arg => !arg.parentId);
                  if (parentArguments.length === 0) {
                    return (
                      <div className="text-center py-8 text-muted-foreground bg-card border border-border rounded-lg">
                        <ThumbsUp className="w-8 h-8 mx-auto mb-3 opacity-50" />
                        <p className="text-base">No supporting arguments yet.</p>
                        {!currentUserId && (
                          <p className="text-sm">Sign in to be the first to argue PRO!</p>
                        )}
                      </div>
                    );
                  }
                  
                  return parentArguments.map((argument) => {
                    const allReplies = getAllRepliesFlat(argument.id, 'PRO');
                    return (
                      <div key={argument.id} className="space-y-3">
                        <RenderArgument argument={argument} side="PRO" isReply={false} />
                        {allReplies.map((reply) => (
                          <RenderArgument key={reply.id} argument={reply} side="PRO" isReply={true} />
                        ))}
                      </div>
                    );
                  });
                })()}
              </div>
            </div>

            {/* CON Arguments Column */}
            <div className="space-y-6">
              <div className="bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-lg p-6">
                <div className="flex items-center justify-center gap-2 mb-4">
                  <ThumbsDown className="w-6 h-6 text-red-600" />
                  <h2 className="text-xl font-bold text-red-700 dark:text-red-400">CON Arguments</h2>
                </div>
                <div className="text-center text-3xl font-bold text-red-600 mb-2">
                  {stats.conPercentage}%
                </div>
                <div className="text-center text-base text-muted-foreground">
                  {stats.conVotes} votes opposing
                </div>
              </div>

              {/* Add CON Argument Form or Confirmation Message */}
              {currentUserId && (!userVote || userVote.side === 'CON') && (
                hasUserConArgument ? (
                  // Show confirmation message if user already posted
                  <div className="bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800 rounded-lg p-6">
                    <div className="flex items-center gap-3 mb-3">
                      <ThumbsDown className="w-5 h-5 text-red-600" />
                      <h4 className="font-semibold text-red-700 dark:text-red-400">Thank you for your CON argument!</h4>
                    </div>
                    <p className="text-sm text-red-600 dark:text-red-300 mb-4">
                      You've already shared your opposing perspective on this debate. You can still reply to other arguments to continue the discussion.
                    </p>
                    <Button
                      onClick={() => {
                        const userArg = getUserConArgument();
                        if (userArg) {
                          handleDeleteArgument(userArg.id, 'CON');
                        }
                      }}
                      variant="outline"
                      size="sm"
                      className="text-red-600 border-red-200 hover:bg-red-50 hover:border-red-300"
                    >
                      Delete My Argument
                    </Button>
                  </div>
                ) : (
                  // Show add argument form if user hasn't posted yet
                  <div className="bg-card border border-red-200 dark:border-red-800 rounded-lg p-6 space-y-4">
                    <h4 className="font-semibold text-red-700 dark:text-red-400">Add CON Argument</h4>
                    
                    <Textarea
                      value={newConArgument}
                      onChange={(e) => setNewConArgument(e.target.value)}
                      placeholder="Share your opposing reasoning, evidence, or perspective..."
                      rows={4}
                      maxLength={500}
                      disabled={conArgumentLoading}
                      className="border-red-200 dark:border-red-800 focus:border-red-400"
                    />
                    
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-muted-foreground">
                        {newConArgument.length}/500 characters
                      </span>
                      <Button
                        onClick={() => handleAddArgument('CON')}
                        disabled={conArgumentLoading || !newConArgument.trim()}
                        size="sm"
                        className="bg-red-600 hover:bg-red-700 text-white"
                      >
                        {conArgumentLoading ? (
                          <>
                            <Loader2 className="w-3 h-3 animate-spin mr-2" />
                            Adding...
                          </>
                        ) : (
                          'Add CON Argument'
                        )}
                      </Button>
                    </div>
                  </div>
                )
              )}
              
              {/* CON Arguments List */}
              <div className="space-y-4">
                {(() => {
                  const parentArguments = allConArguments.filter(arg => !arg.parentId);
                  if (parentArguments.length === 0) {
                    return (
                      <div className="text-center py-8 text-muted-foreground bg-card border border-border rounded-lg">
                        <ThumbsDown className="w-8 h-8 mx-auto mb-3 opacity-50" />
                        <p className="text-base">No opposing arguments yet.</p>
                        {!currentUserId && (
                          <p className="text-sm">Sign in to be the first to argue CON!</p>
                        )}
                      </div>
                    );
                  }
                  
                  return parentArguments.map((argument) => {
                    const allReplies = getAllRepliesFlat(argument.id, 'CON');
                    return (
                      <div key={argument.id} className="space-y-3">
                        <RenderArgument argument={argument} side="CON" isReply={false} />
                        {allReplies.map((reply) => (
                          <RenderArgument key={reply.id} argument={reply} side="CON" isReply={true} />
                        ))}
                      </div>
                    );
                  });
                })()}
              </div>
            </div>
          </div>
        </div>
      </div>

        </div>
      </div>
    </div>
  );
}