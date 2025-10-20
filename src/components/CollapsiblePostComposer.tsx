'use client';

import { useState, useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { X, Lightbulb, AlertTriangle, MessageCircle, ChevronDown, Users, Target, Gavel } from 'lucide-react';
import CreatePostForm from './CreatePostForm';
import { cn } from '@/lib/utils';

interface CollapsiblePostComposerProps {
  onPostCreated?: () => void;
  onSuccess?: () => void;
  societyId?: string;
  context?: 'general' | 'society' | 'initiative';
  battleContext?: any;
  initialTopic?: string | null;
  onOpenSocietyModal?: () => void;
  onOpenInitiativeModal?: () => void;
  onOpenDebateTopicModal?: () => void;
}

type ContentType = 'idea' | 'issue' | 'post' | null;

export function CollapsiblePostComposer({
  onPostCreated,
  onSuccess,
  societyId,
  context = 'general',
  battleContext,
  initialTopic,
  onOpenSocietyModal,
  onOpenInitiativeModal,
  onOpenDebateTopicModal,
}: CollapsiblePostComposerProps) {
  const { data: session } = useSession();
  const [isExpanded, setIsExpanded] = useState(false);
  const [selectedContentType, setSelectedContentType] = useState<ContentType>(null);
  const composerRef = useRef<HTMLDivElement>(null);

  // Click outside to collapse
  useEffect(() => {
    if (!isExpanded) return;

    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;

      // Don't close if clicking inside the composer
      if (composerRef.current && composerRef.current.contains(target)) {
        return;
      }

      // Don't close if clicking inside a Popover (portaled content)
      if ((target as HTMLElement).closest?.('[data-radix-popper-content-wrapper]')) {
        return;
      }

      // Close the composer
      setIsExpanded(false);
      setSelectedContentType(null);
    };

    // Add a small delay before attaching the listener to prevent immediate collapse
    const timeout = setTimeout(() => {
      document.addEventListener('mousedown', handleClickOutside);
    }, 100);

    return () => {
      clearTimeout(timeout);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isExpanded]);

  const handleActionClick = (type: ContentType | 'society' | 'initiative' | 'debate') => {
    if (type === 'society') {
      onOpenSocietyModal?.();
    } else if (type === 'initiative') {
      onOpenInitiativeModal?.();
    } else if (type === 'debate') {
      onOpenDebateTopicModal?.();
    } else {
      setSelectedContentType(type);
      setIsExpanded(true);
    }
  };

  // If expanded, show full form - floating at bottom with margin
  if (isExpanded && selectedContentType) {
    return (
      <div className="fixed bottom-4 left-4 right-4 z-50 flex justify-center pointer-events-none">
        <div ref={composerRef} className="w-full max-w-2xl pointer-events-auto">
          <Card className="bg-background/95 backdrop-blur-sm border border-border shadow-2xl rounded-2xl overflow-hidden">
            <div className="relative p-4">
              {/* Close button */}
              <button
                onClick={() => {
                  setIsExpanded(false);
                  setSelectedContentType(null);
                }}
                className="absolute top-3 right-3 z-10 p-2 rounded-full bg-muted hover:bg-muted/80 shadow-sm hover:shadow-md transition-all"
                aria-label="Close composer"
              >
                <X className="h-5 w-5 text-foreground" />
              </button>

              <CreatePostForm
                onPostCreated={() => {
                  onPostCreated?.();
                  setIsExpanded(false);
                  setSelectedContentType(null);
                }}
                onSuccess={() => {
                  onSuccess?.();
                  setIsExpanded(false);
                  setSelectedContentType(null);
                }}
                societyId={societyId}
                context={context}
                battleContext={battleContext}
                initialTopic={initialTopic}
                initialContentType={selectedContentType}
              />
            </div>
          </Card>
        </div>
      </div>
    );
  }

  // Collapsed state - Action button bar
  return (
    <div className="fixed bottom-4 left-4 right-4 z-40 flex justify-center pointer-events-none" data-composer>
      <div className="w-full max-w-4xl pointer-events-auto">
        <Card className="bg-background/95 backdrop-blur-sm border border-border shadow-lg rounded-full overflow-hidden">
          <div className="p-2 sm:p-3 flex items-center justify-between gap-1 sm:gap-2">
            {/* Primary Action Buttons - Horizontally scrollable on small screens */}
            <div className="flex items-center gap-1.5 sm:gap-2 flex-1 overflow-x-auto scrollbar-thin scrollbar-thumb-border scrollbar-track-transparent hover:scrollbar-thumb-primary/50">
              {/* Share Idea Button */}
              <Button
                onClick={() => handleActionClick('idea')}
                className={cn(
                  "flex items-center gap-1.5 sm:gap-2 rounded-full font-medium transition-all flex-shrink-0",
                  "bg-yellow-500/10 border-2 border-yellow-500/30 text-yellow-700 dark:text-yellow-400",
                  "hover:bg-yellow-500/20 hover:scale-105 active:scale-95",
                  "px-3 sm:px-4 py-2 sm:py-2.5 h-auto"
                )}
                variant="ghost"
              >
                <Lightbulb className="h-4 w-4 flex-shrink-0" />
                <span className="hidden sm:inline text-sm">Share Idea</span>
                <span className="sm:hidden text-xs">Idea</span>
              </Button>

              {/* Raise Issue Button */}
              <Button
                onClick={() => handleActionClick('issue')}
                className={cn(
                  "flex items-center gap-1.5 sm:gap-2 rounded-full font-medium transition-all flex-shrink-0",
                  "bg-red-500/10 border-2 border-red-500/30 text-red-700 dark:text-red-300",
                  "hover:bg-red-500/20 hover:scale-105 active:scale-95",
                  "px-3 sm:px-4 py-2 sm:py-2.5 h-auto"
                )}
                variant="ghost"
              >
                <AlertTriangle className="h-4 w-4 flex-shrink-0" />
                <span className="hidden sm:inline text-sm">Raise Issue</span>
                <span className="sm:hidden text-xs">Issue</span>
              </Button>

              {/* Post Update Button */}
              <Button
                onClick={() => handleActionClick('post')}
                className={cn(
                  "flex items-center gap-1.5 sm:gap-2 rounded-full font-medium transition-all flex-shrink-0",
                  "bg-green-500/10 border-2 border-green-500/30 text-green-700 dark:text-green-300",
                  "hover:bg-green-500/20 hover:scale-105 active:scale-95",
                  "px-3 sm:px-4 py-2 sm:py-2.5 h-auto"
                )}
                variant="ghost"
              >
                <MessageCircle className="h-4 w-4 flex-shrink-0" />
                <span className="hidden sm:inline text-sm">Post Update</span>
                <span className="sm:hidden text-xs">Post</span>
              </Button>

              {/* Start Debate Button */}
              <Button
                onClick={() => handleActionClick('debate')}
                className={cn(
                  "flex items-center gap-1.5 sm:gap-2 rounded-full font-medium transition-all flex-shrink-0",
                  "bg-purple-500/10 border-2 border-purple-500/30 text-purple-700 dark:text-purple-300",
                  "hover:bg-purple-500/20 hover:scale-105 active:scale-95",
                  "px-3 sm:px-4 py-2 sm:py-2.5 h-auto"
                )}
                variant="ghost"
              >
                <Gavel className="h-4 w-4 flex-shrink-0" />
                <span className="hidden sm:inline text-sm">Start Debate</span>
                <span className="sm:hidden text-xs">Debate</span>
              </Button>

              {/* Create Society Button - Hidden on smaller screens, shown on lg+ */}
              <Button
                onClick={() => handleActionClick('society')}
                className={cn(
                  "hidden lg:flex items-center gap-1.5 sm:gap-2 rounded-full font-medium transition-all flex-shrink-0",
                  "bg-indigo-500/10 border-2 border-indigo-500/30 text-indigo-700 dark:text-indigo-300",
                  "hover:bg-indigo-500/20 hover:scale-105 active:scale-95",
                  "px-3 sm:px-4 py-2 sm:py-2.5 h-auto"
                )}
                variant="ghost"
              >
                <Users className="h-4 w-4 flex-shrink-0" />
                <span className="text-sm">Create Society</span>
              </Button>

              {/* Start Initiative Button - Hidden on smaller screens, shown on lg+ */}
              <Button
                onClick={() => handleActionClick('initiative')}
                className={cn(
                  "hidden lg:flex items-center gap-1.5 sm:gap-2 rounded-full font-medium transition-all flex-shrink-0",
                  "bg-blue-500/10 border-2 border-blue-500/30 text-blue-700 dark:text-blue-300",
                  "hover:bg-blue-500/20 hover:scale-105 active:scale-95",
                  "px-3 sm:px-4 py-2 sm:py-2.5 h-auto"
                )}
                variant="ghost"
              >
                <Target className="h-4 w-4 flex-shrink-0" />
                <span className="text-sm">Start Initiative</span>
              </Button>
            </div>

            {/* More Dropdown - Only shown on smaller screens */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  className={cn(
                    "lg:hidden flex items-center gap-1.5 rounded-full font-medium transition-all",
                    "bg-muted/50 border-2 border-border/50 text-muted-foreground",
                    "hover:bg-muted hover:scale-105 active:scale-95",
                    "px-4 py-2.5 h-auto"
                  )}
                  variant="ghost"
                >
                  <span className="text-sm hidden sm:inline">More</span>
                  <ChevronDown className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-52">
                <DropdownMenuItem
                  onClick={() => handleActionClick('debate')}
                  className="flex items-center gap-2 cursor-pointer"
                >
                  <Gavel className="h-4 w-4 text-purple-500" />
                  <span>Start Debate</span>
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => handleActionClick('society')}
                  className="flex items-center gap-2 cursor-pointer"
                >
                  <Users className="h-4 w-4 text-indigo-500" />
                  <span>Create Society</span>
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => handleActionClick('initiative')}
                  className="flex items-center gap-2 cursor-pointer"
                >
                  <Target className="h-4 w-4 text-blue-500" />
                  <span>Start Initiative</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </Card>
      </div>
    </div>
  );
}
