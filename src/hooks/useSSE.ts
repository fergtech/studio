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

  // Handle page visibility changes (mobile background/foreground)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        // Page is hidden, can reduce polling frequency or pause SSE
        if (state.isPolling && pollingIntervalRef.current) {
          clearInterval(pollingIntervalRef.current);
          // Reduce polling frequency when in background
          pollingIntervalRef.current = setInterval(async () => {
            if (!pollingUrl) return;
            try {
              const response = await fetch(pollingUrl);
              if (response.ok) {
                const data = await response.json();
                onMessage?.(data);
              }
            } catch (error) {
              console.error('Background polling error:', error);
            }
          }, pollingInterval * 2); // Double the interval in background
        }
      } else {
        // Page is visible, restore normal behavior
        if (!state.isConnected && !isManuallyClosedRef.current) {
          connect();
        } else if (state.isPolling) {
          stopPolling();
          startPolling(); // Restore normal polling frequency
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [state.isConnected, state.isPolling, connect, startPolling, stopPolling, pollingUrl, pollingInterval, onMessage]);

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