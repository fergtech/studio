"use client";
import React, { useState, useEffect } from 'react';
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

  const fallback = post.creatorName?.substring(0, 2).toUpperCase() || '??';
  const postTime = formatDistanceToNow(new Date(post.timestamp), { addSuffix: true });
  const isCreator = session?.user?.id === post.creatorId;

  // Social stats
  const [interestCount, setInterestCount] = useState(0);
  const [isInterested, setIsInterested] = useState(false);
  const [shareCount, setShareCount] = useState(0);
  const [commentsCount, setCommentsCount] = useState(0);

  // Detect media types
  const hasMedia = post.media && post.media.length > 0;
  const firstMedia = hasMedia ? post.media[0] : null;
  const isVideo = firstMedia && isVideoFile(firstMedia.url);

  // Fetch social data
  useEffect(() => {
    async function fetchSocialData() {
      try {
        const [likeRes, shareRes, commentRes] = await Promise.all([
          fetch(`/api/general-posts/likes?postId=${post.id}&userId=${currentUserId || ''}`),
          fetch(`/api/general-posts/shares?postId=${post.id}&userId=${currentUserId || ''}`),
          fetch(`/api/general-posts/comments?postId=${post.id}`)
        ]);

        const [likeData, shareData, commentData] = await Promise.all([
          likeRes.json(),
          shareRes.json(),
          commentRes.json()
        ]);

        setInterestCount(likeData.count || 0);
        setIsInterested(likeData.liked || false);
        setShareCount(shareData.count || 0);
        setCommentsCount(commentData.allComments ? commentData.allComments.length : 0);
      } catch (error) {
        console.error('Error fetching social data:', error);
      }
    }
    fetchSocialData();
  }, [post.id, currentUserId]);

  const handleLike = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const newState = !isInterested;
    setIsInterested(newState);
    setInterestCount(prev => newState ? prev + 1 : prev - 1);

    try {
      await fetch('/api/general-posts/likes', {
        method: newState ? 'POST' : 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ postId: post.id, userId: currentUserId })
      });
    } catch (error) {
      // Revert on error
      setIsInterested(!newState);
      setInterestCount(prev => newState ? prev - 1 : prev + 1);
    }
  };

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
      const response = await fetch(`/api/general-posts/${post.id}`, { method: 'DELETE' });
      if (!response.ok) throw new Error('Failed to delete');

      toast({ title: "Post deleted successfully" });
      router.refresh();
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
      <div
        className={cn(
          "flex-1 pb-6 cursor-pointer hover:bg-muted/5 -mx-2 px-2 rounded-lg transition-colors",
          !showTimeline && "ml-11" // Indent if no timeline
        )}
        onClick={navigateToPost}
      >
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
                    src={firstMedia!.url}
                    className="w-full h-full object-cover"
                    muted
                    preload="metadata"
                    poster={`${firstMedia!.url}#t=0.1`}
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

        {/* Actions */}
        <div className="flex items-center gap-4 mt-3">
          <Button
            variant="ghost"
            size="sm"
            className={cn("h-8 gap-1.5", isInterested && "text-primary")}
            onClick={handleLike}
          >
            <ThumbsUp className={cn("h-4 w-4", isInterested && "fill-current")} />
            {interestCount > 0 && <span className="text-xs">{interestCount}</span>}
          </Button>

          <Button
            variant="ghost"
            size="sm"
            className="h-8 gap-1.5"
            onClick={(e) => {
              e.stopPropagation();
              navigateToPost();
            }}
          >
            <MessageSquare className="h-4 w-4" />
            {commentsCount > 0 && <span className="text-xs">{commentsCount}</span>}
          </Button>

          <Button
            variant="ghost"
            size="sm"
            className="h-8 gap-1.5"
            onClick={(e) => {
              e.stopPropagation();
              // TODO: Share functionality
            }}
          >
            <Share2 className="h-4 w-4" />
            {shareCount > 0 && <span className="text-xs">{shareCount}</span>}
          </Button>
        </div>
      </div>
    </div>
  );
}
