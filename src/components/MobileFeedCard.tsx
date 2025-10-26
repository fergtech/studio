'use client';

import React, { useState, useEffect, useRef } from 'react';
import { GeneralPost } from '@/lib/types';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { MessageSquare, Share2, ThumbsUp, Heart, MoreVertical } from 'lucide-react';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { useToast } from '@/hooks/use-toast';
import { useSession } from 'next-auth/react';
import { useSwipeGestures } from '@/hooks/useSwipeGestures';
import { LikeAnimation, SwipeIndicator } from '@/components/animations/LikeAnimation';
import { motion, AnimatePresence } from 'framer-motion';
import { triggerHaptic, hapticPatterns } from '@/lib/animations';
import { ContentCardMenu } from '@/components/ui/content-card-menu';
import { deletePostAction } from '@/app/actions/postActions';
import { usePostStats } from '@/context/PostStatsContext';
import { ContextBadge } from '@/components/ui/context-badge';

// Helper function to detect video files
const isVideoFile = (url: string) => {
  if (!url) return false;
  const videoExtensions = ['.mp4', '.webm', '.mov', '.avi', '.mkv', '.wmv', '.flv', '.m4v'];
  const lowerUrl = url.toLowerCase();
  return videoExtensions.some(ext => lowerUrl.includes(ext));
};

interface MobileFeedCardProps {
  post: GeneralPost;
  currentUserId?: string;
  onPostClick?: (post: GeneralPost) => void;
  society?: {
    id: string;
    name: string;
  } | null;
}

/**
 * MobileFeedCard - TikTok/Instagram Reels style card
 * - Full viewport height (9:16 ratio on mobile)
 * - Media-first layout
 * - Floating action buttons
 * - Double-tap to like
 * - Swipe gestures
 */
