"use client";
import React, { useState } from 'react';
import { Idea } from '@/lib/types';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Lightbulb, MapPin } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Button } from "@/components/ui/button";
import Image from 'next/image';
import { useToast } from '@/hooks/use-toast';
import { useSession } from 'next-auth/react';
import { ContentCardMenu } from '@/components/ui/content-card-menu';

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

interface CompactIdeaCardProps {
  idea: Idea;
  currentUserId?: string;
  showTimeline?: boolean;
}

export function CompactIdeaCard({ idea, currentUserId, showTimeline = true }: CompactIdeaCardProps) {
  const router = useRouter();
  const { toast } = useToast();
  const { data: session } = useSession();
  const [isDeleting, setIsDeleting] = useState(false);

  const creatorName = idea.creator?.name || 'Anonymous';
  const creatorAvatar = idea.creator?.image || undefined;
  const fallback = creatorName.substring(0, 2).toUpperCase();

  // Safely handle timestamp formatting
  let timeAgo = 'recently';
  try {
    const timestamp = new Date(idea.createdAt);
    if (!isNaN(timestamp.getTime())) {
      timeAgo = formatDistanceToNow(timestamp, { addSuffix: true });
    }
  } catch (error) {
    console.error('Invalid timestamp for idea:', idea.id, idea.createdAt);
  }

  const locationDisplay = getLocationDisplay(idea.location);
  const isCreator = session?.user?.id === idea.creatorId;

  // Determine background - use first media if available
  const hasMedia = idea.media && idea.media.length > 0;
  const backgroundStyle = hasMedia
    ? { backgroundImage: `url(${idea.media[0].url})` }
    : { background: 'linear-gradient(135deg, #4ecdc4 0%, #44a08d 100%)' }; // Teal gradient for ideas

  const handleClick = () => {
    sessionStorage.setItem('scrollY', window.scrollY.toString());
    router.push(`/ideas/${idea.id}`);
  };

  const handleDelete = async () => {
    if (!isCreator || isDeleting) return;

    if (!confirm(`Are you sure you want to delete "${idea.title}"? This action cannot be undone.`)) {
      return;
    }

    setIsDeleting(true);
    try {
      const response = await fetch(`/api/ideas/${idea.id}`, { method: 'DELETE' });
      if (!response.ok) throw new Error('Failed to delete');

      toast({ title: "Idea deleted successfully" });
      router.refresh();
    } catch (error) {
      toast({ title: "Failed to delete idea", variant: "destructive" });
      setIsDeleting(false);
    }
  };

  return (
    <div className="relative flex gap-3 group">
      {/* Timeline connector */}
      {showTimeline && (
        <div className="flex flex-col items-center">
          <div className="w-8 h-8 rounded-full bg-teal-500/20 flex items-center justify-center flex-shrink-0 relative z-10">
            <Lightbulb className="w-4 h-4 text-teal-500" />
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
            itemId={idea.id}
            itemType="idea"
            itemName={idea.title}
            isCreator={isCreator}
            onDelete={handleDelete}
          />
        </div>

        {/* Idea Card - Horizontal with background */}
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
            <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-teal-500 text-white border-0">
              Idea
            </span>
          </div>

          {/* Content Overlay */}
          <div className="relative z-10 p-4 h-full flex flex-col justify-end text-white">
            <h3 className="font-bold text-lg mb-1 line-clamp-1">
              {idea.title}
            </h3>
            <p className="text-sm opacity-90 line-clamp-2">
              {idea.description || ''}
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
