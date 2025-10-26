"use client";
import React, { useState, useEffect, useRef } from 'react';
import { GeneralPost } from '@/lib/types';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from "@/components/ui/button";
import { MessageSquare, Share2, ThumbsUp, Play, Image as ImageIcon } from 'lucide-react';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { useToast } from '@/hooks/use-toast';
import { useSession } from 'next-auth/react';
import { ContentCardMenu } from '@/components/ui/content-card-menu';
import { deletePostAction } from '@/app/actions/postActions';
import { AuthGate } from '@/components/AuthGate';
import { useSwipeGestures } from '@/hooks/useSwipeGestures';
import { LikeAnimation, SwipeIndicator } from '@/components/animations/LikeAnimation';
import { motion, AnimatePresence } from 'framer-motion';
import { triggerHaptic, hapticPatterns } from '@/lib/animations';
import { usePostStats } from '@/context/PostStatsContext';

// Helper function to detect video files
const isVideoFile = (url: string) => {
  if (!url) return false;
  const videoExtensions = ['.mp4', '.webm', '.mov', '.avi', '.mkv', '.wmv', '.flv', '.m4v'];
  const lowerUrl = url.toLowerCase();
  return videoExtensions.some(ext => lowerUrl.includes(ext));
};

interface CompactPostCardProps {
  post: GeneralPost;
  currentUserId?: string;
  showTimeline?: boolean; // Whether to show the timeline connector
}

