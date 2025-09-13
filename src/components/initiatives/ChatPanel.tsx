import { useState, useEffect } from 'react';
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { MessageSquare, X, Send, Wifi, WifiOff, Radio } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import type { EnhancedChatMessage } from '@/lib/types';
import { useChat } from '@/hooks/useChat';
import { cn } from '@/lib/utils';
import Link from 'next/link';

interface ChatPanelProps {
  isOpen: boolean;
  onClose: () => void;
  initiativeId: string;
  currentUserId: string | undefined;
  mode?: 'overlay' | 'split' | 'modal'; // Add mode prop
}

export function ChatPanel({
  isOpen,
  onClose,
  initiativeId,
  currentUserId,
  mode = 'modal' // Default to modal for focused experience
}: ChatPanelProps) {
  const [newMessage, setNewMessage] = useState('');
  
  const {
    messages,
    isLoading,
    error,
    isConnected,
    isPolling,
    sendMessage
  } = useChat({
    initiativeId,
    enabled: isOpen
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    const success = await sendMessage(newMessage);
    if (success) {
      setNewMessage('');
    }
  };

  if (!isOpen) return null;

  // Modal mode - full screen focused experience
  if (mode === 'modal') {
    return (
      <div className="fixed inset-0 bg-black/50 z-[70] flex items-center justify-center p-4">
        <div className="bg-background rounded-lg shadow-2xl border w-full max-w-4xl h-[80vh] flex flex-col">
          <div className="flex items-center justify-between p-4 border-b">
            <div className="flex items-center gap-3">
              <MessageSquare className="h-5 w-5" />
              <span className="font-semibold text-lg">Initiative Chat</span>
              <div className="flex items-center gap-2">
                {isConnected && (
                  <Wifi className="h-4 w-4 text-green-500" title="Real-time connected" />
                )}
                {isPolling && !isConnected && (
                  <Radio className="h-4 w-4 text-yellow-500" title="Polling mode" />
                )}
                {!isConnected && !isPolling && (
                  <WifiOff className="h-4 w-4 text-red-500" title="Disconnected" />
                )}
              </div>
            </div>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
          <ScrollArea className="flex-1 p-4">
            {isLoading && messages.length === 0 && (
              <div className="text-center text-muted-foreground text-sm p-4">
                Loading messages...
              </div>
            )}
            {messages.map((message) => {
              const isCurrentUser = message.sender?.id === currentUserId;

              return (
                <div key={message.id} className={cn("mb-6 flex items-start gap-3", isCurrentUser ? 'justify-end' : 'justify-start')}>
                  {!isCurrentUser && (
                    <Link href={`/profile/${message.sender?.username || message.sender?.id}`} className="cursor-pointer hover:opacity-80 transition-opacity">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={message.sender?.image ?? undefined} alt={message.sender?.name || 'User'} />
                        <AvatarFallback>{(message.sender?.name || message.sender?.username || 'U')[0]}</AvatarFallback>
                      </Avatar>
                    </Link>
                  )}
                  <div className={cn(
                    "flex flex-col space-y-1 max-w-[70%]",
                    isCurrentUser ? 'items-end' : 'items-start'
                  )}>
                    <div className={cn("flex items-center gap-2", isCurrentUser && 'flex-row-reverse')}>
                      {!isCurrentUser && (
                        <Link href={`/profile/${message.sender?.username || message.sender?.id}`} className="cursor-pointer hover:underline">
                          <span className="font-semibold text-sm">
                            {message.sender?.name || message.sender?.username || 'User'}
                          </span>
                        </Link>
                      )}
                      <span className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(message.timestamp), { addSuffix: true })}
                      </span>
                    </div>
                    <p className={cn(
                      "text-sm p-3 rounded-lg max-w-full break-words",
                      isCurrentUser ? 'bg-primary text-primary-foreground' : 'bg-muted'
                    )}>
                      {message.text}
                    </p>
                  </div>
                  {isCurrentUser && (
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={message.sender?.image ?? undefined} alt={message.sender?.name || 'User'} />
                      <AvatarFallback>{(message.sender?.name || message.sender?.username || 'U')[0]}</AvatarFallback>
                    </Avatar>
                  )}
                </div>
              );
            })}
          </ScrollArea>
          <form onSubmit={handleSubmit} className="p-4 border-t flex items-center gap-3">
            <Input
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder={isConnected || isPolling ? "Type a message..." : "Connecting..."}
              className="flex-1 text-base"
              disabled={!isConnected && !isPolling}
            />
            <Button type="submit" disabled={!isConnected && !isPolling}>
              <Send className="h-4 w-4" />
            </Button>
          </form>
        </div>
      </div>
    );
  }

  // Split mode - takes up half the screen
  if (mode === 'split') {
    return (
      <div className="fixed inset-y-0 right-0 w-1/2 bg-background border-l z-[70] flex flex-col">
        <div className="flex items-center justify-between p-3 border-b">
          <div className="flex items-center gap-2">
            <MessageSquare className="h-4 w-4" />
            <span className="font-semibold">Chat</span>
            {isConnected && (
              <Wifi className="h-4 w-4 text-green-500" title="Real-time connected" />
            )}
            {isPolling && !isConnected && (
              <Radio className="h-4 w-4 text-yellow-500" title="Polling mode" />
            )}
            {!isConnected && !isPolling && (
              <WifiOff className="h-4 w-4 text-red-500" title="Disconnected" />
            )}
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>
        <ScrollArea className="flex-1 p-3">
          {isLoading && messages.length === 0 && (
            <div className="text-center text-muted-foreground text-sm p-4">
              Loading messages...
            </div>
          )}
          {messages.map((message) => {
            const isCurrentUser = message.sender?.id === currentUserId;

            return (
              <div key={message.id} className={cn("mb-4 flex items-end", isCurrentUser ? 'justify-end' : 'justify-start')}>
                {!isCurrentUser && (
                  <Link href={`/profile/${message.sender?.username || message.sender?.id}`} className="cursor-pointer hover:opacity-80 transition-opacity">
                    <Avatar className="h-8 w-8 mr-2">
                      <AvatarImage src={message.sender?.image ?? undefined} alt={message.sender?.name || 'User'} />
                      <AvatarFallback>{(message.sender?.name || message.sender?.username || 'U')[0]}</AvatarFallback>
                    </Avatar>
                  </Link>
                )}
                <div className={cn(
                  "flex flex-col space-y-1 max-w-[70%]",
                  isCurrentUser ? 'items-end' : 'items-start'
                )}>
                  <div className={cn("flex items-center gap-2", isCurrentUser && 'flex-row-reverse')}>
                    {!isCurrentUser && (
                      <Link href={`/profile/${message.sender?.username || message.sender?.id}`} className="cursor-pointer hover:underline">
                        <span className="font-semibold text-sm">
                          {message.sender?.name || message.sender?.username || 'User'}
                        </span>
                      </Link>
                    )}
                    <span className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(message.timestamp), { addSuffix: true })}
                    </span>
                  </div>
                  <p className={cn(
                    "text-sm p-2 rounded-lg",
                    isCurrentUser ? 'bg-primary text-primary-foreground' : 'bg-muted'
                  )}>
                    {message.text}
                  </p>
                </div>
                {isCurrentUser && (
                  <Avatar className="h-8 w-8 ml-2">
                    <AvatarImage src={message.sender?.image ?? undefined} alt={message.sender?.name || 'User'} />
                    <AvatarFallback>{(message.sender?.name || message.sender?.username || 'U')[0]}</AvatarFallback>
                  </Avatar>
                )}
              </div>
            );
          })}
        </ScrollArea>
        <form onSubmit={handleSubmit} className="p-3 border-t flex items-center gap-2">
          <Input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder={isConnected || isPolling ? "Type a message..." : "Connecting..."}
            className="flex-1"
            disabled={!isConnected && !isPolling}
          />
          <Button type="submit" size="icon" disabled={!isConnected && !isPolling}>
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </div>
    );
  }

  // Original overlay mode (small floating window)

  return (
    <div className="fixed bottom-20 right-4 w-80 h-96 md:w-1/2 bg-background rounded-lg shadow-lg border z-[70] flex flex-col">
      <div className="flex items-center justify-between p-2 border-b">
        <div className="flex items-center gap-2">
          <span className="font-semibold">Chat</span>
          {isConnected && (
            <Wifi className="h-4 w-4 text-green-500" title="Real-time connected" />
          )}
          {isPolling && !isConnected && (
            <Radio className="h-4 w-4 text-yellow-500" title="Polling mode" />
          )}
          {!isConnected && !isPolling && (
            <WifiOff className="h-4 w-4 text-red-500" title="Disconnected" />
          )}
          {error && (
            <span className="text-xs text-red-500 ml-2">{error}</span>
          )}
        </div>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>
      <ScrollArea className="flex-1 p-2">
        {isLoading && messages.length === 0 && (
          <div className="text-center text-muted-foreground text-sm p-4">
            Loading messages...
          </div>
        )}
        {messages.map((message) => {
          const isCurrentUser = message.sender?.id === currentUserId;

          return (
            <div key={message.id} className={cn("mb-4 flex items-end", isCurrentUser ? 'justify-end' : 'justify-start')}>
              {!isCurrentUser && (
                <Link href={`/profile/${message.sender?.username || message.sender?.id}`} className="cursor-pointer hover:opacity-80 transition-opacity">
                  <Avatar className="h-8 w-8 mr-2">
                    <AvatarImage src={message.sender?.image ?? undefined} alt={message.sender?.name || 'User'} />
                    <AvatarFallback>{(message.sender?.name || message.sender?.username || 'U')[0]}</AvatarFallback>
                  </Avatar>
                </Link>
              )}
              <div className={cn(
                "flex flex-col space-y-1 max-w-[70%]",
                isCurrentUser ? 'items-end' : 'items-start'
              )}>
                <div className={cn("flex items-center gap-2", isCurrentUser && 'flex-row-reverse')}>
                  {!isCurrentUser && (
                    <Link href={`/profile/${message.sender?.username || message.sender?.id}`} className="cursor-pointer hover:underline">
                      <span className="font-semibold text-sm">
                        {message.sender?.name || message.sender?.username || 'User'}
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
                  <AvatarImage src={message.sender?.image ?? undefined} alt={message.sender?.name || 'User'} />
                  <AvatarFallback>{(message.sender?.name || message.sender?.username || 'U')[0]}</AvatarFallback>
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
          placeholder={isConnected || isPolling ? "Type a message..." : "Connecting..."}
          className="flex-1"
          disabled={!isConnected && !isPolling}
        />
        <Button type="submit" variant="default" size="icon" disabled={!isConnected && !isPolling}>
          <Send className="h-4 w-4" />
        </Button>
      </form>
    </div>
  );
}
