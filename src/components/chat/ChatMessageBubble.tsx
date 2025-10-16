'use client';

import { useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { MoreHorizontal, Reply, Trash2 } from 'lucide-react';
import { RichMessageRenderer } from '@/components/RichMessageRenderer';
import { useToast } from '@/components/ui/use-toast';

interface ChatMessage {
  id: string;
  text: string;
  timestamp: Date | string;
  senderId: string;
  senderName: string;
  isDeleted?: boolean;
  deletedAt?: Date | string | null;
  sender: {
    id: string;
    name: string | null;
    image: string | null;
    username: string | null;
  };
  replyTo?: {
    id: string;
    text: string;
    senderName: string;
    isDeleted?: boolean;
    sender: {
      id: string;
      name: string | null;
      image: string | null;
      username: string | null;
    };
  } | null;
  reactions?: Array<{
    id: string;
    emoji: string;
    user: {
      id: string;
      name: string | null;
      username: string | null;
    };
  }>;
}

interface ChatMessageBubbleProps {
  message: ChatMessage;
  currentUserId: string;
  onReply: (message: ChatMessage) => void;
  onDelete: (messageId: string) => void;
  isDeleting?: boolean;
}

export function ChatMessageBubble({
  message,
  currentUserId,
  onReply,
  onDelete,
  isDeleting = false
}: ChatMessageBubbleProps) {
  const { toast } = useToast();
  const [isHovered, setIsHovered] = useState(false);
  const isOwnMessage = message.senderId === currentUserId;
  const isDeleted = message.isDeleted;

  const handleDelete = async () => {
    if (!isOwnMessage || isDeleted) return;
    
    try {
      await onDelete(message.id);
      // Success toast is handled by the parent component
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete message. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleReply = () => {
    if (isDeleted) return;
    onReply(message);
  };

  if (isDeleted) {
    return (
      <div className={`flex mb-4 ${isOwnMessage ? 'justify-end' : 'justify-start'}`}>
        <div className={`max-w-[70%] ${isOwnMessage ? 'ml-12' : 'mr-12'}`}>
          <div className="flex items-center gap-2 mb-1">
            {!isOwnMessage && (
              <>
                <Avatar className="h-6 w-6">
                  <AvatarImage src={message.sender.image || ''} />
                  <AvatarFallback className="text-xs">
                    {(message.sender.name || message.senderName || 'U').charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <span className="text-sm font-medium text-foreground">
                  {message.sender.name || message.senderName}
                </span>
              </>
            )}
            <span className="text-xs text-muted-foreground">
              {formatDistanceToNow(new Date(message.timestamp), { addSuffix: true })}
            </span>
          </div>
          <div className={`rounded-lg px-3 py-2 italic text-muted-foreground border border-dashed ${
            isOwnMessage 
              ? 'bg-muted/30 border-muted-foreground/30' 
              : 'bg-muted/20 border-muted-foreground/20'
          }`}>
            This message was deleted
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex mb-4 ${isOwnMessage ? 'justify-end' : 'justify-start'}`}>
      <div className={`max-w-[70%] ${isOwnMessage ? 'ml-12' : 'mr-12'}`}>
        {/* Reply indicator */}
        {message.replyTo && (
          <div className="mb-2 ml-4 pl-3 border-l-2 border-muted-foreground/30">
            <div className="text-xs text-muted-foreground mb-1">
              Replying to {message.replyTo.sender.name || message.replyTo.senderName}
            </div>
            <div className="text-sm text-muted-foreground bg-muted/30 rounded px-2 py-1">
              {message.replyTo.isDeleted ? (
                <em>This message was deleted</em>
              ) : (
                message.replyTo.text.length > 100 
                  ? message.replyTo.text.substring(0, 100) + '...' 
                  : message.replyTo.text
              )}
            </div>
          </div>
        )}

        {/* Message header */}
        <div className="flex items-center gap-2 mb-1">
          {!isOwnMessage && (
            <>
              <Avatar className="h-6 w-6">
                <AvatarImage src={message.sender.image || ''} />
                <AvatarFallback className="text-xs">
                  {(message.sender.name || message.senderName || 'U').charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <span className="text-sm font-medium text-foreground">
                {message.sender.name || message.senderName}
              </span>
            </>
          )}
          <span className="text-xs text-muted-foreground">
            {formatDistanceToNow(new Date(message.timestamp), { addSuffix: true })}
          </span>
        </div>

        {/* Message bubble with actions */}
        <div className="relative group">
          <div className={`rounded-lg px-3 py-2 ${
            isOwnMessage 
              ? 'bg-primary text-primary-foreground' 
              : 'bg-muted text-foreground'
          }`}>
            <RichMessageRenderer text={message.text} />
          </div>

          {/* Message actions */}
          <div className={`absolute top-0 ${
            isOwnMessage ? '-left-12' : '-right-12'
          } opacity-0 group-hover:opacity-100 transition-opacity duration-200`}>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0 bg-background/80 backdrop-blur-sm border shadow-sm"
                >
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align={isOwnMessage ? "end" : "start"}>
                <DropdownMenuItem onClick={handleReply}>
                  <Reply className="h-4 w-4 mr-2" />
                  Reply
                </DropdownMenuItem>
                {isOwnMessage && (
                  <DropdownMenuItem 
                    onClick={handleDelete}
                    disabled={isDeleting}
                    className="text-destructive focus:text-destructive"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    {isDeleting ? 'Deleting...' : 'Delete'}
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Reactions */}
        {message.reactions && message.reactions.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2">
            {message.reactions.map((reaction) => (
              <span
                key={reaction.id}
                className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-muted text-xs"
              >
                {reaction.emoji}
                <span className="text-muted-foreground">
                  {reaction.user.name || reaction.user.username}
                </span>
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}