export function MobileFeedCard({ post, currentUserId, onPostClick, society }: MobileFeedCardProps) {
  const router = useRouter();
  const { toast } = useToast();
  const { data: session } = useSession();
  const [isDeleting, setIsDeleting] = useState(false);

  // Video autoplay state
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isInView, setIsInView] = useState(false);

  // Mobile-first gesture states
  const [showLikeAnimation, setShowLikeAnimation] = useState(false);
  const [showSwipeLeft, setShowSwipeLeft] = useState(false);
  const [showSwipeRight, setShowSwipeRight] = useState(false);

  const fallback = post.creatorName?.substring(0, 2).toUpperCase() || '??';

  // Safely handle timestamp formatting
  let postTime = 'recently';
  try {
    const timestamp = new Date(post.timestamp);
    if (!isNaN(timestamp.getTime())) {
      postTime = formatDistanceToNow(timestamp, { addSuffix: true });
    }
  } catch (error) {
    console.error('Invalid timestamp for post:', post.id, post.timestamp);
  }

  const isCreator = session?.user?.id === post.creatorId;

  // Use batch stats context for efficient data fetching
  const { getStats, registerPost, updateLike: updateLikeInContext } = usePostStats();

  // Register this post for batch fetching on mount
  useEffect(() => {
    registerPost(post.id);
  }, [post.id, registerPost]);

  // Get stats from context
  const stats = getStats(post.id);
  const interestCount = stats?.likes.count || 0;
  const isInterested = stats?.likes.liked || false;
  const shareCount = stats?.shares.count || 0;
  const commentsCount = stats?.comments.count || 0;

  // Detect media types
  const hasMedia = post.media && post.media.length > 0;
  const firstMedia = hasMedia && post.media ? post.media[0] : null;
  const isVideo = firstMedia && isVideoFile(firstMedia.url);

  // Generate vibrant gradient for text-only posts
  const gradients = [
    'bg-gradient-to-br from-purple-600 via-pink-600 to-blue-600',
    'bg-gradient-to-br from-cyan-500 via-blue-500 to-purple-600',
    'bg-gradient-to-br from-orange-500 via-red-500 to-pink-600',
    'bg-gradient-to-br from-green-500 via-teal-500 to-cyan-600',
    'bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600',
    'bg-gradient-to-br from-yellow-500 via-orange-500 to-red-600',
  ];
  const gradientIndex = post.id.split('').reduce((sum, char) => sum + char.charCodeAt(0), 0) % gradients.length;
  const textOnlyGradient = gradients[gradientIndex];

  // Intersection Observer for video autoplay
  useEffect(() => {
    if (!isVideo || !videoRef.current) return;

    const video = videoRef.current;
    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        setIsInView(entry.isIntersecting);

        if (entry.isIntersecting) {
          video.play().catch(() => console.log('Autoplay failed'));
        } else {
          video.pause();
        }
      },
      { threshold: 0.5 }
    );

    observer.observe(video);
    return () => observer.unobserve(video);
  }, [isVideo]);

  const handleLike = async (e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (!currentUserId) return;

    const newState = !isInterested;

    // Optimistically update in context
    updateLikeInContext(post.id, newState);

    triggerHaptic(newState ? [...hapticPatterns.success] : hapticPatterns.light);

    try {
      await fetch('/api/general-posts/likes', {
        method: newState ? 'POST' : 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ postId: post.id, userId: currentUserId })
      });
    } catch (error) {
      // Revert on error
      updateLikeInContext(post.id, !newState);
    }
  };

  const handleDoubleClick = () => {
    console.log('🎯 Double-tap detected on post:', post.id);
    if (!currentUserId) return;

    if (isInterested) {
      setShowLikeAnimation(true);
      triggerHaptic([...hapticPatterns.doubleTap]);
      return;
    }

    setShowLikeAnimation(true);
    handleLike();
  };

  const handleShare = async (e?: React.MouseEvent) => {
    e?.stopPropagation();
    // TODO: Implement share functionality
    toast({
      title: 'Sharing is caring!',
      description: 'Share functionality coming soon.',
    });
  };

  const handleEdit = () => {
    if (!isCreator) return;
    // Navigate to post detail page which has edit functionality
    router.push(`/posts/${post.id}`);
  };

  const handleDelete = async () => {
    if (!isCreator || isDeleting) return;
    if (!confirm('Delete this post?')) return;

    setIsDeleting(true);
    try {
      const result = await deletePostAction(post.id);
      if (result.error) {
        toast({ title: result.error, variant: 'destructive' });
        setIsDeleting(false);
      } else {
        toast({ title: 'Post deleted' });
        window.dispatchEvent(new CustomEvent('feed:itemDeleted', { detail: { id: post.id } }));
        router.refresh();
      }
    } catch (error) {
      toast({ title: 'Failed to delete', variant: 'destructive' });
      setIsDeleting(false);
    }
  };

  // Setup swipe gestures
  const { ref: swipeRef } = useSwipeGestures({
    onDoubleTap: handleDoubleClick,
    onSwipeLeft: () => {
      if (!currentUserId) return;
      setShowSwipeLeft(true);
      setTimeout(() => setShowSwipeLeft(false), 300);
      handleShare();
    },
    onSwipeRight: () => {
      if (!currentUserId) return;
      setShowSwipeRight(true);
      setTimeout(() => setShowSwipeRight(false), 300);
      if (!isInterested) handleLike();
    },
  });

  const navigateToPost = () => {
    if (onPostClick) {
      onPostClick(post);
    } else {
      sessionStorage.setItem('scrollY', window.scrollY.toString());
      router.push(`/posts/${post.id}`);
    }
  };

  return (
    <motion.div
      ref={swipeRef}
      className="relative w-full h-[calc(100vh-8rem)] md:h-[600px] md:max-w-md md:mx-auto bg-card rounded-xl overflow-hidden snap-start group md:mb-6 cursor-pointer"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      onClick={navigateToPost}
    >
      {/* Like Animation Overlay */}
      <LikeAnimation
        show={showLikeAnimation}
        onComplete={() => setShowLikeAnimation(false)}
      />

      {/* Swipe Indicators */}
      <SwipeIndicator
        direction="left"
        icon={<Share2 className="w-6 h-6 text-white" />}
        color="bg-cyan-500"
        show={showSwipeLeft}
      />
      <SwipeIndicator
        direction="right"
        icon={<Heart className="w-6 h-6 text-white fill-white" />}
        color="bg-pink-500"
        show={showSwipeRight}
      />

      {/* Background - Media or Vibrant Gradient */}
      <div className="absolute inset-0 w-full h-full">
        {hasMedia ? (
          <>
            {isVideo ? (
              <video
                ref={videoRef}
                src={firstMedia!.url}
                className="w-full h-full object-cover"
                muted
                playsInline
                loop
                preload="metadata"
              />
            ) : (
              <Image
                src={firstMedia!.url}
                alt="Post media"
                fill
                className="object-cover"
                sizes="100vw"
                priority
              />
            )}
            {/* Gradient overlay for readability */}
            <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/80" />
          </>
        ) : (
          /* Vibrant gradient for text-only posts */
          <div className={`w-full h-full ${textOnlyGradient}`}>
            <div className="absolute inset-0 bg-black/10" />
          </div>
        )}
      </div>

      {/* Content Overlay */}
      <div className="absolute inset-0 flex flex-col justify-between p-4 text-white">
        {/* Top Bar - Creator Info & Menu */}
        <div className={cn(
          "flex items-center justify-between z-10",
          !hasMedia && "absolute top-4 left-4 right-4"
        )}>
          <div className="flex flex-col gap-2">
            <Link
              href={`/profile/${post.creatorId}`}
              onClick={(e) => e.stopPropagation()}
              className="flex items-center gap-3"
            >
              <Avatar className="h-12 w-12 border-2 border-white shadow-lg">
                <AvatarImage src={post.creatorAvatar} alt={post.creatorName} />
                <AvatarFallback>{fallback}</AvatarFallback>
              </Avatar>
              <div>
                <p className="font-bold text-base drop-shadow-lg">{post.creatorName}</p>
                <p className="text-xs text-white/90 drop-shadow-md">{postTime}</p>
              </div>
            </Link>

            {/* Society/Initiative Context Badge */}
            {society && (
              <div className="ml-[60px]">
                <ContextBadge
                  type="society"
                  id={society.id}
                  name={society.name}
                  variant="minimal"
                  className="text-white/90 drop-shadow-md hover:text-white"
                />
              </div>
            )}
            {post.linkedInitiativeId && !society && (
              <div className="ml-[60px]">
                <ContextBadge
                  type="initiative"
                  id={post.linkedInitiativeId}
                  name="Initiative"
                  variant="minimal"
                  className="text-white/90 drop-shadow-md hover:text-white"
                />
              </div>
            )}
          </div>
          <ContentCardMenu
            itemId={post.id}
            itemType="post"
            itemName={post.content.substring(0, 50)}
            isCreator={isCreator}
            onEdit={handleEdit}
            onDelete={handleDelete}
          />
        </div>

        {/* Middle - Text Content (for text-only posts) */}
        {!hasMedia && (
          <div className="flex-1 flex items-center justify-center z-10 px-4 py-20">
            <motion.div
              onClick={navigateToPost}
              className="cursor-pointer max-w-2xl"
              whileTap={{ scale: 0.98 }}
            >
              <p className="text-2xl md:text-4xl font-bold text-center leading-tight drop-shadow-2xl">
                {post.content}
              </p>
            </motion.div>
          </div>
        )}

        {/* Bottom Bar - Content & Actions */}
        <div className={cn(
          "space-y-4 z-10",
          !hasMedia && "absolute bottom-4 left-4 right-4"
        )}>
          {/* Post Content (for media posts) */}
          {hasMedia && (
            <motion.div
              onClick={navigateToPost}
              className="cursor-pointer"
              whileTap={{ scale: 0.98 }}
            >
              <p className="text-base leading-relaxed drop-shadow-lg line-clamp-3 mb-2">
                {post.content}
              </p>
            </motion.div>
          )}

          {/* Action Buttons - Horizontal (TikTok style) */}
          <div className="flex items-center gap-4">
            {/* Like */}
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={handleLike}
              disabled={!currentUserId}
              className="flex flex-col items-center gap-1 min-w-[60px]"
            >
              <div
                className={cn(
                  "w-12 h-12 rounded-full flex items-center justify-center transition-all",
                  isInterested
                    ? "bg-pink-500 shadow-lg shadow-pink-500/50"
                    : "bg-white/20 backdrop-blur-sm"
                )}
              >
                <Heart
                  className={cn(
                    "w-6 h-6",
                    isInterested ? "fill-white text-white" : "text-white"
                  )}
                />
              </div>
              <span className="text-xs font-semibold drop-shadow-lg">
                {interestCount > 0 ? interestCount : 'Like'}
              </span>
            </motion.button>

            {/* Comment */}
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={navigateToPost}
              className="flex flex-col items-center gap-1 min-w-[60px]"
            >
              <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                <MessageSquare className="w-6 h-6 text-white" />
              </div>
              <span className="text-xs font-semibold drop-shadow-lg">
                {commentsCount > 0 ? commentsCount : 'Reply'}
              </span>
            </motion.button>

            {/* Share */}
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={handleShare}
              className="flex flex-col items-center gap-1 min-w-[60px]"
            >
              <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                <Share2 className="w-6 h-6 text-white" />
              </div>
              <span className="text-xs font-semibold drop-shadow-lg">
                {shareCount > 0 ? shareCount : 'Share'}
              </span>
            </motion.button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
