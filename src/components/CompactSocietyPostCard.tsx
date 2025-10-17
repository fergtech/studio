"use client";
import React, { useState, useEffect } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from "@/components/ui/button";
import { MessageSquare, Share2, ThumbsUp, Play, Users } from 'lucide-react';
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

interface CompactSocietyPostCardProps {
  post: {
    id: string;
    type: string;
    content: string;
    createdAt: string | Date;
    imageUrl?: string;
    media?: Array<{
      type: string;
      url: string;
    }>;
    user: {
      id: string;
      name: string;
      image?: string;
    };
    society: {
      id: string;
      name: string;
      image?: string;
    };
  };
  showTimeline?: boolean;
}

export function CompactSocietyPostCard({ post, showTimeline = true }: CompactSocietyPostCardProps) {
  const router = useRouter();
  const { toast } = useToast();
  const { data: session } = useSession();
  const [isDeleting, setIsDeleting] = useState(false);

  const fallback = post.user.name?.substring(0, 2).toUpperCase() || '??';
  const postTime = formatDistanceToNow(
    typeof post.createdAt === 'string' ? new Date(post.createdAt) : post.createdAt,
    { addSuffix: true }
  );
  const isCreator = session?.user?.id === post.user.id;

  // Detect media types
  const hasMedia = (post.media && post.media.length > 0) || post.imageUrl;
  const firstMediaUrl = post.media && post.media.length > 0 ? post.media[0].url : post.imageUrl;
  const isVideo = firstMediaUrl && isVideoFile(firstMediaUrl);

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
      const response = await fetch(`/api/society-posts/${post.id}`, { method: 'DELETE' });
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
          <div className="w-8 h-8 rounded-full bg-indigo-500/20 flex items-center justify-center flex-shrink-0 relative z-10">
            <Users className="w-4 h-4 text-indigo-500" />
          </div>
          <div className="w-0.5 bg-border flex-1 mt-2" />
        </div>
      )}

      {/* Content */}
      <div
        className={cn(
          "flex-1 pb-6 cursor-pointer hover:bg-muted/5 -mx-2 px-2 rounded-lg transition-colors",
          !showTimeline && "ml-11"
        )}
        onClick={navigateToPost}
      >
        {/* Header */}
        <div className="flex items-start justify-between mb-2">
          <div className="flex items-center gap-2">
            <Avatar className="h-8 w-8">
              <AvatarImage src={post.user.image} alt={post.user.name} />
              <AvatarFallback className="text-xs">{fallback}</AvatarFallback>
            </Avatar>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-semibold text-sm">{post.user.name}</span>
                <span className="text-xs text-muted-foreground">in</span>
                <div className="flex items-center gap-1">
                  <Avatar className="h-4 w-4">
                    <AvatarImage src={post.society.image} alt={post.society.name} />
                    <AvatarFallback className="text-[8px]">
                      {post.society.name.substring(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <span className="font-medium text-sm text-indigo-600 dark:text-indigo-400">
                    {post.society.name}
                  </span>
                </div>
              </div>
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
          {hasMedia && firstMediaUrl && (
            <div className="relative rounded-lg overflow-hidden border border-border bg-muted/50 w-full aspect-video">
              {isVideo ? (
                <div className="relative w-full h-full">
                  <video
                    src={firstMediaUrl}
                    className="w-full h-full object-cover"
                    muted
                    preload="metadata"
                    poster={`${firstMediaUrl}#t=0.1`}
                  />
                  <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                    <div className="bg-black/60 rounded-full p-3 backdrop-blur-sm">
                      <Play className="w-5 h-5 text-white fill-white" />
                    </div>
                  </div>
                </div>
              ) : (
                <Image
                  src={firstMediaUrl}
                  alt="Post media"
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                />
              )}
              {post.media && post.media.length > 1 && (
                <div className="absolute top-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded-full backdrop-blur-sm">
                  +{post.media.length - 1}
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
            className="h-8 gap-1.5"
            onClick={(e) => e.stopPropagation()}
          >
            <ThumbsUp className="h-4 w-4" />
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
          </Button>

          <Button
            variant="ghost"
            size="sm"
            className="h-8 gap-1.5"
            onClick={(e) => e.stopPropagation()}
          >
            <Share2 className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
