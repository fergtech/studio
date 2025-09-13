import React, { useState, useEffect } from 'react';
import { MessageSquare, PlusCircle, Flame } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface IdeaReactionsProps {
  ideaId: string;
  currentUserId: string | null;
  initialChampionCount: number;
  isInitiallyChampioned: boolean;
  onCommentClick?: () => void;
  onCreateInitiative?: () => void;
}

export default function IdeaReactions({ 
  ideaId, 
  currentUserId, 
  initialChampionCount,
  isInitiallyChampioned,
  onCommentClick,
  onCreateInitiative
}: IdeaReactionsProps) {
  // --- Champions ---
  const [championCount, setChampionCount] = useState(initialChampionCount);
  const [isChampioned, setIsChampioned] = useState(isInitiallyChampioned);
  const [isChampioning, setIsChampioning] = useState(false);

  // Update champion state when props change
  React.useEffect(() => {
    setChampionCount(initialChampionCount);
    setIsChampioned(isInitiallyChampioned);
  }, [initialChampionCount, isInitiallyChampioned]);
  // --- Comments ---
  const [commentsCount, setCommentsCount] = useState(0);

  // Fetch comments count on mount
  useEffect(() => {
    async function fetchCommentCount() {
      try {
        const commentRes = await fetch(`/api/ideas/comments?ideaId=${ideaId}`);
        const commentData = await commentRes.json();
        setCommentsCount(Array.isArray(commentData) ? commentData.length : 0);
      } catch (error) {
        console.error('Failed to fetch comment count:', error);
      }
    }
    fetchCommentCount();
  }, [ideaId]);

  // Champion/unchampion handler
  const handleChampion = async () => {
    if (!currentUserId || isChampioning) return;
    
    setIsChampioning(true);
    try {
      const response = await fetch(`/api/ideas/${ideaId}/champion`, {
        method: isChampioned ? 'DELETE' : 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId: currentUserId }),
      });

      if (response.ok) {
        const data = await response.json();
        setChampionCount(data.championCount);
        setIsChampioned(!isChampioned);
      }
    } catch (error) {
      console.error('Error championing idea:', error);
    } finally {
      setIsChampioning(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Reaction Buttons - Responsive: Horizontal on mobile, Vertical on desktop */}
      <div className="flex flex-row gap-2 lg:flex-col lg:gap-4">
        {/* Champion Button */}
        <Button
          variant="ghost"
          onClick={handleChampion}
          disabled={!currentUserId || isChampioning}
          className={cn(
            "flex flex-col items-center gap-1 p-2 lg:p-4 h-auto flex-1 lg:flex-none",
            isChampioned ? "text-red-500 bg-red-50" : "text-muted-foreground hover:text-red-500 hover:bg-red-50"
          )}
        >
          <Flame size={20} className={cn("lg:w-6 lg:h-6", isChampioned ? "fill-current" : "")} />
          <span className="text-xs font-medium">{isChampioning ? '...' : championCount}</span>
        </Button>

        {/* Comment Button */}
        <Button
          variant="ghost"
          onClick={onCommentClick}
          className="flex flex-col items-center gap-1 p-2 lg:p-4 h-auto flex-1 lg:flex-none text-muted-foreground hover:text-blue-500 hover:bg-blue-50"
        >
          <MessageSquare size={20} className="lg:w-6 lg:h-6" />
          <span className="text-xs font-medium">{commentsCount}</span>
        </Button>

        {/* Create Initiative Button */}
        <Button
          variant="ghost"
          onClick={onCreateInitiative}
          className="flex flex-col items-center gap-1 p-2 lg:p-4 h-auto flex-1 lg:flex-none text-muted-foreground hover:text-green-500 hover:bg-green-50"
        >
          <PlusCircle size={20} className="lg:w-6 lg:h-6" />
          <span className="text-xs font-medium">Initiative</span>
        </Button>
      </div>
    </div>
  );
}