import React, { useState, useEffect } from 'react';
import { MessageSquare, Share2, Star } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import Link from 'next/link';
import { cn } from '@/lib/utils';

interface Comment {
  id: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  text: string;
  timestamp: string | Date;
}

interface PostSocialPanelProps {
  postId: string;
  currentUserId: string | null;
  postType?: string;
  societyId?: string;
}

export default function PostSocialPanel({ postId, currentUserId, postType = 'general', societyId }: PostSocialPanelProps) {
  // --- Likes ---
  const [interestCount, setInterestCount] = useState(0);
  const [isInterested, setIsInterested] = useState(false);
  // --- Shares ---
  const [shareCount, setShareCount] = useState(0);
  const [hasShared, setHasShared] = useState(false);
  // --- Comments ---
  const [commentsCount, setCommentsCount] = useState(0);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [loadingComments, setLoadingComments] = useState(false);

  // Helper to get API base path
  // For society posts, use the new /api/society-posts/likes endpoint
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
      setCommentsCount(Array.isArray(commentData) ? commentData.length : 0);
    }
    fetchSocialData();
  }, [postId, currentUserId, apiBase, commentsApi]);

  // Fetch comments
  useEffect(() => {
    setLoadingComments(true);
    fetch(commentsApi)
      .then(res => res.json())
      .then(data => {
        setComments(Array.isArray(data) ? data.map((c: any) => ({
          id: c.id,
          userId: c.userId,
          userName: c.user?.name || 'Unknown',
          userAvatar: c.user?.image || undefined,
          text: c.text,
          timestamp: c.createdAt // FIX: use createdAt, not timestamp
        })) : []);
        setCommentsCount(Array.isArray(data) ? data.length : 0);
      })
      .finally(() => setLoadingComments(false));
  }, [postId, commentsApi]);

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

  // Comment submit
  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || !currentUserId) return;
    let res;
    if (postType === 'society' && societyId) {
      res = await fetch(`/api/societies/${societyId}/posts/${postId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: currentUserId, text: newComment })
      });
    } else {
      res = await fetch('/api/general-posts/comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ postId, userId: currentUserId, text: newComment })
      });
    }
    if (res.ok) {
      setNewComment('');
      // Re-fetch comments
      fetch(commentsApi)
        .then(res => res.json())
        .then(data => {
          setComments(Array.isArray(data) ? data.map((c: any) => ({
            id: c.id,
            userId: c.userId,
            userName: c.user?.name || 'Unknown',
            userAvatar: c.user?.image || undefined,
            text: c.text,
            timestamp: c.createdAt // FIX: use createdAt, not timestamp
          })) : []);
          setCommentsCount(Array.isArray(data) ? data.length : 0);
        });
    }
  };

  return (
    <div className="bg-card rounded-lg shadow p-4 flex flex-col h-[540px] md:h-[600px]">
      {/* Comments Section */}
      <div className="flex-1 flex flex-col mb-2">
        <div className="font-semibold text-base mb-2">Comments ({commentsCount})</div>
        <ScrollArea className="flex-1 min-h-0 max-h-[340px] pr-2">
          {loadingComments ? (
            <div className="text-sm text-gray-400">Loading...</div>
          ) : comments.length === 0 ? (
            <div className="text-sm text-gray-400">No comments yet.</div>
          ) : (
            <div className="space-y-4">
              {comments.map(comment => (
                <div key={comment.id} className="flex items-start gap-2">
                  {comment.userName ? (
                    <Link href={`/profile/${comment.userName}`}>
                      <Avatar className="w-7 h-7">
                        {comment.userAvatar ? (
                          <AvatarImage src={comment.userAvatar} alt={comment.userName} />
                        ) : (
                          <AvatarFallback>{comment.userName?.substring(0,2).toUpperCase() || '??'}</AvatarFallback>
                        )}
                      </Avatar>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <div className="text-xs font-medium">{comment.userName}</div>
                        </div>
                        <div className="text-xs text-muted-foreground">{comment.text}</div>
                      </div>
                    </Link>
                  ) : null}
                  <div className="text-[11px] text-gray-500">{typeof comment.timestamp === 'string' ? new Date(comment.timestamp).toLocaleString() : comment.timestamp.toLocaleString()}</div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </div>
      {/* Add Comment */}
      <form onSubmit={handleSubmitComment} className="flex items-center gap-2 mt-2">
        <Textarea
          value={newComment}
          onChange={e => setNewComment(e.target.value)}
          placeholder="Add a comment..."
          className="flex-1 min-h-[36px] max-h-[60px] resize-none"
          rows={1}
        />
        <Button type="submit" size="sm" disabled={!newComment.trim() || !currentUserId}>
          Post
        </Button>
      </form>
      {/* Social Actions */}
      <div className="flex items-center justify-between mt-4 border-t pt-2">
        <button
          className={cn('flex items-center gap-1 text-sm', isInterested ? 'text-primary' : 'text-gray-400 hover:text-primary')}
          onClick={handleInterest}
          disabled={!currentUserId}
        >
          <Star size={18} /> {interestCount}
        </button>
        <button className="flex items-center gap-1 text-sm text-gray-400 cursor-default" disabled>
          <MessageSquare size={18} /> {commentsCount}
        </button>
        <button
          className={cn('flex items-center gap-1 text-sm', hasShared ? 'text-primary' : 'text-gray-400 hover:text-primary')}
          onClick={handleShare}
          disabled={!currentUserId}
        >
          <Share2 size={18} /> {shareCount}
        </button>
      </div>
    </div>
  );
} 