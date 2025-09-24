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

    // Smart heartbeat function with adaptive intervals
    const sendHeartbeat = async () => {
      const timeSinceActivity = Date.now() - lastActivityRef.current;
      
      // Determine user status and heartbeat frequency
      let shouldSend = false;
      let nextInterval = 30000; // Default 30 seconds
      
      if (timeSinceActivity < 30 * 1000) {
        // Very active (last 30 seconds) - send heartbeat, faster interval
        shouldSend = true;
        nextInterval = 15000; // 15 seconds for active users
      } else if (timeSinceActivity < 2 * 60 * 1000) {
        // Recently active (last 2 minutes) - send heartbeat, normal interval
        shouldSend = true;
        nextInterval = 30000; // 30 seconds
      } else if (timeSinceActivity < 5 * 60 * 1000) {
        // Idle but still present (last 5 minutes) - slower heartbeat
        shouldSend = true;
        nextInterval = 60000; // 1 minute
      } else if (timeSinceActivity < 15 * 60 * 1000) {
        // Very idle (last 15 minutes) - minimal heartbeat
        shouldSend = true;
        nextInterval = 5 * 60 * 1000; // 5 minutes
      }
      // If more than 15 minutes idle, stop sending heartbeats
      
      if (shouldSend) {
        try {
          const response = await fetch('/api/users/heartbeat', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              status: timeSinceActivity < 30 * 1000 ? 'active' : 
                     timeSinceActivity < 2 * 60 * 1000 ? 'online' : 'idle',
              lastActivity: lastActivityRef.current,
              pageVisible: !document.hidden
            }),
          });
          
          if (response.ok) {
            console.log(`Heartbeat sent - Status: ${timeSinceActivity < 30 * 1000 ? 'active' : 
                        timeSinceActivity < 2 * 60 * 1000 ? 'online' : 'idle'}, Next: ${nextInterval}ms`);
          }
        } catch (error) {
          console.error('Heartbeat failed:', error);
          nextInterval = 60000; // Slow down on errors
        }
      }
      
      // Schedule next heartbeat with adaptive interval
      if (heartbeatIntervalRef.current) {
        clearTimeout(heartbeatIntervalRef.current);
      }
      heartbeatIntervalRef.current = setTimeout(sendHeartbeat, nextInterval);
    };

    // Send initial heartbeat
    sendHeartbeat();

    // Cleanup function
    return () => {
      // Clear timeout (now using setTimeout instead of setInterval)
      if (heartbeatIntervalRef.current) {
        clearTimeout(heartbeatIntervalRef.current);
      }

      // Remove activity listeners
      activityListenersRef.current.forEach(cleanup => cleanup());
    };
  }, [session?.user?.id]);

  // Return nothing - this is just a background effect
  return null;
}