export function CompactPostCard({ post, currentUserId, showTimeline = true }: CompactPostCardProps) {
  const router = useRouter();
  const { toast } = useToast();
  const { data: session } = useSession();
  const [isDeleting, setIsDeleting] = useState(false);

  // Video autoplay state
  const videoRef = useRef<HTMLVideoElement>(null);
  const [hasVideoStarted, setHasVideoStarted] = useState(false);
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

  // Intersection Observer for video autoplay optimization
  useEffect(() => {
    if (!isVideo || !videoRef.current) return;

    const video = videoRef.current;
    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        setIsInView(entry.isIntersecting);

        if (entry.isIntersecting) {
          // Only start playing when video comes into view
          video.play().catch(() => {
            console.log('Autoplay failed for video in view');
          });
        } else {
          // Pause when out of view to save resources
          video.pause();
        }
      },
      { threshold: 0.5 } // Play when 50% of video is visible
    );

    observer.observe(video);

    return () => {
      observer.unobserve(video);
    };
  }, [isVideo]);

  const handleLike = async (e?: React.MouseEvent) => {
    e?.stopPropagation();

    // Only allow if user is authenticated
    if (!currentUserId) return;

    const newState = !isInterested;

    // Optimistically update in context
    updateLikeInContext(post.id, newState);

    // Haptic feedback
    triggerHaptic(newState ? hapticPatterns.success : hapticPatterns.light);

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

  const handleDoubleTap = () => {
    console.log('🎯 Double-tap detected on post:', post.id);
    // Only allow if user is authenticated
    if (!currentUserId) {
      console.log('⚠️ User not authenticated - showing auth gate');
      return;
    }

    // If already liked, just show animation
    if (isInterested) {
      console.log('❤️ Already liked - showing animation only');
      setShowLikeAnimation(true);
      triggerHaptic(hapticPatterns.doubleTap);
      return;
    }

    // Like the post
    console.log('💗 Liking post with animation');
    setShowLikeAnimation(true);
    handleLike();
  };

  const handleShare = async () => {
    // Haptic feedback
    triggerHaptic(hapticPatterns.medium);

    // Check if Web Share API is available
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${post.creatorName}'s post`,
          text: post.content.substring(0, 100),
          url: window.location.origin + `/posts/${post.id}`,
        });
      } catch (error) {
        // User cancelled or error occurred
        console.log('Share cancelled or failed');
      }
    } else {
      // Fallback: Copy to clipboard
      try {
        await navigator.clipboard.writeText(window.location.origin + `/posts/${post.id}`);
        toast({ title: 'Link copied to clipboard!' });
      } catch (error) {
        toast({ title: 'Could not share post', variant: 'destructive' });
      }
    }
  };

  // Setup swipe gestures
  const { ref: swipeRef } = useSwipeGestures({
    onDoubleTap: handleDoubleTap,
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
      if (!isInterested) {
        handleLike();
      }
    },
  });

  const navigateToPost = () => {
    sessionStorage.setItem('scrollY', window.scrollY.toString());
    router.push(`/posts/${post.id}`);
  };

  const handleDelete = async () => {
    if (!isCreator || isDeleting) return;

    if (!confirm(`Are you sure you want to delete this post? This action cannot be undone.`)) {
      return;
    }

    setIsDeleting(true);
    try {
      const result = await deletePostAction(post.id);
      if (result.error) {
        toast({ title: result.error, variant: "destructive" });
        setIsDeleting(false);
      } else {
        toast({ title: "Post deleted successfully" });

        // Dispatch global delete event for immediate feed update
        window.dispatchEvent(new CustomEvent('feed:itemDeleted', {
          detail: { id: post.id }
        }));

        router.refresh();
      }
    } catch (error) {
      toast({ title: "Failed to delete post", variant: "destructive" });
      setIsDeleting(false);
    }
  };

  return (
    <div className="relative flex gap-3 group">
      {/* Timeline connector */}
      {showTimeline && (
        <div className="flex flex-col items-center">
          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 relative z-10">
            <div className="w-2 h-2 rounded-full bg-primary" />
          </div>
          <div className="w-0.5 bg-border flex-1 mt-2" />
        </div>
      )}

      {/* Content */}
      <motion.div
        ref={swipeRef}
        className={cn(
          "flex-1 pb-6 cursor-pointer hover:bg-muted/5 -mx-2 px-2 rounded-lg transition-colors relative",
          !showTimeline && "ml-11" // Indent if no timeline
        )}
        onClick={navigateToPost}
        whileTap={{ scale: 0.98 }}
        transition={{ duration: 0.1 }}
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
          color="bg-vibrant-share"
          show={showSwipeLeft}
        />
        <SwipeIndicator
          direction="right"
          icon={<ThumbsUp className="w-6 h-6 text-white fill-white" />}
          color="bg-vibrant-like"
          show={showSwipeRight}
        />
        {/* Header */}
        <div className="flex items-start justify-between mb-2">
          <div className="flex items-center gap-2">
            <Link
              href={`/profile/${post.creatorId}`}
              onClick={(e) => e.stopPropagation()}
              className="hover:opacity-80 transition-opacity"
            >
              <Avatar className="h-8 w-8">
                <AvatarImage src={post.creatorAvatar} alt={post.creatorName} />
                <AvatarFallback className="text-xs">{fallback}</AvatarFallback>
              </Avatar>
            </Link>
            <div>
              <Link
                href={`/profile/${post.creatorId}`}
                onClick={(e) => e.stopPropagation()}
                className="font-semibold text-sm hover:underline"
              >
                {post.creatorName}
              </Link>
              <p className="text-xs text-muted-foreground">{postTime}</p>
            </div>
          </div>
          <ContentCardMenu
            itemId={post.id}
            itemType="post"
            itemName={post.content.substring(0, 50)}
            isCreator={isCreator}
            onDelete={handleDelete}
          />
        </div>

        {/* Content */}
        <div className="space-y-2">
          <p className="text-sm leading-relaxed line-clamp-3">
            {post.content}
          </p>

          {/* Media Preview - Compact */}
          {hasMedia && (
            <div className="relative rounded-lg overflow-hidden border border-border bg-muted/50 w-full aspect-video">
              {isVideo ? (
                <div className="relative w-full h-full">
                  <video
                    ref={videoRef}
                    src={firstMedia!.url}
                    className="w-full h-full object-cover"
                    muted
                    playsInline
                    loop
                    preload="metadata"
                    onLoadedMetadata={(e) => {
                      // Seek to 0.5 seconds to show a better preview frame
                      const video = e.target as HTMLVideoElement;
                      video.currentTime = 0.5;
                    }}
                  />
                  <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                    <div className="bg-black/60 rounded-full p-3 backdrop-blur-sm">
                      <Play className="w-5 h-5 text-white fill-white" />
                    </div>
                  </div>
                </div>
              ) : (
                <Image
                  src={firstMedia!.url}
                  alt="Post media"
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                />
              )}
              {post.media!.length > 1 && (
                <div className="absolute top-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded-full backdrop-blur-sm">
                  +{post.media!.length - 1}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Actions - Vibrant Mobile-First Style */}
        <div className="flex items-center gap-3 mt-4">
          <AuthGate currentUserId={currentUserId} action="like this post">
            <motion.div whileTap={{ scale: 0.92 }} className="flex-1">
              <Button
                variant="ghost"
                size="lg"
                className={cn(
                  "h-11 gap-2 rounded-full transition-all w-full font-bold text-base shadow-md",
                  isInterested
                    ? "bg-gradient-to-r from-pink-600 to-rose-600 text-white hover:from-pink-700 hover:to-rose-700 shadow-[0_0_20px_rgba(236,72,153,0.5)] border-2 border-pink-400"
                    : "bg-pink-500/15 text-pink-300 hover:bg-pink-500/25 hover:text-pink-200 border border-pink-500/30"
                )}
                onClick={handleLike}
                disabled={!currentUserId}
              >
                <ThumbsUp className={cn("h-5 w-5", isInterested && "fill-current drop-shadow-lg")} />
                <span className="drop-shadow-sm">{interestCount > 0 ? interestCount : 'Like'}</span>
              </Button>
            </motion.div>
          </AuthGate>

          <motion.div whileTap={{ scale: 0.92 }} className="flex-1">
            <Button
              variant="ghost"
              size="lg"
              className={cn(
                "h-11 gap-2 rounded-full transition-all w-full font-bold text-base shadow-md",
                commentsCount > 0
                  ? "bg-gradient-to-r from-purple-600 to-violet-600 text-white hover:from-purple-700 hover:to-violet-700 shadow-[0_0_20px_rgba(168,85,247,0.5)] border-2 border-purple-400"
                  : "bg-purple-500/15 text-purple-300 hover:bg-purple-500/25 hover:text-purple-200 border border-purple-500/30"
              )}
              onClick={(e) => {
                e.stopPropagation();
                triggerHaptic(hapticPatterns.light);
                navigateToPost();
              }}
            >
              <MessageSquare className="h-5 w-5" />
              <span className="drop-shadow-sm">{commentsCount > 0 ? commentsCount : 'Reply'}</span>
            </Button>
          </motion.div>

          <motion.div whileTap={{ scale: 0.92 }} className="flex-1">
            <Button
              variant="ghost"
              size="lg"
              className={cn(
                "h-11 gap-2 rounded-full transition-all w-full font-bold text-base shadow-md",
                shareCount > 0
                  ? "bg-gradient-to-r from-cyan-600 to-blue-600 text-white hover:from-cyan-700 hover:to-blue-700 shadow-[0_0_20px_rgba(6,182,212,0.5)] border-2 border-cyan-400"
                  : "bg-cyan-500/15 text-cyan-300 hover:bg-cyan-500/25 hover:text-cyan-200 border border-cyan-500/30"
              )}
              onClick={(e) => {
                e.stopPropagation();
                handleShare();
              }}
            >
              <Share2 className="h-5 w-5" />
              <span className="drop-shadow-sm">{shareCount > 0 ? shareCount : 'Share'}</span>
            </Button>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
}
