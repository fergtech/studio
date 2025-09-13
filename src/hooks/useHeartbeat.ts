'use client';

import { useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';

export function useHeartbeat() {
  const { data: session } = useSession();
  const lastActivityRef = useRef<number>(Date.now());
  const heartbeatIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const activityListenersRef = useRef<(() => void)[]>([]);

  useEffect(() => {
    // Only start heartbeat if user is authenticated
    if (!session?.user?.id) {
      return;
    }

    // Track user activity (mouse movement, keyboard input, clicks)
    const updateActivity = () => {
      lastActivityRef.current = Date.now();
    };

    const activityEvents = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];
    
    // Add event listeners for activity detection
    activityEvents.forEach(event => {
      document.addEventListener(event, updateActivity, { passive: true });
    });

    // Store cleanup functions
    activityListenersRef.current = activityEvents.map(event => () => {
      document.removeEventListener(event, updateActivity);
    });

    // Send heartbeat function
    const sendHeartbeat = async () => {
      const timeSinceActivity = Date.now() - lastActivityRef.current;
      
      // Only send heartbeat if user was active in the last 5 minutes
      if (timeSinceActivity < 5 * 60 * 1000) {
        try {
          await fetch('/api/users/heartbeat', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
          });
        } catch (error) {
          console.error('Heartbeat failed:', error);
        }
      }
    };

    // Send initial heartbeat
    sendHeartbeat();

    // Set up interval to send heartbeat every 30 seconds
    heartbeatIntervalRef.current = setInterval(sendHeartbeat, 30000);

    // Cleanup function
    return () => {
      // Clear interval
      if (heartbeatIntervalRef.current) {
        clearInterval(heartbeatIntervalRef.current);
      }

      // Remove activity listeners
      activityListenersRef.current.forEach(cleanup => cleanup());
    };
  }, [session?.user?.id]);

  // Return nothing - this is just a background effect
  return null;
}