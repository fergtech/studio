'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useSession } from 'next-auth/react';
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
  const [isPolling, setIsPolling] = useState(false);
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const { data: session } = useSession();
  const { toast } = useToast();

  // Check if user is online (simple heuristic)
  const [isConnected, setIsConnected] = useState(true);

  // Monitor online status
  useEffect(() => {
    const handleOnline = () => setIsConnected(true);
    const handleOffline = () => setIsConnected(false);

    if (typeof window !== 'undefined') {
      window.addEventListener('online', handleOnline);
      window.addEventListener('offline', handleOffline);
      
      // Initial check
      setIsConnected(navigator.onLine);

      return () => {
        window.removeEventListener('online', handleOnline);
        window.removeEventListener('offline', handleOffline);
      };
    }
  }, []);

  // Polling logic in a single effect
  useEffect(() => {
    // Don't start polling if no session or offline
    if (!session?.user?.id || !isConnected) {
      return;
    }

    console.log('Starting notification polling');
    setIsPolling(true);

    const poll = async () => {
      try {
        const response = await fetch('/api/notifications?limit=10');
        if (response.ok) {
          const newNotifications = await response.json();
          
          setNotifications(prev => {
            // If it's the same data, don't update
            if (JSON.stringify(prev) === JSON.stringify(newNotifications)) {
              return prev;
            }
            return newNotifications;
          });

          // Update unread count
          const newUnreadCount = newNotifications.filter((n: Notification) => !n.read).length;
          setUnreadCount(newUnreadCount);
        } else {
          console.warn('Failed to fetch notifications:', response.status);
        }
      } catch (error) {
        console.error('Polling error:', error);
      }
    };

    // Initial poll
    poll();

    // Set up polling interval (every 2 minutes instead of 30 seconds)
    const intervalId = setInterval(poll, 120000);
    pollingIntervalRef.current = intervalId;

    // Cleanup function
    return () => {
      console.log('Stopping notification polling');
      clearInterval(intervalId);
      pollingIntervalRef.current = null;
      setIsPolling(false);
    };
  }, [session?.user?.id, isConnected]); // Simple dependencies

  // Manual fetch function for external use
  const fetchNotifications = useCallback(async () => {
    if (!session?.user?.id) return;
    
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
  }, [session?.user?.id]);

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
    fetchNotifications,
    markAsRead,
    markAllAsRead
  };
}