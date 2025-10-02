"use client";
import React, { useState, useEffect } from 'react';
import { Idea } from '@/lib/types';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from "@/components/ui/button";
import { PlusCircle, MessageSquare, Share2, X, Send, Star, Trash2, MapPin } from 'lucide-react';
import Link from 'next/link';
import { formatDistanceToNow, parseISO } from 'date-fns';
import { cn } from '@/lib/utils';
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useModal } from "@/context/ModalContext";
import { ShareModal } from './ShareModal';
import { deleteIdea } from '@/app/actions/ideaActions';
import { saveScrollPositionForKey } from '@/hooks/useScrollPosition';
import { useRouter } from 'next/navigation';
import { createNavigationHandler } from '@/utils/navigation';

// Helper function to safely parse and display location
const getLocationDisplay = (location: string | null | undefined): string | null => {
  if (!location) return null;

  try {
    // Try to parse as JSON in case it's stored as object
    const parsed = JSON.parse(location);
    // If it has a name property, use that
    if (parsed.name) return parsed.name;
    // If it has address, use that
    if (parsed.address) return parsed.address;
    // Otherwise return null to hide it
    return null;
  } catch {
    // If it's not JSON, it's already a string, return it
    return location;
  }
};

// Mock comment data (in a real app, this would come from the database)
interface Comment {
  id: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  text: string;
  timestamp: Date;
}

interface IdeaCardProps {
  idea: Idea;
  currentUserId?: string;
  onIdeaDeleted?: (ideaId: string) => void;
}

