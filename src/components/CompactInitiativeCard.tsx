"use client";
import React, { useState } from 'react';
import { Initiative } from '@/lib/types';
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Target } from 'lucide-react';
import { formatDistanceToNow, parseISO } from 'date-fns';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { useSession } from 'next-auth/react';
import { ContentCardMenu } from '@/components/ui/content-card-menu';

// Helper function to parse and display location data
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

// Status color mapping
const getStatusColor = (status: string | undefined) => {
  switch (status?.toLowerCase()) {
    case 'planning':
      return 'bg-blue-500/80';
    case 'active':
      return 'bg-green-500/80';
    case 'completed':
      return 'bg-purple-500/80';
    case 'on-hold':
      return 'bg-yellow-500/80';
    default:
      return 'bg-gray-500/80';
  }
};

interface CompactInitiativeCardProps {
  initiative: Initiative & { creatorId?: string };
  creatorName?: string;
  creatorAvatarUrl?: string;
  currentUserId?: string;
  showTimeline?: boolean;
}

export function CompactInitiativeCard({
  initiative,
  creatorName = "Creator",
  creatorAvatarUrl,
  currentUserId,
  showTimeline = true
}: CompactInitiativeCardProps) {
  const router = useRouter();
  const { toast } = useToast();
  const { data: session } = useSession();
  const [isDeleting, setIsDeleting] = useState(false);

  const fallback = creatorName.substring(0, 2).toUpperCase();
  const isCreator = session?.user?.id === initiative.creatorId;

  // Handle date formatting
  const timeAgo = initiative.createdAt ?
    formatDistanceToNow(
      typeof initiative.createdAt === 'string'
        ? parseISO(initiative.createdAt)
        : initiative.createdAt instanceof Date
          ? initiative.createdAt
          : new Date(initiative.createdAt as any),
      { addSuffix: true }
    ) : '';

  const locationDisplay = getLocationDisplay(initiative.location);

  // Determine background image or gradient
  const backgroundStyle = initiative.featuredImageUrl
    ? { backgroundImage: `url(${initiative.featuredImageUrl})` }
    : { background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' };

  const handleClick = () => {
    sessionStorage.setItem('scrollY', window.scrollY.toString());
    router.push(`/initiatives/${initiative.id}`);
  };

  const handleDelete = async () => {
    if (!isCreator || isDeleting) return;

    if (!confirm(`Are you sure you want to delete "${initiative.title}"? This action cannot be undone.`)) {
      return;
    }

    setIsDeleting(true);
    try {
      const response = await fetch(`/api/initiatives/${initiative.id}`, { method: 'DELETE' });
      if (!response.ok) throw new Error('Failed to delete');

      toast({ title: "Initiative deleted successfully" });
      router.refresh();
    } catch (error) {
      toast({ title: "Failed to delete initiative", variant: "destructive" });
      setIsDeleting(false);
    }
  };

  return (
    <div className="relative flex gap-3 group">
      {/* Timeline connector */}
      {showTimeline && (
        <div className="flex flex-col items-center">
          <div className="w-8 h-8 rounded-full bg-purple-500/20 flex items-center justify-center flex-shrink-0 relative z-10">
            <Target className="w-4 h-4 text-purple-500" />
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
              <AvatarImage src={creatorAvatarUrl} alt={creatorName} />
              <AvatarFallback className="text-xs">{fallback}</AvatarFallback>
            </Avatar>
            <div>
              <p className="font-semibold text-sm">{creatorName}</p>
              <p className="text-xs text-muted-foreground">{timeAgo}</p>
            </div>
          </div>
          <ContentCardMenu
            itemId={initiative.id}
            itemType="initiative"
            itemName={initiative.title}
            isCreator={isCreator}
            onDelete={handleDelete}
          />
        </div>

        {/* Initiative Card - Horizontal with background */}
        <div
          className="relative rounded-lg overflow-hidden h-32 group/card hover:shadow-lg transition-all"
          style={backgroundStyle}
        >
          {/* Zoom on hover effect */}
          <div
            className="absolute inset-0 bg-cover bg-center transition-transform duration-300 group-hover/card:scale-105"
            style={backgroundStyle}
          />

          {/* Dark overlay */}
          <div className="absolute inset-0 bg-black/40" />

          {/* Status Badge - Top Right */}
          {initiative.status && (
            <div className="absolute top-2 right-2 z-10">
              <Badge className={cn("text-white border-0", getStatusColor(initiative.status))}>
                {initiative.status}
              </Badge>
            </div>
          )}

          {/* Content Overlay */}
          <div className="relative z-10 p-4 h-full flex flex-col justify-end text-white">
            <h3 className="font-bold text-lg mb-1 line-clamp-1">
              {initiative.title}
            </h3>
            <p className="text-sm opacity-90 line-clamp-2">
              {initiative.description}
            </p>
            {locationDisplay && (
              <p className="text-xs opacity-75 mt-1">
                📍 {locationDisplay}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
