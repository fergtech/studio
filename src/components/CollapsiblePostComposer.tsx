'use client';

import { useState, useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card } from '@/components/ui/card';
import { User2, X } from 'lucide-react';
import CreatePostForm from './CreatePostForm';

interface CollapsiblePostComposerProps {
  onPostCreated?: () => void;
  onSuccess?: () => void;
  societyId?: string;
  context?: 'general' | 'society' | 'initiative';
  battleContext?: any;
  initialTopic?: string | null;
}

export function CollapsiblePostComposer({
  onPostCreated,
  onSuccess,
  societyId,
  context = 'general',
  battleContext,
  initialTopic
}: CollapsiblePostComposerProps) {
  const { data: session } = useSession();
  const [isExpanded, setIsExpanded] = useState(false);
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

  // If expanded, show full form - floating at bottom with margin
  if (isExpanded) {
    return (
      <div className="fixed bottom-4 left-4 right-4 z-50 flex justify-center pointer-events-none">
        <div ref={composerRef} className="w-full max-w-2xl pointer-events-auto">
          <Card className="bg-background/95 backdrop-blur-sm border border-border shadow-2xl rounded-2xl overflow-hidden">
            <div className="relative p-4">
              {/* Close button - especially useful on mobile */}
              <button
                onClick={() => setIsExpanded(false)}
                className="absolute top-3 right-3 z-10 p-2 rounded-full bg-muted hover:bg-muted/80 shadow-sm hover:shadow-md transition-all"
                aria-label="Close composer"
              >
                <X className="h-5 w-5 text-foreground" />
              </button>

              <CreatePostForm
                onPostCreated={() => {
                  onPostCreated?.();
                  setIsExpanded(false); // Collapse after posting
                }}
                onSuccess={() => {
                  onSuccess?.();
                  setIsExpanded(false);
                }}
                societyId={societyId}
                context={context}
                battleContext={battleContext}
                initialTopic={initialTopic}
              />
            </div>
          </Card>
        </div>
      </div>
    );
  }

  // Collapsed state - floating at bottom with margin
  return (
    <div className="fixed bottom-4 left-4 right-4 z-40 flex justify-center pointer-events-none">
      <div className="w-full max-w-2xl pointer-events-auto">
        <Card className="bg-background/95 backdrop-blur-sm border border-border shadow-lg rounded-full cursor-pointer hover:shadow-xl transition-shadow">
          <div
            className="p-4 flex items-center gap-3"
            onClick={() => setIsExpanded(true)}
          >
            <Avatar className="h-10 w-10 flex-shrink-0">
              <AvatarImage src={session?.user?.image || undefined} />
              <AvatarFallback>
                {session?.user?.name
                  ? session.user.name.charAt(0).toUpperCase()
                  : <User2 className="h-4 w-4" />}
              </AvatarFallback>
            </Avatar>

            <div className="flex-1 bg-muted/50 rounded-full px-4 py-2.5 text-muted-foreground hover:bg-muted transition-colors">
              What's happening?
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
