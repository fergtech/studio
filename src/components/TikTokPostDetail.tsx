'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, PanInfo } from 'framer-motion';
import { useSession } from 'next-auth/react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Heart,
  MessageCircle,
  Share,
  X,
  Send,
  MoreHorizontal,
  Volume2,
  VolumeX,
  ChevronUp,
  ChevronDown
} from 'lucide-react';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { useRouter } from 'next/navigation';
import { usePostStats } from '@/context/PostStatsContext';
import { ExpandableTextModal } from '@/components/ui/expandable-text';
import { ContextBadge } from '@/components/ui/context-badge';

interface PostUser {
  id: string;
  name: string;
  username: string;
  image?: string;
}

interface PostComment {
  id: string;
  content: string;
  createdAt: string;
  user: PostUser;
}

interface TikTokPost {
  id: string;
  content: string;
  title?: string;
  type: 'general' | 'issue' | 'idea';
  mediaUrl?: string;
  mediaType?: string;
  userId: string;
  user: PostUser;
  createdAt: string;
  likes: number;
  comments: PostComment[];
  shares: number;
  isLiked?: boolean;
  isShared?: boolean;
  linkedInitiativeId?: string;
  society?: {
    id: string;
    name: string;
  } | null;
  initiative?: {
    id: string;
    name: string;
  } | null;
}

interface TikTokPostDetailProps {
  post: TikTokPost;
  isOpen: boolean;
  onClose: () => void;
  onNavigatePost?: (direction: 'up' | 'down') => void;
  showNavigation?: boolean;
}