export function IdeaCard({ idea, currentUserId, onIdeaDeleted }: IdeaCardProps) {
  const { openCreateInitiativeModal } = useModal();
  const router = useRouter();
  const navigationHandler = createNavigationHandler(router);
  
  // --- Likes ---
  const [interestCount, setInterestCount] = useState(0);
  const [isInterested, setIsInterested] = useState(false);
  // --- Shares ---
  const [shareCount, setShareCount] = useState(0);
  const [hasShared, setHasShared] = useState(false);
  // --- Comments ---
  const [commentsCount, setCommentsCount] = useState(0);
  const [comments, setComments] = useState<Comment[]>([]);
  const [showComments, setShowComments] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [loadingComments, setLoadingComments] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);

  // Add state and handler for editing
  const [editMode, setEditMode] = useState(false);
  const [editTitle, setEditTitle] = useState(idea.title);
  const [editDescription, setEditDescription] = useState(idea.description);
  
  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editTitle.trim() && editDescription.trim() && 
        (editTitle !== idea.title || editDescription !== idea.description)) {
      // TODO: Implement update functionality
      console.log("Update idea:", idea.id, editTitle, editDescription);
      setEditMode(false);
    } else {
      setEditMode(false);
    }
  };

  // Fetch likes, shares, and comments count on mount
  useEffect(() => {
    async function fetchSocialData() {
      // Likes
      const likeRes = await fetch(`/api/ideas/likes?ideaId=${idea.id}&userId=${currentUserId || ''}`);
      const likeData = await likeRes.json();
      setInterestCount(likeData.count || 0);
      setIsInterested(likeData.liked || false);
      // Shares
      const shareRes = await fetch(`/api/ideas/shares?ideaId=${idea.id}&userId=${currentUserId || ''}`);
      const shareData = await shareRes.json();
      setShareCount(shareData.count || 0);
      setHasShared(shareData.shared || false);
      // Comments count
      const commentRes = await fetch(`/api/ideas/comments?ideaId=${idea.id}`);
      const commentData = await commentRes.json();
      setCommentsCount(Array.isArray(commentData) ? commentData.length : 0);
    }
    fetchSocialData();
  }, [idea.id, currentUserId]);

  // Fetch comments when comments are shown
  useEffect(() => {
    if (showComments) {
      setLoadingComments(true);
      fetch(`/api/ideas/comments?ideaId=${idea.id}`)
        .then(res => res.json())
        .then(data => {
          setComments(Array.isArray(data) ? data.map((c: any) => ({
            id: c.id,
            userId: c.userId,
            userName: c.user?.name || 'Unknown',
            userAvatar: c.user?.image || undefined,
            text: c.text,
            timestamp: new Date(c.timestamp)
          })) : []);
          setCommentsCount(Array.isArray(data) ? data.length : 0);
        })
        .finally(() => setLoadingComments(false));
    }
  }, [showComments, idea.id]);

  // Existing idea logic
  const fallback = idea.creator?.name?.substring(0, 2).toUpperCase() || '??';
  
  // Handle both Timestamp objects (with toDate method) and ISO strings
  const ideaTime = idea.createdAt ? 
    formatDistanceToNow(
      typeof idea.createdAt === 'string' 
        ? parseISO(idea.createdAt)
        : idea.createdAt,
      { addSuffix: true }
    ) : 'Just now';
  
  const hasMedia = idea.media && idea.media.length > 0 && idea.media[0].type === 'image';
  const backgroundStyle = hasMedia
    ? { backgroundImage: `url(${idea.media![0].url})` }
    : { background: 'linear-gradient(to right, #4ecdc4, #44a08d)' };

  // Like/Unlike
  const handleInterest = async () => {
    if (!currentUserId) return;
    if (isInterested) {
      await fetch('/api/ideas/likes', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ideaId: idea.id, userId: currentUserId })
      });
      setInterestCount(c => Math.max(0, c - 1));
      setIsInterested(false);
    } else {
      await fetch('/api/ideas/likes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ideaId: idea.id, userId: currentUserId })
      });
      setInterestCount(c => c + 1);
      setIsInterested(true);
    }
  };
  
  // Share/Unshare
  const handleShare = async () => {
    if (!currentUserId) return;
    if (hasShared) {
      await fetch('/api/ideas/shares', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ideaId: idea.id, userId: currentUserId })
      });
      setShareCount(c => Math.max(0, c - 1));
      setHasShared(false);
    } else {
      await fetch('/api/ideas/shares', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ideaId: idea.id, userId: currentUserId })
      });
      setShareCount(c => c + 1);
      setHasShared(true);
    }
    setIsShareModalOpen(true);
  };

  // Comment handlers
  const handleToggleComments = () => {
    setShowComments(!showComments);
  };
  
  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || !currentUserId) return;
    const res = await fetch('/api/ideas/comments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ideaId: idea.id, userId: currentUserId, text: newComment })
    });
    if (res.ok) {
      const comment = await res.json();
      setComments(prev => [{
        id: comment.id,
        userId: comment.userId,
        userName: comment.user?.name || 'Unknown',
        userAvatar: comment.user?.image || undefined,
        text: comment.text,
        timestamp: new Date(comment.timestamp)
      }, ...prev]);
      setCommentsCount(c => c + 1);
      setNewComment('');
    }
  };

  const handleCreateInitiativeFromIdea = () => {
    const imageUrl = idea.media && idea.media.length > 0 ? idea.media[0].url : undefined;
    openCreateInitiativeModal(idea.title, idea.description, imageUrl, undefined, idea.id);
  };

  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const handleDelete = async () => {
    if (!currentUserId || idea.creatorId !== currentUserId) {
      setDeleteError("You are not authorized to delete this idea.");
      return;
    }
    if (!confirm("Are you sure you want to delete this idea? This action cannot be undone.")) {
      return;
    }
    setIsDeleting(true);
    setDeleteError(null);
    try {
      const result = await deleteIdea(idea.id);
      if (result.success) {
        if (onIdeaDeleted) onIdeaDeleted(idea.id);
      } else {
        setDeleteError(result.error || "Failed to delete idea.");
      }
    } catch (error) {
      console.error("Error in handleDelete:", error);
      setDeleteError("An unexpected error occurred. Please try again.");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div
      onClick={(e) => {
        // Only navigate if not clicking interactive elements
        if (!e.target || !(e.target as HTMLElement).closest('button, [role="button"], input, textarea')) {
          navigationHandler.handleIdeaClick(idea.id);
        }
      }}
      className={cn(
        "relative mb-4 rounded-lg overflow-hidden shadow-lg flex flex-col text-card-foreground cursor-pointer hover:shadow-xl transition-shadow",
        "aspect-[9/12]"
      )}
    >
      {/* Post Type Badge */}
      <div className="absolute top-3 right-3 z-30">
        <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-yellow-500 text-white shadow">Idea</span>
      </div>
      {/* Background Layer - Always present */}
      <div className="absolute inset-0 bg-cover bg-center z-0" style={backgroundStyle}>
        <div className="absolute inset-0 bg-black/30 z-10"></div>
      </div>

      {/* Content Layer - Always present */}
      <div className="relative z-20 flex flex-col flex-grow p-4">
        {/* Regular Header - Always present */}
        <div className="flex items-center space-x-3 mb-auto">
          <div 
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              navigationHandler.handleProfileClick(idea.creatorId);
            }}
            className="cursor-pointer hover:opacity-80 transition-opacity"
          >
            <Avatar className="h-9 w-9 border-2 border-white/80">
              <AvatarImage src={idea.creator?.image || undefined} alt={idea.creator?.name || undefined} />
              <AvatarFallback>{fallback}</AvatarFallback>
            </Avatar>
          </div>
          <div>
            <p 
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                navigationHandler.handleProfileClick(idea.creatorId);
              }}
              className="text-sm font-semibold cursor-pointer hover:underline"
            >
              {idea.creator?.name}
            </p>
            <p className="text-xs opacity-80">{ideaTime}</p>
            {idea.location && (
              <div className="flex items-center gap-1 mt-0.5">
                <MapPin className="h-3 w-3 opacity-60" />
                <p className="text-xs opacity-80 truncate">{getLocationDisplay(idea.location)}</p>
              </div>
            )}
          </div>
          {/* Delete Button - Show only to author */}
          {currentUserId && idea.creatorId === currentUserId && (
            <Button
              variant="ghost"
              size="icon"
              onClick={handleDelete}
              disabled={isDeleting}
              className="ml-auto text-destructive-foreground hover:text-destructive hover:bg-destructive/10"
              aria-label="Delete idea"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </div>

        {/* Main Content Text - Move to bottom, now editable if user is creator */}
        <div className="mt-auto mb-2 flex items-end gap-2">
          {currentUserId && idea.creatorId === currentUserId && !showComments ? (
            editMode ? (
              <form onSubmit={handleEditSubmit} className="flex items-end gap-2 w-full">
                <div className="flex-grow">
                  <input
                    type="text"
                    value={editTitle}
                    onChange={e => setEditTitle(e.target.value)}
                    className="text-base font-medium whitespace-pre-wrap px-2 bg-black/40 rounded-md py-1 w-full max-w-full border border-border mb-2"
                    placeholder="Idea title"
                    autoFocus
                  />
                  <textarea
                    value={editDescription}
                    onChange={e => setEditDescription(e.target.value)}
                    className="text-sm whitespace-pre-wrap px-2 bg-black/40 rounded-md py-1 w-full max-w-full border border-border"
                    placeholder="Idea description"
                    rows={2}
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <Button type="submit" size="sm" className="h-7 px-2">Save</Button>
                  <Button type="button" size="sm" variant="ghost" className="h-7 px-2" onClick={() => setEditMode(false)}>Cancel</Button>
                </div>
              </form>
            ) : (
              <>
                <div className="flex-grow">
                  <p className="text-base font-medium whitespace-pre-wrap text-left px-2 bg-black/40 rounded-md py-1 w-fit max-w-full mb-1">{idea.title}</p>
                  <p 
                    className="text-sm whitespace-pre-wrap text-left px-2 bg-black/40 rounded-md py-1 w-fit max-w-full"
                    title={idea.description.length > 150 ? idea.description : undefined}
                  >
                    {idea.description.length > 150 ? `${idea.description.substring(0, 150)}...` : idea.description}
                  </p>
                </div>
                <Button size="icon" variant="ghost" className="h-7 w-7 ml-1" onClick={() => { setEditTitle(idea.title); setEditDescription(idea.description); setEditMode(true); }} aria-label="Edit idea"><svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M15.232 5.232l3.536 3.536M9 13l6.586-6.586a2 2 0 112.828 2.828L11.828 15.828a2 2 0 01-2.828 0L9 13zm-6 6h6v-2H5v-2H3v4z"/></svg></Button>
              </>
            )
          ) : (
            <div className="flex-grow">
              <p className="text-base font-medium whitespace-pre-wrap text-left px-2 bg-black/40 rounded-md py-1 w-fit max-w-full mb-1">{idea.title}</p>
              <p 
                className="text-sm whitespace-pre-wrap text-left px-2 bg-black/40 rounded-md py-1 w-fit max-w-full"
                title={idea.description.length > 150 ? idea.description : undefined}
              >
                {idea.description.length > 150 ? `${idea.description.substring(0, 150)}...` : idea.description}
              </p>
            </div>
          )}
        </div>

        {/* Footer Actions - Only show when comments are hidden */}
        {!showComments && (
          <div className="space-y-3 pt-1">
            {/* Social Actions Bar */}
            <div className="flex justify-around items-center px-1 py-2 backdrop-blur-sm bg-card/50 rounded-full">
              {/* Interest Button */}
              <button 
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  handleInterest();
                }}
                className="flex items-center space-x-1 px-3 py-1 rounded-full transition-all duration-200 group"
                aria-label="Interest"
              >
                <Star className={cn(
                  "h-4 w-4 transition-all", 
                  isInterested 
                    ? "text-primary fill-primary scale-110" 
                    : "text-muted-foreground group-hover:text-primary group-hover:scale-110"
                )} />
                <span className={cn(
                  "text-xs font-medium transition-colors",
                  isInterested ? "text-primary" : "text-muted-foreground group-hover:text-primary"
                )}>{interestCount}</span>
              </button>
              
              <div className="h-4 w-px bg-border/50"></div>
              
              {/* Comment Button - Toggles overlay */}
              <button 
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  handleToggleComments();
                }} 
                className="flex items-center space-x-1 px-3 py-1 rounded-full transition-all duration-200 group"
                aria-label="Comment"
              >
                <MessageSquare className="h-4 w-4 text-muted-foreground group-hover:text-primary group-hover:scale-110 transition-all" />
                <span className="text-xs font-medium text-muted-foreground group-hover:text-primary transition-colors">{commentsCount}</span>
              </button>
              
              <div className="h-4 w-px bg-border/50"></div>
              
              {/* Share Button */}
              <button 
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  handleShare();
                }} 
                className="flex items-center space-x-1 px-3 py-1 rounded-full transition-all duration-200 group"
                aria-label="Share"
              >
                <Share2 className="h-4 w-4 text-muted-foreground group-hover:text-primary group-hover:scale-110 transition-all" />
                <span className="text-xs font-medium text-muted-foreground group-hover:text-primary transition-colors">Share</span>
              </button>
            </div>
            
            {/* Create Initiative Button */}
            <div className="flex justify-center">
              <Button 
                variant="outline" 
                size="sm" 
                className="text-xs w-full"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  handleCreateInitiativeFromIdea();
                }}
              >
                <PlusCircle className="mr-1 h-3.5 w-3.5" />
                Create Initiative
              </Button>
            </div>
            {deleteError && <p className="text-xs text-destructive text-center mt-2">{deleteError}</p>}
          </div>
        )}
      </div>

      {/* Comments Overlay - Conditionally rendered on top */}
      {showComments && (
        <div className="absolute inset-0 z-30 flex flex-col bg-card/90 backdrop-blur-sm text-card-foreground overflow-hidden">
          {/* Compact Header for Comment Mode */}
          <div className="flex items-center justify-between p-3 border-b bg-card/95 flex-shrink-0">
            <div className="flex items-center space-x-2 overflow-hidden">
              <div 
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  saveScrollPositionForKey('homeFeed');
              window.location.href = `/profile/${idea.creatorId}`;
                }}
                className="cursor-pointer hover:opacity-80 transition-opacity"
              >
                <Avatar className="h-7 w-7">
                  <AvatarImage src={idea.creator?.image || undefined} alt={idea.creator?.name || undefined} />
                  <AvatarFallback>{fallback}</AvatarFallback>
                </Avatar>
              </div>
              <div className="truncate">
                <p 
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    navigationHandler.handleProfileClick(idea.creatorId);
                  }}
                  className="text-sm font-medium truncate cursor-pointer hover:underline"
                >
                  {idea.creator?.name}
                </p>
                <p className="text-xs truncate opacity-70">{idea.title.substring(0, 60)}...</p>
                {idea.location && (
                  <div className="flex items-center gap-1 mt-0.5">
                    <MapPin className="h-2.5 w-2.5 opacity-60" />
                    <p className="text-xs opacity-70 truncate">{getLocationDisplay(idea.location)}</p>
                  </div>
                )}
              </div>
            </div>
            <button 
              onClick={handleToggleComments}
              className="text-muted-foreground hover:text-foreground p-1 rounded-full"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Comments list - Takes remaining space */}
          <ScrollArea className="flex-grow p-3">
            {comments.length > 0 ? (
              <div className="space-y-4">
                {comments.map(comment => (
                  <div key={comment.id} className="flex space-x-3">
                    <div 
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        navigationHandler.handleProfileClick(comment.userId);
                      }}
                      className="cursor-pointer hover:opacity-80 transition-opacity"
                    >
                      <Avatar className="h-8 w-8 flex-shrink-0">
                        <AvatarImage src={comment.userAvatar} alt={comment.userName} />
                        <AvatarFallback>{comment.userName.substring(0, 2).toUpperCase()}</AvatarFallback>
                      </Avatar>
                    </div>
                    <div className="flex-grow">
                      <div className="flex items-baseline space-x-2">
                        <p 
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            navigationHandler.handleProfileClick(comment.userId);
                          }}
                          className="text-sm font-medium cursor-pointer hover:underline"
                        >
                          {comment.userName}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {formatDistanceToNow(comment.timestamp, { addSuffix: true })}
                        </p>
                      </div>
                      <p className="text-sm mt-1">{comment.text}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex items-center justify-center h-full">
                <p className="text-sm text-muted-foreground">No comments yet. Be the first!</p>
              </div>
            )}
          </ScrollArea>
          
          {/* Comment form - Sticks to bottom */}
          <div className="p-3 border-t bg-card/95 flex-shrink-0">
            <form onSubmit={handleSubmitComment} className="flex space-x-2">
              <Textarea 
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Write a comment..."
                className="min-h-[40px] max-h-[100px] resize-none flex-grow bg-background/50"
                rows={1}
              />
              <Button 
                type="submit" 
                size="icon" 
                disabled={!newComment.trim()}
                className="self-end h-9 w-9 flex-shrink-0"
              >
                <Send className="h-4 w-4" />
              </Button>
            </form>
          </div>
        </div>
      )}

      <ShareModal
        open={isShareModalOpen}
        onOpenChange={setIsShareModalOpen}
        url={`https://yoursite.com/ideas/${idea.id}`}
        title="Share Idea"
        defaultMessage={`Check out this idea: ${idea.title}`}
      />
    </div>
  );
} 
