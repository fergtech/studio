'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { formatDistanceToNow } from 'date-fns';
import { ThumbsUp, MessageSquare, Share2, MoreHorizontal, Trash2 } from 'lucide-react';
import type { Update as GlobalUpdateType } from "@/lib/types";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useSession } from 'next-auth/react';
import { deleteUpdateAction } from '@/app/actions/initiativeActions';
import { useToast } from "@/components/ui/use-toast";
import { useRouter } from 'next/navigation';

interface ActivityFeedProps {
  updates: GlobalUpdateType[];
  onLoadMore: () => void;
  hasMore: boolean;
}

export function ActivityFeed({ updates: initialUpdates, onLoadMore, hasMore }: ActivityFeedProps) {
  const { data: session, status } = useSession();
  const currentUserId = session?.user?.id;
  const { toast } = useToast();
  const router = useRouter();

  const [activityUpdates, setActivityUpdates] = useState<GlobalUpdateType[]>(initialUpdates);

  // Debug logging - remove these once working
  useEffect(() => {
    console.log('=== ActivityFeed Debug ===');
    console.log('Session status:', status);
    console.log('Session data:', session);
    console.log('Current User ID:', currentUserId);
    console.log('Number of updates:', activityUpdates.length);
    console.log('First update sample:', activityUpdates[0]);
    if (activityUpdates[0]) {
      console.log('First update user:', activityUpdates[0].user);
      console.log('First update userId:', activityUpdates[0].userId);
    }
  }, [session, status, currentUserId, activityUpdates]);

  const handleDeleteUpdate = async (updateId: string) => {
    const result = await deleteUpdateAction(updateId);
    if (result.success) {
      toast({
        title: "Success",
        description: "Update deleted successfully.",
      });
      setActivityUpdates(prevUpdates => prevUpdates.filter(u => u.id !== updateId));
    } else {
      toast({
        title: "Error",
        description: result.error || "Failed to delete update.",
        variant: "destructive",
      });
    }
  };

  if (!activityUpdates || activityUpdates.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">No updates yet. Be the first to share an update!</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {activityUpdates.map((update) => {
        const displayImage = update.media && 
                             update.media.length > 0 && 
                             String(update.media[0].type) === 'IMAGE'
                             ? update.media[0].url 
                             : null;

        // Per-update debugging
        const canDelete = currentUserId === update.userId;
        console.log(`Update ${update.id}: currentUserId="${currentUserId}" vs update.userId="${update.userId}" = canDelete: ${canDelete}`);

        return (
          <Card key={update.id}>
            <CardContent className="p-4">
              <div className="flex gap-4">
                <Avatar>
                  <AvatarImage src={update.user?.image || undefined} />
                  <AvatarFallback>
                    {update.user?.name ? update.user.name.slice(0, 2).toUpperCase() : 'AN'}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <p className="font-medium">
                        {update.user?.name || 'Anonymous User'}
                      </p>
                      <span className="text-sm text-muted-foreground">
                        {(() => {
                          try {
                            const date = new Date(update.createdAt);
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
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-500 dark:text-gray-400">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        {canDelete && (
                          <DropdownMenuItem
                            onClick={() => handleDeleteUpdate(update.id)}
                            className="text-red-600 hover:!text-red-600 hover:!bg-red-50 dark:hover:!bg-red-700/20 dark:text-red-500 dark:hover:!text-red-500"
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem disabled> 
                          Report (coming soon) 
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                  <p className="mt-2 text-sm whitespace-pre-wrap">{update.content}</p>
                  {displayImage && (
                    <div className="mt-3 relative aspect-video w-full max-w-2xl rounded-lg overflow-hidden">
                      <img
                        src={displayImage}
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
        );
      })}
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