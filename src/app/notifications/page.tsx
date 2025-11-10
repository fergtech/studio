'use client';

import { useState } from 'react';
import { Bell, ChevronLeft, Check, CheckCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatDistanceToNow } from 'date-fns';
import { useRouter } from 'next/navigation';
import { useNotifications } from '@/hooks/useNotifications';
import { useSession } from 'next-auth/react';

// Add type definition for notification
interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  data: any;
  read: boolean;
  createdAt: string;
}

export default function NotificationsPage() {
  const router = useRouter();
  const { data: session } = useSession();
  
  const {
    notifications,
    unreadCount,
    isConnected,
    isPolling,
    markAsRead,
    markAllAsRead,
    fetchNotifications
  } = useNotifications();

  const handleNotificationClick = (notification: Notification) => {
    markAsRead(notification.id);
    
    // Handle different notification types
    switch (notification.type) {
      case 'new_message':
        router.push('/messages');
        break;
      case 'new_vote':
        if (notification.data?.postId) {
          router.push(`/posts/${notification.data.postId}`);
        }
        break;
      case 'new_comment':
        if (notification.data?.postId) {
          router.push(`/posts/${notification.data.postId}`);
        }
        break;
      case 'new_follow':
        if (notification.data?.userId) {
          router.push(`/profile/${notification.data.userId}`);
        }
        break;
      case 'society_update':
        if (notification.data?.societyId) {
          router.push(`/societies/${notification.data.societyId}`);
        }
        break;
      default:
        // For unknown types, just mark as read
        break;
    }
  };

  const handleBack = () => {
    router.back();
  };

  if (!session?.user) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container max-w-2xl mx-auto px-4 py-8">
          <div className="text-center">
            <Bell className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h1 className="text-2xl font-bold mb-2">Sign in required</h1>
            <p className="text-muted-foreground">Please sign in to view your notifications.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b">
        <div className="container max-w-2xl mx-auto px-4">
          <div className="flex items-center justify-between h-14">
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="sm" onClick={handleBack}>
                <ChevronLeft className="h-5 w-5" />
              </Button>
              <div>
                <h1 className="text-lg font-semibold">Notifications</h1>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  {unreadCount > 0 && (
                    <span>{unreadCount} unread</span>
                  )}
                  <div className="flex items-center gap-1">
                    {isConnected ? (
                      <div className="w-1.5 h-1.5 bg-green-500 rounded-full" />
                    ) : isPolling ? (
                      <div className="w-1.5 h-1.5 bg-yellow-500 rounded-full" />
                    ) : (
                      <div className="w-1.5 h-1.5 bg-red-500 rounded-full" />
                    )}
                    <span className="text-xs">
                      {isConnected ? 'Live' : isPolling ? 'Polling' : 'Offline'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
            
            {notifications.length > 0 && unreadCount > 0 && (
              <Button variant="ghost" size="sm" onClick={markAllAsRead}>
                <CheckCheck className="h-4 w-4 mr-2" />
                Mark all read
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container max-w-2xl mx-auto px-4 py-6">
        {notifications.length === 0 ? (
          <div className="text-center py-12">
            <Bell className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h2 className="text-xl font-semibold mb-2">No notifications yet</h2>
            <p className="text-muted-foreground">
              When you get notifications, they'll appear here.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {notifications.map((notification) => (
              <Card
                key={notification.id}
                className={`p-4 cursor-pointer transition-all hover:shadow-md ${
                  !notification.read 
                    ? 'bg-primary/5 border-primary/20 shadow-sm' 
                    : 'hover:bg-muted/50'
                }`}
                onClick={() => handleNotificationClick(notification)}
              >
                <div className="flex items-start gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <h3 className="font-medium text-sm leading-tight">
                        {notification.title}
                      </h3>
                      {!notification.read && (
                        <div className="w-2 h-2 bg-primary rounded-full flex-shrink-0 mt-1" />
                      )}
                    </div>
                    
                    <p className="text-sm text-muted-foreground leading-relaxed mb-3">
                      {notification.message}
                    </p>
                    
                    <div className="flex items-center justify-between">
                      <p className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                      </p>
                      
                      {!notification.read && (
                        <Badge variant="secondary" className="text-xs">
                          New
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}