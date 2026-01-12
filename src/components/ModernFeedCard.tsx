'use client';

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { formatDistanceToNow } from 'date-fns';
import { ThumbsUp, ThumbsDown, MessageCircle, Share2 } from 'lucide-react';
import { useState } from 'react';

interface ModernFeedCardProps {
  post: {
    id: string;
    creatorId: string;
    creatorName: string;
    creatorAvatar?: string;
    content: string;
    timestamp: Date;
    media?: Array<{
      url: string;
      type: string;
    }>;
  };
  currentUserId?: string;
  onPostClick?: (post: any) => void;
}

export function ModernFeedCard({ post, currentUserId, onPostClick }: ModernFeedCardProps) {
  const [isLiked, setIsLiked] = useState(false);
  const [isDisliked, setIsDisliked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [dislikeCount, setDislikeCount] = useState(0);

  const mediaItem = post.media && post.media.length > 0 ? post.media[0] : null;
  const isVideo = mediaItem?.type === 'video' || mediaItem?.url?.includes('.mp4') || mediaItem?.url?.includes('.webm');

  const handleLike = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isLiked) {
      setIsLiked(false);
      setLikeCount(prev => prev - 1);
    } else {
      setIsLiked(true);
      setLikeCount(prev => prev + 1);
      if (isDisliked) {
        setIsDisliked(false);
        setDislikeCount(prev => prev - 1);
      }
    }
  };

  const handleDislike = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isDisliked) {
      setIsDisliked(false);
      setDislikeCount(prev => prev - 1);
    } else {
      setIsDisliked(true);
      setDislikeCount(prev => prev + 1);
      if (isLiked) {
        setIsLiked(false);
        setLikeCount(prev => prev - 1);
      }
    }
  };

  const handleShare = (e: React.MouseEvent) => {
    e.stopPropagation();
    // Share functionality
  };

  const handleComment = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onPostClick) {
      onPostClick(post);
    }
  };

  return (
    <div className="relative w-full space-y-3 pb-4">
      {/* Component 1: Media Container - Separate floating artifact */}
      {mediaItem && (
        <div className="relative w-full aspect-video overflow-hidden rounded-2xl bg-gradient-to-br from-muted/30 to-muted/10 border border-border/40 shadow-md backdrop-blur-sm transition-all duration-300 hover:shadow-xl hover:scale-[1.02]">
          {isVideo ? (
            <video
              src={mediaItem.url}
              className="w-full h-full object-cover"
              controls
              playsInline
            />
          ) : (
            <img
              src={mediaItem.url}
              alt="Post media"
              className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
            />
          )}
        </div>
      )}

      {/* Component 2: Author Info + Post Content - Merged into one floating artifact */}
      <div className="p-5 bg-gradient-to-br from-background/95 via-background to-background/90 rounded-2xl border border-border/40 shadow-md backdrop-blur-sm transition-all duration-300 hover:shadow-lg space-y-4">
        {/* Author Info */}
        <div className="flex items-center gap-3">
          <Avatar className="h-11 w-11 ring-2 ring-primary/20 ring-offset-2 ring-offset-background">
            <AvatarImage src={post.creatorAvatar} alt={post.creatorName} />
            <AvatarFallback className="bg-gradient-to-br from-primary/30 to-purple-500/30 text-primary font-semibold">
              {post.creatorName?.charAt(0) || 'U'}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <p className="font-semibold text-foreground">{post.creatorName}</p>
            <p className="text-xs text-muted-foreground">
              {formatDistanceToNow(new Date(post.timestamp), { addSuffix: true })}
            </p>
          </div>
        </div>
        
        {/* Post Content */}
        <p className="text-foreground/90 leading-relaxed whitespace-pre-wrap text-sm">
          {post.content}
        </p>
      </div>

      {/* Component 3: Action Buttons - Centered below content to tie artifacts together */}
      <div className="flex items-center justify-center gap-2 pt-2">
        <button
          onClick={handleLike}
          className={`group flex items-center justify-center w-12 h-12 rounded-full border border-border/40 shadow-md backdrop-blur-sm transition-all duration-300 hover:scale-110 hover:shadow-xl ${
            isLiked
              ? 'bg-gradient-to-br from-green-500/20 to-green-500/10 text-green-600 border-green-500/30'
              : 'bg-gradient-to-br from-background/95 to-background/80 text-muted-foreground hover:text-foreground'
          }`}
          title="Like"
        >
          <ThumbsUp className={`h-5 w-5 transition-transform duration-300 group-hover:scale-110 ${isLiked ? 'fill-current' : ''}`} />
        </button>

        <button
          onClick={handleDislike}
          className={`group flex items-center justify-center w-12 h-12 rounded-full border border-border/40 shadow-md backdrop-blur-sm transition-all duration-300 hover:scale-110 hover:shadow-xl ${
            isDisliked
              ? 'bg-gradient-to-br from-red-500/20 to-red-500/10 text-red-500 border-red-500/30'
              : 'bg-gradient-to-br from-background/95 to-background/80 text-muted-foreground hover:text-foreground'
          }`}
          title="Dislike"
        >
          <ThumbsDown className={`h-5 w-5 transition-transform duration-300 group-hover:scale-110 ${isDisliked ? 'fill-current' : ''}`} />
        </button>

        <button
          onClick={handleComment}
          className="group flex items-center justify-center w-12 h-12 rounded-full bg-gradient-to-br from-background/95 to-background/80 border border-border/40 shadow-md backdrop-blur-sm text-muted-foreground hover:text-foreground transition-all duration-300 hover:scale-110 hover:shadow-xl"
          title="Comment"
        >
          <MessageCircle className="h-5 w-5 transition-transform duration-300 group-hover:scale-110" />
        </button>

        <button
          onClick={handleShare}
          className="group flex items-center justify-center w-12 h-12 rounded-full bg-gradient-to-br from-background/95 to-background/80 border border-border/40 shadow-md backdrop-blur-sm text-muted-foreground hover:text-foreground transition-all duration-300 hover:scale-110 hover:shadow-xl"
          title="Share"
        >
          <Share2 className="h-5 w-5 transition-transform duration-300 group-hover:scale-110" />
        </button>
      </div>

      {/* Subtle separator to distinguish between posts */}
      <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 w-16 h-0.5 bg-gradient-to-r from-transparent via-border/30 to-transparent rounded-full" />
    </div>
  );
}
