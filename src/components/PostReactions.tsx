import React, { useState, useEffect } from 'react';
import { MessageSquare, Share2, Star, Flame } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface PostReactionsProps {
  postId: string;
  currentUserId: string | null;
  postType?: string;
  societyId?: string;
  societyPostType?: string;
  onCommentClick?: () => void;
}

export default function PostReactions({ 
  postId, 
  currentUserId, 
  postType = 'general', 
  societyId,
  societyPostType,
  onCommentClick 
}: PostReactionsProps) {
  // --- Likes ---
  const [interestCount, setInterestCount] = useState(0);
  const [isInterested, setIsInterested] = useState(false);
  // --- Shares ---
  const [shareCount, setShareCount] = useState(0);
  const [hasShared, setHasShared] = useState(false);
  // --- Comments ---
  const [commentsCount, setCommentsCount] = useState(0);

  // Helper to get API base path
  const apiBase = postType === 'society' ? '/api/society-posts' : '/api/general-posts';

  // Helper to get comments API endpoint
  const commentsApi = postType === 'society' && societyId
    ? `/api/societies/${societyId}/posts/${postId}/comments`
    : `/api/general-posts/comments?postId=${postId}`;

  // Fetch likes, shares, and comments count on mount
  useEffect(() => {
    async function fetchSocialData() {
      // Likes
      const likeRes = await fetch(`${apiBase}/likes?postId=${postId}&userId=${currentUserId || ''}`);
      const likeData = await likeRes.json();
      setInterestCount(likeData.count || 0);
      setIsInterested(likeData.liked || false);
      // Shares
      const shareRes = await fetch(`${apiBase}/shares?postId=${postId}&userId=${currentUserId || ''}`);
      const shareData = await shareRes.json();
      setShareCount(shareData.count || 0);
      setHasShared(shareData.shared || false);
      // Comments count
      const commentRes = await fetch(commentsApi);
      const commentData = await commentRes.json();
      setCommentsCount(commentData.allComments ? commentData.allComments.length : (Array.isArray(commentData) ? commentData.length : 0));
    }
    fetchSocialData();
  }, [postId, currentUserId, apiBase, commentsApi]);

  // Like/Unlike
  const handleInterest = async () => {
    if (!currentUserId) return;
    if (isInterested) {
      await fetch(`${apiBase}/likes`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ postId, userId: currentUserId })
      });
      setInterestCount(c => Math.max(0, c - 1));
      setIsInterested(false);
    } else {
      await fetch(`${apiBase}/likes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ postId, userId: currentUserId })
      });
      setInterestCount(c => c + 1);
      setIsInterested(true);
    }
  };

  // Share/Unshare
  const handleShare = async () => {
    if (!currentUserId) return;
    if (hasShared) {
      await fetch(`${apiBase}/shares`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ postId, userId: currentUserId })
      });
      setShareCount(c => Math.max(0, c - 1));
      setHasShared(false);
    } else {
      await fetch(`${apiBase}/shares`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ postId, userId: currentUserId })
      });
      setShareCount(c => c + 1);
      setHasShared(true);
    }
  };

  return (
    <div className="space-y-4">
      {/* Reaction Buttons - Responsive: Horizontal on mobile, Vertical on desktop */}
      <div className="flex flex-row gap-2 lg:flex-col lg:gap-4">
        {/* Champion/Like Button */}
        <Button
          variant="ghost"
          onClick={handleInterest}
          disabled={!currentUserId}
          className={cn(
            "flex flex-col items-center gap-1 p-2 lg:p-4 h-auto flex-1 lg:flex-none",
            societyPostType === 'IDEA' 
              ? (isInterested ? "text-red-500 bg-red-50" : "text-muted-foreground hover:text-red-500 hover:bg-red-50")
              : (isInterested ? "text-orange-500 bg-orange-50" : "text-muted-foreground hover:text-orange-500 hover:bg-orange-50")
          )}
        >
          {societyPostType === 'IDEA' ? (
            <Flame size={20} className={cn("lg:w-6 lg:h-6", isInterested ? "fill-current" : "")} />
          ) : (
            <Star size={20} className={cn("lg:w-6 lg:h-6", isInterested ? "fill-current" : "")} />
          )}
          <span className="text-xs font-medium">{interestCount}</span>
        </Button>

        {/* Comment Button */}
        <Button
          variant="ghost"
          onClick={onCommentClick}
          className="flex flex-col items-center gap-1 p-2 lg:p-4 h-auto flex-1 lg:flex-none text-muted-foreground hover:text-blue-500 hover:bg-blue-50"
        >
          <MessageSquare size={20} className="lg:w-6 lg:h-6" />
          <span className="text-xs font-medium">{commentsCount}</span>
        </Button>

        {/* Share Button */}
        <Button
          variant="ghost"
          onClick={handleShare}
          disabled={!currentUserId}
          className={cn(
            "flex flex-col items-center gap-1 p-2 lg:p-4 h-auto flex-1 lg:flex-none",
            hasShared ? "text-green-500 bg-green-50" : "text-muted-foreground hover:text-green-500 hover:bg-green-50"
          )}
        >
          <Share2 size={20} className="lg:w-6 lg:h-6" />
          <span className="text-xs font-medium">{shareCount}</span>
        </Button>
      </div>
    </div>
  );
}