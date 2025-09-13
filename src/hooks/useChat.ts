'use client';

import { useCallback, useState, useEffect } from 'react';
import { useSSE } from './useSSE';

interface ChatMessage {
  id: string;
  text: string;
  timestamp: Date;
  senderId: string;
  sender: {
    id: string;
    name: string | null;
    username: string | null;
    image: string | null;
  };
  initiativeId?: string;
}

interface UseChatOptions {
  initiativeId?: string;
  userId?: string; // For direct messages
  enabled?: boolean;
}

export function useChat({ initiativeId, userId, enabled = true }: UseChatOptions) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Determine SSE endpoint based on chat type
  const sseUrl = initiativeId 
    ? `/api/sse/chat/${initiativeId}`
    : userId 
    ? `/api/sse/messages/${userId}`
    : '';

  // Determine polling endpoint
  const pollingUrl = initiativeId
    ? `/api/chat/messages?initiativeId=${initiativeId}`
    : userId
    ? `/api/direct-messages?userId=${userId}`
    : '';

  const handleSSEMessage = useCallback((data: any) => {
    if (data.type === 'messages' && data.data) {
      const newMessages = data.data as ChatMessage[];
      setMessages(prev => {
        const existingIds = new Set(prev.map(m => m.id));
        const uniqueNew = newMessages.filter(m => !existingIds.has(m.id));
        
        if (uniqueNew.length > 0) {
          return [...prev, ...uniqueNew].sort((a, b) => 
            new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
          );
        }
        return prev;
      });
    } else if (data.type === 'directMessages' && data.data) {
      const newMessages = data.data as ChatMessage[];
      setMessages(prev => {
        const existingIds = new Set(prev.map(m => m.id));
        const uniqueNew = newMessages.filter(m => !existingIds.has(m.id));
        
        if (uniqueNew.length > 0) {
          return [...prev, ...uniqueNew].sort((a, b) => 
            new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
          );
        }
        return prev;
      });
    }
  }, []);

  // Use polling for now (SSE temporarily disabled due to infinite loop)
  const [isConnected, setIsConnected] = useState(false);
  const [isPolling, setIsPolling] = useState(true);
  const sseError = null;

  // Set up polling for messages
  useEffect(() => {
    if (!enabled || (!initiativeId && !userId)) return;

    const pollMessages = async () => {
      try {
        const url = initiativeId
          ? `/api/chat/messages?initiativeId=${initiativeId}&limit=50`
          : `/api/direct-messages?userId=${userId}&limit=50`;
          
        const response = await fetch(url);
        if (response.ok) {
          const data = await response.json();
          setMessages(data.sort((a: ChatMessage, b: ChatMessage) => 
            new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
          ));
        }
      } catch (error) {
        console.error('Error polling messages:', error);
        setError('Failed to fetch messages');
      }
    };

    // Initial poll
    pollMessages();

    // Poll every 3 seconds for chat
    const pollInterval = setInterval(pollMessages, 3000);

    return () => {
      clearInterval(pollInterval);
    };
  }, [enabled, initiativeId, userId]);

  // Fetch initial messages
  const fetchMessages = useCallback(async () => {
    if (!enabled || (!initiativeId && !userId)) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const url = initiativeId
        ? `/api/chat/messages?initiativeId=${initiativeId}&limit=50`
        : `/api/direct-messages?userId=${userId}&limit=50`;
        
      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        setMessages(data.sort((a: ChatMessage, b: ChatMessage) => 
          new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
        ));
      } else {
        setError('Failed to fetch messages');
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
      setError('Failed to fetch messages');
    } finally {
      setIsLoading(false);
    }
  }, [initiativeId, userId, enabled]);

  // Send message
  const sendMessage = useCallback(async (text: string) => {
    if (!text.trim() || (!initiativeId && !userId)) return;

    try {
      const url = initiativeId
        ? '/api/chat/messages'
        : '/api/direct-messages';
        
      // Get current user info from session storage or make API call
      let senderId: string | undefined;
      let senderName: string | undefined;
      
      // Try to get from session
      try {
        const sessionResponse = await fetch('/api/auth/session');
        if (sessionResponse.ok) {
          const session = await sessionResponse.json();
          senderId = session?.user?.id;
          senderName = session?.user?.name || session?.user?.username || 'User';
        }
      } catch (sessionError) {
        console.error('Error getting session:', sessionError);
      }

      if (!senderId) {
        setError('Authentication required');
        return;
      }
        
      const body = initiativeId
        ? { text, initiativeId, senderId, senderName }
        : { text, receiverId: userId, senderId, senderName };

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });

      if (response.ok) {
        const newMessage = await response.json();
        // Optimistically add the message
        setMessages(prev => [...prev, newMessage]);
        return newMessage; // This is truthy for success check
      } else {
        const errorData = await response.text();
        console.error('Send message error:', errorData);
        setError('Failed to send message');
        return false; // Return false for failure
      }
    } catch (error) {
      console.error('Error sending message:', error);
      setError('Failed to send message');
      return false; // Return false for failure
    }
  }, [initiativeId, userId]);

  // Load initial messages when component mounts or chat target changes
  useEffect(() => {
    if (enabled && (initiativeId || userId)) {
      fetchMessages();
    }
  }, [fetchMessages, enabled, initiativeId, userId]);

  return {
    messages,
    isLoading,
    error: error || sseError,
    isConnected,
    isPolling,
    sendMessage,
    fetchMessages,
    refetch: fetchMessages
  };
}