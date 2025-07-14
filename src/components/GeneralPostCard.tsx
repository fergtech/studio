"use client";
import React, { useState, useEffect } from 'react';
import { GeneralPost } from '@/lib/types';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from "@/components/ui/button";
import { PlusCircle, MessageSquare, Share2, X, Send, Star, Trash2, Play, Pause } from 'lucide-react';
import Link from 'next/link';
import { formatDistanceToNow, parseISO } from 'date-fns';
import { cn } from '@/lib/utils';
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useModal } from "@/context/ModalContext";
import { deletePostAction, updateGeneralPostContent } from '@/app/actions/postActions';
import { ShareModal } from './ShareModal';

// Mock comment data (in a real app, this would come from the database)
interface Comment {
  id: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  text: string;
  timestamp: Date;
}

// Mock User Profile Data (Simplified) - Needed for comment avatars/names
const mockUsers: Record<string, { name: string; avatar?: string }> = {
  "user1": { name: "Alice" , avatar: "https://i.pravatar.cc/40?u=user1"},
  "user2": { name: "Bob" },
  "user3": { name: "Charlie", avatar: "https://i.pravatar.cc/40?u=user3" },
  "user4": { name: "Diana" },
  "user5": { name: "Eve", avatar: "https://i.pravatar.cc/40?u=user5" },
  "user6": { name: "Faythe" },
  "user7": { name: "Grace", avatar: "https://i.pravatar.cc/40?u=user7" },
  "user8": { name: "Frank" },
  "currentUser": { name: "You" }, // Placeholder for the current user
};

interface GeneralPostCardProps {
  post: GeneralPost;
  currentUserId?: string; // Added currentUserId prop
  onPostDeleted?: (postId: string) => void; // New prop
}

