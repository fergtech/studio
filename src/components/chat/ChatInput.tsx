'use client';

import { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Smile, Send, Paperclip, X, Image as ImageIcon, Video as VideoIcon, File as FileIcon } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

const emojiCategories = {
  "Faces": ["😀", "😃", "😄", "😁", "😆", "😅", "😂", "🤣", "😊", "😇", "🙂", "🙃", "😉", "😌", "😍", "🥰", "😘", "😗", "😙", "😚", "😋", "😛", "😝", "😜", "🤪", "🤨", "🧐", "🤓", "😎", "🤩", "🥳"],
  "Gestures": ["👍", "👎", "👌", "✌️", "🤞", "🤟", "🤘", "🤙", "👈", "👉", "👆", "🖕", "👇", "☝️", "👋", "🤚", "🖐️", "✋", "🖖", "👏", "🙌", "🤲", "🤝", "🙏"],
  "Hearts": ["❤️", "🧡", "💛", "💚", "💙", "💜", "🖤", "🤍", "🤎", "💔", "❣️", "💕", "💞", "💓", "💗", "💖", "💘", "💝"],
  "Objects": ["🎉", "🎊", "🎈", "🎁", "🏆", "🥇", "🥈", "🥉", "⚽", "🏀", "🏈", "⚾", "🎾", "🏐", "🏉", "🎱", "🔥", "💯", "✨", "⭐", "🌟", "💫"]
};

interface ChatInputProps {
  newMessage: string;
  setNewMessage: (message: string) => void;
  handleSendMessage: () => void;
  isLoading: boolean;
  selectedFile: File | null;
  setSelectedFile: (file: File | null) => void;
  filePreview: string | null;
  setFilePreview: (preview: string | null) => void;
  fileType: 'image' | 'video' | 'document' | null;
  setFileType: (type: 'image' | 'video' | 'document' | null) => void;
}

export default function ChatInput({ 
  newMessage, 
  setNewMessage, 
  handleSendMessage, 
  isLoading,
  selectedFile,
  setSelectedFile,
  filePreview,
  setFilePreview,
  fileType,
  setFileType
}: ChatInputProps) {
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const emojiPickerRef = useRef<HTMLDivElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const documentInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (emojiPickerRef.current && !emojiPickerRef.current.contains(event.target as Node)) {
        setShowEmojiPicker(false);
      }
    }

    if (showEmojiPicker) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showEmojiPicker]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>, type: 'image' | 'video' | 'document') => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setFileType(type);
      const reader = new FileReader();
      reader.onloadend = () => {
        setFilePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
    // Reset input value to allow selecting the same file again
    event.target.value = '';
  };

  const handleRemoveFile = () => {
    setSelectedFile(null);
    setFilePreview(null);
    setFileType(null);
  };

  const handleEmojiSelect = (emoji: string) => {
    const textarea = textareaRef.current;
    if (textarea) {
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const newContent = newMessage.slice(0, start) + emoji + newMessage.slice(end);
      setNewMessage(newContent);
      
      setTimeout(() => {
        textarea.focus();
        textarea.setSelectionRange(start + emoji.length, start + emoji.length);
      }, 0);
    } else {
      setNewMessage(newMessage + emoji);
    }
    setShowEmojiPicker(false);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="relative border-t border-gray-200 dark:border-gray-700 p-4 bg-white dark:bg-gray-800">
      {filePreview && (
        <div className="relative mb-2 p-2 border border-gray-300 rounded-lg max-w-xs">
          {fileType === 'image' && <Image src={filePreview} alt="Preview" width={100} height={100} className="rounded-md object-cover" />}
          {fileType === 'video' && <video src={filePreview} controls className="rounded-md w-full max-h-40" />}
          {fileType === 'document' && (
            <div className="flex items-center gap-2 p-2 bg-gray-100 rounded-md">
              <FileIcon className="h-8 w-8 text-gray-500" />
              <span className="text-sm text-gray-700 truncate">{selectedFile?.name}</span>
            </div>
          )}
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="absolute top-0 right-0 h-6 w-6 rounded-full bg-gray-700 text-white hover:bg-gray-800"
            onClick={handleRemoveFile}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      )}
      <div className="relative flex items-center">
        <Popover>
          <PopoverTrigger asChild>
            <Button type="button" variant="ghost" size="icon" className="mr-2 rounded-full">
              <Paperclip className="h-5 w-5" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-1">
            <div className="flex flex-col">
              <Button variant="ghost" className="justify-start" onClick={() => imageInputRef.current?.click()}>
                <ImageIcon className="mr-2 h-4 w-4" /> Image
              </Button>
              <Button variant="ghost" className="justify-start" onClick={() => videoInputRef.current?.click()}>
                <VideoIcon className="mr-2 h-4 w-4" /> Video
              </Button>
              <Button variant="ghost" className="justify-start" onClick={() => documentInputRef.current?.click()}>
                <FileIcon className="mr-2 h-4 w-4" /> Document
              </Button>
            </div>
          </PopoverContent>
        </Popover>
        <Textarea
          ref={textareaRef}
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Type a message..."
          className="w-full pr-20 rounded-full border-gray-300 focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
          rows={1}
          disabled={isLoading}
        />
        <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center">
          <div className="relative" ref={emojiPickerRef}>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => setShowEmojiPicker(!showEmojiPicker)}
              className="rounded-full"
            >
              <Smile className="h-5 w-5" />
            </Button>
            {showEmojiPicker && (
              <div className="absolute right-0 bottom-full mb-2 z-10 bg-background border border-border rounded-lg shadow-lg p-3 w-80 max-h-60 overflow-y-auto">
                {Object.entries(emojiCategories).map(([category, emojis]) => (
                  <div key={category} className="mb-3">
                    <div className="text-xs font-semibold text-muted-foreground mb-1">{category}</div>
                    <div className="grid grid-cols-8 gap-1">
                      {emojis.map((emoji) => (
                        <button
                          key={emoji}
                          type="button"
                          onClick={() => handleEmojiSelect(emoji)}
                          className="text-2xl p-1 rounded-md hover:bg-muted"
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
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={handleSendMessage}
            disabled={isLoading || (!newMessage.trim() && !selectedFile)}
            className="rounded-full"
          >
            <Send className="h-5 w-5" />
          </Button>
        </div>
      </div>
      <input type="file" ref={imageInputRef} accept="image/*" className="hidden" onChange={(e) => handleFileChange(e, 'image')} />
      <input type="file" ref={videoInputRef} accept="video/*" className="hidden" onChange={(e) => handleFileChange(e, 'video')} />
      <input type="file" ref={documentInputRef} accept=".pdf,.doc,.docx,.txt,.csv" className="hidden" onChange={(e) => handleFileChange(e, 'document')} />
    </div>
  );
}
