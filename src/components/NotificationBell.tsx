'use client';

import { useState, useEffect } from 'react';
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

interface NotificationBellProps {
  asMenuItem?: boolean;
}

export default function NotificationBell({ asMenuItem = false }: NotificationBellProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const router = useRouter();
  const { data: session } = useSession();

  // Detect mobile devices
  useEffect(() => {
    const checkIfMobile = () => {
      setIsMobile(window.innerWidth < 768); // md breakpoint
    };
    
    checkIfMobile();
    window.addEventListener('resize', checkIfMobile);
    
    return () => window.removeEventListener('resize', checkIfMobile);
  }, []);
  
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

  const handleBellClick = () => {
    if (isMobile) {
      // On mobile, navigate to notifications page
      router.push('/notifications');
    } else {
      // On desktop, toggle dropdown
      setIsOpen(!isOpen);
    }
  };

  if (asMenuItem) {
    if (isMobile) {
      // On mobile, render as a simple menu item that navigates
      return (
        <DropdownMenuItem 
          className="cursor-pointer relative" 
          onClick={() => router.push('/notifications')}
        >
          <Bell className="mr-2 h-4 w-4" />
          <span>Notifications</span>
          {unreadCount > 0 && (
            <Badge 
              variant="destructive" 
              className="ml-auto h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs"
            >
              {unreadCount > 9 ? '9+' : unreadCount}
            </Badge>
          )}
        </DropdownMenuItem>
      );
    }

    // On desktop, keep the nested dropdown
    return (
      <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
        <DropdownMenuTrigger asChild>
          <DropdownMenuItem className="cursor-pointer relative">
            <Bell className="mr-2 h-4 w-4" />
            <span>Notifications</span>
            {unreadCount > 0 && (
              <Badge 
                variant="destructive" 
                className="ml-auto h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs"
              >
                {unreadCount > 9 ? '9+' : unreadCount}
              </Badge>
            )}
          </DropdownMenuItem>
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

  // For non-menu item usage (standalone button)
  if (isMobile) {
    return (
      <Button 
        variant="ghost" 
        size="sm" 
        className="relative" 
        onClick={() => router.push('/notifications')}
      >
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
    );
  }

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
      
      <DropdownMenuContent align="end" className="w-96 max-w-sm">
        <div className="p-3 flex items-center justify-between">
          <div>
            <h3 className="font-semibold">Notifications</h3>
            <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
              {unreadCount > 0 && <span>{unreadCount} unread</span>}
              <div className="flex items-center gap-1">
                {isConnected ? (
                  <>
                    <div className="w-1.5 h-1.5 bg-green-500 rounded-full" />
                    <span>Live</span>
                  </>
                ) : isPolling ? (
                  <>
                    <div className="w-1.5 h-1.5 bg-yellow-500 rounded-full" />
                    <span>Polling</span>
                  </>
                ) : (
                  <>
                    <div className="w-1.5 h-1.5 bg-red-500 rounded-full" />
                    <span>Offline</span>
                  </>
                )}
              </div>
            </div>
          </div>
          
          {notifications.length > 0 && (
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => router.push('/notifications')}
              className="text-xs"
            >
              View all
            </Button>
          )}
        </div>
        <DropdownMenuSeparator />
        
        {notifications.length === 0 ? (
          <div className="p-6 text-center">
            <Bell className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
            <p className="text-sm text-muted-foreground">No notifications yet</p>
          </div>
        ) : (
          <>
            <div className="max-h-80 overflow-y-auto">
              {notifications.slice(0, 5).map((notification) => (
                <DropdownMenuItem
                  key={notification.id}
                  className={`p-3 cursor-pointer hover:bg-muted/50 ${
                    !notification.read ? 'bg-primary/5 border-l-2 border-l-primary' : ''
                  }`}
                  onClick={() => handleNotificationClick(notification)}
                >
                  <div className="flex items-start gap-3 w-full">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <p className="text-sm font-medium leading-tight line-clamp-1">
                          {notification.title}
                        </p>
                        {!notification.read && (
                          <div className="w-2 h-2 bg-primary rounded-full flex-shrink-0 mt-1" />
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground line-clamp-2 mb-1">
                        {notification.message}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                      </p>
                    </div>
                  </div>
                </DropdownMenuItem>
              ))}
            </div>
            
            {notifications.length > 5 && (
              <>
                <DropdownMenuSeparator />
                <div className="p-2">
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="w-full"
                    onClick={() => router.push('/notifications')}
                  >
                    View all {notifications.length} notifications
                  </Button>
                </div>
              </>
            )}
            
            {unreadCount > 0 && (
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
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
} 
