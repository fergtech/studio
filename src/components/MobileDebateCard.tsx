'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { MessageSquare, Share2, ThumbsUp, ThumbsDown, Play, Volume2 } from 'lucide-react';
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
import { DebateDetailsSheet } from '@/components/DebateDetailsSheet';
import { CommentsSheet } from '@/components/CommentsSheet';
import { ShareOptionsSheet } from '@/components/ShareOptionsSheet';
import { DebateDetailsModal } from '@/components/modals/DebateDetailsModal';
import { CommentsModal } from '@/components/modals/CommentsModal';
import { ShareOptionsModal } from '@/components/modals/ShareOptionsModal';
import { useIsMobile } from '@/hooks/useIsMobile';

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

interface MobileDebateCardProps {
  id: string;
  title: string;
  content: string;
  imageUrl?: string;
  creator: {
    id: string;
    name: string;
    image?: string;
  };
  createdAt: Date | string;
  stats: {
    proVotes: number;
    conVotes: number;
    totalVotes: number;
    proPercentage: number;
    conPercentage: number;
    argumentCount: number;
  };
  currentUserId?: string;
  onDelete?: (id: string) => void;
}

/**
 * MobileDebateCard - TikTok/Instagram Reels style debate card
 * - Full viewport height (9:16 ratio on mobile)
 * - Media-first layout
 * - Agree/Disagree voting buttons (not Pro/Con)
 * - Double-tap to agree
 * - Swipe gestures
 */
