import { useState, useEffect, useRef } from 'react';
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { MessageSquare, X, Send, Wifi, WifiOff, Radio, Smile, Paperclip, Trash2, Edit3, Check, SmilePlus } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import type { EnhancedChatMessage } from '@/lib/types';
import { useChat } from '@/hooks/useChat';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import Image from 'next/image';

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
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [deletingMessageId, setDeletingMessageId] = useState<string | null>(null);
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editText, setEditText] = useState('');
  const [showReactionPicker, setShowReactionPicker] = useState<string | null>(null);

  const inputRef = useRef<HTMLInputElement>(null);
  const editInputRef = useRef<HTMLInputElement>(null);
  const emojiPickerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const reactionPickerRef = useRef<HTMLDivElement>(null);

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

  // Common emojis for the picker (same as society form)
  const emojiCategories = {
    "Faces": ["😀", "😃", "😄", "😁", "😆", "😅", "😂", "🤣", "😊", "😇", "🙂", "🙃", "😉", "😌", "😍", "🥰", "😘", "😗", "😙", "😚", "😋", "😛", "😝", "😜", "🤪", "🤨", "🧐", "🤓", "😎", "🤩", "🥳"],
    "Gestures": ["👍", "👎", "👌", "✌️", "🤞", "🤟", "🤘", "🤙", "👈", "👉", "👆", "🖕", "👇", "☝️", "👋", "🤚", "🖐️", "✋", "🖖", "👏", "🙌", "🤲", "🤝", "🙏"],
    "Hearts": ["❤️", "🧡", "💛", "💚", "💙", "💜", "🖤", "🤍", "🤎", "💔", "❣️", "💕", "💞", "💓", "💗", "💖", "💘", "💝"],
    "Objects": ["🎉", "🎊", "🎈", "🎁", "🏆", "🥇", "🥈", "🥉", "⚽", "🏀", "🏈", "⚾", "🎾", "🏐", "🏉", "🎱", "🔥", "💯", "✨", "⭐", "🌟", "💫"]
  };

  // Quick reaction emojis (shown on hover)
  const quickReactions = ["👍", "❤️", "😂", "😮", "😢", "🙏"];

  // Close emoji picker when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (emojiPickerRef.current && !emojiPickerRef.current.contains(event.target as Node)) {
        setShowEmojiPicker(false);
      }
      if (reactionPickerRef.current && !reactionPickerRef.current.contains(event.target as Node)) {
        setShowReactionPicker(null);
      }
    }

    if (showEmojiPicker || showReactionPicker) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showEmojiPicker, showReactionPicker]);

  const handleEmojiSelect = (emoji: string) => {
    const input = inputRef.current;
    if (input) {
      const start = input.selectionStart || 0;
      const end = input.selectionEnd || 0;
      const newContent = newMessage.slice(0, start) + emoji + newMessage.slice(end);
      setNewMessage(newContent);

      // Set cursor position after the emoji
      setTimeout(() => {
        input.focus();
        input.setSelectionRange(start + emoji.length, start + emoji.length);
      }, 0);
    } else {
      setNewMessage(prev => prev + emoji);
    }
    setShowEmojiPicker(false);
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setFilePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveFile = () => {
    setSelectedFile(null);
    setFilePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleDeleteMessage = async (messageId: string) => {
    if (!currentUserId) return;

    setDeletingMessageId(messageId);
    try {
      const response = await fetch(`/api/chat/messages?messageId=${messageId}&userId=${currentUserId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        console.error('Failed to delete message');
      }
      // The message will be removed from the UI automatically via the real-time updates
    } catch (error) {
      console.error('Error deleting message:', error);
    } finally {
      setDeletingMessageId(null);
    }
  };

  const handleStartEdit = (messageId: string, currentText: string) => {
    // Parse the message to get plain text if it's media
    const { isMedia, media, text } = parseMessageContent(currentText);
    setEditingMessageId(messageId);
    setEditText(isMedia && media?.text ? media.text : text || '');
    setTimeout(() => editInputRef.current?.focus(), 0);
  };

  const handleCancelEdit = () => {
    setEditingMessageId(null);
    setEditText('');
  };

  const handleSaveEdit = async (messageId: string, originalText: string) => {
    if (!currentUserId || !editText.trim()) return;

    try {
      // If the original message was media, preserve the media structure but update the text
      const { isMedia, media } = parseMessageContent(originalText);
      let updatedText = editText;

      if (isMedia && media) {
        // Update only the text field in the media JSON
        const updatedMedia = {
          ...media,
          text: editText
        };
        updatedText = JSON.stringify(updatedMedia);
      }

      const response = await fetch('/api/chat/messages', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messageId,
          userId: currentUserId,
          text: updatedText,
        }),
      });

      if (response.ok) {
        setEditingMessageId(null);
        setEditText('');
      } else {
        console.error('Failed to update message');
      }
    } catch (error) {
      console.error('Error updating message:', error);
    }
  };

  const handleReaction = async (messageId: string, emoji: string) => {
    if (!currentUserId) return;

    try {
      const response = await fetch('/api/chat/reactions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messageId,
          userId: currentUserId,
          emoji,
        }),
      });

      if (response.ok) {
        setShowReactionPicker(null);
        // The reactions will update automatically via real-time updates
      } else {
        console.error('Failed to add reaction');
      }
    } catch (error) {
      console.error('Error adding reaction:', error);
    }
  };

  // Helper function to parse message content (text or JSON media)
  const parseMessageContent = (text: string) => {
    try {
      const parsed = JSON.parse(text);
      if (parsed.type && parsed.url) {
        return { isMedia: true, media: parsed };
      }
    } catch {
      // Not JSON, treat as regular text
    }
    return { isMedia: false, text };
  };

  // Helper function to render message content
  const renderMessageContent = (text: string, isCurrentUser: boolean) => {
    const { isMedia, media, text: plainText } = parseMessageContent(text);

    if (isMedia && media) {
      const mediaType = media.type;

      if (mediaType === 'image') {
        return (
          <div className="max-w-sm">
            {media.text && <p className="text-sm mb-2">{media.text}</p>}
            <div className="relative w-full h-48 rounded-lg overflow-hidden cursor-pointer">
              <Image
                src={media.url}
                alt="Shared image"
                fill
                className="object-cover"
                onClick={() => window.open(media.url, '_blank')}
              />
            </div>
          </div>
        );
      }

      if (mediaType === 'video') {
        return (
          <div className="max-w-sm">
            {media.text && <p className="text-sm mb-2">{media.text}</p>}
            <video
              src={media.url}
              controls
              className="w-full max-h-64 rounded-lg bg-black"
            />
          </div>
        );
      }

      if (mediaType === 'audio') {
        return (
          <div>
            {media.text && <p className="text-sm mb-2">{media.text}</p>}
            <audio src={media.url} controls className="w-full" />
          </div>
        );
      }

      if (mediaType === 'file') {
        return (
          <div>
            {media.text && <p className="text-sm mb-2">{media.text}</p>}
            <a
              href={media.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 p-2 bg-muted rounded hover:bg-muted/80 transition-colors"
            >
              <Paperclip className="h-4 w-4" />
              <span className="text-sm">{media.filename || 'Download file'}</span>
            </a>
          </div>
        );
      }
    }

    return <p className="text-sm">{plainText}</p>;
  };

  // Helper function to render reactions
  const renderReactions = (message: any) => {
    if (!message.reactions || message.reactions.length === 0) return null;

    // Group reactions by emoji
    const groupedReactions = message.reactions.reduce((acc: any, reaction: any) => {
      if (!acc[reaction.emoji]) {
        acc[reaction.emoji] = [];
      }
      acc[reaction.emoji].push(reaction);
      return acc;
    }, {});

    return (
      <div className="flex flex-wrap gap-1 mt-1">
        {Object.entries(groupedReactions).map(([emoji, reactions]: [string, any]) => {
          const hasUserReacted = reactions.some((r: any) => r.userId === currentUserId);
          const names = reactions.map((r: any) => r.user?.name || r.user?.username || 'Someone').join(', ');

          return (
            <button
              key={emoji}
              onClick={() => handleReaction(message.id, emoji)}
              className={cn(
                "px-2 py-0.5 rounded-full text-xs flex items-center gap-1 transition-colors border",
                hasUserReacted
                  ? "bg-primary/20 border-primary/40 hover:bg-primary/30"
                  : "bg-muted border-border hover:bg-muted/80"
              )}
              title={names}
            >
              <span>{emoji}</span>
              <span className="text-xs font-medium">{reactions.length}</span>
            </button>
          );
        })}
      </div>
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() && !selectedFile) return;

    setIsUploading(true);

    try {
      let messageText = newMessage;

      // Upload file if selected
      if (selectedFile) {
        const formData = new FormData();
        formData.append('file', selectedFile);
        formData.append('filePath', `initiatives/chat/${initiativeId}`);

        const response = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        });

        const result = await response.json();

        if (response.ok && result.imageUrl) {
          // Determine media type
          let mediaType = 'file';
          if (selectedFile.type.startsWith('image/')) {
            mediaType = 'image';
          } else if (selectedFile.type.startsWith('video/')) {
            mediaType = 'video';
          } else if (selectedFile.type.startsWith('audio/')) {
            mediaType = 'audio';
          }

          // Create rich media JSON
          const richMedia = JSON.stringify({
            type: mediaType,
            url: result.imageUrl,
            filename: selectedFile.name,
            text: messageText || undefined
          });

          messageText = richMedia;
        } else {
          console.error('File upload failed:', result);
          setIsUploading(false);
          return;
        }
      }

      const success = await sendMessage(messageText);
      if (success) {
        setNewMessage('');
        handleRemoveFile();
      }
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setIsUploading(false);
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
                <div key={message.id} className={cn("mb-6 flex items-start gap-3 group", isCurrentUser ? 'justify-end' : 'justify-start')}>
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
                    <div className="relative">
                      {editingMessageId === message.id ? (
                        <div className="flex items-center gap-2">
                          <Input
                            ref={editInputRef}
                            value={editText}
                            onChange={(e) => setEditText(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault();
                                handleSaveEdit(message.id, message.text);
                              } else if (e.key === 'Escape') {
                                handleCancelEdit();
                              }
                            }}
                            className="flex-1"
                          />
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8 bg-green-100 hover:bg-green-200 text-green-700"
                            onClick={() => handleSaveEdit(message.id, message.text)}
                          >
                            <Check className="h-4 w-4" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8"
                            onClick={handleCancelEdit}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ) : (
                        <>
                          <div>
                            <div className={cn(
                              "p-3 rounded-lg max-w-full",
                              isCurrentUser ? 'bg-primary text-primary-foreground' : 'bg-muted'
                            )}>
                              {renderMessageContent(message.text, isCurrentUser)}
                            </div>
                            {renderReactions(message)}
                            {/* Action buttons below message */}
                            <div className="flex items-center gap-1 mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              {/* Reaction button (for everyone) */}
                              <div className="relative" ref={showReactionPicker === message.id ? reactionPickerRef : null}>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-6 w-6 bg-background hover:bg-yellow-100 hover:text-yellow-700 shadow-sm border"
                                  onClick={() => setShowReactionPicker(showReactionPicker === message.id ? null : message.id)}
                                >
                                  <SmilePlus className="h-3 w-3" />
                                </Button>
                                {showReactionPicker === message.id && (
                                  <div className="absolute bottom-full mb-1 left-0 bg-background border rounded-lg shadow-lg p-2 flex gap-1 z-10">
                                    {quickReactions.map((emoji) => (
                                      <button
                                        key={emoji}
                                        onClick={() => handleReaction(message.id, emoji)}
                                        className="hover:bg-muted p-1 rounded text-lg transition-colors"
                                      >
                                        {emoji}
                                      </button>
                                    ))}
                                  </div>
                                )}
                              </div>
                              {/* Edit/Delete buttons (only for own messages) */}
                              {isCurrentUser && (
                                <>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-6 w-6 bg-background hover:bg-primary hover:text-primary-foreground shadow-sm border"
                                    onClick={() => handleStartEdit(message.id, message.text)}
                                    disabled={deletingMessageId === message.id}
                                  >
                                    <Edit3 className="h-3 w-3" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-6 w-6 bg-background hover:bg-destructive hover:text-destructive-foreground disabled:opacity-50 disabled:cursor-not-allowed shadow-sm border"
                                    onClick={() => handleDeleteMessage(message.id)}
                                    disabled={deletingMessageId === message.id}
                                  >
                                    {deletingMessageId === message.id ? (
                                      <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-current" />
                                    ) : (
                                      <Trash2 className="h-3 w-3" />
                                    )}
                                  </Button>
                                </>
                              )}
                            </div>
                          </div>
                        </>
                      )}
                    </div>
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
          <form onSubmit={handleSubmit} className="p-4 border-t space-y-3">
            {/* File Preview */}
            {filePreview && selectedFile && (
              <div className="relative">
                {selectedFile.type.startsWith('image/') ? (
                  <div className="relative w-32 h-32">
                    <Image
                      src={filePreview}
                      alt="Preview"
                      fill
                      className="object-cover rounded border"
                    />
                    <Button
                      type="button"
                      size="sm"
                      variant="destructive"
                      className="absolute -top-2 -right-2 h-6 w-6 p-0"
                      onClick={handleRemoveFile}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 p-2 bg-muted rounded border">
                    <Paperclip className="h-4 w-4" />
                    <span className="text-sm flex-1 truncate">{selectedFile.name}</span>
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      className="h-6 w-6 p-0"
                      onClick={handleRemoveFile}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                )}
              </div>
            )}

            <div className="flex items-center gap-2">
              {/* Emoji Picker */}
              <div className="relative" ref={emojiPickerRef}>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                  disabled={!isConnected && !isPolling}
                >
                  <Smile className="h-4 w-4" />
                </Button>

                {showEmojiPicker && (
                  <div className="absolute left-0 bottom-full mb-2 z-10 bg-background border border-border rounded-lg shadow-lg p-3 w-80 max-h-60 overflow-y-auto">
                    {Object.entries(emojiCategories).map(([category, emojis]) => (
                      <div key={category} className="mb-3">
                        <div className="text-xs font-semibold text-muted-foreground mb-1">{category}</div>
                        <div className="grid grid-cols-8 gap-1">
                          {emojis.map((emoji) => (
                            <button
                              key={emoji}
                              type="button"
                              onClick={() => handleEmojiSelect(emoji)}
                              className="w-8 h-8 flex items-center justify-center text-lg hover:bg-muted rounded transition-colors"
                            >
                              {emoji}
                            </button>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* File Attachment */}
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => fileInputRef.current?.click()}
                disabled={!isConnected && !isPolling}
              >
                <Paperclip className="h-4 w-4" />
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*,video/*,audio/*,.pdf,.docx,.doc,.txt"
                onChange={handleFileChange}
                className="hidden"
              />

              {/* Message Input */}
              <Input
                ref={inputRef}
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder={isConnected || isPolling ? "Type a message..." : "Connecting..."}
                className="flex-1 text-base"
                disabled={!isConnected && !isPolling}
              />

              {/* Send Button */}
              <Button type="submit" disabled={isUploading || (!newMessage.trim() && !selectedFile) || (!isConnected && !isPolling)}>
                {isUploading ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </Button>
            </div>
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
              <div key={message.id} className={cn("mb-4 flex items-end group", isCurrentUser ? 'justify-end' : 'justify-start')}>
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
                  <div className="relative">
                    {editingMessageId === message.id ? (
                      <div className="flex items-center gap-1">
                        <Input
                          ref={editInputRef}
                          value={editText}
                          onChange={(e) => setEditText(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                              e.preventDefault();
                              handleSaveEdit(message.id, message.text);
                            } else if (e.key === 'Escape') {
                              handleCancelEdit();
                            }
                          }}
                          className="flex-1 text-sm"
                        />
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-6 w-6 bg-green-100 hover:bg-green-200 text-green-700"
                          onClick={() => handleSaveEdit(message.id, message.text)}
                        >
                          <Check className="h-3 w-3" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-6 w-6"
                          onClick={handleCancelEdit}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    ) : (
                      <>
                        <div className={cn(
                          "p-2 rounded-lg",
                          isCurrentUser ? 'bg-primary text-primary-foreground' : 'bg-muted'
                        )}>
                          {renderMessageContent(message.text, isCurrentUser)}
                        </div>
                        {isCurrentUser && (
                          <div className="absolute left-full ml-1 top-1/2 -translate-y-1/2 flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6 bg-background hover:bg-primary hover:text-primary-foreground shadow-sm border"
                              onClick={() => handleStartEdit(message.id, message.text)}
                              disabled={deletingMessageId === message.id}
                            >
                              <Edit3 className="h-3 w-3" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6 bg-background hover:bg-destructive hover:text-destructive-foreground disabled:opacity-50 disabled:cursor-not-allowed shadow-sm border"
                              onClick={() => handleDeleteMessage(message.id)}
                              disabled={deletingMessageId === message.id}
                            >
                              {deletingMessageId === message.id ? (
                                <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-current" />
                              ) : (
                                <Trash2 className="h-3 w-3" />
                              )}
                            </Button>
                          </div>
                        )}
                      </>
                    )}
                  </div>
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
            <div key={message.id} className={cn("mb-4 flex items-end group", isCurrentUser ? 'justify-end' : 'justify-start')}>
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
                <div className="relative">
                  {editingMessageId === message.id ? (
                    <div className="flex items-center gap-1">
                      <Input
                        ref={editInputRef}
                        value={editText}
                        onChange={(e) => setEditText(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            handleSaveEdit(message.id, message.text);
                          } else if (e.key === 'Escape') {
                            handleCancelEdit();
                          }
                        }}
                        className="flex-1 text-sm"
                      />
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-6 w-6 bg-green-100 hover:bg-green-200 text-green-700"
                        onClick={() => handleSaveEdit(message.id, message.text)}
                      >
                        <Check className="h-3 w-3" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-6 w-6"
                        onClick={handleCancelEdit}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  ) : (
                    <>
                      <div className={cn(
                        "p-2 rounded-lg",
                        isCurrentUser ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                      )}>
                        {renderMessageContent(message.text, isCurrentUser)}
                      </div>
                      {isCurrentUser && (
                        <div className="absolute left-full ml-1 top-1/2 -translate-y-1/2 flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 bg-background hover:bg-primary hover:text-primary-foreground shadow-sm border"
                            onClick={() => handleStartEdit(message.id, message.text)}
                            disabled={deletingMessageId === message.id}
                          >
                            <Edit3 className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 bg-background hover:bg-destructive hover:text-destructive-foreground disabled:opacity-50 disabled:cursor-not-allowed shadow-sm border"
                            onClick={() => handleDeleteMessage(message.id)}
                            disabled={deletingMessageId === message.id}
                          >
                            {deletingMessageId === message.id ? (
                              <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-current" />
                            ) : (
                              <Trash2 className="h-3 w-3" />
                            )}
                          </Button>
                        </div>
                      )}
                    </>
                  )}
                </div>
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
