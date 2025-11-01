"use client";

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ThumbsUp, ThumbsDown, MessageCircle, Share2, Users, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { formatDistanceToNow } from 'date-fns';
import { triggerHaptic, hapticPatterns } from '@/lib/animations';
import { cn } from '@/lib/utils';
import { VideoPlayer } from '@/components/ui/video-player';
import { AudioPlayer } from '@/components/ui/audio-player';

// Types
interface DebateVote {
  id: string;
  side: 'PRO' | 'CON';
  user: {
    id: string;
    name: string;
    image?: string;
    username?: string;
  };
}

// VoteCountDropdown component (same as in DebateDetailsSheet)
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

interface DebateDetailsModalProps {
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
  votes?: DebateVote[];
}

export function DebateDetailsModal({
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
}: DebateDetailsModalProps) {
  useEffect(() => {
    // Prevent body scroll when open
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
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

  const modalContent = (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 z-[100] backdrop-blur-sm"
            onClick={handleClose}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-full max-w-2xl max-h-[85vh] bg-background border border-border rounded-2xl shadow-2xl flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-border">
              <div className="flex items-center gap-3">
                <Avatar className="w-10 h-10">
                  <AvatarImage src={debate.creator.image} />
                  <AvatarFallback>{debate.creator.name?.charAt(0)}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium">{debate.creator.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {formatDistanceToNow(new Date(debate.createdAt), { addSuffix: true })}
                  </p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClose}
                className="w-8 h-8 p-0 hover:bg-muted"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6 min-h-0">
              {/* Title */}
              <h2 className="text-2xl font-bold leading-tight">{debate.title}</h2>
              
              {/* Content */}
              <p className="text-muted-foreground leading-relaxed text-base">{debate.content}</p>

              {/* Media - Video, Audio, or Image */}
              {debate.imageUrl && (
                <div className="relative rounded-xl overflow-hidden">
                  {isVideoFile(debate.imageUrl) ? (
                    <VideoPlayer
                      src={debate.imageUrl}
                      className="w-full max-h-48 md:max-h-96 rounded-xl"
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
                      className="w-full max-h-48 md:max-h-96 object-cover rounded-xl"
                    />
                  )}
                </div>
              )}

              {/* Vote Statistics */}
              <div className="bg-card border border-border rounded-xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <span className="font-medium">Community Response</span>
                  <span className="text-sm text-muted-foreground flex items-center gap-2">
                    <Users className="w-4 h-4" />
                    {stats.totalVotes} votes
                  </span>
                </div>
                
                {/* Progress Bar */}
                <div className="w-full bg-muted rounded-full h-3 mb-4">
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
                <div className="flex justify-between text-sm text-muted-foreground">
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
            </div>

            {/* Actions - single row layout */}
            <div className="border-t border-border p-6">
              <div className="flex flex-row items-center justify-between gap-6">
                {/* Left group: Agree/Disagree */}
                <div className="flex gap-3">
                  <Button
                    onClick={() => handleVote('agree')}
                    variant={userVote === 'agree' ? "default" : "outline"}
                    className={cn(
                      "h-12 w-28 text-base",
                      userVote === 'agree' 
                        ? "bg-green-600 hover:bg-green-700 text-white" 
                        : "border-green-200 hover:bg-green-50 text-green-600"
                    )}
                  >
                    <ThumbsUp className="w-5 h-5 mr-2" />
                    Agree
                  </Button>
                  <Button
                    onClick={() => handleVote('disagree')}
                    variant={userVote === 'disagree' ? "default" : "outline"}
                    className={cn(
                      "h-12 w-28 text-base",
                      userVote === 'disagree' 
                        ? "bg-red-600 hover:bg-red-700 text-white" 
                        : "border-red-200 hover:bg-red-50 text-red-600"
                    )}
                  >
                    <ThumbsDown className="w-5 h-5 mr-2" />
                    Disagree
                  </Button>
                </div>
                {/* Visual gap between groups */}
                <div className="flex-1" />
                {/* Right group: Arguments/Share */}
                <div className="flex gap-3">
                  <Button
                    onClick={handleComments}
                    variant="outline"
                    className="h-11 w-32 text-base"
                  >
                    <MessageCircle className="w-5 h-5 mr-2" />
                    Arguments
                  </Button>
                  <Button
                    onClick={handleShare}
                    variant="outline"
                    className="h-11 w-24 text-base"
                  >
                    <Share2 className="w-5 h-5 mr-2" />
                    Share
                  </Button>
                </div>
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
  return createPortal(modalContent, document.body);
}