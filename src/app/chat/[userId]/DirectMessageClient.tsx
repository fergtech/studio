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

import Image from 'next/image';
import { FileIcon, Send, Paperclip, X, Smile, MoreVertical, Reply, Trash2 } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { RichMessageRenderer } from '@/components/RichMessageRenderer';
import { formatFileSize, createImageMessage, createVideoMessage, createFileMessage } from '@/lib/messageUtils';
import { Textarea } from '@/components/ui/textarea';

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
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [fileType, setFileType] = useState<'image' | 'video' | 'document' | null>(null);
  const [replyingTo, setReplyingTo] = useState<any | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  // const [socket, setSocket] = useState<Socket | null>(null); // Temporarily disabled
  // Sidebar state removed; always full width
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const { toast } = useToast();

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

  const handleSendMessage = async () => {
    if ((!newMessage.trim() && !selectedFile) || isLoading) return;

    setIsLoading(true);
    const messageText = newMessage.trim();
    const fileToSend = selectedFile;
    
    // Reset input fields immediately for a better user experience
    setNewMessage('');
    setSelectedFile(null);
    setFilePreview(null);
    setFileType(null);

    try {
      let fileUrl: string | undefined = undefined;

      // 1. Upload file if it exists
      if (fileToSend) {
        const formData = new FormData();
        formData.append('file', fileToSend);
        formData.append('filePath', `direct-messages/${currentUserId}-${otherUser.id}`);
        
        const uploadResponse = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        });

        const result = await uploadResponse.json();
        if (uploadResponse.ok && result.imageUrl) {
          fileUrl = result.imageUrl;
        } else {
          throw new Error(result.message || result.error || 'File upload failed.');
        }
      }

      // 2. Send message with file URL
      const isImage = fileToSend?.type?.startsWith('image/');
      const isVideo = fileToSend?.type?.startsWith('video/');
      const isMediaFile = isImage || isVideo;

      // Encode message properly based on content type
      let textContent = messageText;
      if (fileUrl) {
        if (isImage) {
          textContent = createImageMessage(fileUrl, fileToSend?.name);
        } else if (isVideo) {
          textContent = createVideoMessage(fileUrl, fileToSend?.name);
        } else {
          // Other file types
          textContent = createFileMessage(
            fileUrl,
            fileToSend?.name || 'file',
            fileToSend?.size ? formatFileSize(fileToSend.size) : undefined,
            fileToSend?.type
          );
        }
      }

      const response = await fetch(`/api/chat/direct/${otherUser.id}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: textContent,
          replyToId: replyingTo?.id,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('Server error response:', errorData);
        throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
      }

      const savedMessage = await response.json();

      // Clear reply state
      if (replyingTo) setReplyingTo(null);

      // Add message to local state
      setMessages(prev => [...prev, savedMessage]);

    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to send message. Please try again.',
        variant: 'destructive',
      });
      // Restore the message text and file if sending failed
      setNewMessage(messageText);
      if (fileToSend) {
        setSelectedFile(fileToSend);
        // Re-create file preview
        const reader = new FileReader();
        reader.onloadend = () => {
          setFilePreview(reader.result as string);
        };
        reader.readAsDataURL(fileToSend);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (messageId: string) => {
    if (deletingId) return;
    setDeletingId(messageId);

    try {
      const response = await fetch(`/api/chat/message/${messageId}`, { method: 'DELETE' });

      if (!response.ok) {
        const error = await response.json().catch(() => ({ error: 'Failed to delete' }));
        if (response.status === 400 && error.error?.includes('already deleted')) {
          setMessages(prev => prev.filter(m => m.id !== messageId));
          return;
        }
        throw new Error(error.error);
      }

      setMessages(prev => prev.filter(m => m.id !== messageId));
      toast({ title: "Message deleted" });
    } catch (error) {
      toast({ title: "Error", description: "Failed to delete message", variant: "destructive" });
    } finally {
      setDeletingId(null);
    }
  };

  const handleReaction = async (messageId: string, emoji: string) => {
    try {
      const response = await fetch(`/api/chat/message/${messageId}/reaction`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ emoji }),
      });

      if (!response.ok) throw new Error('Failed to add reaction');

      const updatedMessage = await response.json();
      setMessages(prev => prev.map(m => m.id === messageId ? updatedMessage : m));
    } catch (error) {
      toast({ title: "Error", description: "Failed to add reaction", variant: "destructive" });
    }
  };

  return (
    <div className="flex h-screen">
      
      <div className="flex-1 flex flex-col w-full">
        {/* Header */}
        <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center gap-4 pl-20 lg:pl-0">
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
              messages.filter(m => !m.isDeleted).map((message) => {
                const isOwnMessage = message.senderId === currentUserId;

                return (
                  <div key={message.id} className={`group flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}>
                    <div className="flex flex-col gap-1 max-w-xs lg:max-w-md">
                      {/* Reply indicator */}
                      {message.replyTo && (
                        <div className="text-xs px-2 py-1 bg-muted/50 rounded border-l-2 border-primary/30">
                          <span className="font-semibold">Reply to {message.replyTo.sender?.name || message.replyTo.senderName}</span>
                          <p className="text-muted-foreground truncate">
                            {message.replyTo.isDeleted ? <em>Deleted</em> : message.replyTo.text.substring(0, 40)}
                          </p>
                        </div>
                      )}

                      {/* Message bubble with dropdown */}
                      <div className="flex items-start gap-1">
                        <div className={`flex-1 px-3 py-2 rounded-lg overflow-hidden break-words ${
                          isOwnMessage ? 'bg-blue-500 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white'
                        }`}>
                          <div className="break-all">
                            <RichMessageRenderer
                              text={message.text}
                              isOwnMessage={isOwnMessage}
                              className={isOwnMessage ? 'text-white' : 'text-gray-900 dark:text-white'}
                            />
                          </div>
                          <p className={`text-xs mt-1 ${isOwnMessage ? 'text-blue-100' : 'text-gray-500 dark:text-gray-400'}`}>
                            {formatDistanceToNow(new Date(message.timestamp), { addSuffix: true })}
                          </p>
                        </div>

                        {/* Dropdown menu */}
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100">
                              <MoreVertical className="h-3 w-3" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-48">
                            <DropdownMenuItem onClick={() => setReplyingTo(message)}>
                              <Reply className="h-4 w-4 mr-2" /> Reply
                            </DropdownMenuItem>

                            {/* React submenu */}
                            <DropdownMenuItem asChild>
                              <div className="flex items-center justify-between w-full cursor-default">
                                <span className="flex items-center gap-2">
                                  <Smile className="h-4 w-4" /> React
                                </span>
                              </div>
                            </DropdownMenuItem>
                            <div className="px-2 py-1">
                              <div className="flex gap-1 flex-wrap">
                                {['👍', '❤️', '😂', '😮', '😢', '🙏'].map(emoji => (
                                  <button
                                    key={emoji}
                                    onClick={() => handleReaction(message.id, emoji)}
                                    className="text-lg hover:bg-accent rounded p-1 transition-colors"
                                  >
                                    {emoji}
                                  </button>
                                ))}
                              </div>
                            </div>

                            {isOwnMessage && (
                              <DropdownMenuItem onClick={() => handleDelete(message.id)} className="text-destructive">
                                <Trash2 className="h-4 w-4 mr-2" /> Delete
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>

                      {/* Reactions display */}
                      {message.reactions && message.reactions.length > 0 && (
                         <div className="flex gap-1 flex-wrap mt-1">
                          {Object.entries(
                            message.reactions.reduce((acc: Record<string, number>, r: any) => {
                              acc[r.emoji] = (acc[r.emoji] || 0) + 1;
                              return acc;
                            }, {})
                          ).map(([emoji, count]) => (
                            <span
                              key={emoji as string}
                              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-muted text-xs"
                            >
                              {emoji as string} {count as number}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>
          
          {/* Message Input */}
          <div className="flex-shrink-0 border-t bg-background p-4 mb-20">
            {/* Reply indicator */}
            {replyingTo && (
              <div className="mb-2 p-2 bg-muted rounded flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-xs font-semibold">Replying to {replyingTo.sender?.name || replyingTo.senderName}</p>
                  <p className="text-xs text-muted-foreground truncate">{replyingTo.text.substring(0, 50)}</p>
                </div>
                <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => setReplyingTo(null)}>
                  <X className="h-3 w-3" />
                </Button>
              </div>
            )}

            {/* File Preview */}
            {filePreview && (
              <div className="mb-3 p-3 bg-muted rounded-lg flex items-center gap-3">
                {fileType === 'image' ? (
                  <Image src={filePreview} alt="Preview" width={60} height={60} className="rounded object-cover" />
                ) : fileType === 'video' ? (
                  <video src={filePreview} className="w-16 h-16 rounded object-cover" />
                ) : (
                  <FileIcon className="h-10 w-10 text-muted-foreground" />
                )}
                <span className="text-sm flex-1">{selectedFile?.name}</span>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => {
                    setSelectedFile(null);
                    setFilePreview(null);
                    setFileType(null);
                  }}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            )}

            {/* Input Area */}
            <div className="flex items-end gap-2">
              <Textarea
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Type a message..."
                className="min-h-[44px] max-h-[120px] resize-none"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage();
                  }
                }}
              />

              {/* File Upload Button */}
              <input
                type="file"
                id="file-upload"
                className="hidden"
                accept="image/*,video/*,application/*"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    // Check file size (4MB limit)
                    const MAX_FILE_SIZE = 4 * 1024 * 1024; // 4MB
                    if (file.size > MAX_FILE_SIZE) {
                      toast({
                        title: "File too large",
                        description: `File size must be less than 4MB. Your file is ${(file.size / 1024 / 1024).toFixed(2)}MB. Please compress it before uploading.`,
                        variant: "destructive",
                      });
                      e.target.value = ''; // Reset input
                      return;
                    }

                    setSelectedFile(file);
                    const reader = new FileReader();
                    reader.onloadend = () => {
                      setFilePreview(reader.result as string);
                    };
                    reader.readAsDataURL(file);

                    if (file.type.startsWith('image/')) {
                      setFileType('image');
                    } else if (file.type.startsWith('video/')) {
                      setFileType('video');
                    } else {
                      setFileType('document');
                    }
                  }
                }}
              />
              <Button
                variant="outline"
                size="icon"
                onClick={() => document.getElementById('file-upload')?.click()}
                disabled={isLoading}
              >
                <Paperclip className="h-4 w-4" />
              </Button>

              {/* Emoji Button - TODO: Add emoji picker */}
              <Button
                variant="outline"
                size="icon"
                onClick={() => {
                  // TODO: Implement emoji picker
                  // For now, just add a simple emoji
                  setNewMessage(prev => prev + '😊');
                }}
                disabled={isLoading}
              >
                <Smile className="h-4 w-4" />
              </Button>

              {/* Send Button */}
              <Button
                onClick={handleSendMessage}
                disabled={isLoading || (!newMessage.trim() && !selectedFile)}
                size="icon"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
