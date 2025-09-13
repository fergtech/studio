"use client";

import React, { useState, useEffect } from 'react';
import { Heart, MessageSquare, Share2, Flame } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface SocietyPostReactionsProps {
  postId: string;
  currentUserId: string | null;
  societyId: string;
  postType?: string;
  onCommentClick?: () => void;
  commentsCount?: number;
}

export default function SocietyPostReactions({ 
  postId, 
  currentUserId, 
  societyId,
  postType,
  onCommentClick,
  commentsCount = 0 
}: SocietyPostReactionsProps) {
  const [likeCount, setLikeCount] = useState(0);
  const [isLiked, setIsLiked] = useState(false);
  const [shareCount, setShareCount] = useState(0);
  const [hasShared, setHasShared] = useState(false);
  const [actualCommentsCount, setActualCommentsCount] = useState(0);
  const [loading, setLoading] = useState(true);

  // Fetch initial reaction data
  useEffect(() => {
    async function fetchReactions() {
      try {
        // Fetch likes
        const likesRes = await fetch(`/api/society-posts/likes?postId=${postId}&userId=${currentUserId}`);
        if (likesRes.ok) {
          const likesData = await likesRes.json();
          setLikeCount(likesData.count);
          setIsLiked(likesData.liked);
        }

        // Fetch shares
        const sharesRes = await fetch(`/api/society-posts/shares?postId=${postId}&userId=${currentUserId}`);
        if (sharesRes.ok) {
          const sharesData = await sharesRes.json();
          setShareCount(sharesData.count);
          setHasShared(sharesData.shared);
        }

        // Fetch comments count
        const commentsRes = await fetch(`/api/societies/${societyId}/posts/${postId}/comments`);
        if (commentsRes.ok) {
          const commentsData = await commentsRes.json();
          setActualCommentsCount(commentsData.length);
        }
      } catch (error) {
        console.error('Error fetching reactions:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchReactions();
  }, [postId, currentUserId, societyId]);

  const handleLike = async () => {
    if (!currentUserId) return;

    try {
      const method = isLiked ? 'DELETE' : 'POST';
      const response = await fetch('/api/society-posts/likes', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ postId, userId: currentUserId }),
      });

      if (response.ok) {
        setIsLiked(!isLiked);
        setLikeCount(prev => isLiked ? prev - 1 : prev + 1);
      }
    } catch (error) {
      console.error('Error toggling like:', error);
    }
  };

  const handleShare = async () => {
    if (!currentUserId) return;

    try {
      const method = hasShared ? 'DELETE' : 'POST';
      const response = await fetch('/api/society-posts/shares', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ postId, userId: currentUserId }),
      });

      if (response.ok) {
        setHasShared(!hasShared);
        setShareCount(prev => hasShared ? prev - 1 : prev + 1);
      }
    } catch (error) {
      console.error('Error toggling share:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-between py-2 border-t">
        <div className="flex gap-6">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            {postType === 'IDEA' ? <Flame size={16} /> : <Heart size={16} />}
            <span>...</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <MessageSquare size={16} />
            <span>...</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Share2 size={16} />
            <span>...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-between py-2 border-t">
      <div className="flex gap-6">
        {/* Champion/Like Button */}
        <Button
          variant="ghost"
          size="sm"
          onClick={handleLike}
          disabled={!currentUserId}
          className={cn(
            "flex items-center gap-2 text-sm px-2 h-8",
            postType === 'IDEA' 
              ? (isLiked ? "text-red-500" : "text-muted-foreground hover:text-red-500")
              : (isLiked ? "text-red-500" : "text-muted-foreground hover:text-red-500")
          )}
        >
          {postType === 'IDEA' ? (
            <Flame size={16} className={isLiked ? "fill-current" : ""} />
          ) : (
            <Heart size={16} className={isLiked ? "fill-current" : ""} />
          )}
          <span>{likeCount}</span>
        </Button>

        {/* Comment Button */}
        <Button
          variant="ghost"
          size="sm"
          onClick={onCommentClick}
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary px-2 h-8"
        >
          <MessageSquare size={16} />
          <span>{actualCommentsCount}</span>
        </Button>

        {/* Share Button */}
        <Button
          variant="ghost"
          size="sm"
          onClick={handleShare}
          disabled={!currentUserId}
          className={cn(
            "flex items-center gap-2 text-sm px-2 h-8",
            hasShared ? "text-blue-500" : "text-muted-foreground hover:text-blue-500"
          )}
        >
          <Share2 size={16} />
          <span>{shareCount}</span>
        </Button>
      </div>
    </div>
  );
}