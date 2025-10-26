"use client";
import React, { useState, useEffect, useRef } from 'react';
import { Issue } from '@/lib/types';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { AlertTriangle, MapPin, Play } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { useSession } from 'next-auth/react';
import { ContentCardMenu } from '@/components/ui/content-card-menu';
import Image from 'next/image';

// Helper function to detect video files
const isVideoFile = (url: string) => {
  if (!url) return false;
  const videoExtensions = ['.mp4', '.webm', '.mov', '.avi', '.mkv', '.wmv', '.flv', '.m4v'];
  const lowerUrl = url.toLowerCase();
  return videoExtensions.some(ext => lowerUrl.includes(ext));
};

// Helper function to safely parse and display location
const getLocationDisplay = (location: string | null | undefined): string | null => {
  if (!location) return null;
  try {
    const parsed = JSON.parse(location);
    if (parsed.name) return parsed.name;
    if (parsed.address) return parsed.address;
    return null;
  } catch {
    return location;
  }
};

interface CompactIssueCardProps {
  issue: Issue;
  currentUserId?: string;
  showTimeline?: boolean;
}

export function CompactIssueCard({ issue, currentUserId, showTimeline = true }: CompactIssueCardProps) {
  const router = useRouter();
  const { toast } = useToast();
  const { data: session } = useSession();
  const [isDeleting, setIsDeleting] = useState(false);

  // Video autoplay state
  const videoRef = useRef<HTMLVideoElement>(null);
  const [hasVideoStarted, setHasVideoStarted] = useState(false);
  const [isInView, setIsInView] = useState(false);

  const creatorName = issue.creator?.name || 'Anonymous';
  const creatorAvatar = issue.creator?.image || undefined;
  const fallback = creatorName.substring(0, 2).toUpperCase();

  // Safely handle timestamp formatting
  let timeAgo = 'recently';
  try {
    const timestamp = new Date(issue.createdAt);
    if (!isNaN(timestamp.getTime())) {
      timeAgo = formatDistanceToNow(timestamp, { addSuffix: true });
    }
  } catch (error) {
    console.error('Invalid timestamp for issue:', issue.id, issue.createdAt);
  }

  const locationDisplay = getLocationDisplay(issue.location);
  const isCreator = session?.user?.id === issue.creatorId;

  // Determine background - use first media if available
  const hasMedia = issue.media && issue.media.length > 0;
  const firstMedia = hasMedia ? issue.media[0] : null;
  const isVideo = firstMedia && isVideoFile(firstMedia.url);
  const isImage = firstMedia && !isVideo;
  
  const backgroundStyle = isImage
    ? { backgroundImage: `url(${firstMedia.url})` }
    : { background: 'linear-gradient(135deg, #ff6b6b 0%, #ee5a24 100%)' }; // Red gradient for issues

  // Intersection Observer for video autoplay optimization
  useEffect(() => {
    if (!isVideo || !videoRef.current) return;

    const video = videoRef.current;
    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        setIsInView(entry.isIntersecting);
        
        if (entry.isIntersecting) {
          // Only start playing when video comes into view
          video.play().catch(() => {
            console.log('Autoplay failed for video in view');
          });
        } else {
          // Pause when out of view to save resources
          video.pause();
        }
      },
      { threshold: 0.5 } // Play when 50% of video is visible
    );

    observer.observe(video);

    return () => {
      observer.unobserve(video);
    };
  }, [isVideo]);

  const handleClick = () => {
    sessionStorage.setItem('scrollY', window.scrollY.toString());
    router.push(`/issues/${issue.id}`);
  };

  const handleDelete = async () => {
    if (!isCreator || isDeleting) return;

    if (!confirm(`Are you sure you want to delete "${issue.title}"? This action cannot be undone.`)) {
      return;
    }

    setIsDeleting(true);
    try {
      const response = await fetch(`/api/issues/${issue.id}`, { method: 'DELETE' });
      if (!response.ok) throw new Error('Failed to delete');

      toast({ title: "Issue deleted successfully" });

      // Dispatch global delete event for immediate feed update
      window.dispatchEvent(new CustomEvent('feed:itemDeleted', {
        detail: { id: issue.id }
      }));

      router.refresh();
    } catch (error) {
      toast({ title: "Failed to delete issue", variant: "destructive" });
      setIsDeleting(false);
    }
  };

  return (
    <div className="relative flex gap-3 group">
      {/* Timeline connector */}
      {showTimeline && (
        <div className="flex flex-col items-center">
          <div className="w-8 h-8 rounded-full bg-red-500/20 flex items-center justify-center flex-shrink-0 relative z-10">
            <AlertTriangle className="w-4 h-4 text-red-500" />
          </div>
          <div className="w-0.5 bg-border flex-1 mt-2" />
        </div>
      )}

      {/* Content */}
      <div
        className={cn(
          "flex-1 pb-6 cursor-pointer",
          !showTimeline && "ml-11"
        )}
        onClick={handleClick}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Avatar className="h-8 w-8">
              <AvatarImage src={creatorAvatar} alt={creatorName} />
              <AvatarFallback className="text-xs">{fallback}</AvatarFallback>
            </Avatar>
            <div>
              <p className="font-semibold text-sm">{creatorName}</p>
              <p className="text-xs text-muted-foreground">{timeAgo}</p>
            </div>
          </div>
          <ContentCardMenu
            itemId={issue.id}
            itemType="issue"
            itemName={issue.title}
            isCreator={isCreator}
            onDelete={handleDelete}
          />
        </div>

        {/* Issue Card - Horizontal with background */}
        <div
          className="relative rounded-lg overflow-hidden h-32 group/card hover:shadow-lg transition-all"
        >
          {/* Video Background */}
          {isVideo ? (
            <div className="absolute inset-0">
              <video
                ref={videoRef}
                src={firstMedia!.url}
                className="w-full h-full object-cover transition-transform duration-300 group-hover/card:scale-105"
                muted
                playsInline
                loop
                preload="metadata"
                onLoadedMetadata={(e) => {
                  // Seek to 0.5 seconds to show a better preview frame
                  const video = e.target as HTMLVideoElement;
                  video.currentTime = 0.5;
                }}
              />
              {/* Video Play Icon */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="bg-black/60 rounded-full p-3 backdrop-blur-sm">
                  <Play className="w-5 h-5 text-white fill-white" />
                </div>
              </div>
            </div>
          ) : (
            /* Image/Gradient Background */
            <div
              className="absolute inset-0 bg-cover bg-center transition-transform duration-300 group-hover/card:scale-105"
              style={backgroundStyle}
            />
          )}

          {/* Dark overlay */}
          <div className="absolute inset-0 bg-black/40" />

          {/* Type Badge - Top Right */}
          <div className="absolute top-2 right-2 z-10">
            <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-red-500 text-white border-0">
              Issue
            </span>
          </div>

          {/* Content Overlay */}
          <div className="relative z-10 p-4 h-full flex flex-col justify-end text-white">
            <h3 className="font-bold text-lg mb-1 line-clamp-1">
              {issue.title}
            </h3>
            <p className="text-sm opacity-90 line-clamp-2">
              {issue.description || ''}
            </p>
            {locationDisplay && (
              <p className="text-xs opacity-75 mt-1 flex items-center gap-1">
                <MapPin className="w-3 h-3" />
                {locationDisplay}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
