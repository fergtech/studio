'use client';

import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { formatDistanceToNow } from 'date-fns';
import { ThumbsUp, MessageSquare, Share2 } from 'lucide-react';
import type { Update } from "@/lib/types";

interface ActivityFeedProps {
  updates: Update[];
  onLoadMore: () => void;
  hasMore: boolean;
}

export function ActivityFeed({ updates, onLoadMore, hasMore }: ActivityFeedProps) {
  return (
    <div className="space-y-4">
      {updates.map((update) => (
        <Card key={update.id}>
          <CardContent className="p-4">
            <div className="flex gap-4">
              <Avatar>
                <AvatarImage src={update.author?.image || undefined} />
                <AvatarFallback>
                  {update.author?.name ? update.author.name.slice(0, 2).toUpperCase() : 'AN'}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-medium">{update.author?.name || 'Anonymous'}</p>
                  <span className="text-sm text-muted-foreground">
                    {(() => {
                      try {
                        const date = new Date(update.createdAt);
                        // Check if the date is valid
                        if (isNaN(date.getTime())) {
                          return "Invalid date";
                        }
                        return formatDistanceToNow(date, { addSuffix: true });
                      } catch (e) {
                        return "Invalid date";
                      }
                    })()}
                  </span>
                </div>
                <p className="mt-2 text-sm whitespace-pre-wrap">{update.content}</p>
                {update.imageUrl && (
                  <div className="mt-3 relative aspect-video w-full max-w-2xl rounded-lg overflow-hidden">
                    <img
                      src={update.imageUrl}
                      alt="Update attachment"
                      className="object-cover w-full h-full"
                    />
                  </div>
                )}
                <div className="mt-4 flex items-center gap-4">
                  <Button variant="ghost" size="sm" className="h-8">
                    <ThumbsUp className="h-4 w-4 mr-2" />
                    Like
                  </Button>
                  <Button variant="ghost" size="sm" className="h-8">
                    <MessageSquare className="h-4 w-4 mr-2" />
                    Comment
                  </Button>
                  <Button variant="ghost" size="sm" className="h-8">
                    <Share2 className="h-4 w-4 mr-2" />
                    Share
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
      {hasMore && (
        <div className="flex justify-center">
          <Button
            variant="outline"
            onClick={onLoadMore}
          >
            Load More
          </Button>
        </div>
      )}
    </div>
  );
}