export function GeneralPostCard({ post, currentUserId, onPostDeleted }: GeneralPostCardProps) {
  const { openCreateInitiativeModal } = useModal(); // Use modal context
  // Generate deterministic values based on post ID instead of random numbers
  // This ensures the same values are used on both server and client
  const postIdSum = post.id.split('').reduce((sum, char) => sum + char.charCodeAt(0), 0);
  
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

  // Add state and handler at the top of the component
  const [editMode, setEditMode] = useState(false);
  const [editContent, setEditContent] = useState(post.content);
  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editContent.trim() && editContent !== post.content) {
      const result = await updateGeneralPostContent(post.id, editContent);
      if (result.success) {
        setEditMode(false);
        // Optionally, trigger a re-fetch or update the post content in state
        window.location.reload(); // Simple way to refresh
      } else {
        alert(result.error || 'Failed to update post');
      }
    } else {
      setEditMode(false);
    }
  };

  // Fetch likes, shares, and comments count on mount
  useEffect(() => {
    async function fetchSocialData() {
      // Likes
      const likeRes = await fetch(`/api/general-posts/likes?postId=${post.id}&userId=${currentUserId || ''}`);
      const likeData = await likeRes.json();
      setInterestCount(likeData.count || 0);
      setIsInterested(likeData.liked || false);
      // Shares
      const shareRes = await fetch(`/api/general-posts/shares?postId=${post.id}&userId=${currentUserId || ''}`);
      const shareData = await shareRes.json();
      setShareCount(shareData.count || 0);
      setHasShared(shareData.shared || false);
      // Comments count
      const commentRes = await fetch(`/api/general-posts/comments?postId=${post.id}`);
      const commentData = await commentRes.json();
      setCommentsCount(Array.isArray(commentData) ? commentData.length : 0);
    }
    fetchSocialData();
  }, [post.id, currentUserId]);

  // Fetch comments when comments are shown
  useEffect(() => {
    if (showComments) {
      setLoadingComments(true);
      fetch(`/api/general-posts/comments?postId=${post.id}`)
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
  }, [showComments, post.id]);

  // Existing post logic
  const fallback = post.creatorName?.substring(0, 2).toUpperCase() || '??';
  
  // Handle both Timestamp objects (with toDate method) and ISO strings
  const postTime = post.timestamp ? 
    formatDistanceToNow(
      typeof post.timestamp === 'string' 
        ? parseISO(post.timestamp)
        : post.timestamp, // Removed .toDate() as post.timestamp is already a Date
      { addSuffix: true }
    ) : 'Just now';
  
  const hasMedia = post.media && post.media.length > 0 && post.media[0].type === 'image';
  const backgroundStyle = hasMedia
    ? { backgroundImage: `url(${post.media![0].url})` }
    : { background: post.background || 'linear-gradient(to right, #6a11cb, #2575fc)' };

  // Like/Unlike
  const handleInterest = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!currentUserId) return;
    if (isInterested) {
      await fetch('/api/general-posts/likes', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ postId: post.id, userId: currentUserId })
      });
      setInterestCount(c => Math.max(0, c - 1));
      setIsInterested(false);
    } else {
      await fetch('/api/general-posts/likes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ postId: post.id, userId: currentUserId })
      });
      setInterestCount(c => c + 1);
      setIsInterested(true);
    }
  };
  
  // Share/Unshare
  const handleShare = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!currentUserId) return;
    if (hasShared) {
      await fetch('/api/general-posts/shares', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ postId: post.id, userId: currentUserId })
      });
      setShareCount(c => Math.max(0, c - 1));
      setHasShared(false);
    } else {
      await fetch('/api/general-posts/shares', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ postId: post.id, userId: currentUserId })
      });
      setShareCount(c => c + 1);
      setHasShared(true);
    }
    setIsShareModalOpen(true);
  };

  // Comment handlers
  const handleToggleComments = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setShowComments(!showComments);
  };
  
  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || !currentUserId) return;
    const res = await fetch('/api/general-posts/comments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ postId: post.id, userId: currentUserId, text: newComment })
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

  const handleCreateInitiativeFromPost = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    openCreateInitiativeModal(post.content);
  };

  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const handleDelete = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!currentUserId || post.creatorId !== currentUserId) { // Changed authorId to creatorId
      setDeleteError("You are not authorized to delete this post.");
      return;
    }

    // Optional: Add a confirmation dialog
    if (!confirm("Are you sure you want to delete this post? This action cannot be undone.")) {
      return;
    }

    setIsDeleting(true);
    setDeleteError(null);
    try {
      const result = await deletePostAction(post.id);
      if (result.error) {
        setDeleteError(result.error);
      } else {
        // Post was deleted successfully.
        if (onPostDeleted) onPostDeleted(post.id);
      }
    } catch (error) {
      console.error("Error in handleDelete:", error);
      setDeleteError("An unexpected error occurred. Please try again.");
    } finally {
      setIsDeleting(false);
    }
  };

  // Video play/pause state for custom control
  const [isVideoPlaying, setIsVideoPlaying] = useState(true);
  const [isVideoMuted, setIsVideoMuted] = useState(true); // New state for mute
  const videoRef = React.useRef<HTMLVideoElement>(null);

  const handleVideoToggle = () => {
    if (!videoRef.current) return;
    if (videoRef.current.paused) {
      videoRef.current.play();
      setIsVideoPlaying(true);
    } else {
      videoRef.current.pause();
      setIsVideoPlaying(false);
    }
  };

  const handleMuteToggle = (e: React.MouseEvent) => {
    e.preventDefault(); // Prevent navigation
    e.stopPropagation(); // Prevent triggering play/pause
    setIsVideoMuted((prev) => {
      const newMuted = !prev;
      if (videoRef.current) {
        videoRef.current.muted = newMuted;
      }
      return newMuted;
    });
  };

  // Add a handler to save scroll position before navigating to detail page
  const handlePostClick = () => {
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('feedScrollPosition', window.scrollY.toString());
    }
  };

  return (
    <div 
      className={cn(
        "relative mb-4 rounded-lg overflow-hidden shadow-lg flex flex-col text-card-foreground cursor-pointer",
        "aspect-[9/12] hover:ring-2 hover:ring-primary/60 transition group"
      )}
      onClick={(e) => {
        // Check if clicking on interactive elements
        const target = e.target as HTMLElement;
        const isInteractiveElement = target.closest('button, a, textarea, input, [role="button"]');
        
        if (!isInteractiveElement) {
          handlePostClick();
          window.location.href = `/posts/${post.id}`;
        }
      }}
    >
      {/* Post Type Badge */}
      <div className="absolute top-3 right-3 z-30">
        <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-blue-500 text-white shadow">General</span>
      </div>

      {/* Background Layer - Always present, but skip if video is present */}
      {!(post.media && post.media.length > 0 && post.media[0].type === 'video') && (
        <div className="absolute inset-0 bg-cover bg-center z-0" style={backgroundStyle}>
          <div className="absolute inset-0 bg-black/30 z-10"></div>
        </div>
      )}

      {/* Video Cover Layer - SIMPLIFIED */}
      {post.media && post.media.length > 0 && post.media[0].type === 'video' && (
        <div className="absolute inset-0 z-0">
          <video
            ref={videoRef}
            src={post.media[0].url}
            className="w-full h-full object-cover rounded-none"
            style={{ 
              maxHeight: '100%',
              pointerEvents: 'none' // Video won't capture any events
            }}
            autoPlay
            muted={true}
            loop
            playsInline
            onPlay={() => setIsVideoPlaying(true)}
            onPause={() => setIsVideoPlaying(false)}
          />
        </div>
      )}

      {/* Content Layer - Always present */}
      <div className="relative z-20 flex flex-col flex-grow p-4">
        {/* Regular Header - Always present */}
        <div className="flex items-center space-x-3 mb-auto">
          <div 
            onClick={(e) => {
              e.stopPropagation(); // Prevent card click
              window.location.href = `/profile/${post.creatorId}`;
            }}
            className="cursor-pointer hover:opacity-80 transition-opacity"
          >
            <Avatar className="h-9 w-9 border-2 border-white/80">
              <AvatarImage src={post.creatorAvatar} alt={post.creatorName} />
              <AvatarFallback>{fallback}</AvatarFallback>
            </Avatar>
          </div>
          <div>
            <div 
              onClick={(e) => {
                e.stopPropagation(); // Prevent card click
                window.location.href = `/profile/${post.creatorId}`;
              }}
              className="cursor-pointer hover:underline"
            >
              <p className="text-sm font-semibold">{post.creatorName}</p>
            </div>
            <p className="text-xs opacity-80">{postTime}</p>
          </div>
          {/* Delete Button - Show only to author */}
          {currentUserId && post.creatorId === currentUserId && (
            <Button
              variant="ghost"
              size="icon"
              onClick={(e) => {
                e.stopPropagation(); // Prevent card click
                handleDelete(e);
              }}
              disabled={isDeleting}
              className="ml-auto text-destructive-foreground hover:text-destructive hover:bg-destructive/10"
              aria-label="Delete post"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </div>

        {/* Main Content Text - Always above social bar, not absolutely positioned */}
        <div className="mb-2">
          <p className="text-base font-medium whitespace-pre-wrap text-left px-2 bg-black/40 rounded-md py-1 w-fit max-w-full text-white" style={{marginLeft: 0}}>{post.content}</p>
        </div>

        {/* Footer Actions - Only show when comments are hidden */}
        {!showComments && (
          <div className="space-y-3 pt-1">
            {/* Social Actions Bar */}
            <div className="flex justify-around items-center px-1 py-2 backdrop-blur-sm bg-card/50 rounded-full">
              {/* Interest Button */}
              <button 
                onClick={(e) => {
                  e.stopPropagation(); // Prevent card click
                  handleInterest(e);
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
                  e.stopPropagation(); // Prevent card click
                  handleToggleComments(e);
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
                  e.stopPropagation(); // Prevent card click
                  handleShare(e);
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
                  e.stopPropagation(); // Prevent card click
                  handleCreateInitiativeFromPost(e);
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
                  e.stopPropagation();
                  window.location.href = `/profile/${post.creatorId}`;
                }}
                className="cursor-pointer hover:opacity-80 transition-opacity"
              >
                <Avatar className="h-7 w-7">
                  <AvatarImage src={post.creatorAvatar} alt={post.creatorName} />
                  <AvatarFallback>{fallback}</AvatarFallback>
                </Avatar>
              </div>
              <div className="truncate">
                <div 
                  onClick={(e) => {
                    e.stopPropagation();
                    window.location.href = `/profile/${post.creatorId}`;
                  }}
                  className="cursor-pointer hover:underline"
                >
                  <p className="text-sm font-medium truncate">{post.creatorName}</p>
                </div>
                <p className="text-xs truncate opacity-70">{post.content.substring(0, 60)}...</p>
              </div>
            </div>
            <button 
              onClick={(e) => {
                e.stopPropagation();
                handleToggleComments(e);
              }}
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
                        e.stopPropagation();
                        window.location.href = `/profile/${comment.userId}`;
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
                        <div 
                          onClick={(e) => {
                            e.stopPropagation();
                            window.location.href = `/profile/${comment.userId}`;
                          }}
                          className="cursor-pointer hover:underline"
                        >
                          <p className="text-sm font-medium">{comment.userName}</p>
                        </div>
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
            <form 
              onSubmit={(e) => {
                e.stopPropagation();
                handleSubmitComment(e);
              }} 
              className="flex space-x-2"
            >
              <Textarea 
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Write a comment..."
                className="min-h-[40px] max-h-[100px] resize-none flex-grow bg-background/50"
                rows={1}
                onClick={(e) => e.stopPropagation()}
              />
              <Button 
                type="submit" 
                size="icon" 
                disabled={!newComment.trim()}
                className="self-end h-9 w-9 flex-shrink-0"
                onClick={(e) => e.stopPropagation()}
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
        url={`https://yoursite.com/posts/${post.id}`}
        title="Share Post"
        defaultMessage={`Check out this post: ${post.content}`}
      />
    </div>
  );
}
