'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { formatDistanceToNow } from 'date-fns';
import Link from 'next/link';
import Image from 'next/image';
import { Card, CardContent, CardHeader, CardFooter } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Pin, ThumbsUp, PartyPopper, Heart, Lightbulb, Send, MessageCircle, Repeat2, Share, MoreHorizontal, Trash2 } from 'lucide-react';
import { cn } from "@/lib/utils";
import { useSession } from 'next-auth/react';
import { deleteUpdateAction } from '@/app/actions/initiativeActions';
import { useToast } from "@/components/ui/use-toast";
import { useRouter } from 'next/navigation';
import type { Update } from '@/lib/types';

interface ActivityFeedProps {
  updates: Update[];
  onLoadMore: () => void;
  hasMore: boolean;
}

const UpdateTypeIcon = ({ type }: { type: string }) => {
  switch (type) {
    case 'POST': return <Send className="h-4 w-4" />;
    case 'MILESTONE_CREATED':
    case 'MILESTONE_CREATION': 
        return <Pin className="h-4 w-4" />;
    case 'GOAL_ACHIEVED': 
    case 'GOAL_STATUS': 
    case 'GOAL_CREATION': 
        return <PartyPopper className="h-4 w-4" />;
    case 'JOIN': return <Heart className="h-4 w-4" />;
    default: return <Lightbulb className="h-4 w-4" />;
  }
};

export function ActivityFeed({ updates: initialUpdates, onLoadMore, hasMore }: ActivityFeedProps) {
  const { data: session, status } = useSession();
  const currentUserId = session?.user?.id;
  const { toast } = useToast();
  const router = useRouter();

  const [activityUpdates, setActivityUpdates] = useState<Update[]>(
    initialUpdates.map(u => ({ 
      ...u, 
      timestamp: new Date(u.timestamp as string | Date),
      createdAt: new Date(u.createdAt as string | Date),
      updatedAt: new Date(u.updatedAt as string | Date)
    }))
  );

  // Debug logging - remove these once working
  useEffect(() => {
    console.log('=== Components ActivityFeed Debug ===');
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
    return <p className="text-center text-gray-500 dark:text-gray-400 py-8">No activity yet. Be the first to post an update!</p>;
  }

  return (
    <div className="space-y-6">
      {activityUpdates.map((update) => {
        const canDelete = currentUserId === update.userId;
        console.log(`Components Update ${update.id}: currentUserId="${currentUserId}" vs update.userId="${update.userId}" = canDelete: ${canDelete}`);
        
        return (
          <Card key={update.id} className="overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-200 bg-white dark:bg-slate-850 rounded-lg">
            <CardHeader className="p-4 bg-slate-50 dark:bg-slate-800">
              <div className="flex items-start space-x-3">
                <Avatar className="h-10 w-10 border border-slate-200 dark:border-slate-700">
                  <AvatarImage src={update.user?.image || undefined} alt={update.user?.name || 'User'} />
                  <AvatarFallback className="bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                    {update.user?.name?.charAt(0).toUpperCase() || 'U'}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                      <div>
                          <Link href={`/profile/${update.user?.id}`} className="font-semibold text-sm text-slate-800 dark:text-slate-100 hover:underline">
                            {update.user?.name || 'Anonymous User'}
                            {/* Debug info - remove once working */}
                            <span className="text-xs text-red-500 ml-2">
                              (ID: {update.userId})
                            </span>
                          </Link>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {formatDistanceToNow(new Date(update.createdAt), { addSuffix: true })}
                          </p>
                      </div>
                      {/* Three-dot menu */}
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-500 dark:text-gray-400">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          {/* Debug menu items - remove once working */}
                          <DropdownMenuItem disabled className="text-xs">
                            Debug: {currentUserId} vs {update.userId}
                          </DropdownMenuItem>
                          <DropdownMenuItem disabled className="text-xs">
                            Session: {status} | Can delete: {canDelete ? 'Yes' : 'No'}
                          </DropdownMenuItem>
                          
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
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2 mb-3">
                  <UpdateTypeIcon type={String(update.type)} />
                  <Badge variant="outline" className="text-xs font-medium border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-300">
                      {String(update.type).replace('_', ' ').toLowerCase().replace(/\b\w/g, (l: string) => l.toUpperCase())}
                  </Badge>
              </div>
              <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap break-words">
                {update.content}
              </p>
              {update.media && update.media.length > 0 && String(update.media[0].type) === 'IMAGE' && (
                <div className="mt-4 rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700 max-w-md mx-auto">
                  <Image 
                      src={update.media[0].url} 
                      alt="Update image" 
                      width={500} 
                      height={300} 
                      className="object-cover w-full h-auto aspect-[16/9]"
                      unoptimized
                  />
                </div>
              )}
            </CardContent>
            <CardFooter className="p-3 bg-slate-50 dark:bg-slate-800/60 border-t border-gray-200 dark:border-gray-700/50 flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
              <div className="flex space-x-2">
                  <Button variant="ghost" size="sm" className="flex items-center space-x-1.5 px-2 py-1 h-auto text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700">
                      <ThumbsUp className="h-4 w-4" /> 
                      <span>{update.reactionCount || 0}</span>
                  </Button>
                  <Button variant="ghost" size="sm" className="flex items-center space-x-1.5 px-2 py-1 h-auto text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700">
                      <MessageCircle className="h-4 w-4" /> 
                      <span>{update.commentCount || 0}</span>
                  </Button>
              </div>
              <div className="flex space-x-1">
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700">
                      <Repeat2 className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700">
                      <Share className="h-4 w-4" />
                  </Button>
              </div>
            </CardFooter>
          </Card>
        );
      })}
      {hasMore && (
        <Button 
          variant="outline" 
          className="w-full mt-8 py-2.5 border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700"
          onClick={onLoadMore}
        >
          Load More Updates
        </Button>
      )}
    </div>
  );
}