'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { useSession } from 'next-auth/react';

interface SSEOptions {
  url: string;
  onMessage?: (data: any) => void;
  onError?: (error: Event) => void;
  onConnect?: () => void;
  onDisconnect?: () => void;
  enablePollingFallback?: boolean;
  pollingInterval?: number;
  pollingUrl?: string;
  maxReconnectAttempts?: number;
  reconnectDelay?: number;
}

interface SSEState {
  isConnected: boolean;
  isPolling: boolean;
  error: string | null;
  reconnectAttempts: number;
}

export function useSSE(options: SSEOptions) {
  const { data: session } = useSession();
  const [state, setState] = useState<SSEState>({
    isConnected: false,
    isPolling: false,
    error: null,
    reconnectAttempts: 0
  });

  const eventSourceRef = useRef<EventSource | null>(null);
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isManuallyClosedRef = useRef(false);

  const {
    url,
    onMessage,
    onError,
    onConnect,
    onDisconnect,
    enablePollingFallback = true,
    pollingInterval = 15000,
    pollingUrl,
    maxReconnectAttempts = 5,
    reconnectDelay = 2000
  } = options;

  // Polling fallback function
  const startPolling = useCallback(async () => {
    if (!enablePollingFallback || !pollingUrl || !session?.user?.id) return;

    setState(prev => ({ ...prev, isPolling: true }));

    const poll = async () => {
      try {
        const response = await fetch(pollingUrl);
        if (response.ok) {
          const data = await response.json();
          onMessage?.(data);
        }
      } catch (error) {
        console.error('Polling error:', error);
      }
    };

    // Initial poll
    await poll();

    // Set up polling interval
    pollingIntervalRef.current = setInterval(poll, pollingInterval);
  }, [enablePollingFallback, pollingUrl, pollingInterval, onMessage, session?.user?.id]);

  // Stop polling
  const stopPolling = useCallback(() => {
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
    }
    setState(prev => ({ ...prev, isPolling: false }));
  }, []);

  // Connect to SSE
  const connect = useCallback(() => {
    if (!session?.user?.id || isManuallyClosedRef.current) return;

    // Close existing connection
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }

    try {
      // For now, we'll use a simple approach - append user ID as query param
      // In production, you might want to use proper authentication headers
      const sseUrl = `${url}${url.includes('?') ? '&' : '?'}userId=${session.user.id}`;
      const eventSource = new EventSource(sseUrl);
      eventSourceRef.current = eventSource;

      eventSource.onopen = () => {
        setState(prev => ({ 
          ...prev, 
          isConnected: true, 
          error: null, 
          reconnectAttempts: 0 
        }));
        stopPolling(); // Stop polling when SSE connects
        onConnect?.(true);
      };

      eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          onMessage?.(data);
        } catch (error) {
          console.error('Error parsing SSE message:', error);
        }
      };

      eventSource.onerror = (event) => {
        setState(prev => ({ ...prev, isConnected: false }));
        onError?.(event);

        // Start polling fallback if SSE fails
        if (enablePollingFallback && !state.isPolling) {
          startPolling();
        }

        // Attempt reconnection
        setState(currentState => {
          if (currentState.reconnectAttempts < maxReconnectAttempts && !isManuallyClosedRef.current) {
            const delay = reconnectDelay * Math.pow(2, currentState.reconnectAttempts); // Exponential backoff
            
            reconnectTimeoutRef.current = setTimeout(() => {
              setState(prev => ({ ...prev, reconnectAttempts: prev.reconnectAttempts + 1 }));
              connect();
            }, delay);
            return currentState;
          } else if (enablePollingFallback && !currentState.isPolling) {
            // Fall back to polling permanently if max reconnect attempts reached
            startPolling();
            return currentState;
          }
          return currentState;
        });
      };

    } catch (error) {
      console.error('Error creating EventSource:', error);
      setState(prev => ({ ...prev, error: 'Failed to create SSE connection' }));
      
      // Fall back to polling
      if (enablePollingFallback) {
        startPolling();
      }
    }
  }, [url, session?.user?.id]);

  // Disconnect
  const disconnect = useCallback(() => {
    isManuallyClosedRef.current = true;
    
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }

    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    stopPolling();
    
    setState(prev => ({ 
      ...prev, 
      isConnected: false, 
      reconnectAttempts: 0 
    }));
    
    onDisconnect?.();
  }, [stopPolling, onDisconnect]);

  // Smart polling based on user activity and visibility
  useEffect(() => {
    let lastActivity = Date.now();
    
    // Track user activity for intelligent polling
    const trackActivity = () => {
      lastActivity = Date.now();
    };
    
    const activityEvents = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];
    activityEvents.forEach(event => {
      document.addEventListener(event, trackActivity, { passive: true });
    });

    const handleVisibilityChange = () => {
      if (document.hidden) {
        // Page is hidden - implement smart background polling
        if (state.isPolling && pollingIntervalRef.current) {
          clearInterval(pollingIntervalRef.current);
          
          // Background polling with progressive slow-down
          let backgroundInterval = pollingInterval * 2; // Start with 2x interval
          
          const backgroundPoll = async () => {
            if (!pollingUrl) return;
            
            try {
              const response = await fetch(pollingUrl);
              if (response.ok) {
                const data = await response.json();
                onMessage?.(data);
              }
              
              // Gradually increase interval (max 5 minutes)
              backgroundInterval = Math.min(backgroundInterval * 1.2, 5 * 60 * 1000);
            } catch (error) {
              console.error('Background polling error:', error);
            }
            
            // Schedule next poll with updated interval
            pollingIntervalRef.current = setTimeout(backgroundPoll, backgroundInterval);
          };
          
          // Start background polling
          pollingIntervalRef.current = setTimeout(backgroundPoll, backgroundInterval);
        }
      } else {
        // Page is visible - restore smart polling
        const timeSinceActivity = Date.now() - lastActivity;
        
        if (!state.isConnected && !isManuallyClosedRef.current) {
          connect();
        } else if (state.isPolling) {
          stopPolling();
          
          // Determine polling frequency based on recent activity
          let smartInterval = pollingInterval;
          if (timeSinceActivity > 2 * 60 * 1000) { // No activity for 2+ minutes
            smartInterval = pollingInterval * 2; // Slower polling
          } else if (timeSinceActivity < 30 * 1000) { // Active in last 30 seconds
            smartInterval = Math.max(pollingInterval * 0.7, 10000); // Faster polling, min 10s
          }
          
          console.log(`Smart polling interval: ${smartInterval}ms (activity: ${timeSinceActivity}ms ago)`);
          
          // Start polling with smart interval
          const smartPoll = async () => {
            if (!pollingUrl || !session?.user?.id) return;
            try {
              const response = await fetch(pollingUrl);
              if (response.ok) {
                const data = await response.json();
                onMessage?.(data);
              }
            } catch (error) {
              console.error('Smart polling error:', error);
            }
          };
          
          setState(prev => ({ ...prev, isPolling: true }));
          smartPoll(); // Call immediately without await
          pollingIntervalRef.current = setInterval(smartPoll, smartInterval);
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      activityEvents.forEach(event => {
        document.removeEventListener(event, trackActivity);
      });
    };
  }, [state.isConnected, state.isPolling, connect, startPolling, stopPolling, pollingUrl, pollingInterval, onMessage, session?.user?.id]);

  // Initial connection
  useEffect(() => {
    if (session?.user?.id && !isManuallyClosedRef.current) {
      isManuallyClosedRef.current = false;
      connect();
    }

    return () => {
      disconnect();
    };
  }, [session?.user?.id, connect, disconnect]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      disconnect();
    };
  }, [disconnect]);

  return {
    ...state,
    connect,
    disconnect,
    reconnect: connect
  };
}