export function TikTokPostDetail({ 
  post, 
  isOpen, 
  onClose, 
  onNavigatePost,
  showNavigation = false
}: TikTokPostDetailProps) {
  const [showComments, setShowComments] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [isMuted, setIsMuted] = useState(true);
  const [comments, setComments] = useState<PostComment[]>(post.comments || []);
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const router = useRouter();
  const { data: session } = useSession();

  // Use batch stats context for like state
  const { getStats, registerPost, updateLike: updateLikeInContext } = usePostStats();

  // Register post and get stats from context
  useEffect(() => {
    if (post.id) {
      registerPost(post.id);
    }
  }, [post.id, registerPost]);

  // Get current like stats from context
  const stats = getStats(post.id);
  const likes = stats?.likes.count || post.likes || 0;
  const isLiked = stats?.likes.liked || false;

  // Helper function to check if URL is a video
  const isVideoFile = (url: string): boolean => {
    if (!url || typeof url !== 'string') return false;
    const videoExtensions = ['.mp4', '.webm', '.ogg', '.mov', '.avi'];
    return videoExtensions.some(ext => url.toLowerCase().includes(ext));
  };

  const isVideo = post.mediaUrl ? isVideoFile(post.mediaUrl) : false;

  // Auto-play video when modal opens
  useEffect(() => {
    if (isOpen && videoRef.current && isVideo) {
      videoRef.current.play().catch(() => {
        // Handle autoplay failure
      });
    }
  }, [isOpen, isVideo]);

  // Load comments when modal opens
  useEffect(() => {
    if (isOpen && post.id) {
      loadComments();
    }
  }, [isOpen, post.id]);

  // Load comments from API
  const loadComments = async () => {
    try {
      const response = await fetch(`/api/general-posts/comments?postId=${post.id}`);
      if (response.ok) {
        const data = await response.json();
        // Convert API comment format to our interface
        const formattedComments: PostComment[] = data.allComments.map((comment: any) => ({
          id: comment.id,
          content: comment.text,
          createdAt: comment.timestamp,
          user: {
            id: comment.user.id,
            name: comment.user.name || 'Unknown User',
            username: comment.user.username || 'unknown',
            image: comment.user.image
          }
        }));
        setComments(formattedComments);
      }
    } catch (error) {
      console.error('Failed to load comments:', error);
    }
  };

  // Handle swipe gestures
  const handleDragEnd = (event: any, info: PanInfo) => {
    const threshold = 50;
    
    if (info.offset.y > threshold && onNavigatePost) {
      onNavigatePost('down');
    } else if (info.offset.y < -threshold && onNavigatePost) {
      onNavigatePost('up');
    } else if (info.offset.x > threshold) {
      onClose();
    }
  };

  // Handle like action
  const handleLike = async () => {
    if (!session?.user?.id) return;

    const newState = !isLiked;

    // Optimistically update in context
    updateLikeInContext(post.id, newState);

    try {
      const response = await fetch(`/api/general-posts/likes`, {
        method: newState ? 'POST' : 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          postId: post.id,
          userId: session.user.id
        })
      });

      if (!response.ok) {
        // Revert on error
        updateLikeInContext(post.id, !newState);
        console.error('Failed to toggle like');
      }
    } catch (error) {
      // Revert on error
      updateLikeInContext(post.id, !newState);
      console.error('Error toggling like:', error);
    }
  };

  // Handle comment submission
  const handleComment = async () => {
    if (!newComment.trim() || !session?.user?.id || isSubmittingComment) return;
    
    setIsSubmittingComment(true);
    
    try {
      const response = await fetch('/api/general-posts/comments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          postId: post.id,
          userId: session.user.id,
          text: newComment.trim()
        })
      });

      if (response.ok) {
        const newCommentData = await response.json();
        
        // Add the new comment to the local state
        const formattedComment: PostComment = {
          id: newCommentData.id,
          content: newCommentData.text,
          createdAt: newCommentData.timestamp,
          user: {
            id: newCommentData.user.id,
            name: newCommentData.user.name || session.user.name || 'You',
            username: newCommentData.user.username || session.user.email || 'you',
            image: newCommentData.user.image || session.user.image
          }
        };
        
        setComments(prev => [...prev, formattedComment]);
        setNewComment('');
        setShowComments(true);
      } else {
        console.error('Failed to submit comment');
      }
    } catch (error) {
      console.error('Error submitting comment:', error);
    } finally {
      setIsSubmittingComment(false);
    }
  };

  // Handle share action
  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: post.content,
          url: `${window.location.origin}/posts/${post.id}`
        });
      } catch (error) {
        // Handle share error
      }
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(`${window.location.origin}/posts/${post.id}`);
    }
  };

  const handleUserClick = () => {
    onClose();
    router.push(`/profile/${post.user.username}`);
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black z-50 flex"
        onClick={onClose}
      >
        {/* Main content area */}
        <motion.div
          drag="y"
          dragConstraints={{ top: 0, bottom: 0 }}
          dragElastic={0.2}
          onDragEnd={handleDragEnd}
          className="relative w-full h-full flex flex-col"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Close button */}
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="absolute top-4 left-4 z-10 bg-black/50 text-white hover:bg-black/70"
          >
            <X className="h-6 w-6" />
          </Button>

          {/* Navigation buttons */}
          {showNavigation && onNavigatePost && (
            <>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onNavigatePost('up')}
                className="absolute top-4 right-16 z-10 bg-black/50 text-white hover:bg-black/70"
              >
                <ChevronUp className="h-6 w-6" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onNavigatePost('down')}
                className="absolute top-4 right-4 z-10 bg-black/50 text-white hover:bg-black/70"
              >
                <ChevronDown className="h-6 w-6" />
              </Button>
            </>
          )}

          {/* Media content */}
          <div className="relative flex-1 flex items-center justify-center bg-black">
            {post.mediaUrl ? (
              isVideo ? (
                <div className="relative w-full h-full flex items-center justify-center">
                  <video
                    ref={videoRef}
                    src={post.mediaUrl}
                    className="max-w-full max-h-full object-contain"
                    loop
                    muted={isMuted}
                    playsInline
                    onClick={(e) => {
                      e.stopPropagation();
                      if (e.currentTarget.paused) {
                        e.currentTarget.play();
                      } else {
                        e.currentTarget.pause();
                      }
                    }}
                  />
                  
                  {/* Volume control */}
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setIsMuted(!isMuted)}
                    className="absolute bottom-4 left-4 bg-black/50 text-white hover:bg-black/70"
                  >
                    {isMuted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
                  </Button>
                </div>
              ) : (
                <Image
                  src={post.mediaUrl}
                  alt={post.content}
                  fill
                  className="object-contain"
                />
              )
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-purple-900 to-blue-900">
                <div className="text-center max-w-md mx-auto p-8">
                  {post.title && <h2 className="text-2xl font-bold text-white mb-4">{post.title}</h2>}
                  <ExpandableTextModal
                    text={post.content}
                    className="text-lg text-gray-200 leading-relaxed"
                  />
                </div>
              </div>
            )}

            {/* Floating actions sidebar */}
            <div className="absolute right-4 bottom-1/3 flex flex-col gap-6">
              {/* Like button */}
              <motion.div 
                className="flex flex-col items-center gap-1"
                whileTap={{ scale: 0.8 }}
              >
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleLike}
                  className={cn(
                    "w-12 h-12 rounded-full bg-black/50 hover:bg-black/70",
                    isLiked && "bg-red-500 hover:bg-red-600"
                  )}
                >
                  <Heart className={cn("h-6 w-6", isLiked ? "fill-white text-white" : "text-white")} />
                </Button>
                <span className="text-white text-xs font-medium">{likes}</span>
              </motion.div>

              {/* Comment button */}
              <motion.div 
                className="flex flex-col items-center gap-1"
                whileTap={{ scale: 0.8 }}
              >
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setShowComments(true)}
                  className="w-12 h-12 rounded-full bg-black/50 hover:bg-black/70 text-white"
                >
                  <MessageCircle className="h-6 w-6" />
                </Button>
                <span className="text-white text-xs font-medium">{comments.length}</span>
              </motion.div>

              {/* Share button */}
              <motion.div 
                className="flex flex-col items-center gap-1"
                whileTap={{ scale: 0.8 }}
              >
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleShare}
                  className="w-12 h-12 rounded-full bg-black/50 hover:bg-black/70 text-white"
                >
                  <Share className="h-6 w-6" />
                </Button>
                <span className="text-white text-xs font-medium">{post.shares}</span>
              </motion.div>
            </div>

            {/* Post metadata overlay */}
            <div className="absolute bottom-0 left-0 right-0 p-6 pr-20 bg-gradient-to-t from-black/80 via-black/40 to-transparent">
              {/* User info */}
              <div className="flex items-center gap-3 mb-3" onClick={handleUserClick}>
                <Avatar className="w-10 h-10 cursor-pointer">
                  <AvatarImage src={post.user.image} alt={post.user.name} />
                  <AvatarFallback>{post.user.name.substring(0, 2)}</AvatarFallback>
                </Avatar>
                <div className="cursor-pointer flex-1">
                  <p className="text-white font-semibold">{post.user.name}</p>
                  <p className="text-gray-300 text-sm">@{post.user.username}</p>

                  {/* Society/Initiative Context */}
                  {post.society && (
                    <div className="mt-1">
                      <ContextBadge
                        type="society"
                        id={post.society.id}
                        name={post.society.name}
                        variant="minimal"
                        className="text-gray-300 hover:text-white text-xs"
                      />
                    </div>
                  )}
                  {post.initiative && !post.society && (
                    <div className="mt-1">
                      <ContextBadge
                        type="initiative"
                        id={post.initiative.id}
                        name={post.initiative.name}
                        variant="minimal"
                        className="text-gray-300 hover:text-white text-xs"
                      />
                    </div>
                  )}
                </div>
                <Badge
                  variant={
                    post.type === 'issue' ? 'destructive' :
                    post.type === 'idea' ? 'default' : 'secondary'
                  }
                  className="ml-auto"
                >
                  {post.type === 'issue' ? '🚨 Issue' :
                   post.type === 'idea' ? '💡 Idea' : '📝 General'}
                </Badge>
              </div>

              {/* Post content */}
              {post.mediaUrl && (
                <div className="mb-2">
                  {post.title && <h3 className="text-white font-semibold mb-1">{post.title}</h3>}
                  <ExpandableTextModal
                    text={post.content}
                    className="text-gray-200 text-sm leading-relaxed"
                  />
                </div>
              )}

              {/* Comment input */}
              <div className="flex gap-2 mt-4">
                <Input
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Add a comment..."
                  className="flex-1 bg-white/10 border-white/20 text-white placeholder-gray-400"
                  onKeyPress={(e) => e.key === 'Enter' && handleComment()}
                />
                <Button onClick={handleComment} size="icon" variant="ghost">
                  <Send className="h-4 w-4 text-white" />
                </Button>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Comments sliding panel */}
        <AnimatePresence>
          {showComments && (
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              className="absolute right-0 top-0 bottom-0 w-96 bg-background border-l border-border"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="h-full flex flex-col">
                <div className="p-4 border-b border-border flex items-center justify-between">
                  <h3 className="font-semibold">Comments</h3>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setShowComments(false)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
                
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  {comments.length === 0 ? (
                    <div className="text-center text-muted-foreground py-8">
                      <MessageCircle className="w-8 h-8 mx-auto mb-2 opacity-50" />
                      <p>No comments yet. Be the first to comment!</p>
                    </div>
                  ) : (
                    comments.map((comment) => (
                      <div key={comment.id} className="flex gap-3">
                        <Avatar className="w-8 h-8">
                          <AvatarImage src={comment.user.image} alt={comment.user.name} />
                          <AvatarFallback className="text-xs">
                            {comment.user.name.substring(0, 2)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <div className="bg-muted rounded-lg p-3">
                            <p className="font-medium text-sm">{comment.user.name}</p>
                            <p className="text-sm">{comment.content}</p>
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">
                            {new Date(comment.createdAt).toLocaleTimeString()}
                          </p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
                
                {/* Comment input at bottom */}
                <div className="p-4 border-t border-border">
                  <div className="flex gap-2">
                    <Avatar className="w-8 h-8">
                      <AvatarImage src={session?.user?.image} alt={session?.user?.name || 'You'} />
                      <AvatarFallback className="text-xs">
                        {session?.user?.name?.substring(0, 2) || 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 flex gap-2">
                      <Input
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        placeholder="Add a comment..."
                        className="flex-1"
                        onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && handleComment()}
                        disabled={isSubmittingComment}
                      />
                      <Button 
                        onClick={handleComment} 
                        size="icon" 
                        variant="ghost"
                        disabled={!newComment.trim() || isSubmittingComment}
                      >
                        <Send className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </AnimatePresence>
  );
}