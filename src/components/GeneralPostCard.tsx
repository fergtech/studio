"use client";
import React, { useState } from 'react';
import { GeneralPost } from '@/lib/types';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from "@/components/ui/button";
import { PlusCircle, MessageSquare, Share2, X, Send, Star, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { formatDistanceToNow, parseISO } from 'date-fns';
import { cn } from '@/lib/utils';
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useModal } from "@/context/ModalContext";
import { deletePostAction } from '@/app/actions/postActions';

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
}

export function GeneralPostCard({ post, currentUserId }: GeneralPostCardProps) {
  const { openCreateInitiativeModal } = useModal(); // Use modal context
  // Generate deterministic values based on post ID instead of random numbers
  // This ensures the same values are used on both server and client
  const postIdSum = post.id.split('').reduce((sum, char) => sum + char.charCodeAt(0), 0);
  
  // Replace upvotes/downvotes with interest count
  const [interestCount, setInterestCount] = useState(5 + (postIdSum % 15)); // Values between 5-19
  const [isInterested, setIsInterested] = useState(false);
  const [commentsCount, setCommentsCount] = useState(2 + (postIdSum % 6)); // Values between 2-7
  
  // State for comment view
  const [showComments, setShowComments] = useState(false);
  const [newComment, setNewComment] = useState('');
  
  // Mock comments (in a real app, fetch these from an API)
  // Use fixed timestamps rather than Date.now() which changes on each render
  const commentBaseTime = new Date('2025-04-30T12:00:00Z').getTime();
  
  const [comments, setComments] = useState<Comment[]>([
    {
      id: '1',
      userId: 'user2',
      userName: mockUsers['user2'].name,
      userAvatar: mockUsers['user2'].avatar,
      text: 'Great idea! I would definitely join this initiative.',
      timestamp: new Date(commentBaseTime - 30 * 60 * 1000) // 30 minutes ago
    },
    {
      id: '2',
      userId: 'user3',
      userName: mockUsers['user3'].name,
      userAvatar: mockUsers['user3'].avatar,
      text: 'I\'ve been thinking about something similar. Would love to collaborate!',
      timestamp: new Date(commentBaseTime - 45 * 60 * 1000) // 45 minutes ago
    }
  ]);

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

  // Interest handler
  const handleInterest = () => {
    if (isInterested) {
      setInterestCount(prev => prev - 1);
      setIsInterested(false);
    } else {
      setInterestCount(prev => prev + 1);
      setIsInterested(true);
    }
  };
  
  const handleShare = () => {
    console.log('Share clicked for post:', post.id);
    // In a real implementation, this would open sharing options
    
    // Example: copy link to clipboard
    if (navigator.clipboard) {
      navigator.clipboard.writeText(`https://yoursite.com/posts/${post.id}`)
        .then(() => alert('Link copied to clipboard!'))
        .catch(err => console.error('Failed to copy:', err));
    }
  };

  // Comment handlers
  const handleToggleComments = () => {
    setShowComments(!showComments);
  };
  
  const handleSubmitComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    
    // Add new comment
    const newCommentObj: Comment = {
      id: `temp-${Date.now()}`, // In real app, server would generate ID
      userId: 'currentUser', // In real app, get from auth context
      userName: mockUsers['currentUser'].name, // In real app, get from auth context
      text: newComment,
      timestamp: new Date()
    };
    
    setComments(prev => [newCommentObj, ...prev]);
    setCommentsCount(prev => prev + 1);
    setNewComment('');
  };

  const handleCreateInitiativeFromPost = () => {
    openCreateInitiativeModal(post.content);
  };

  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const handleDelete = async () => {
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
        // The page will revalidate, so no need to manually remove the post from UI here
        // unless you want an immediate optimistic update.
        console.log(result.success);
      }
    } catch (error) {
      console.error("Error in handleDelete:", error);
      setDeleteError("An unexpected error occurred. Please try again.");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className={cn(
      "relative mb-4 rounded-lg overflow-hidden shadow-lg flex flex-col text-card-foreground",
      "aspect-[9/12]"
    )}>
      {/* Background Layer - Always present */}
      <div className="absolute inset-0 bg-cover bg-center z-0" style={backgroundStyle}>
        <div className="absolute inset-0 bg-black/30 z-10"></div>
      </div>

      {/* Content Layer - Always present */}
      <div className="relative z-20 flex flex-col flex-grow p-4">
        {/* Regular Header - Always present */}
        <div className="flex items-center space-x-3 mb-auto">
          <Link href={`/profile/${post.creatorId}`} className="cursor-pointer hover:opacity-80 transition-opacity">
            <Avatar className="h-9 w-9 border-2 border-white/80">
              <AvatarImage src={post.creatorAvatar} alt={post.creatorName} />
              <AvatarFallback>{fallback}</AvatarFallback>
            </Avatar>
          </Link>
          <div>
            <Link href={`/profile/${post.creatorId}`} className="cursor-pointer hover:underline">
              <p className="text-sm font-semibold">{post.creatorName}</p>
            </Link>
            <p className="text-xs opacity-80">{postTime}</p>
          </div>
          {/* Delete Button - Show only to author */}
          {currentUserId && post.creatorId === currentUserId && ( // Changed authorId to creatorId
            <Button
              variant="ghost"
              size="icon"
              onClick={handleDelete}
              disabled={isDeleting}
              className="ml-auto text-destructive-foreground hover:text-destructive hover:bg-destructive/10"
              aria-label="Delete post"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </div>

        {/* Main Content Text - Always present */}
        <div className="my-4">
          <p className="text-lg font-medium whitespace-pre-wrap text-center px-2">{post.content}</p>
        </div>

        {/* Footer Actions - Only show when comments are hidden */}
        {!showComments && (
          <div className="space-y-3 mt-auto pt-3">
            {/* Social Actions Bar */}
            <div className="flex justify-around items-center px-1 py-2 backdrop-blur-sm bg-card/50 rounded-full">
              {/* Interest Button */}
              <button 
                onClick={handleInterest}
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
                onClick={handleToggleComments} 
                className="flex items-center space-x-1 px-3 py-1 rounded-full transition-all duration-200 group"
                aria-label="Comment"
              >
                <MessageSquare className="h-4 w-4 text-muted-foreground group-hover:text-primary group-hover:scale-110 transition-all" />
                <span className="text-xs font-medium text-muted-foreground group-hover:text-primary transition-colors">{commentsCount}</span>
              </button>
              
              <div className="h-4 w-px bg-border/50"></div>
              
              {/* Share Button */}
              <button 
                onClick={handleShare} 
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
                onClick={handleCreateInitiativeFromPost} // Call context function
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
              <Link href={`/profile/${post.creatorId}`} className="cursor-pointer hover:opacity-80 transition-opacity">
                <Avatar className="h-7 w-7">
                  <AvatarImage src={post.creatorAvatar} alt={post.creatorName} />
                  <AvatarFallback>{fallback}</AvatarFallback>
                </Avatar>
              </Link>
              <div className="truncate">
                <Link href={`/profile/${post.creatorId}`} className="cursor-pointer hover:underline">
                  <p className="text-sm font-medium truncate">{post.creatorName}</p>
                </Link>
                <p className="text-xs truncate opacity-70">{post.content.substring(0, 60)}...</p>
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
                    <Link href={`/profile/${comment.userId}`} className="cursor-pointer hover:opacity-80 transition-opacity">
                      <Avatar className="h-8 w-8 flex-shrink-0">
                        <AvatarImage src={comment.userAvatar} alt={comment.userName} />
                        <AvatarFallback>{comment.userName.substring(0, 2).toUpperCase()}</AvatarFallback>
                      </Avatar>
                    </Link>
                    <div className="flex-grow">
                      <div className="flex items-baseline space-x-2">
                        <Link href={`/profile/${comment.userId}`} className="cursor-pointer hover:underline">
                          <p className="text-sm font-medium">{comment.userName}</p>
                        </Link>
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
                rows={1} // Start with 1 row, auto-expands slightly
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
    </div>
  );
}
