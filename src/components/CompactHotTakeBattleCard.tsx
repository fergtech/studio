"use client";
import React, { useState } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Flame, Users } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { useSession } from 'next-auth/react';
import { ContentCardMenu } from '@/components/ui/content-card-menu';

interface CompactHotTakeBattleCardProps {
  battle: {
    id: string;
    topic: string;
    title: string;
    description?: string;
    createdAt: Date;
    totalParticipants: number;
    post1Supporters: number;
    post2Supporters: number;
    neutralTakes: number;
    creatorId?: string;
  };
  showTimeline?: boolean;
}

export function CompactHotTakeBattleCard({ battle, showTimeline = true }: CompactHotTakeBattleCardProps) {
  const router = useRouter();
  const { toast } = useToast();
  const { data: session } = useSession();
  const [isDeleting, setIsDeleting] = useState(false);

  const timeAgo = formatDistanceToNow(battle.createdAt, { addSuffix: true });
  const isCreator = session?.user?.id === battle.creatorId;

  const total = battle.post1Supporters + battle.post2Supporters;
  const post1Percentage = total > 0 ? Math.round((battle.post1Supporters / total) * 100) : 50;
  const post2Percentage = 100 - post1Percentage;

  const handleClick = () => {
    sessionStorage.setItem('scrollY', window.scrollY.toString());
    router.push(`/debates/${battle.id}`);
  };

  const handleDelete = async () => {
    if (!isCreator || isDeleting) return;

    if (!confirm(`Are you sure you want to delete this battle? This action cannot be undone.`)) {
      return;
    }

    setIsDeleting(true);
    try {
      const response = await fetch(`/api/debates/${battle.id}`, { method: 'DELETE' });
      if (!response.ok) throw new Error('Failed to delete');

      toast({ title: "Battle deleted successfully" });
      router.refresh();
    } catch (error) {
      toast({ title: "Failed to delete battle", variant: "destructive" });
      setIsDeleting(false);
    }
  };

  return (
    <div className="relative flex gap-3 group">
      {/* Timeline connector */}
      {showTimeline && (
        <div className="flex flex-col items-center">
          <div className="w-8 h-8 rounded-full bg-orange-500/20 flex items-center justify-center flex-shrink-0 relative z-10">
            <Flame className="w-4 h-4 text-orange-500" />
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
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <div className="bg-gradient-to-br from-orange-500 to-red-500 rounded-full p-1.5">
              <Flame className="w-4 h-4 text-white" />
            </div>
            <div>
              <p className="font-semibold text-sm">Hot Take Battle</p>
              <p className="text-xs text-muted-foreground">{timeAgo}</p>
            </div>
          </div>
          <ContentCardMenu
            itemId={battle.id}
            itemType="battle"
            itemName={battle.title}
            isCreator={isCreator}
            onDelete={handleDelete}
          />
        </div>

        {/* Battle Content */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-orange-500/20 text-orange-700 dark:text-orange-300">
              {battle.topic}
            </span>
          </div>

          <h3 className="font-bold text-base line-clamp-1">{battle.title}</h3>

          {battle.description && (
            <p className="text-sm text-muted-foreground line-clamp-2">
              {battle.description}
            </p>
          )}

          {/* Progress Bar */}
          <div className="space-y-1">
            <div className="flex h-2 rounded-full overflow-hidden bg-muted">
              <div
                className="bg-blue-500 transition-all"
                style={{ width: `${post1Percentage}%` }}
              />
              <div
                className="bg-red-500 transition-all"
                style={{ width: `${post2Percentage}%` }}
              />
            </div>
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>{post1Percentage}%</span>
              <span className="flex items-center gap-1">
                <Users className="w-3 h-3" />
                {battle.totalParticipants}
              </span>
              <span>{post2Percentage}%</span>
            </div>
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
            <Flame className="w-3 h-3 mr-1" />
            Join Battle
          </Button>
        </div>
      </div>
    </div>
  );
}
