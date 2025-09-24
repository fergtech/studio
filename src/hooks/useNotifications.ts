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
    console.log('SSE message received:', data.type);
    
    if (data.type === 'new_notifications' && data.data) {
      const newNotifications = data.data as Notification[];
      
      // Only process if we have new notifications
      if (newNotifications.length > 0) {
        // Add new notifications to state
        setNotifications(prev => {
          const existingIds = new Set(prev.map(n => n.id));
          const uniqueNew = newNotifications.filter(n => !existingIds.has(n.id));
          
          // Show toast for truly new notifications
          uniqueNew.forEach(notification => {
            toast({
              title: notification.title,
              description: notification.message,
            });
          });
          
          if (uniqueNew.length > 0) {
            return [
              ...uniqueNew,
              ...prev
            ].slice(0, 50); // Keep only latest 50 notifications
          }
          return prev; // No changes if no new notifications
        });

        // Update unread count only for truly new notifications
        const existingIds = new Set(notifications.map(n => n.id));
        const trulyNew = newNotifications.filter(n => !existingIds.has(n.id));
        if (trulyNew.length > 0) {
          setUnreadCount(prev => prev + trulyNew.length);
        }
      }
    } else if (data.type === 'connected') {
      console.log('SSE connected for notifications');
    } else if (data.type === 'heartbeat') {
      // Heartbeat - no action needed
    } else if (data.type === 'error') {
      console.error('SSE error:', data.message);
    }
  }, [toast, notifications]);

  // Re-enable SSE with fixed endpoint and proper deduplication
  const { isConnected, isPolling, error } = useSSE({
    url: '/api/sse/notifications',
    onMessage: handleSSEMessage,
    enablePollingFallback: true,
    pollingUrl: '/api/notifications?limit=10',
    pollingInterval: 45000, // Increased to 45s to avoid conflicts with SSE
    maxReconnectAttempts: 3,
    reconnectDelay: 5000,
    onConnect: () => {
      console.log('Notifications SSE connected');
    },
    onError: (error) => {
      console.error('Notifications SSE error:', error);
    }
  });

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