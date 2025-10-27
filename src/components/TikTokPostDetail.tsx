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
import { formatDistanceToNow } from 'date-fns';
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

  // Lock body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      document.body.style.position = 'fixed';
      document.body.style.width = '100%';
      document.body.style.height = '100%';
    } else {
      document.body.style.overflow = '';
      document.body.style.position = '';
      document.body.style.width = '';
      document.body.style.height = '';
    }
    return () => {
      document.body.style.overflow = '';
      document.body.style.position = '';
      document.body.style.width = '';
      document.body.style.height = '';
    };
  }, [isOpen]);

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

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-[99999] bg-black flex"
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            width: '100vw',
            height: '100vh',
            zIndex: 99999
          }}
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
                    className="max-w-full max-h-[90vh] object-contain"
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
                    maxLines={3}
                  />
                </div>
              </div>
            )}

            {/* Right sidebar with actions and info */}
            <motion.div
              className="absolute right-4 bottom-1/3 flex flex-col items-center space-y-4 z-40"
              drag="y"
              dragConstraints={{ top: 0, bottom: 0 }}
              onDragEnd={handleDragEnd}
            >
              {/* User info */}
              <div className="flex flex-col items-center space-y-2">
                <div className="flex items-center gap-3 mb-3" onClick={handleUserClick}>
                  <Avatar className="w-12 h-12 cursor-pointer border-2 border-white">
                    <AvatarImage src={post.user?.image || ''} alt={post.user?.name || ''} />
                    <AvatarFallback>{post.user?.name?.substring(0, 2) || '?'}</AvatarFallback>
                  </Avatar>
                </div>
                <div className="text-center">
                  <p className="text-white font-semibold text-sm cursor-pointer" onClick={handleUserClick}>
                    {post.user.name}
                  </p>
                  <p className="text-gray-300 text-xs">
                    {formatDistanceToNow(new Date(post.createdAt), { addSuffix: true })}
                  </p>
                </div>
              </div>

              {/* Like button */}
              <div className="flex flex-col items-center">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleLike}
                  className={cn(
                    "rounded-full w-12 h-12 transition-all",
                    isLiked
                      ? "bg-red-500 text-white hover:bg-red-600"
                      : "bg-black/50 text-white hover:bg-black/70"
                  )}
                >
                  <Heart className={cn("h-6 w-6", isLiked && "fill-current")} />
                </Button>
                <span className="text-white text-xs mt-1">{likes}</span>
              </div>

              {/* Comments button */}
              <div className="flex flex-col items-center">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setShowComments(!showComments)}
                  className="bg-black/50 text-white hover:bg-black/70 rounded-full w-12 h-12"
                >
                  <MessageCircle className="h-6 w-6" />
                </Button>
                <span className="text-white text-xs mt-1">{comments.length}</span>
              </div>

              {/* Share button */}
              <div className="flex flex-col items-center">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleShare}
                  className="bg-black/50 text-white hover:bg-black/70 rounded-full w-12 h-12"
                >
                  <Share className="h-6 w-6" />
                </Button>
                <span className="text-white text-xs mt-1">{post.shares}</span>
              </div>

              {/* More actions */}
              <Button
                variant="ghost"
                size="icon"
                className="bg-black/50 text-white hover:bg-black/70 rounded-full w-12 h-12"
              >
                <MoreHorizontal className="h-6 w-6" />
              </Button>
            </motion.div>

            {/* Bottom metadata overlay - shows content when media is present */}
            {post.mediaUrl && (
              <div className="absolute bottom-0 left-0 right-0 p-6 pr-20 bg-gradient-to-t from-black/80 via-black/40 to-transparent">
                <div className="mb-2">
                  <Badge
                    variant={
                      post.type === 'issue' ? 'destructive' :
                      post.type === 'idea' ? 'default' : 'secondary'
                    }
                    className="mb-3"
                  >
                    {post.type === 'issue' ? '🚨 Issue' :
                     post.type === 'idea' ? '💡 Idea' :
                     '📝 General'}
                  </Badge>
                </div>
                {post.title && <h2 className="text-xl font-bold text-white mb-2">{post.title}</h2>}
                <ExpandableTextModal
                  text={post.content}
                  className="text-sm text-gray-200 leading-relaxed"
                  maxLines={3}
                />

                {/* Society/Initiative Context */}
                {(post.society || post.initiative) && (
                  <div className="flex items-center gap-2 mt-3">
                    {post.society && (
                      <ContextBadge
                        type="society"
                        id={post.society.id}
                        name={post.society.name}
                        variant="minimal"
                        className="text-gray-300 hover:text-white text-xs"
                      />
                    )}
                    {post.initiative && !post.society && (
                      <ContextBadge
                        type="initiative"
                        id={post.initiative.id}
                        name={post.initiative.name}
                        variant="minimal"
                        className="text-gray-300 hover:text-white text-xs"
                      />
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </motion.div>

        {/* Comments sliding panel */}
        <AnimatePresence>
          {showComments && (
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="absolute bottom-0 left-0 right-0 bg-black/90 backdrop-blur-sm h-[60vh] max-h-[60vh] z-[100] flex flex-col"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex-shrink-0 p-4 border-b border-gray-700 flex items-center justify-between">
                <h3 className="text-white font-semibold">Comments ({comments.length})</h3>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setShowComments(false)}
                  className="text-white hover:bg-white/10"
                >
                  <ChevronDown className="h-5 w-5" />
                </Button>
              </div>

              {/* Comments list */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-0">
                  {comments.length === 0 ? (
                    <div className="text-center text-gray-400 py-8">
                      <MessageCircle className="w-8 h-8 mx-auto mb-2 opacity-50" />
                      <p>No comments yet. Be the first to comment!</p>
                    </div>
                  ) : (
                    comments.map((comment) => (
                      <div key={comment.id} className="flex gap-3">
                        <Avatar className="w-8 h-8 flex-shrink-0">
                          <AvatarImage src={comment.user.image} alt={comment.user.name} />
                          <AvatarFallback className="text-xs">
                            {comment.user.name.substring(0, 2)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-white font-medium text-sm">{comment.user.name}</span>
                            <span className="text-gray-400 text-xs">
                              {new Date(comment.createdAt).toLocaleTimeString()}
                            </span>
                          </div>
                          <p className="text-gray-200 text-sm break-words">{comment.content}</p>
                        </div>
                      </div>
                    ))
                  )}
              </div>

              {/* Comment input at bottom - always visible */}
              {session?.user && (
                <div className="flex-shrink-0 p-4 border-t border-gray-700 bg-black/90">
                  <div className="flex gap-2">
                    <Input
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      placeholder="Add a comment..."
                      className="flex-1 bg-white/10 border-white/20 text-white placeholder-gray-400"
                      onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && handleComment()}
                      disabled={isSubmittingComment}
                    />
                    <Button
                      onClick={handleComment}
                      size="icon"
                      variant="ghost"
                      disabled={!newComment.trim() || isSubmittingComment}
                      className="text-white hover:bg-white/10"
                    >
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
        </motion.div>
      )}
    </AnimatePresence>
  );
}