"use client";

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Send, Heart, Reply, MoreHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { formatDistanceToNow } from 'date-fns';
import { triggerHaptic, hapticPatterns } from '@/lib/animations';
import { cn } from '@/lib/utils';

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

interface CommentsSheetProps {
  isOpen: boolean;
  onClose: () => void;
  debateId: string;
  debateTitle: string;
  currentUserId?: string | null;
}

export function CommentsSheet({
  isOpen,
  onClose,
  debateId,
  debateTitle,
  currentUserId
}: CommentsSheetProps) {
  const [isMobile, setIsMobile] = useState(false);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      fetchComments();
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      window.removeEventListener('resize', checkMobile);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, debateId]);

  const fetchComments = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/debates/${debateId}/comments`);
      if (!response.ok) {
        // It's okay if there are no comments, don't throw an error for 404
        if (response.status !== 404) {
          console.error('Failed to fetch comments');
        }
        setComments([]);
        return;
      }
      const data = await response.json();
      setComments(data.comments || []);
    } catch (error) {
      console.error('Error fetching comments:', error);
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
      const response = await fetch(`/api/debates/${debateId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: newComment,
          parentId: replyingTo,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to post comment');
      }

      setNewComment('');
      setReplyingTo(null);
      fetchComments(); // Refetch comments to show the new one

      // Trigger success haptic
      triggerHaptic([...hapticPatterns.success]);
    } catch (error) {
      console.error('Error posting comment:', error);
      // TODO: Show error toast to user
    } finally {
      setIsLoading(false);
    }
  };

  const handleLikeComment = async (commentId: string) => {
    if (!currentUserId) return;
    triggerHaptic(hapticPatterns.light);

    const originalComments = [...comments];
    const comment = comments.find(c => c.id === commentId);
    if (!comment) return;

    const isLiked = comment.isLiked;

    // Optimistic update
    setComments(prev => prev.map(c => 
      c.id === commentId 
        ? { 
            ...c, 
            isLiked: !isLiked,
            likes: isLiked ? c.likes - 1 : c.likes + 1
          }
        : c
    ));

    try {
      const response = await fetch(`/api/comments/${commentId}/like`, {
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error('Failed to like comment');
      }
    } catch (error) {
      console.error('Error liking comment:', error);
      setComments(originalComments); // Revert on error
      // TODO: Show error toast
    }
  };

  const handleReply = (commentId: string, username: string) => {
    setReplyingTo(commentId);
    setNewComment(`@${username} `);
    textareaRef.current?.focus();
    triggerHaptic(hapticPatterns.light);
  };

  // Mobile: slide up from bottom
  const mobileVariants = {
    hidden: { y: "100%" },
    visible: { y: 0 },
    exit: { y: "100%" }
  };

  // Desktop: modal center
  const desktopVariants = {
    hidden: { opacity: 0, scale: 0.95 },
    visible: { opacity: 1, scale: 1 },
    exit: { opacity: 0, scale: 0.95 }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50"
            onClick={handleClose}
          />
          
          {/* Sheet Content */}
          <motion.div
            variants={isMobile ? mobileVariants : desktopVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            transition={{ duration: 0.3, ease: "easeOut" }}
            className={cn(
              "fixed z-50 bg-background border border-border flex flex-col",
              isMobile 
                ? "bottom-0 left-0 right-0 rounded-t-3xl h-[85vh]" 
                : "top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-2xl w-[420px] h-[600px] shadow-2xl"
            )}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-border">
              <div>
                <h3 className="font-semibold">Arguments</h3>
                <p className="text-sm text-muted-foreground truncate max-w-[200px]">
                  {debateTitle}
                </p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClose}
                className="w-8 h-8 p-0"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>

            {/* Arguments List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {comments.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <p>No arguments yet. Be the first to make your case!</p>
                </div>
              ) : (
                comments.map((comment) => (
                  <div key={comment.id} className="space-y-2">
                    <div className="flex gap-3">
                      <Avatar className="w-8 h-8 flex-shrink-0">
                        <AvatarImage src={comment.user.image} />
                        <AvatarFallback>{comment.user.name?.charAt(0)}</AvatarFallback>
                      </Avatar>
                      
                      <div className="flex-1 min-w-0">
                        <div className="bg-muted rounded-2xl px-3 py-2">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium text-sm">{comment.user.name}</span>
                            <span className="text-xs text-muted-foreground">
                              {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}
                            </span>
                          </div>
                          <p className="text-sm leading-relaxed break-words">{comment.content}</p>
                        </div>
                        
                        {/* Comment Actions */}
                        <div className="flex items-center gap-4 mt-2 ml-2">
                          <button
                            onClick={() => handleLikeComment(comment.id)}
                            className={cn(
                              "flex items-center gap-1 text-xs hover:text-red-500 transition-colors",
                              comment.isLiked ? "text-red-500" : "text-muted-foreground"
                            )}
                          >
                            <Heart className={cn("w-3 h-3", comment.isLiked && "fill-current")} />
                            {comment.likes > 0 && comment.likes}
                          </button>
                          
                          {currentUserId && (
                            <button
                              onClick={() => handleReply(comment.id, comment.user.username || comment.user.name)}
                              className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
                            >
                              <Reply className="w-3 h-3" />
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

            {/* Argument Input */}
            {currentUserId && (
              <div className="border-t border-border p-4 flex-shrink-0 min-h-[100px]">
                {replyingTo && (
                  <div className="flex items-center gap-2 mb-2 text-xs text-muted-foreground">
                    <Reply className="w-3 h-3" />
                    <span>Replying to argument</span>
                    <button
                      onClick={() => {
                        setReplyingTo(null);
                        setNewComment('');
                      }}
                      className="text-red-500 hover:text-red-600"
                    >
                      Cancel
                    </button>
                  </div>
                )}
                
                <div className="flex gap-3">
                  <Avatar className="w-8 h-8 flex-shrink-0">
                    <AvatarFallback>You</AvatarFallback>
                  </Avatar>
                  
                  <div className="flex-1 flex gap-2">
                    <Textarea
                      ref={textareaRef}
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      placeholder="Make your argument..."
                      className="flex-1 min-h-[40px] max-h-[120px] resize-none border-muted"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          handleSubmitComment();
                        }
                      }}
                    />
                    
                    <Button
                      onClick={handleSubmitComment}
                      disabled={!newComment.trim() || isLoading}
                      size="sm"
                      className="self-end"
                    >
                      <Send className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {!currentUserId && (
              <div className="border-t border-border p-4 text-center">
                <p className="text-sm text-muted-foreground">
                  Sign in to join the debate
                </p>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}