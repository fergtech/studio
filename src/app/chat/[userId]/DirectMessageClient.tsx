'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ArrowLeft, Send, User2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useToast } from '@/components/ui/use-toast';
import { io, Socket } from 'socket.io-client';

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
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [socket, setSocket] = useState<Socket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const { toast } = useToast();

  // Initialize socket connection
  useEffect(() => {
    const socketUrl = process.env.NEXT_PUBLIC_SOCKET_SERVER_URL || 'http://localhost:9003';
    const socketInstance = io(socketUrl, {
      // path: '/api/socketio',
      transports: ['websocket', 'polling']
    });

    socketInstance.on('connect', () => {
      console.log('DirectMessageClient: Socket connected');
      // Join a room for this specific conversation
      socketInstance.emit('joinConversation', `${currentUserId}-${otherUser.id}`);
    });

    socketInstance.on('receiveDirectMessage', (message) => {
      console.log('DirectMessageClient: Received direct message:', message);
      setMessages(prev => [...prev, message]);
    });

    setSocket(socketInstance);

    return () => {
      socketInstance.disconnect();
    };
  }, [currentUserId, otherUser.id]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async () => {
    if (!newMessage.trim() || isLoading) return;

    setIsLoading(true);
    const messageText = newMessage.trim();
    setNewMessage('');

    try {
      const response = await fetch('/api/direct-messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          receiverId: otherUser.id,
          text: messageText,
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

      // Emit socket event for real-time updates
      if (socket) {
        socket.emit('sendDirectMessage', {
          ...savedMessage,
          conversationId: `${currentUserId}-${otherUser.id}`,
        });
      }
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to send message. Please try again.',
        variant: 'destructive',
      });
      // Restore the message text if sending failed
      setNewMessage(messageText);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="container mx-auto px-4 py-4">
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
      <div className="container mx-auto px-4 py-4">
        <Card className="h-[calc(100vh-200px)] flex flex-col">
          <CardHeader className="flex-shrink-0 pb-2">
            <h2 className="text-lg font-semibold">Direct Message</h2>
          </CardHeader>
          
          <CardContent className="flex-1 flex flex-col p-0">
            {/* Messages List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.length === 0 ? (
                <div className="text-center text-gray-500 dark:text-gray-400 py-8">
                  <p>No messages yet. Start the conversation!</p>
                </div>
              ) : (
                messages.map((message) => {
                  const isOwnMessage = message.senderId === currentUserId;
                  
                  return (
                    <div
                      key={message.id}
                      className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                          isOwnMessage
                            ? 'bg-blue-500 text-white'
                            : 'bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white'
                        }`}
                      >
                        <p className="text-sm">{message.text}</p>
                        <p className={`text-xs mt-1 ${
                          isOwnMessage ? 'text-blue-100' : 'text-gray-500 dark:text-gray-400'
                        }`}>
                          {formatDistanceToNow(new Date(message.timestamp), { addSuffix: true })}
                        </p>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Message Input */}
            <div className="flex-shrink-0 p-4 border-t border-gray-200 dark:border-gray-700">
              <div className="flex gap-2">
                <Input
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Type your message..."
                  disabled={isLoading}
                  className="flex-1"
                />
                <Button
                  onClick={handleSendMessage}
                  disabled={!newMessage.trim() || isLoading}
                  size="sm"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 
