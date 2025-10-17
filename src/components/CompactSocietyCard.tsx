"use client";
import React, { useState } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Users } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { useSession } from 'next-auth/react';
import { ContentCardMenu } from '@/components/ui/content-card-menu';

interface CompactSocietyCardProps {
  society: {
    id: string;
    name: string;
    description?: string | null;
    image?: string | null;
    createdAt: Date;
    creator: {
      id: string;
      name: string | null;
      image: string | null;
    } | null;
  };
  showTimeline?: boolean;
}

export function CompactSocietyCard({ society, showTimeline = true }: CompactSocietyCardProps) {
  const router = useRouter();
  const { toast } = useToast();
  const { data: session } = useSession();
  const [isDeleting, setIsDeleting] = useState(false);

  const timeAgo = formatDistanceToNow(society.createdAt, { addSuffix: true });
  const creatorName = society.creator?.name || 'Anonymous';
  const creatorAvatar = society.creator?.image || undefined;
  const isCreator = session?.user?.id === society.creator?.id;

  const handleClick = () => {
    sessionStorage.setItem('scrollY', window.scrollY.toString());
    router.push(`/societies/${society.id}`);
  };

  const handleDelete = async () => {
    if (!isCreator || isDeleting) return;

    if (!confirm(`Are you sure you want to delete "${society.name}"? This action cannot be undone.`)) {
      return;
    }

    setIsDeleting(true);
    try {
      const response = await fetch(`/api/societies/${society.id}`, { method: 'DELETE' });
      if (!response.ok) throw new Error('Failed to delete');

      toast({ title: "Society deleted successfully" });
      router.refresh();
    } catch (error) {
      toast({ title: "Failed to delete society", variant: "destructive" });
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
        onClick={handleClick}
      >
        {/* Header */}
        <div className="flex items-start justify-between mb-2">
          <div className="flex items-center gap-2">
            <Avatar className="h-8 w-8">
              <AvatarImage src={creatorAvatar} alt={creatorName} />
              <AvatarFallback className="text-xs">
                {creatorName.substring(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-semibold text-sm">{creatorName}</span>
                <span className="text-xs text-muted-foreground">created a new society</span>
              </div>
              <p className="text-xs text-muted-foreground">{timeAgo}</p>
            </div>
          </div>
          <ContentCardMenu
            itemId={society.id}
            itemType="society"
            itemName={society.name}
            isCreator={isCreator}
            onDelete={handleDelete}
          />
        </div>

        {/* Society Card - Horizontal with featured image */}
        <div className="relative rounded-lg overflow-hidden h-32 group/card hover:shadow-lg transition-all">
          {/* Background Image */}
          <div
            className="absolute inset-0 bg-cover bg-center transition-transform duration-300 group-hover/card:scale-105"
            style={{
              backgroundImage: society.image
                ? `url(${society.image})`
                : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            }}
          />

          {/* Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />

          {/* Content */}
          <div className="relative h-full p-4 flex flex-col justify-end">
            <div className="flex items-center gap-2 mb-2">
              <div className="bg-indigo-500/20 backdrop-blur-sm rounded-full p-1.5 border border-indigo-500/30">
                <Users className="w-4 h-4 text-indigo-300" />
              </div>
              <span className="text-xs font-medium text-white/90 bg-black/30 backdrop-blur-sm px-2 py-1 rounded-full">
                New Society
              </span>
            </div>

            <h3 className="font-bold text-lg text-white line-clamp-1 mb-1">
              {society.name}
            </h3>

            {society.description && (
              <p className="text-sm text-white/80 line-clamp-2">
                {society.description}
              </p>
            )}
          </div>
        </div>

        {/* Action */}
        <div className="mt-3">
          <Button
            variant="outline"
            size="sm"
            className="h-8"
            onClick={(e) => {
              e.stopPropagation();
              handleClick();
            }}
          >
            <Users className="w-3 h-3 mr-1" />
            View Society
          </Button>
        </div>
      </div>
    </div>
  );
}
