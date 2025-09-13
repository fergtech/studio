'use client';

import { useCallback, useState, useEffect } from 'react';
import { useSSE } from './useSSE';
import { useToast } from '@/components/ui/use-toast';

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  data: any;
  read: boolean;
  createdAt: string;
}

export function useNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const { toast } = useToast();

  const handleSSEMessage = useCallback((data: any) => {
    if (data.type === 'notifications' && data.data) {
      const newNotifications = data.data as Notification[];
      
      // Add new notifications to state
      setNotifications(prev => {
        const existingIds = new Set(prev.map(n => n.id));
        const uniqueNew = newNotifications.filter(n => !existingIds.has(n.id));
        
        // Show toast for new notifications
        uniqueNew.forEach(notification => {
          toast({
            title: notification.title,
            description: notification.message,
          });
        });
        
        return [
          ...uniqueNew,
          ...prev
        ].slice(0, 50); // Keep only latest 50 notifications
      });

      // Update unread count
      setUnreadCount(prev => prev + newNotifications.length);
    }
  }, [toast]);

  // Temporarily disable SSE to prevent infinite loops
  // const { isConnected, isPolling, error } = useSSE({
  //   url: '/api/sse/notifications',
  //   onMessage: handleSSEMessage,
  //   enablePollingFallback: true,
  //   pollingUrl: '/api/notifications?limit=10',
  //   pollingInterval: 15000,
  //   onError: (error) => {
  //     console.error('Notifications SSE error:', error);
  //   }
  // });

  // Use simple polling for now
  const [isConnected, setIsConnected] = useState(false);
  const [isPolling, setIsPolling] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch initial notifications
  const fetchNotifications = useCallback(async () => {
    try {
      const response = await fetch('/api/notifications?limit=10');
      if (response.ok) {
        const data = await response.json();
        setNotifications(data);
        setUnreadCount(data.filter((n: Notification) => !n.read).length);
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  }, []);

  // Initial fetch
  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  // Mark notification as read
  const markAsRead = useCallback(async (notificationId: string) => {
    try {
      const response = await fetch('/api/notifications', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ notificationId, read: true }),
      });

      if (response.ok) {
        setNotifications(prev =>
          prev.map(n =>
            n.id === notificationId ? { ...n, read: true } : n
          )
        );
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  }, []);

  // Mark all as read
  const markAllAsRead = useCallback(async () => {
    const unreadNotifications = notifications.filter(n => !n.read);
    
    try {
      await Promise.all(
        unreadNotifications.map(n => markAsRead(n.id))
      );
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  }, [notifications, markAsRead]);

  return {
    notifications,
    unreadCount,
    isConnected,
    isPolling,
    error,
    fetchNotifications,
    markAsRead,
    markAllAsRead
  };
}