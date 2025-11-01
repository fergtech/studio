"use client";

import React, { useState, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Send, Heart, Reply } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { formatDistanceToNow } from 'date-fns';
import { triggerHaptic, hapticPatterns } from '@/lib/animations';
import { cn } from '@/lib/utils';

// Mock user avatars matching main feed pattern
const mockUserAvatars: Record<string, string | undefined> = {
  "user1": "https://i.pravatar.cc/40?u=user1",
  "user3": "https://i.pravatar.cc/40?u=user3",
  "user5": "https://i.pravatar.cc/40?u=user5",
  "user7": "https://i.pravatar.cc/40?u=user7",
};

interface Comment {
  id: string;
  content: string;
  createdAt: string;
  user: {
    id: string;
    name: string;
    image?: string;
    username?: string;
  };
  likes: number;
  isLiked: boolean;
  replies?: Comment[];
}

interface CommentsModalProps {
  isOpen: boolean;
  onClose: () => void;
  debateId: string;
  debateTitle: string;
  currentUserId?: string | null;
}


// Get initials for fallback
const getInitials = (name?: string | null) => {
  if (!name) return 'U';
  return name.substring(0, 2).toUpperCase();
};

export function CommentsModal({
  isOpen,
  onClose,
  debateId,
  debateTitle,
  currentUserId
}: CommentsModalProps) {
  const { data: session } = useSession();
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  // Media upload state
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [fileType, setFileType] = useState<'image' | 'video' | null>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  // File picker logic
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>, type: 'image' | 'video') => {
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
    event.target.value = '';
  };

  const handleRemoveFile = () => {
    setSelectedFile(null);
    setFilePreview(null);
    setFileType(null);
  };

  // Fetch comments on open
  React.useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      fetchComments();
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, debateId]);

  const fetchComments = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/debates/${debateId}/arguments`);
      if (!response.ok) {
        if (response.status !== 404) {
          console.error('Failed to fetch arguments');
        }
        setComments([]);
        return;
      }

      const debateArguments = await response.json();

      // Transform arguments to comment format
      const formattedComments: Comment[] = debateArguments.map((arg: any) => ({
        id: arg.id,
        content: arg.content,
        createdAt: arg.createdAt,
        user: {
          id: arg.user.id,
          name: arg.user.name || 'Anonymous',
          image: arg.user.image,
          username: arg.user.username
        },
        likes: arg.votes?.filter((v: any) => v.isUpvote).length || 0,
        isLiked: currentUserId ? arg.votes?.some((v: any) => v.userId === currentUserId && v.isUpvote) || false : false,
        replies: arg.replies || []
      }));

      setComments(formattedComments);
    } catch (error) {
      console.error('Error fetching arguments:', error);
      setComments([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    triggerHaptic(hapticPatterns.light);
    setReplyingTo(null);
    setNewComment('');
    onClose();
  };

  const handleSubmitComment = async () => {
    if (!newComment.trim() || !currentUserId) return;

    setIsLoading(true);
    triggerHaptic(hapticPatterns.medium);

    try {
      // First, check if user has voted to determine their side
      const voteResponse = await fetch(`/api/debates/${debateId}/vote?userId=${currentUserId}`);

      if (!voteResponse.ok) {
        // User hasn't voted yet
        alert('You must vote on the debate before commenting.');
        setIsLoading(false);
        return;
      }

      const voteData = await voteResponse.json();
      const userSide = voteData.userVote; // 'PRO' or 'CON'

      if (!userSide) {
        alert('You must vote on the debate before commenting.');
        setIsLoading(false);
        return;
      }

      // Post the argument
      const response = await fetch(`/api/debates/${debateId}/arguments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: newComment.trim(),
          side: userSide,
          parentId: replyingTo || null,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to post argument');
      }

      setNewComment('');
      setReplyingTo(null);
      fetchComments(); // Refetch to show the new argument

      // Trigger success haptic
      triggerHaptic([...hapticPatterns.success]);
    } catch (error) {
      console.error('Error posting argument:', error);
      alert('Failed to post comment. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLikeComment = async (commentId: string) => {
    triggerHaptic(hapticPatterns.light);
    
    setComments(prev => prev.map(comment => 
      comment.id === commentId 
        ? { 
            ...comment, 
            isLiked: !comment.isLiked,
            likes: comment.isLiked ? comment.likes - 1 : comment.likes + 1
          }
        : comment
    ));
  };

  const handleReply = (commentId: string, username: string) => {
    setReplyingTo(commentId);
    setNewComment(`@${username} `);
    textareaRef.current?.focus();
    triggerHaptic(hapticPatterns.light);
  };

  const modalContent = (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 z-[100] backdrop-blur-sm"
            onClick={handleClose}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-full max-w-lg max-h-[85vh] bg-background border border-border rounded-2xl shadow-2xl flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-border">
              <div>
                <h3 className="font-semibold text-lg">Arguments</h3>
                <p className="text-sm text-muted-foreground truncate max-w-[300px] mt-1">
                  {debateTitle}
                </p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClose}
                className="w-8 h-8 p-0 hover:bg-muted"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>

            {/* Comments List */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6 min-h-0">
              {isLoading && comments.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <p className="text-base">Loading arguments...</p>
                </div>
              ) : comments.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <p className="text-base mb-2">No arguments yet</p>
                  <p className="text-sm">Be the first to make your case!</p>
                </div>
              ) : (
                comments.map((comment) => (
                  <div key={comment.id} className="space-y-3">
                    <div className="flex gap-3">
                      <Avatar className="w-9 h-9 flex-shrink-0">
                        <AvatarImage src={comment.user.image} />
                        <AvatarFallback>{comment.user.name?.charAt(0)}</AvatarFallback>
                      </Avatar>
                      
                      <div className="flex-1 min-w-0">
                        <div className="bg-muted rounded-2xl px-4 py-3">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="font-medium text-sm">{comment.user.name}</span>
                            <span className="text-xs text-muted-foreground">
                              {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}
                            </span>
                          </div>
                          <p className="text-sm leading-relaxed break-words">{comment.content}</p>
                        </div>
                        
                        {/* Comment Actions */}
                        <div className="flex items-center gap-6 mt-3 ml-2">
                          <button
                            onClick={() => handleLikeComment(comment.id)}
                            className={cn(
                              "flex items-center gap-2 text-sm hover:text-red-500 transition-colors",
                              comment.isLiked ? "text-red-500" : "text-muted-foreground"
                            )}
                          >
                            <Heart className={cn("w-4 h-4", comment.isLiked && "fill-current")} />
                            {comment.likes > 0 && comment.likes}
                          </button>
                          
                          {currentUserId && (
                            <button
                              onClick={() => handleReply(comment.id, comment.user.username || comment.user.name)}
                              className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
                            >
                              <Reply className="w-4 h-4" />
                              Reply
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Comment Input */}
            {currentUserId && (
              <div className="border-t border-border p-6">
                {replyingTo && (
                  <div className="flex items-center gap-2 mb-3 text-sm text-muted-foreground">
                    <Reply className="w-4 h-4" />
                    <span>Replying to argument</span>
                    <button
                      onClick={() => {
                        setReplyingTo(null);
                        setNewComment('');
                      }}
                      className="text-red-500 hover:text-red-600 ml-auto"
                    >
                      Cancel
                    </button>
                  </div>
                )}

                <div className="flex gap-3">
                  <Avatar className="h-10 w-10">
                    <AvatarImage 
                      src={session?.user?.image || undefined}
                      alt={session?.user?.name || 'User'}
                    />
                    <AvatarFallback>{getInitials(session?.user?.name)}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 flex flex-col gap-2">
                    {/* Media preview */}
                    {filePreview && (
                      <div className="relative mb-2 p-2 border border-gray-300 rounded-lg max-w-xs">
                        {fileType === 'image' && <img src={filePreview} alt="Preview" className="rounded-md object-cover max-h-40" />}
                        {fileType === 'video' && <video src={filePreview} controls className="rounded-md w-full max-h-40" />}
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
                    <div className="flex gap-2 items-center">
                      {/* Media upload buttons hidden for now */}
                      {/* <Button type="button" variant="ghost" size="icon" className="rounded-full" onClick={() => imageInputRef.current?.click()}>
                        <span role="img" aria-label="Image">🖼️</span>
                      </Button>
                      <Button type="button" variant="ghost" size="icon" className="rounded-full" onClick={() => videoInputRef.current?.click()}>
                        <span role="img" aria-label="Video">🎥</span>
                      </Button> */}
                      <Textarea
                        ref={textareaRef}
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        placeholder="Make your argument..."
                        className="flex-1 min-h-[44px] max-h-[120px] resize-none border-muted"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            handleSubmitComment();
                          }
                        }}
                      />
                      <Button
                        onClick={handleSubmitComment}
                        disabled={!newComment.trim() && !selectedFile || isLoading}
                        size="sm"
                        className="self-end px-4"
                      >
                        <Send className="w-4 h-4" />
                      </Button>
                    </div>
                    <input type="file" ref={imageInputRef} accept="image/*" className="hidden" onChange={(e) => handleFileChange(e, 'image')} />
                    <input type="file" ref={videoInputRef} accept="video/*" className="hidden" onChange={(e) => handleFileChange(e, 'video')} />
                  </div>
                </div>
              </div>
            )}

            {!currentUserId && (
              <div className="border-t border-border p-6 text-center">
                <p className="text-sm text-muted-foreground">
                  Sign in to join the debate
                </p>
              </div>
            )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );

  // Use portal to render at document root, escaping parent stacking contexts
  if (typeof document === 'undefined') return null;
  return createPortal(modalContent, document.body);
}