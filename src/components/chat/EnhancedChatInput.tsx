'use client';

import { useState, useRef, KeyboardEvent } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { X, Reply, Send } from 'lucide-react';

interface ChatMessage {
  id: string;
  text: string;
  senderName: string;
  sender: {
    id: string;
    name: string | null;
    image: string | null;
    username: string | null;
  };
}

interface EnhancedChatInputProps {
  onSendMessage: (text: string, replyToId?: string) => void;
  disabled?: boolean;
  placeholder?: string;
  replyingTo?: ChatMessage | null;
  onCancelReply?: () => void;
}

export function EnhancedChatInput({
  onSendMessage,
  disabled = false,
  placeholder = "Type a message...",
  replyingTo,
  onCancelReply
}: EnhancedChatInputProps) {
  const [message, setMessage] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || disabled) return;

    onSendMessage(message.trim(), replyingTo?.id);
    setMessage('');
    
    // Clear reply state
    if (onCancelReply) {
      onCancelReply();
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e as any);
    }
  };

  const handleCancelReply = () => {
    if (onCancelReply) {
      onCancelReply();
    }
  };

  return (
    <div className="border-t bg-background">
      {/* Reply indicator */}
      {replyingTo && (
        <div className="px-4 py-2 bg-muted/30 border-b flex items-center justify-between">
          <div className="flex items-center gap-2 flex-1">
            <Reply className="h-4 w-4 text-muted-foreground" />
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium">
                Replying to {replyingTo.sender.name || replyingTo.senderName}
              </div>
              <div className="text-xs text-muted-foreground truncate">
                {replyingTo.text.length > 80 
                  ? replyingTo.text.substring(0, 80) + '...' 
                  : replyingTo.text
                }
              </div>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleCancelReply}
            className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      )}

      {/* Message input */}
      <form onSubmit={handleSubmit} className="p-4">
        <div className="flex gap-2 items-end">
          <div className="flex-1">
            <Textarea
              ref={textareaRef}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={placeholder}
              disabled={disabled}
              rows={1}
              className="min-h-[44px] max-h-[120px] resize-none"
              style={{ 
                height: 'auto',
                minHeight: '44px'
              }}
              onInput={(e) => {
                const target = e.target as HTMLTextAreaElement;
                target.style.height = 'auto';
                target.style.height = Math.min(target.scrollHeight, 120) + 'px';
              }}
            />
          </div>
          <Button
            type="submit"
            size="sm"
            disabled={disabled || !message.trim()}
            className="h-11 px-3"
          >
            <Send className="h-4 w-4" />
            <span className="sr-only">Send message</span>
          </Button>
        </div>
      </form>
    </div>
  );
}