export function MobileDebateCard({
  id,
  title,
  content,
  imageUrl,
  creator,
  createdAt,
  stats,
  currentUserId,
  onDelete,
}: MobileDebateCardProps) {
  const router = useRouter();
  const { toast } = useToast();
  const { data: session } = useSession();
  const [isDeleting, setIsDeleting] = useState(false);

  // Video/audio autoplay state
  const mediaRef = useRef<HTMLVideoElement | HTMLAudioElement>(null);
  const [isInView, setIsInView] = useState(false);

  // Mobile-first gesture states
  const [showAgreeAnimation, setShowAgreeAnimation] = useState(false);
  const [showSwipeLeft, setShowSwipeLeft] = useState(false);
  const [showSwipeRight, setShowSwipeRight] = useState(false);

  // User's vote state
  const [userVote, setUserVote] = useState<'agree' | 'disagree' | null>(null);
  const [agreeCount, setAgreeCount] = useState(stats.proVotes);
  const [disagreeCount, setDisagreeCount] = useState(stats.conVotes);
  const [totalVotes, setTotalVotes] = useState(stats.totalVotes);

  // Sync local state when props change (fixes stale vote count bug)
  useEffect(() => {
    setAgreeCount(stats.proVotes);
    setDisagreeCount(stats.conVotes);
    setTotalVotes(stats.totalVotes);
  }, [stats.proVotes, stats.conVotes, stats.totalVotes]);

  // Sheet states
  const [showDetailsSheet, setShowDetailsSheet] = useState(false);
  const [showCommentsSheet, setShowCommentsSheet] = useState(false);
  const [showShareSheet, setShowShareSheet] = useState(false);

  // Responsive behavior
  const isMobile = useIsMobile();

  const fallback = creator.name?.substring(0, 2).toUpperCase() || '??';

  // Safely handle timestamp formatting
  let timeAgo = 'recently';
  try {
    const timestamp = typeof createdAt === 'string' ? new Date(createdAt) : createdAt;
    if (!isNaN(timestamp.getTime())) {
      timeAgo = formatDistanceToNow(timestamp, { addSuffix: true });
    }
  } catch (error) {
    console.error('Invalid timestamp for debate:', id, createdAt);
  }

  const isCreator = session?.user?.id === creator.id;

  // Detect media types
  const hasMedia = imageUrl;
  const isVideo = hasMedia && isVideoFile(imageUrl);
  const isAudio = hasMedia && isAudioFile(imageUrl);
  const isImage = hasMedia && !isVideo && !isAudio;

  // Generate vibrant gradient for text-only debates
  const gradients = [
    'bg-gradient-to-br from-purple-600 via-violet-600 to-indigo-600',
    'bg-gradient-to-br from-rose-500 via-pink-600 to-purple-600',
    'bg-gradient-to-br from-blue-600 via-cyan-500 to-teal-600',
    'bg-gradient-to-br from-orange-600 via-red-500 to-pink-600',
    'bg-gradient-to-br from-emerald-600 via-green-500 to-cyan-600',
    'bg-gradient-to-br from-fuchsia-600 via-purple-600 to-blue-600',
  ];
  const gradientIndex = id.split('').reduce((sum, char) => sum + char.charCodeAt(0), 0) % gradients.length;
  const textOnlyGradient = gradients[gradientIndex];

  // Calculate percentages
  const agreePercentage = totalVotes > 0 ? Math.round((agreeCount / totalVotes) * 100) : 0;
  const disagreePercentage = totalVotes > 0 ? Math.round((disagreeCount / totalVotes) * 100) : 0;

  // Intersection Observer for media autoplay
  useEffect(() => {
    if ((!isVideo && !isAudio) || !mediaRef.current) return;

    const media = mediaRef.current;
    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        setIsInView(entry.isIntersecting);

        if (entry.isIntersecting) {
          media.play().catch(() => console.log('Autoplay failed'));
        } else {
          media.pause();
        }
      },
      { threshold: 0.5 }
    );

    observer.observe(media);
    return () => observer.unobserve(media);
  }, [isVideo, isAudio]);

  // Fetch user's vote
  useEffect(() => {
    async function fetchUserVote() {
      if (!currentUserId) return;
      try {
        // Use the correct endpoint that matches the API route
        const res = await fetch(`/api/debates/${id}/vote?userId=${currentUserId}`);
        if (!res.ok) {
          console.log('No vote found for user');
          return;
        }
        const data = await res.json();
        setUserVote(data.userVote === 'PRO' ? 'agree' : data.userVote === 'CON' ? 'disagree' : null);
      } catch (error) {
        console.error('Error fetching user vote:', error);
      }
    }
    fetchUserVote();
  }, [id, currentUserId]);

  const handleVote = async (voteType: 'agree' | 'disagree', e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (!currentUserId) return;

    const apiVoteType = voteType === 'agree' ? 'PRO' : 'CON';
    const isChangingVote = userVote && userVote !== voteType;
    const isRemovingVote = userVote === voteType;

    // Optimistic update
    if (isRemovingVote) {
      setUserVote(null);
      if (voteType === 'agree') {
        setAgreeCount(prev => prev - 1);
      } else {
        setDisagreeCount(prev => prev - 1);
      }
      setTotalVotes(prev => prev - 1);
    } else if (isChangingVote) {
      setUserVote(voteType);
      if (voteType === 'agree') {
        setAgreeCount(prev => prev + 1);
        setDisagreeCount(prev => prev - 1);
      } else {
        setDisagreeCount(prev => prev + 1);
        setAgreeCount(prev => prev - 1);
      }
    } else {
      setUserVote(voteType);
      if (voteType === 'agree') {
        setAgreeCount(prev => prev + 1);
      } else {
        setDisagreeCount(prev => prev + 1);
      }
      setTotalVotes(prev => prev + 1);
    }

    triggerHaptic(voteType === 'agree' ? [...hapticPatterns.success] : hapticPatterns.medium);

    try {
      const response = await fetch(`/api/debates/${id}/vote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ side: apiVoteType }) // Use 'side' instead of voteType
      });

      if (response.ok) {
        // Use fresh vote counts from API response
        const data = await response.json();
        if (data.stats) {
          setAgreeCount(data.stats.proVotes);
          setDisagreeCount(data.stats.conVotes);
          setTotalVotes(data.stats.totalVotes);
        }
      } else {
        throw new Error('Vote request failed');
      }
    } catch (error) {
      // Revert optimistic update on error
      console.error('Vote failed:', error);
      setUserVote(userVote);
      // Trigger parent refresh to get fresh data
      router.refresh();
    }
  };

  const handleDoubleTap = () => {
    console.log('🎯 Double-tap detected on debate:', id);
    if (!currentUserId) return;

    if (userVote === 'agree') {
      setShowAgreeAnimation(true);
      triggerHaptic([...hapticPatterns.doubleTap]);
      return;
    }

    setShowAgreeAnimation(true);
    handleVote('agree');
  };

  const handleShare = async () => {
    triggerHaptic(hapticPatterns.medium);
    
    // Try native sharing first on mobile
    if (typeof navigator !== 'undefined' && 'share' in navigator && window.innerWidth < 768) {
      try {
        await navigator.share({
          title: title,
          text: content.substring(0, 100),
          url: `${window.location.origin}/debates/${id}`,
        });
        return;
      } catch (error) {
        // Fall back to share sheet if native sharing fails or user cancels
        if ((error as Error).name !== 'AbortError') {
          console.log('Native sharing failed, showing share options');
        } else {
          return; // User cancelled, don't show sheet
        }
      }
    }
    
    // Show share options sheet
    setShowShareSheet(true);
  };

  const handleEdit = () => {
    if (!isCreator) return;
    // Navigate to debate detail page which has edit functionality
    router.push(`/debates/${id}`);
  };

  const handleDelete = async () => {
    if (!isCreator || isDeleting) return;
    if (!confirm('Delete this debate?')) return;

    setIsDeleting(true);
    try {
      const response = await fetch(`/api/debates/${id}`, { method: 'DELETE' });
      if (!response.ok) throw new Error('Failed to delete');

      toast({ title: 'Debate deleted' });
      window.dispatchEvent(new CustomEvent('feed:itemDeleted', { detail: { id } }));
      onDelete?.(id);
      router.refresh();
    } catch (error) {
      toast({ title: 'Failed to delete', variant: 'destructive' });
      setIsDeleting(false);
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
      if (userVote !== 'agree') handleVote('agree');
    },
  });

  const navigateToDebate = () => {
    triggerHaptic(hapticPatterns.light);
    setShowDetailsSheet(true);
  };

  const handleComment = () => {
    triggerHaptic(hapticPatterns.medium);
    setShowCommentsSheet(true);
  };

  return (
    <motion.div
      ref={swipeRef}
      className="relative w-full h-[calc(100vh-8rem)] md:h-[600px] md:max-w-md md:mx-auto bg-card rounded-xl overflow-hidden snap-start group md:mb-6"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      {/* Agree Animation Overlay */}
      <LikeAnimation
        show={showAgreeAnimation}
        onComplete={() => setShowAgreeAnimation(false)}
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
        icon={<ThumbsUp className="w-6 h-6 text-white fill-white" />}
        color="bg-green-500"
        show={showSwipeRight}
      />

      {/* Background - Media or Vibrant Gradient */}
      <div className="absolute inset-0 w-full h-full">
        {hasMedia ? (
          <>
            {isVideo ? (
              <video
                ref={mediaRef as React.RefObject<HTMLVideoElement>}
                src={imageUrl!}
                className="w-full h-full object-cover"
                controls
                playsInline
                loop
                preload="metadata"
              />
            ) : isAudio ? (
              <>
                <div className={`w-full h-full ${textOnlyGradient}`}>
                  <div className="absolute inset-0 bg-black/20" />
                </div>
                <audio
                  ref={mediaRef as React.RefObject<HTMLAudioElement>}
                  src={imageUrl!}
                  className="hidden"
                  loop
                />
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="bg-black/40 rounded-full p-6 backdrop-blur-sm">
                    <Volume2 className="w-12 h-12 text-white" />
                  </div>
                </div>
              </>
            ) : (
              <Image
                src={imageUrl!}
                alt="Debate media"
                fill
                className="object-cover"
                sizes="100vw"
                priority
              />
            )}
            {/* Gradient overlay for readability */}
            <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/90" />
          </>
        ) : (
          /* Vibrant gradient for text-only debates */
          <div className={`w-full h-full ${textOnlyGradient}`}>
            <div className="absolute inset-0 bg-black/10" />
          </div>
        )}
      </div>

      {/* Content Overlay */}
      <div className="absolute inset-0 flex flex-col justify-between p-4 text-white">
        {/* Top Bar - Creator Info & Menu */}
        <div className="flex items-center justify-between z-10">
          <Link
            href={`/profile/${creator.id}`}
            onClick={(e) => e.stopPropagation()}
            className="flex items-center gap-3"
          >
            <Avatar className="h-12 w-12 border-2 border-white shadow-lg">
              <AvatarImage src={creator.image} alt={creator.name} />
              <AvatarFallback>{fallback}</AvatarFallback>
            </Avatar>
            <div>
              <p className="font-bold text-base drop-shadow-lg">{creator.name}</p>
              <p className="text-xs text-white/90 drop-shadow-md">{timeAgo}</p>
            </div>
          </Link>
          <ContentCardMenu
            itemId={id}
            itemType="debate"
            itemName={title}
            isCreator={isCreator}
            onEdit={handleEdit}
            onDelete={handleDelete}
          />
        </div>

        {/* Middle - Debate Title & Content (centered for text-only) */}
        {!hasMedia && (
          <div className="flex-1 flex items-center justify-center z-10 px-4 py-20">
            <motion.div
              onClick={navigateToDebate}
              className="cursor-pointer max-w-2xl"
              whileTap={{ scale: 0.98 }}
            >
              <h2 className="text-3xl md:text-5xl font-black text-center leading-tight drop-shadow-2xl mb-4 line-clamp-3">
                {title}
              </h2>
              <p className="text-lg md:text-xl text-center leading-relaxed drop-shadow-xl opacity-90 line-clamp-4">
                {content}
              </p>
            </motion.div>
          </div>
        )}

        {/* Bottom Bar - Content & Actions */}
        <div className="space-y-4 z-10">
          {/* Debate Title & Content (for media debates) */}
          {hasMedia && (
            <motion.div
              onClick={navigateToDebate}
              className="cursor-pointer"
              whileTap={{ scale: 0.98 }}
            >
              <h2 className="text-xl font-bold leading-tight drop-shadow-lg mb-2 line-clamp-2">
                {title}
              </h2>
              <p className="text-sm leading-relaxed drop-shadow-lg line-clamp-2 opacity-90">
                {content}
              </p>
            </motion.div>
          )}

          {/* Voting Progress Bar */}
          {totalVotes > 0 && (
            <div className="bg-black/30 backdrop-blur-sm rounded-lg p-3">
              <div className="flex justify-between text-xs font-bold mb-2">
                <span className="text-green-300 drop-shadow-lg">
                  {agreePercentage}% Agree
                </span>
                <span className="text-red-300 drop-shadow-lg">
                  {disagreePercentage}% Disagree
                </span>
              </div>
              <div className="w-full bg-white/20 rounded-full h-2 overflow-hidden">
                <div className="h-full flex">
                  <div
                    className="bg-gradient-to-r from-green-400 to-emerald-500 transition-all duration-500"
                    style={{ width: `${agreePercentage}%` }}
                  />
                  <div
                    className="bg-gradient-to-r from-red-400 to-rose-500 transition-all duration-500"
                    style={{ width: `${disagreePercentage}%` }}
                  />
                </div>
              </div>
              <div className="flex justify-between text-xs mt-2 text-white/80">
                <span>{agreeCount} votes</span>
                <span>{disagreeCount} votes</span>
              </div>
            </div>
          )}

          {/* Action Buttons - Agree/Disagree/Comment/Share */}
          <div className="flex items-center gap-3">
            {/* Agree */}
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={(e) => handleVote('agree', e)}
              disabled={!currentUserId}
              className="flex-1"
            >
              <div
                className={cn(
                  "h-12 rounded-full flex items-center justify-center gap-2 transition-all font-bold text-sm",
                  userVote === 'agree'
                    ? "bg-gradient-to-r from-green-500 to-emerald-600 shadow-lg shadow-green-500/50 text-white"
                    : "bg-white/20 backdrop-blur-sm text-white hover:bg-white/30"
                )}
              >
                <ThumbsUp
                  className={cn(
                    "w-5 h-5",
                    userVote === 'agree' && "fill-white"
                  )}
                />
                <span className="drop-shadow-lg">
                  {agreeCount > 0 ? agreeCount : 'Agree'}
                </span>
              </div>
            </motion.button>

            {/* Disagree */}
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={(e) => handleVote('disagree', e)}
              disabled={!currentUserId}
              className="flex-1"
            >
              <div
                className={cn(
                  "h-12 rounded-full flex items-center justify-center gap-2 transition-all font-bold text-sm",
                  userVote === 'disagree'
                    ? "bg-gradient-to-r from-red-500 to-rose-600 shadow-lg shadow-red-500/50 text-white"
                    : "bg-white/20 backdrop-blur-sm text-white hover:bg-white/30"
                )}
              >
                <ThumbsDown
                  className={cn(
                    "w-5 h-5",
                    userVote === 'disagree' && "fill-white"
                  )}
                />
                <span className="drop-shadow-lg">
                  {disagreeCount > 0 ? disagreeCount : 'Disagree'}
                </span>
              </div>
            </motion.button>

            {/* Comment */}
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={handleComment}
              className="flex flex-col items-center gap-1 min-w-[60px]"
            >
              <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                <MessageSquare className="w-6 h-6 text-white" />
              </div>
              <span className="text-xs font-semibold drop-shadow-lg">
                {stats.argumentCount > 0 ? stats.argumentCount : 'Reply'}
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
              <span className="text-xs font-semibold drop-shadow-lg">Share</span>
            </motion.button>
          </div>
        </div>
      </div>

      {/* Responsive Modal/Sheet Components */}
      {isMobile ? (
        <>
          {/* Mobile: Slide-up sheets */}
          <DebateDetailsSheet
            isOpen={showDetailsSheet}
            onClose={() => setShowDetailsSheet(false)}
            onOpenComments={() => {
              setShowDetailsSheet(false);
              setShowCommentsSheet(true);
            }}
            onShare={() => {
              setShowDetailsSheet(false);
              setShowShareSheet(true);
            }}
            debate={{
              id,
              title,
              content,
              imageUrl,
              createdAt: typeof createdAt === 'string' ? createdAt : createdAt.toISOString(),
              creator
            }}
            stats={{
              proVotes: agreeCount,
              conVotes: disagreeCount,
              totalVotes,
              proPercentage: agreePercentage,
              conPercentage: disagreePercentage
            }}
            userVote={userVote}
            onVote={handleVote}
            currentUserId={currentUserId}
          />

          <CommentsSheet
            isOpen={showCommentsSheet}
            onClose={() => setShowCommentsSheet(false)}
            debateId={id}
            debateTitle={title}
            currentUserId={currentUserId}
          />

          <ShareOptionsSheet
            isOpen={showShareSheet}
            onClose={() => setShowShareSheet(false)}
            url={`${typeof window !== 'undefined' ? window.location.origin : ''}/debates/${id}`}
            title={title}
            description={content.substring(0, 100)}
          />
        </>
      ) : (
        <>
          {/* Desktop: Center modals */}
          <DebateDetailsModal
            isOpen={showDetailsSheet}
            onClose={() => setShowDetailsSheet(false)}
            onOpenComments={() => {
              setShowDetailsSheet(false);
              setShowCommentsSheet(true);
            }}
            onShare={() => {
              setShowDetailsSheet(false);
              setShowShareSheet(true);
            }}
            debate={{
              id,
              title,
              content,
              imageUrl,
              createdAt: typeof createdAt === 'string' ? createdAt : createdAt.toISOString(),
              creator
            }}
            stats={{
              proVotes: agreeCount,
              conVotes: disagreeCount,
              totalVotes,
              proPercentage: agreePercentage,
              conPercentage: disagreePercentage
            }}
            userVote={userVote}
            onVote={handleVote}
            currentUserId={currentUserId}
          />

          <CommentsModal
            isOpen={showCommentsSheet}
            onClose={() => setShowCommentsSheet(false)}
            debateId={id}
            debateTitle={title}
            currentUserId={currentUserId}
          />

          <ShareOptionsModal
            isOpen={showShareSheet}
            onClose={() => setShowShareSheet(false)}
            debate={{
              id,
              title,
              content,
              creator
            }}
          />
        </>
      )}
    </motion.div>
  );
}
