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
import { X, Lightbulb, AlertTriangle, MessageCircle, ChevronDown, Users, Target, Gavel, LogIn, Plus } from 'lucide-react';
import CreatePostForm from './CreatePostForm';
import { cn } from '@/lib/utils';
import Link from 'next/link';

interface CollapsiblePostComposerProps {
  onPostCreated?: (post?: any) => void;
  onSuccess?: (post?: any) => void;
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
                onPostCreated={(post) => {
                  onPostCreated?.(post);  // Pass the post through!
                  setIsExpanded(false);
                  setSelectedContentType(null);
                }}
                onSuccess={(post) => {
                  onSuccess?.(post);  // Pass the post through!
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

  // Guest mode - show CTA to sign in
  if (!session?.user) {
    return (
      <div className="fixed bottom-4 left-4 right-4 z-40 flex justify-center pointer-events-none" data-composer>
        <div className="w-full max-w-4xl pointer-events-auto">
          <Card className="bg-background/95 backdrop-blur-sm border border-border shadow-lg rounded-2xl overflow-hidden">
            <div className="p-4 sm:p-6 text-center">
              <p className="text-muted-foreground mb-4">
                Sign in to share ideas, raise issues, and create posts
              </p>
              <div className="flex gap-3 justify-center">
                <Button asChild variant="default">
                  <Link href="/register">Sign Up</Link>
                </Button>
                <Button asChild variant="outline">
                  <Link href="/login">
                    <LogIn className="h-4 w-4 mr-2" />
                    Log In
                  </Link>
                </Button>
              </div>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  // Collapsed state - FAB
  return (
    <div className="fixed bottom-6 right-6 z-40" data-composer>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            className={cn(
              "rounded-full h-16 w-16 bg-primary text-primary-foreground shadow-lg hover:bg-primary/90 hover:scale-105 active:scale-95 transition-all flex items-center justify-center"
            )}
          >
            <Plus className="h-8 w-8" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-64 rounded-2xl border border-border/50 shadow-xl bg-background/95 backdrop-blur-sm mb-2">
          <div className="p-2 space-y-1">
            <DropdownMenuItem
              onClick={() => handleActionClick('idea')}
              className="flex items-center gap-3 cursor-pointer p-3 rounded-xl hover:bg-yellow-500/10 transition-colors"
            >
              <div className="flex items-center justify-center w-8 h-8 rounded-full bg-yellow-500/10">
                <Lightbulb className="h-4 w-4 text-yellow-500" />
              </div>
              <div className="flex-1">
                <span className="font-medium text-sm">Share an Idea</span>
              </div>
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => handleActionClick('issue')}
              className="flex items-center gap-3 cursor-pointer p-3 rounded-xl hover:bg-red-500/10 transition-colors"
            >
              <div className="flex items-center justify-center w-8 h-8 rounded-full bg-red-500/10">
                <AlertTriangle className="h-4 w-4 text-red-500" />
              </div>
              <div className="flex-1">
                <span className="font-medium text-sm">Raise an Issue</span>
              </div>
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => handleActionClick('post')}
              className="flex items-center gap-3 cursor-pointer p-3 rounded-xl hover:bg-blue-500/10 transition-colors"
            >
              <div className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-500/10">
                <MessageCircle className="h-4 w-4 text-blue-500" />
              </div>
              <div className="flex-1">
                <span className="font-medium text-sm">Create Post</span>
              </div>
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => handleActionClick('debate')}
              className="flex items-center gap-3 cursor-pointer p-3 rounded-xl hover:bg-purple-500/10 transition-colors"
            >
              <div className="flex items-center justify-center w-8 h-8 rounded-full bg-purple-500/10">
                <Gavel className="h-4 w-4 text-purple-500" />
              </div>
              <div className="flex-1">
                <span className="font-medium text-sm">Start Debate</span>
              </div>
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => handleActionClick('society')}
              className="flex items-center gap-3 cursor-pointer p-3 rounded-xl hover:bg-indigo-500/10 transition-colors"
            >
              <div className="flex items-center justify-center w-8 h-8 rounded-full bg-indigo-500/10">
                <Users className="h-4 w-4 text-indigo-500" />
              </div>
              <div className="flex-1">
                <span className="font-medium text-sm">Create Society</span>
              </div>
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => handleActionClick('initiative')}
              className="flex items-center gap-3 cursor-pointer p-3 rounded-xl hover:bg-green-500/10 transition-colors"
            >
              <div className="flex items-center justify-center w-8 h-8 rounded-full bg-green-500/10">
                <Target className="h-4 w-4 text-green-500" />
              </div>
              <div className="flex-1">
                <span className="font-medium text-sm">Start Initiative</span>
              </div>
            </DropdownMenuItem>
          </div>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
