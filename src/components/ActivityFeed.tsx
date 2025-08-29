'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatDistanceToNow } from 'date-fns';
import Link from 'next/link';
import { 
  MessageSquare, 
  Users, 
  Rocket, 
  Target, 
  UserPlus, 
  FileText,
  Calendar,
  MapPin
} from 'lucide-react';
import { useSession } from 'next-auth/react';

interface ActivityFeedItem {
  id: string;
  type: 'post' | 'follow' | 'initiative_join' | 'initiative_create' | 'goal_complete' | 'milestone_reach' | 'comment' | 'like';
  title: string;
  description: string;
  userId: string;
  user: {
    id: string;
    name: string | null;
    image: string | null;
    username?: string; // Added username to user interface
  };
  timestamp: Date;
  data?: any;
  relatedInitiativeId?: string;
  relatedPostId?: string;
}

interface ActivityFeedProps {
  initialActivities?: ActivityFeedItem[];
  preview?: boolean;
}

export default function ActivityFeed({ initialActivities = [], preview = false }: ActivityFeedProps) {
  const [activities, setActivities] = useState<ActivityFeedItem[]>(initialActivities);
  const [isLoading, setIsLoading] = useState(!initialActivities.length);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(1);
  const { data: session } = useSession();

  useEffect(() => {
    if (!initialActivities.length) {
      fetchActivities();
    }
  }, []);

  const fetchActivities = async (pageNum = 1) => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/activity-feed?page=${pageNum}&limit=${preview ? 3 : 10}&preview=${preview ? '1' : '0'}`);
      if (!response.ok) {
        throw new Error('Failed to fetch activities');
      }
      
      const data = await response.json();
      
      if (pageNum === 1) {
        setActivities(data.activities);
      } else {
        setActivities(prev => [...prev, ...data.activities]);
      }
      
      setHasMore(data.hasMore);
      setPage(pageNum);
    } catch (error) {
      console.error('Error fetching activities:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadMore = () => {
    fetchActivities(page + 1);
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'post':
        return <FileText className="h-4 w-4" />;
      case 'follow':
        return <UserPlus className="h-4 w-4" />;
      case 'initiative_join':
        return <Users className="h-4 w-4" />;
      case 'initiative_create':
        return <Rocket className="h-4 w-4" />;
      case 'goal_complete':
        return <Target className="h-4 w-4" />;
      case 'milestone_reach':
        return <Calendar className="h-4 w-4" />;
      case 'comment':
        return <MessageSquare className="h-4 w-4" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  };

  const getActivityColor = (type: string) => {
    switch (type) {
      case 'post':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'follow':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'initiative_join':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
      case 'initiative_create':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200';
      case 'goal_complete':
        return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200';
      case 'milestone_reach':
        return 'bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  if (isLoading && activities.length === 0) {
    return (
      <div className="space-y-4">
        {[...Array(preview ? 1 : 3)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-4">
              <div className="flex items-start space-x-3">
                <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (activities.length === 0) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <div className="text-gray-500 dark:text-gray-400">
            <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <h3 className="text-lg font-medium mb-2">No Activity Yet</h3>
            <p className="text-sm">
              Follow some users or join initiatives to see activity in your feed.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Preview mode: compact list, no load more, see all link
  if (preview) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Activity Feed
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {activities.map((activity) => (
            <div key={activity.id} className="flex items-start gap-2">
              <Avatar className="h-8 w-8">
                <AvatarImage src={activity.user.image || undefined} />
                <AvatarFallback>
                  {activity.user.name ? activity.user.name.slice(0, 2).toUpperCase() : 'U'}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-xs truncate">{activity.user.name || 'Anonymous'}</span>
                  <Badge variant="secondary" className={`text-xs ${getActivityColor(activity.type)}`}>{activity.title}</Badge>
                </div>
                <p className="text-xs text-gray-700 dark:text-gray-300 truncate">{activity.description}</p>
                <span className="text-xs text-gray-500 dark:text-gray-400">{formatDistanceToNow(new Date(activity.timestamp), { addSuffix: true })}</span>
              </div>
            </div>
          ))}
          <div className="pt-2 text-right">
            <Link href="/activity" className="text-xs text-primary hover:underline">See all activity</Link>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {activities.map((activity) => (
        <Card key={activity.id} className="hover:shadow-md transition-shadow">
          <CardContent className="p-4">
            <div className="flex items-start space-x-3">
              {activity.user.username && (
                <Link href={`/profile/${activity.user.username}`}>
                  <Avatar className="h-10 w-10 cursor-pointer hover:opacity-80 transition-opacity">
                    <AvatarImage src={activity.user.image || undefined} />
                    <AvatarFallback>{activity.user.name?.[0]?.toUpperCase() || '?'}</AvatarFallback>
                  </Avatar>
                </Link>
              )}
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <Link 
                      href={`/profile/${activity.user.username}`}
                      className="font-medium text-sm hover:underline"
                    >
                      {activity.user.name || 'Anonymous User'}
                    </Link>
                    <Badge 
                      variant="secondary" 
                      className={`text-xs ${getActivityColor(activity.type)}`}
                    >
                      <div className="flex items-center space-x-1">
                        {getActivityIcon(activity.type)}
                        <span>{activity.title}</span>
                      </div>
                    </Badge>
                  </div>
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {formatDistanceToNow(new Date(activity.timestamp), { addSuffix: true })}
                  </span>
                </div>
                
                <p className="text-sm text-gray-700 dark:text-gray-300 mb-3">
                  {activity.description}
                </p>

                {/* Action buttons based on activity type */}
                <div className="flex items-center space-x-2">
                  {activity.relatedInitiativeId && (
                    <Button 
                      variant="outline" 
                      size="sm" 
                      asChild
                      className="text-xs"
                    >
                      <Link href={`/initiatives/${activity.relatedInitiativeId}`}>
                        <Rocket className="h-3 w-3 mr-1" />
                        View Initiative
                      </Link>
                    </Button>
                  )}
                  
                  {activity.relatedPostId && (
                    <Button 
                      variant="outline" 
                      size="sm" 
                      asChild
                      className="text-xs"
                    >
                      <Link href={`/post/${activity.relatedPostId}`}>
                        <FileText className="h-3 w-3 mr-1" />
                        View Post
                      </Link>
                    </Button>
                  )}

                  {activity.type === 'follow' && activity.data?.followedUser && (
                    <Button 
                      variant="outline" 
                      size="sm" 
                      asChild
                      className="text-xs"
                    >
                      <Link href={`/profile/${activity.data.followedUser.username}`}>
                        <UserPlus className="h-3 w-3 mr-1" />
                        View Profile
                      </Link>
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}

      {hasMore && (
        <div className="flex justify-center pt-4">
          <Button 
            variant="outline" 
            onClick={loadMore}
            disabled={isLoading}
          >
            {isLoading ? 'Loading...' : 'Load More'}
          </Button>
        </div>
      )}
    </div>
  );
} 
