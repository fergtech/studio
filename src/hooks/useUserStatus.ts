'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useSession } from 'next-auth/react';

interface UserStatus {
  userId: string;
  isOnline: boolean;
  lastActiveAt: string;
}

interface UseUserStatusOptions {
  userIds: string[];
  enabled?: boolean;
  pollingInterval?: number;
}

export function useUserStatus({ userIds, enabled = true, pollingInterval = 300000 }: UseUserStatusOptions) {
  const [userStatuses, setUserStatuses] = useState<Record<string, UserStatus>>({});
  const [isLoading, setIsLoading] = useState(false);
  const { data: session } = useSession();

  // Function to check if a user is considered online (within last 5 minutes)
  const isUserOnline = useCallback((lastActiveAt: string) => {
    const lastActive = new Date(lastActiveAt);
    const now = new Date();
    const diffInMinutes = (now.getTime() - lastActive.getTime()) / (1000 * 60);
    return diffInMinutes <= 5; // Consider online if active within 5 minutes
  }, []);

  // Just fetch once on mount - no continuous polling to avoid performance issues
  useEffect(() => {
    if (!enabled || !session?.user?.id || userIds.length === 0) {
      return;
    }

    console.log('Fetching initial user status for', userIds.length, 'users');

    const fetchUserStatuses = async () => {
      try {
        setIsLoading(true);
        
        const response = await fetch('/api/users/status', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ userIds }),
        });

        if (response.ok) {
          const users = await response.json();
          
          const statusMap: Record<string, UserStatus> = {};
          users.forEach((user: any) => {
            statusMap[user.id] = {
              userId: user.id,
              isOnline: user.lastActiveAt ? isUserOnline(user.lastActiveAt) : false,
              lastActiveAt: user.lastActiveAt || new Date().toISOString(),
            };
          });

          setUserStatuses(statusMap);
        }
      } catch (error) {
        console.error('Error fetching user statuses:', error);
      } finally {
        setIsLoading(false);
      }
    };

    // Just fetch once initially
    fetchUserStatuses();
  }, [session?.user?.id, enabled, JSON.stringify(userIds), isUserOnline]);

  // Create a manual refresh function
  const refreshStatuses = useCallback(async () => {
    if (!enabled || !session?.user?.id || userIds.length === 0) return;

    try {
      setIsLoading(true);
      
      const response = await fetch('/api/users/status', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userIds }),
      });

      if (response.ok) {
        const users = await response.json();
        
        const statusMap: Record<string, UserStatus> = {};
        users.forEach((user: any) => {
          statusMap[user.id] = {
            userId: user.id,
            isOnline: user.lastActiveAt ? isUserOnline(user.lastActiveAt) : false,
            lastActiveAt: user.lastActiveAt || new Date().toISOString(),
          };
        });

        setUserStatuses(statusMap);
      }
    } catch (error) {
      console.error('Error fetching user statuses:', error);
    } finally {
      setIsLoading(false);
    }
  }, [session?.user?.id, enabled, userIds, isUserOnline]);

  return {
    userStatuses,
    isLoading,
    isUserOnline: (userId: string) => userStatuses[userId]?.isOnline || false,
    getUserStatus: (userId: string) => userStatuses[userId],
    refreshStatuses,
  };
}