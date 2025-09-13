'use client';

import { useState } from 'react';
import { Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { formatDistanceToNow } from 'date-fns';
import { useRouter } from 'next/navigation';
import { useNotifications } from '@/hooks/useNotifications';
import { useSession } from 'next-auth/react';

export default function NotificationBell() {
  const [isOpen, setIsOpen] = useState(false);
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

  const handleNotificationClick = (notification: Notification) => {
    markAsRead(notification.id);
    
    // Handle different notification types
    if (notification.type === 'DIRECT_MESSAGE') {
      const senderId = notification.data?.senderId;
      if (senderId) {
        router.push(`/chat/${senderId}`);
      }
    } else if (notification.type === 'FOLLOW') {
      const followerId = notification.data?.followerId;
      const followerUsername = notification.data?.followerUsername;
      if (followerUsername) router.push(`/profile/${followerUsername}`);
    }
    
    setIsOpen(false);
  };

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge 
              variant="destructive" 
              className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs"
            >
              {unreadCount > 9 ? '9+' : unreadCount}
            </Badge>
          )}
          {/* Show connection status indicator */}
          {isPolling && !isConnected && (
            <div className="absolute -bottom-1 -right-1 w-2 h-2 bg-yellow-500 rounded-full" 
                 title="Using polling fallback" />
          )}
        </Button>
      </DropdownMenuTrigger>
      
      <DropdownMenuContent align="end" className="w-80">
        <div className="p-2 flex items-center justify-between">
          <h3 className="font-semibold text-sm">Notifications</h3>
          <div className="flex items-center gap-1">
            {isConnected && (
              <div className="w-2 h-2 bg-green-500 rounded-full" title="Real-time connected" />
            )}
            {isPolling && !isConnected && (
              <div className="w-2 h-2 bg-yellow-500 rounded-full" title="Polling mode" />
            )}
          </div>
        </div>
        <DropdownMenuSeparator />
        
        {notifications.length === 0 ? (
          <div className="p-4 text-center text-sm text-gray-500">
            No notifications yet
          </div>
        ) : (
          <div className="max-h-96 overflow-y-auto">
            {notifications.map((notification) => (
              <DropdownMenuItem
                key={notification.id}
                className={`p-3 cursor-pointer ${!notification.read ? 'bg-blue-50 dark:bg-blue-950/20' : ''}`}
                onClick={() => handleNotificationClick(notification)}
              >
                <div className="flex flex-col space-y-1 w-full">
                  <div className="flex items-start justify-between">
                    <p className="text-sm font-medium">{notification.title}</p>
                    {!notification.read && (
                      <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0 mt-1" />
                    )}
                  </div>
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    {notification.message}
                  </p>
                  <p className="text-xs text-gray-500">
                    {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                  </p>
                </div>
              </DropdownMenuItem>
            ))}
          </div>
        )}
        
        {notifications.length > 0 && (
          <>
            <DropdownMenuSeparator />
            <div className="p-2">
              <Button 
                variant="ghost" 
                size="sm" 
                className="w-full text-xs"
                onClick={markAllAsRead}
              >
                Mark all as read
              </Button>
            </div>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
} 
