"use client";

import { Info } from 'lucide-react';

interface VoteCountDropdownProps {
  side: 'PRO' | 'CON';
  count: number;
  percentage: number;
  votes: DebateVote[];
}

const VoteCountDropdown = ({ side, count, percentage, votes }: VoteCountDropdownProps) => {
  const [open, setOpen] = React.useState(false);
  const ref = React.useRef<HTMLSpanElement>(null);
  const label = side === 'PRO' ? 'agree' : 'disagree';
  const color = side === 'PRO' ? 'text-green-500' : 'text-red-500';
  const filtered = votes.filter(v => v.side === side);

  // Close dropdown on click outside
  React.useEffect(() => {
    if (!open) return;
    function handle(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    window.addEventListener('mousedown', handle);
    return () => window.removeEventListener('mousedown', handle);
  }, [open]);

  return (
    <span className="relative flex items-center gap-1" ref={ref}>
      {side === 'PRO' ? (
        <ThumbsUp className="w-3 h-3 text-green-500" />
      ) : (
        <ThumbsDown className="w-3 h-3 text-red-500" />
      )}
      {count} {label} ({percentage}%)
      <button
        type="button"
        className="ml-1 p-0.5 rounded hover:bg-muted/40 focus:outline-none"
        aria-label={`Show users who ${label}`}
        onClick={e => { e.stopPropagation(); setOpen(v => !v); }}
        tabIndex={0}
      >
        <Info className={color + ' w-3 h-3'} />
      </button>
      {open && (
        <div className="absolute z-50 left-0 mt-2 min-w-[160px] bg-background border border-border rounded shadow-lg p-2 text-xs" onClick={e => e.stopPropagation()}>
          {filtered.length === 0 ? (
            <div>No users</div>
          ) : (
            <ul>
              {filtered.map(v => (
                <li key={v.user.id} className="flex items-center gap-2 py-1">
                  {v.user.image ? (
                    <img src={v.user.image} alt={v.user.name} className="w-5 h-5 rounded-full" />
                  ) : (
                    <span className="w-5 h-5 rounded-full bg-muted flex items-center justify-center text-xs font-bold">
                      {v.user.name?.charAt(0) || '?'}
                    </span>
                  )}
                  <span>@{v.user.username || v.user.name}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </span>
  );
};




import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ThumbsUp, ThumbsDown, MessageCircle, Share2, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { formatDistanceToNow } from 'date-fns';
import { triggerHaptic, hapticPatterns } from '@/lib/animations';
import { cn } from '@/lib/utils';
import { VideoPlayer } from '@/components/ui/video-player';
import { AudioPlayer } from '@/components/ui/audio-player';

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

interface DebateStats {
  proVotes: number;
  conVotes: number;
  totalVotes: number;
  proPercentage: number;
  conPercentage: number;
}

interface DebateUser {
  id: string;
  name: string;
  image?: string;
  username?: string;
}

interface DebateVoteUser {
  id: string;
  name: string;
  image?: string;
  username?: string;
}

interface DebateVote {
  id: string;
  user: DebateVoteUser;
  side: 'PRO' | 'CON';
}

interface DebateDetailsSheetProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenComments: () => void;
  onShare: () => void;
  debate: {
    id: string;
    title: string;
    content: string;
    imageUrl?: string;
    createdAt: string;
    creator: DebateUser;
  };
  stats: DebateStats;
  userVote: 'agree' | 'disagree' | null;
  onVote: (voteType: 'agree' | 'disagree') => void;
  currentUserId?: string | null;
  votes?: DebateVote[]; // <-- pass votes here
}

export function DebateDetailsSheet({
  isOpen,
  onClose,
  onOpenComments,
  onShare,
  debate,
  stats,
  userVote,
  onVote,
  currentUserId,
  votes = []
}: DebateDetailsSheetProps) {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    // Detect mobile viewport
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    // Prevent body scroll when open
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      window.removeEventListener('resize', checkMobile);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  const handleClose = () => {
    triggerHaptic(hapticPatterns.light);
    onClose();
  };

  const handleVote = (voteType: 'agree' | 'disagree') => {
    triggerHaptic(voteType === 'agree' ? [...hapticPatterns.success] : hapticPatterns.medium);
    onVote(voteType);
  };

  const handleComments = () => {
    triggerHaptic(hapticPatterns.medium);
    onOpenComments();
  };

  const handleShare = () => {
    triggerHaptic(hapticPatterns.medium);
    onShare();
  };

  // Mobile: slide up from bottom
  const mobileVariants = {
    hidden: { y: "100%" },
    visible: { y: 0 },
    exit: { y: "100%" }
  };

  // Desktop: modal center
  const desktopVariants = {
    hidden: { opacity: 0, scale: 0.95 },
    visible: { opacity: 1, scale: 1 },
    exit: { opacity: 0, scale: 0.95 }
  };

  const sheetContent = (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-[100]"
            onClick={handleClose}
          />

          {/* Sheet Content */}
          <motion.div
            variants={isMobile ? mobileVariants : desktopVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            transition={{ duration: 0.3, ease: "easeOut" }}
            className={cn(
              "fixed z-[100] bg-background border border-border",
              isMobile
                ? "bottom-0 left-0 right-0 rounded-t-3xl max-h-[85vh]"
                : "top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-2xl w-[90vw] max-w-xl max-h-[75vh] shadow-2xl"
            )}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-border">
              <div className="flex items-center gap-3">
                <Avatar className="w-8 h-8">
                  <AvatarImage src={debate.creator.image} />
                  <AvatarFallback>{debate.creator.name?.charAt(0)}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium text-sm">{debate.creator.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(debate.createdAt), { addSuffix: true })}
                  </p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClose}
                className="w-8 h-8 p-0"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {/* Title */}
              <h2 className="text-xl font-bold leading-tight">{debate.title}</h2>
              
              {/* Content */}
              <p className="text-muted-foreground leading-relaxed">{debate.content}</p>

              {/* Media - Video, Audio, or Image */}
              {debate.imageUrl && (
                <div className="relative rounded-lg overflow-hidden">
                  {isVideoFile(debate.imageUrl) ? (
                    <VideoPlayer
                      src={debate.imageUrl}
                      className="w-full max-h-48 md:max-h-80 rounded-lg"
                      controls={true}
                      autoPlay={false}
                      muted={false}
                    />
                  ) : isAudioFile(debate.imageUrl) ? (
                    <AudioPlayer
                      src={debate.imageUrl}
                      className="w-full"
                    />
                  ) : (
                    <img
                      src={debate.imageUrl}
                      alt="Debate content"
                      className="w-full max-h-48 md:max-h-80 object-cover rounded-lg"
                    />
                  )}
                </div>
              )}

              {/* Vote Statistics */}
              <div className="bg-card border border-border rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-medium">Community Response</span>
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <Users className="w-3 h-3" />
                    {stats.totalVotes} votes
                  </span>
                </div>
                
                {/* Progress Bar */}
                <div className="w-full bg-muted rounded-full h-2 mb-3">
                  <div className="flex h-full rounded-full overflow-hidden">
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
                
                {/* Vote Counts with Info Dropdown */}
                <div className="flex justify-between text-xs text-muted-foreground">
                  <VoteCountDropdown
                    side="PRO"
                    count={stats.proVotes}
                    percentage={stats.proPercentage}
                    votes={votes}
                  />
                  <VoteCountDropdown
                    side="CON"
                    count={stats.conVotes}
                    percentage={stats.conPercentage}
                    votes={votes}
                  />
                </div>
              </div>


            {/* Actions */}
            <div className="border-t border-border p-4 space-y-3">
              {/* Vote Buttons */}
              {currentUserId && (
                <div className="flex gap-3">
                  <Button
                    onClick={() => handleVote('agree')}
                    variant={userVote === 'agree' ? "default" : "outline"}
                    className={cn(
                      "flex-1 h-12",
                      userVote === 'agree' 
                        ? "bg-green-600 hover:bg-green-700 text-white" 
                        : "border-green-200 hover:bg-green-50 text-green-600"
                    )}
                  >
                    <ThumbsUp className="w-4 h-4 mr-2" />
                    Agree
                  </Button>
                  <Button
                    onClick={() => handleVote('disagree')}
                    variant={userVote === 'disagree' ? "default" : "outline"}
                    className={cn(
                      "flex-1 h-12",
                      userVote === 'disagree' 
                        ? "bg-red-600 hover:bg-red-700 text-white" 
                        : "border-red-200 hover:bg-red-50 text-red-600"
                    )}
                  >
                    <ThumbsDown className="w-4 h-4 mr-2" />
                    Disagree
                  </Button>
                </div>
              )}

              {/* Secondary Actions */}
              <div className="flex gap-3">
                <Button
                  onClick={handleComments}
                  variant="outline"
                  className="flex-1 h-10"
                >
                  <MessageCircle className="w-4 h-4 mr-2" />
                  Comments
                </Button>
                <Button
                  onClick={handleShare}
                  variant="outline"
                  className="flex-1 h-10"
                >
                  <Share2 className="w-4 h-4 mr-2" />
                  Share
                </Button>
              </div>
            </div>
          </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );

  // Use portal to render at document root, escaping parent stacking contexts
  if (typeof document === 'undefined') return null;
  return createPortal(sheetContent, document.body);
}