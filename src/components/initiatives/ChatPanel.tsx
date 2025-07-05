import { useState, useEffect } from 'react';
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { MessageSquare, X, Send, Wifi, WifiOff } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import type { EnhancedChatMessage } from '@/lib/types';
import { io, Socket } from 'socket.io-client';
import { toast } from '@/components/ui/use-toast';
import { cn } from '@/lib/utils';
import Link from 'next/link';

interface ChatPanelProps {
  isOpen: boolean;
  onClose: () => void;
  messages: EnhancedChatMessage[];
  onSendMessage: (message: string) => void;
  currentUserId: string | undefined;
  socket: Socket | null;
}

export function ChatPanel({
  isOpen,
  onClose,
  messages,
  onSendMessage,
  currentUserId,
  socket
}: ChatPanelProps) {
  console.log('ChatPanel rendering. isOpen:', isOpen);
  const [newMessage, setNewMessage] = useState('');
  const [chatMessages, setChatMessages] = useState<EnhancedChatMessage[]>(messages);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    setChatMessages(messages);
  }, [messages]);

  useEffect(() => {
    console.log('ChatPanel useEffect [socket]: running. Socket status:', socket?.connected);
    if (socket) {
      console.log('ChatPanel: Attaching socket listeners.');

      const handleConnect = () => {
        console.log('ChatPanel: Socket connected! Updating state.');
        setIsConnected(true);
        toast({
          title: "Connected",
          description: "Chat connection established",
        });
      };

      const handleDisconnect = () => {
        console.log('ChatPanel: Socket disconnected. Updating state.');
        setIsConnected(false);
        toast({
          title: "Disconnected",
          description: "Chat connection lost",
          variant: "destructive",
        });
      };

      const handleConnectError = (error: any) => {
        console.error('ChatPanel: Socket connection error:', error);
        setIsConnected(false);
        // toast({
        //   title: "Connection Error",
        //   description: "Failed to connect to chat server",
        //   variant: "destructive",
        // });
      };

      const handleReceiveMessage = (message: EnhancedChatMessage) => {
        console.log('ChatPanel: Received message:', message);
        setChatMessages((prevMessages) => {
          if (prevMessages.find(msg => msg.id === message.id)) {
            return prevMessages;
          }
          return [...prevMessages, message];
        });
      };

      socket.on('connect', handleConnect);
      socket.on('disconnect', handleDisconnect);
      socket.on('connect_error', handleConnectError);
      socket.on('receiveMessage', handleReceiveMessage);

      console.log('ChatPanel: Socket listeners attached.');

      if (socket.connected) {
        console.log('ChatPanel useEffect [socket]: Socket already connected on prop receive, setting isConnected to true.');
        setIsConnected(true);
      }

      return () => {
        console.log('ChatPanel: Cleaning up socket listeners.');
        socket.off('connect', handleConnect);
        socket.off('disconnect', handleDisconnect);
        socket.off('connect_error', handleConnectError);
        socket.off('receiveMessage', handleReceiveMessage);
      };
    }
  }, [socket]);

  useEffect(() => {
    if (isOpen) {
      console.log('ChatPanel useEffect [isOpen, socket]: Panel opened. Checking socket connection status.');
      if (socket?.connected) {
        console.log('ChatPanel useEffect [isOpen, socket]: Socket already connected when panel opened.');
        setIsConnected(true);
      } else {
        console.log('ChatPanel useEffect [isOpen, socket]: Socket not connected or not available when panel opened.');
        setIsConnected(false);
      }
    } else {
      console.log('ChatPanel useEffect [isOpen, socket]: Panel closed.');
      setIsConnected(false);
    }
  }, [isOpen, socket]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !isConnected) return;

    onSendMessage(newMessage);
    setNewMessage('');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed bottom-20 right-4 w-80 h-96 md:w-1/2 bg-background rounded-lg shadow-lg border z-50 flex flex-col">
      <div className="flex items-center justify-between p-2 border-b">
        <div className="flex items-center gap-2">
          <span className="font-semibold">Chat</span>
          {isConnected ? (
            <Wifi className="h-4 w-4 text-green-500" />
          ) : (
            <WifiOff className="h-4 w-4 text-red-500" />
          )}
        </div>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>
      <ScrollArea className="flex-1 p-2">
        {chatMessages.map((message) => {
          console.log('ChatPanel: Rendering message with text:', message.text, 'Message object:', message);
          const isCurrentUser = message.sender?.id === currentUserId;

          return (
            <div key={message.id} className={cn("mb-4 flex items-end", isCurrentUser ? 'justify-end' : 'justify-start')}>
              {!isCurrentUser && (
                <Link href={`/profile/${message.sender?.id}`} className="cursor-pointer hover:opacity-80 transition-opacity">
                  <Avatar className="h-8 w-8 mr-2">
                    <AvatarImage src={message.sender?.image ?? undefined} alt={message.senderName} />
                    <AvatarFallback>{message.senderName[0]}</AvatarFallback>
                  </Avatar>
                </Link>
              )}
              <div className={cn(
                "flex flex-col space-y-1 max-w-[70%]",
                isCurrentUser ? 'items-end' : 'items-start'
              )}>
                <div className={cn("flex items-center gap-2", isCurrentUser && 'flex-row-reverse')}>
                  {!isCurrentUser && (
                    <Link href={`/profile/${message.sender?.id}`} className="cursor-pointer hover:underline">
                      <span className="font-semibold text-sm">
                        {message.senderName}
                      </span>
                    </Link>
                  )}
                  <span className="text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(message.timestamp), { addSuffix: true })}
                  </span>
                </div>
                <p className={cn(
                  "text-sm p-2 rounded-lg",
                  isCurrentUser ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                )}>
                  {message.text}
                </p>
              </div>
              {isCurrentUser && (
                <Avatar className="h-8 w-8 ml-2 sr-only">
                  <AvatarImage src={message.sender?.image ?? undefined} alt={message.senderName} />
                  <AvatarFallback>{message.senderName[0]}</AvatarFallback>
                </Avatar>
              )}
            </div>
          );
        })}
      </ScrollArea>
      <form onSubmit={handleSubmit} className="p-2 border-t flex items-center gap-2">
        <Input
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder={isConnected ? "Type a message..." : "Connecting..."}
          className="flex-1"
          disabled={!isConnected}
        />
        <Button type="submit" variant="default" size="icon" disabled={!isConnected}>
          <Send className="h-4 w-4" />
        </Button>
      </form>
    </div>
  );
}
