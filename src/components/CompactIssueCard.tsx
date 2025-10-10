"use client";
import React from 'react';
import { Issue } from '@/lib/types';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { AlertTriangle, MoreHorizontal, MapPin } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Button } from "@/components/ui/button";

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
  const creatorName = issue.creator?.name || 'Anonymous';
  const creatorAvatar = issue.creator?.image || undefined;
  const fallback = creatorName.substring(0, 2).toUpperCase();
  const timeAgo = formatDistanceToNow(new Date(issue.createdAt), { addSuffix: true });
  const locationDisplay = getLocationDisplay(issue.location);

  // Determine background - use first media if available
  const hasMedia = issue.media && issue.media.length > 0;
  const backgroundStyle = hasMedia
    ? { backgroundImage: `url(${issue.media[0].url})` }
    : { background: 'linear-gradient(135deg, #ff6b6b 0%, #ee5a24 100%)' }; // Red gradient for issues

  const handleClick = () => {
    sessionStorage.setItem('scrollY', window.scrollY.toString());
    router.push(`/issues/${issue.id}`);
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
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={(e) => e.stopPropagation()}
          >
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </div>

        {/* Issue Card - Horizontal with background */}
        <div
          className="relative rounded-lg overflow-hidden h-32 group/card hover:shadow-lg transition-all"
        >
          {/* Zoom on hover effect */}
          <div
            className="absolute inset-0 bg-cover bg-center transition-transform duration-300 group-hover/card:scale-105"
            style={backgroundStyle}
          />

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
