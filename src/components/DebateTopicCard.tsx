"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MessageCircle, Users, TrendingUp, Play, Volume2, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { ContentCardMenu } from '@/components/ui/content-card-menu';
import { checkDebateUnlockStatus } from '@/lib/gamification';

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

interface DebateTopicCardProps {
  id: string;
  title: string;
  content: string;
  imageUrl?: string;
  creator: {
    id: string;
    name: string;
    image?: string;
    username?: string;
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
  className?: string;
  onDelete?: (id: string) => void;
}

export function DebateTopicCard({
  id,
  title,
  content,
  imageUrl,
  creator,
  createdAt,
  stats,
  className,
  onDelete,
}: DebateTopicCardProps) {
  const { data: session } = useSession();
  const router = useRouter();
  const { toast } = useToast();
  const [isDeleting, setIsDeleting] = useState(false);

  const isCreator = session?.user?.id === creator.id;

  const handleDelete = async () => {
    if (!isCreator || isDeleting) return;

    if (!confirm(`Are you sure you want to delete "${title}"? This action cannot be undone.`)) {
      return;
    }

    setIsDeleting(true);

    try {
      const response = await fetch(`/api/debates/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete debate topic');
      }

      toast({
        title: 'Debate Deleted',
        description: 'Your debate topic has been successfully deleted.',
      });

      // Dispatch global delete event for immediate feed update
      window.dispatchEvent(new CustomEvent('feed:itemDeleted', {
        detail: { id }
      }));

      // Call the onDelete callback if provided
      onDelete?.(id);

      // Trigger a feed update event
      window.dispatchEvent(new CustomEvent('feed:itemDeleted', {
        detail: { id, type: 'debate' }
      }));

      // Optionally navigate away if on debate detail page
      if (window.location.pathname.includes(`/debates/${id}`)) {
        router.push('/');
      }
    } catch (error) {
      console.error('Error deleting debate topic:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete debate topic. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsDeleting(false);
    }
  };
  const timeAgo = formatDistanceToNow(
    typeof createdAt === 'string' ? new Date(createdAt) : createdAt,
    { addSuffix: true }
  );

  // Truncate content for preview
  const truncatedContent = content.length > 120 
    ? content.substring(0, 120) + '...' 
    : content;

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  // Get avatar URL with fallback to user initials (no mock data)
  const getAvatarUrl = (sessionImage?: string | null) => {
    return sessionImage || undefined;
  };

  // Determine media type
  const hasMedia = imageUrl;
  const isVideo = hasMedia && isVideoFile(imageUrl);
  const isAudio = hasMedia && isAudioFile(imageUrl);
  const isImage = hasMedia && !isVideo && !isAudio;

  // Check if this debate has reached the threshold to unlock Initiative creation
  const unlockStatus = checkDebateUnlockStatus(stats.proVotes, stats.conVotes);

  const handleCreateInitiative = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    // Pre-fill initiative creation with debate context
    const params = new URLSearchParams({
      fromDebate: id,
      title: title,
      description: content,
    });

    router.push(`/?createInitiative=true&${params.toString()}`);
  };

  return (
    <Link href={`/debates/${id}`}>
      <div className={cn(
        "bg-card border border-border rounded-lg overflow-hidden hover:shadow-md transition-all duration-200 cursor-pointer",
        "hover:border-primary/20 hover:-translate-y-0.5 relative",
        className
      )}>
        {/* Background Image */}
        {isImage && (
          <div className="absolute inset-0 z-0">
            <div 
              className="w-full h-full bg-cover bg-center bg-no-repeat"
              style={{ backgroundImage: `url(${imageUrl})` }}
            />
            <div className="absolute inset-0 bg-black/60" /> {/* Dark overlay for text readability */}
          </div>
        )}

        {/* Video Preview */}
        {isVideo && (
          <div className="absolute inset-0 z-0">
            <video
              src={imageUrl}
              className="w-full h-full object-cover"
              style={{ 
                maxHeight: '100%',
                pointerEvents: 'none' // Video won't capture any events
              }}
              muted={true}
              preload="metadata"
            />
            <div className="absolute inset-0 bg-black/60" /> {/* Dark overlay for text readability */}
            {/* Play Icon Overlay */}
            <div className="absolute inset-0 flex items-center justify-center z-10">
              <div className="bg-black/60 rounded-full p-3 backdrop-blur-sm">
                <Play className="w-6 h-6 text-white fill-white" />
              </div>
            </div>
          </div>
        )}

        {/* Audio Background */}
        {isAudio && (
          <div className="absolute inset-0 z-0">
            <div className="w-full h-full bg-gradient-to-br from-purple-600 to-blue-600" />
            <div className="absolute inset-0 bg-black/40" /> {/* Dark overlay for text readability */}
            {/* Audio Icon Overlay */}
            <div className="absolute inset-0 flex items-center justify-center z-10">
              <div className="bg-black/60 rounded-full p-3 backdrop-blur-sm">
                <Volume2 className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>
        )}
        
        <div className={cn(
          "relative z-10 p-4",
          hasMedia && "text-white"
        )}>
        {/* Header with creator info */}
        <div className="flex items-center gap-3 mb-3">
          <Avatar className="w-8 h-8">
            <AvatarImage
              src={getAvatarUrl(creator.image)}
              alt={creator.name}
            />
            <AvatarFallback className="text-xs">
              {getInitials(creator.name)}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{creator.name}</p>
            <p className="text-xs text-muted-foreground">{timeAgo}</p>
          </div>
          <Badge variant="outline" className="text-xs">
            Debate
          </Badge>
          {isCreator && (
            <ContentCardMenu
              itemId={id}
              itemName={title}
              onDelete={handleDelete}
              itemType="debate"
              isCreator={isCreator}
            />
          )}
        </div>

        {/* Title */}
        <h3 className="font-semibold text-base mb-2 line-clamp-2 leading-tight">
          {title}
        </h3>

        {/* Content preview */}
        <p className="text-sm text-muted-foreground mb-4 line-clamp-3 leading-relaxed">
          {truncatedContent}
        </p>

        {/* Progress bar for PRO vs CON */}
        {stats.totalVotes > 0 && (
          <div className="mb-3">
            <div className="flex justify-between text-xs text-muted-foreground mb-1">
              <span className="text-green-600 font-medium">
                PRO {stats.proPercentage}%
              </span>
              <span className="text-red-600 font-medium">
                CON {stats.conPercentage}%
              </span>
            </div>
            <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
              <div className="h-full flex">
                <div 
                  className="bg-green-500 transition-all duration-300"
                  style={{ width: `${stats.proPercentage}%` }}
                />
                <div 
                  className="bg-red-500 transition-all duration-300"
                  style={{ width: `${stats.conPercentage}%` }}
                />
              </div>
            </div>
          </div>
        )}

        {stats.totalVotes === 0 && (
          <div className="mb-3">
            <div className="w-full bg-muted rounded-full h-2">
              <div className="h-full bg-gray-300" />
            </div>
            <p className="text-xs text-muted-foreground mt-1 text-center">
              No votes yet - be the first to weigh in!
            </p>
          </div>
        )}

        {/* Stats footer */}
        <div className={cn(
          "flex items-center justify-between text-xs",
          hasMedia ? "text-white/80" : "text-muted-foreground"
        )}>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1">
              <Users className="w-3 h-3" />
              <span>{stats.totalVotes} votes</span>
            </div>
            <div className="flex items-center gap-1">
              <MessageCircle className="w-3 h-3" />
              <span>{stats.argumentCount} arguments</span>
            </div>
          </div>
          {(stats.totalVotes > 50 || stats.argumentCount > 20) && (
            <div className={cn(
              "flex items-center gap-1",
              hasMedia ? "text-orange-300" : "text-orange-600"
            )}>
              <TrendingUp className="w-3 h-3" />
              <span>Hot</span>
            </div>
          )}
        </div>

        {/* Initiative Unlock Button (Progressive Disclosure!) */}
        {unlockStatus.canUnlockSociety && (
          <div className="mt-4 pt-4 border-t border-border">
            <div className="bg-gradient-to-r from-purple-500/10 to-blue-500/10 border border-purple-500/30 rounded-lg p-3">
              <div className="flex items-center gap-2 mb-2">
                <Sparkles className="w-4 h-4 text-purple-500" />
                <span className="text-sm font-semibold text-purple-700 dark:text-purple-300">
                  Unlock Achieved!
                </span>
              </div>
              <p className="text-xs text-muted-foreground mb-3">
                This debate reached {stats.totalVotes} votes with {unlockStatus.currentAgreementPct}% agreement!
                You can now start an initiative to address this topic.
              </p>
              <Button
                onClick={handleCreateInitiative}
                size="sm"
                className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white"
              >
                <Users className="w-4 h-4 mr-2" />
                Create Initiative
              </Button>
            </div>
          </div>
        )}
        </div>
      </div>
    </Link>
  );
}