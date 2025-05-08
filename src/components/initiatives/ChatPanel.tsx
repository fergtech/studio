import { useState } from 'react';
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { MessageSquare, X, ImageIcon, Smile, Send } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { formatDistanceToNow } from 'date-fns';
import type { EnhancedChatMessage, OnlineMember } from '@/lib/types';

interface ChatPanelProps {
  isOpen: boolean;
  onClose: () => void;
  messages: EnhancedChatMessage[];
  onlineMembers: OnlineMember[];
  onSendMessage: (message: string) => void;
}

export function ChatPanel({
  isOpen,
  onClose,
  messages,
  onlineMembers,
  onSendMessage
}: ChatPanelProps) {
  const [newMessage, setNewMessage] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;
    onSendMessage(newMessage);
    setNewMessage('');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed bottom-20 right-4 md:right-80 w-80 bg-background rounded-lg shadow-lg border z-50">
      {/* ... rest of the chat panel JSX ... */}
    </div>
  );
} 