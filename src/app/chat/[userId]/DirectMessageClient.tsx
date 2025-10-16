'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ArrowLeft, User2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useToast } from '@/components/ui/use-toast';
// import { io, Socket } from 'socket.io-client'; // Temporarily disabled for Vercel deployment
import AppSidebar, { getDefaultCollapsedState } from '@/components/AppSidebar';
import Image from 'next/image';
import { ChatMessageBubble } from '@/components/chat/ChatMessageBubble';
import { EnhancedChatInput } from '@/components/chat/EnhancedChatInput';

interface DirectMessageClientProps {
  otherUser: {
    id: string;
    name: string | null;
    username: string | null;
    image: string | null;
  };
  initialMessages: any[];
  currentUserId: string;
}

export default function DirectMessageClient({ 
  otherUser, 
  initialMessages, 
  currentUserId 
}: DirectMessageClientProps) {
  const [messages, setMessages] = useState(initialMessages);
  const [isLoading, setIsLoading] = useState(false);
  const [replyingTo, setReplyingTo] = useState<any | null>(null);
  const [deletingMessageId, setDeletingMessageId] = useState<string | null>(null);
  // const [socket, setSocket] = useState<Socket | null>(null); // Temporarily disabled
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => getDefaultCollapsedState({ type: 'chat' }));
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const { toast } = useToast();

  // Reply handler - sets the message to reply to
  const handleReply = (message: any) => {
    console.log('Setting reply to:', message);
    setReplyingTo(message);
    toast({
      title: "Reply mode activated",
      description: `Replying to: "${message.text.substring(0, 50)}${message.text.length > 50 ? '...' : ''}"`
    });
  };

  // Delete handler - calls API to soft delete message
  const handleDelete = async (messageId: string) => {
    if (deletingMessageId) return; // Prevent multiple deletes
    
    setDeletingMessageId(messageId);
    
    try {
      // Call the delete API endpoint
      const response = await fetch(`/api/chat/message/${messageId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const responseText = await response.text();
        let errorData;
        try {
          errorData = JSON.parse(responseText);
        } catch {
          errorData = { error: responseText || 'Unknown error' };
        }

        // If message is already deleted, just remove from UI silently
        if (response.status === 400 && errorData.error?.includes('already deleted')) {
          console.log('Message already deleted in DB, removing from UI');
          setMessages(prev => prev.filter(msg => msg.id !== messageId));
          return;
        }

        console.error('Delete API error:', response.status, responseText);
        throw new Error(errorData.error || `Failed to delete message: ${response.status}`);
      }

      // Remove message from local state (optimistic update)
      setMessages(prev => prev.filter(msg => msg.id !== messageId));
      
      toast({
        title: "Message deleted",
        description: "Your message has been deleted."
      });
    } catch (error) {
      console.error('Error deleting message:', error);
      toast({
        title: "Error",
        description: "Failed to delete message. Please try again.",
        variant: "destructive"
      });
    } finally {
      setDeletingMessageId(null);
    }
  };

  // Cancel reply handler
  const handleCancelReply = () => {
    setReplyingTo(null);
  };

  // Socket connection temporarily disabled for Vercel deployment
  useEffect(() => {
    // TODO: Re-enable real-time chat after implementing polling system
    // const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_SERVER_URL || 'http://localhost:9003';

    // const socketInstance = io(SOCKET_URL, {
    //     transports: ['websocket', 'polling']
    // });

    // socketInstance.on('connect', () => {
    //   console.log('DirectMessageClient: Socket connected');
    //   socketInstance.emit('joinConversation', `${currentUserId}-${otherUser.id}`);
    // });

    // socketInstance.on('receiveDirectMessage', (message) => {
    //   console.log('DirectMessageClient: Received direct message:', message);
    //   setMessages(prev => [...prev, message]);
    // });

    // setSocket(socketInstance);

    // return () => {
    //   socketInstance.disconnect();
    // };
  }, [currentUserId, otherUser.id]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (messageText: string, replyToId?: string) => {
    if (!messageText.trim() || isLoading) return;

    setIsLoading(true);
    
    // Clear reply state if replying
    if (replyToId && replyingTo) {
      setReplyingTo(null);
    }

    try {
      const response = await fetch(`/api/chat/direct/${otherUser.id}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: messageText.trim(),
          replyToId: replyToId, // Include reply reference
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('Server error response:', errorData);
        throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
      }

      const savedMessage = await response.json();

      // Add message to local state
      setMessages(prev => [...prev, savedMessage]);

    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to send message. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex h-screen overflow-hidden">
      <AppSidebar
        widgets={['userControls', 'navigation', 'resources', 'footer']}
        context={{ type: 'chat' }}
        onCollapseChange={setSidebarCollapsed}
      />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Header */}
        <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
          <div className="px-4 py-4 max-w-full">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.back()}
                className="p-2"
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>

              <Avatar className="h-10 w-10">
                <AvatarImage src={otherUser.image || undefined} />
                <AvatarFallback>
                  {otherUser.name ? otherUser.name.charAt(0).toUpperCase() : <User2 className="h-4 w-4" />}
                </AvatarFallback>
              </Avatar>

              <div>
                <h1 className="font-semibold text-gray-900 dark:text-white">
                  {otherUser.name || 'Anonymous User'}
                </h1>
                {otherUser.username && (
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    @{otherUser.username}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.length === 0 ? (
              <div className="text-center text-gray-500 dark:text-gray-400 py-8">
                <p>No messages yet. Start the conversation!</p>
              </div>
            ) : (
              messages
                .filter(msg => !msg.isDeleted) // Client-side safety filter
                .map((message) => (
                  <ChatMessageBubble
                    key={message.id}
                    message={message}
                    currentUserId={currentUserId}
                    onReply={handleReply}
                    onDelete={handleDelete}
                    isDeleting={deletingMessageId === message.id}
                  />
                ))
            )}
            <div ref={messagesEndRef} />
          </div>
          
          {/* Enhanced Message Input with Reply Support */}
          <div className="flex-shrink-0">
            <EnhancedChatInput
              onSendMessage={handleSendMessage}
              disabled={isLoading}
              placeholder="Type a message..."
              replyingTo={replyingTo}
              onCancelReply={handleCancelReply}
            />
            {/* Debug: Show current reply state */}
            {replyingTo && (
              <div className="p-2 bg-red-100 text-red-800 text-xs">
                DEBUG: Replying to: {replyingTo.text}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
