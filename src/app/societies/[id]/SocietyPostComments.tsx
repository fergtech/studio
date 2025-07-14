"use client";

import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { MessageCircle, Send, Reply, X as CloseIcon } from 'lucide-react';
import { useSession } from 'next-auth/react';
import { useIsMobile } from '@/hooks/use-mobile';
import { ScrollArea } from '@/components/ui/scroll-area';

interface Comment {
  id: string;
  text: string;
  createdAt: string;
  user: {
    id: string;
    name: string;
    image?: string;
  };
  parentCommentId?: string;
  replies?: Comment[];
}

interface SocietyPostCommentsProps {
  postId: string;
  userId?: string;
  societyId: string;
}

export function SocietyPostComments({ postId, userId, societyId }: SocietyPostCommentsProps) {
  const { data: session } = useSession();
  const [comments, setComments] = useState<Comment[]>([]);
  const [allComments, setAllComments] = useState<Comment[]>([]); // Store all comments flat for counting
  const [newComment, setNewComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');
  const commentRefs = useRef<{ [id: string]: HTMLDivElement | null }>({});
  const [highlightedId, setHighlightedId] = useState<string | null>(null);
  const [showComments, setShowComments] = useState(false); // New state for overlay
  const [overlayReplyingTo, setOverlayReplyingTo] = useState<string | null>(null); // For replying in overlay
  const [overlayReplyText, setOverlayReplyText] = useState('');
  const isMobile = !!(useIsMobile && useIsMobile());

  // Handle reply in overlay
  const handleOverlayReply = async (parentId: string) => {
    if (!overlayReplyText.trim() || !session?.user?.id) return;
    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/societies/${societyId}/posts/${postId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: session.user.id,
          text: overlayReplyText.trim(),
          parentCommentId: parentId,
        }),
      });
      if (response.ok) {
        setOverlayReplyText('');
        setOverlayReplyingTo(null);
        fetchComments(); // Refresh comments
      }
    } catch (error) {
      // Optionally show error
    } finally {
      setIsSubmitting(false);
    }
  };

  // Fetch comments on mount
  useEffect(() => {
    fetchComments();
  }, [postId, societyId]);

  const fetchComments = async () => {
    try {
      const response = await fetch(`/api/societies/${societyId}/posts/${postId}/comments`);
      if (response.ok) {
        const data = await response.json();
        setAllComments(data); // Store all comments flat for counting
        // Organize comments into threads (parent comments with replies)
        const parentComments = data.filter((comment: Comment) => !comment.parentCommentId);
        const replies = data.filter((comment: Comment) => comment.parentCommentId);
        // Attach replies to their parent comments (one level only)
        const organizedComments = parentComments.map((comment: Comment) => ({
          ...comment,
          replies: replies.filter((reply: Comment) => reply.parentCommentId === comment.id)
        }));
        setComments(organizedComments);
      }
    } catch (error) {
      console.error('Failed to fetch comments:', error);
    }
  };

  const handleSubmitComment = async () => {
    if (!newComment.trim() || !session?.user?.id) return;
    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/societies/${societyId}/posts/${postId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: session.user.id,
          text: newComment.trim(),
        }),
      });
      if (response.ok) {
        setNewComment('');
        fetchComments(); // Refresh comments
      }
    } catch (error) {
      console.error('Failed to create comment:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmitReply = async () => {
    if (!replyText.trim() || !session?.user?.id || !replyingTo) return;
    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/societies/${societyId}/posts/${postId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: session.user.id,
          text: replyText.trim(),
          parentCommentId: replyingTo,
        }),
      });
      if (response.ok) {
        setReplyText('');
        setReplyingTo(null);
        fetchComments(); // Refresh comments
      }
    } catch (error) {
      console.error('Failed to create reply:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
    if (diffInHours < 1) {
      const diffInMinutes = Math.floor(diffInHours * 60);
      return `${diffInMinutes}m ago`;
    } else if (diffInHours < 24) {
      return `${Math.floor(diffInHours)}h ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  // Helper to find a comment by id in the flat list
  const findCommentByIdFlat = (id: string | null): Comment | null => {
    if (!id) return null;
    return allComments.find((c) => c.id === id) || null;
  };

  // Helper: get all descendants of a parent comment, sorted by createdAt
  const getAllRepliesFlat = (parentId: string): Comment[] => {
    // Get all replies (direct or indirect) to this parentId
    const replies = allComments.filter((c) => c.parentCommentId === parentId);
    // Sort by createdAt (oldest first)
    replies.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    // For each reply, recursively get its own replies (flattened)
    let flat: Comment[] = [];
    for (const reply of replies) {
      flat.push(reply);
      flat = flat.concat(getAllRepliesFlat(reply.id));
    }
    return flat;
  };

  // Scroll to and highlight a comment
  const scrollToComment = (id: string) => {
    const node = commentRefs.current[id];
    if (node) {
      node.scrollIntoView({ behavior: 'smooth', block: 'center' });
      setHighlightedId(id);
      setTimeout(() => setHighlightedId(null), 1200);
    }
  };

  // Render a single comment (parent or reply)
  const RenderComment = ({ comment, isReply = false }: { comment: Comment; isReply?: boolean }) => {
    // If this is a reply to another reply, show a reference line
    let reference: null | { user: string; snippet: string; parentId: string } = null;
    if (isReply && comment.parentCommentId) {
      const parent = findCommentByIdFlat(comment.parentCommentId);
      if (parent) {
        reference = {
          user: parent.user.name,
          snippet: parent.text.length > 40 ? parent.text.slice(0, 40) + '…' : parent.text,
          parentId: parent.id,
        };
      }
    }
    return (
      <div
        ref={(el) => { commentRefs.current[comment.id] = el; }}
        className={`mb-4 ${isReply ? 'ml-8 border-l-2 border-muted pl-4 mt-2' : ''} ${highlightedId === comment.id ? 'bg-yellow-100 dark:bg-yellow-900 transition-colors duration-700' : ''}`}
        id={`comment-${comment.id}`}
      >
        {reference && (
          <div className="text-xs text-muted-foreground mb-1">
            Replying to{' '}
            <button
              className="underline hover:text-primary"
              onClick={() => scrollToComment(reference.parentId)}
              type="button"
            >
              {reference.user}
            </button>
            : <span className="italic">{reference.snippet}</span>
          </div>
        )}
        <div className="flex items-start gap-3">
          <Avatar className="h-8 w-8">
            <AvatarImage src={comment.user.image || undefined} />
            <AvatarFallback>{comment.user.name?.charAt(0) || 'U'}</AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-sm font-medium">{comment.user.name}</span>
              <span className="text-xs text-muted-foreground">{formatDate(comment.createdAt)}</span>
            </div>
            <p className="text-sm text-foreground mb-2">{comment.text}</p>
            {session?.user?.id && (
              <Button
                variant="ghost"
                size="sm"
                className="h-6 px-2 text-xs"
                onClick={() => {
                  if (showComments) {
                    setOverlayReplyingTo(comment.id);
                    setOverlayReplyText('');
                  } else {
                    setReplyingTo(comment.id);
                    setReplyText('');
                  }
                }}
              >
                <Reply className="h-3 w-3 mr-1" />
                Reply
              </Button>
            )}
          </div>
        </div>
      </div>
    );
  };

  // Find the comment being replied to
  const replyingToComment = findCommentByIdFlat(replyingTo);
  const overlayReplyingToComment = findCommentByIdFlat(overlayReplyingTo);

  return (
    <div className="mt-4 relative">
      <div className="flex items-center gap-2 mb-3">
        <MessageCircle className="h-4 w-4" />
        <span className="text-sm font-medium">Comments ({allComments.length})</span>
        {allComments.length > 0 && (
          <Button
            variant="ghost"
            size="sm"
            className="text-xs text-primary underline hover:no-underline"
            onClick={() => setShowComments(true)}
          >
            View all comments
          </Button>
        )}
      </div>
      
      {/* Comment form */}
      {session?.user?.id && (
        <div className="mb-4">
          <Textarea
            placeholder="Write a comment..."
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            className="mb-2"
            rows={3}
          />
          <Button
            onClick={handleSubmitComment}
            disabled={isSubmitting || !newComment.trim()}
            size="sm"
          >
            <Send className="h-3 w-3 mr-1" />
            Comment
          </Button>
        </div>
      )}
      
      {/* Comments list */}
      <div className="space-y-2">
        {comments.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            No comments yet. Be the first to comment!
          </p>
        ) : (
          comments.map((comment) => {
            const allReplies = getAllRepliesFlat(comment.id);
            const firstReply = allReplies[0];
            const moreReplies = allReplies.length > 1 ? allReplies.slice(1) : [];
            return (
              <div key={comment.id} className="relative">
                <RenderComment comment={comment} isReply={false} />
                {firstReply && <RenderComment comment={firstReply} isReply={true} />}
                {allReplies.length > 1 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="ml-8 text-xs text-primary underline hover:no-underline"
                    onClick={() => setShowComments(true)}
                  >
                    View {allReplies.length} replies
                  </Button>
                )}
              </div>
            );
          })
        )}
      </div>
      
      {/* Single reply input rendered outside the comment tree */}
      {replyingTo && replyingToComment && (
        <div className="mt-4 border-t pt-4">
          <div className="mb-2 text-xs text-muted-foreground">
            Replying to <span className="font-semibold">{replyingToComment.user.name}</span>:<br />
            <span className="italic">{replyingToComment.text}</span>
          </div>
          <Textarea
            placeholder="Write a reply..."
            value={replyText}
            onChange={(e) => setReplyText(e.target.value)}
            className="mb-2"
            rows={2}
            autoFocus
          />
          <div className="flex gap-2">
            <Button
              size="sm"
              onClick={handleSubmitReply}
              disabled={isSubmitting || !replyText.trim()}
            >
              <Send className="h-3 w-3 mr-1" />
              Reply
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setReplyingTo(null);
                setReplyText('');
              }}
            >
              Cancel
            </Button>
          </div>
        </div>
      )}

      {/* Comments Overlay - Conditionally rendered on top */}
      {showComments && (
        <div className="absolute inset-0 z-30 flex flex-col bg-card/90 backdrop-blur-sm text-card-foreground overflow-hidden">
          {/* Compact Header for Comment Mode */}
          <div className="flex items-center justify-between p-3 border-b bg-card/95 flex-shrink-0">
            <div className="flex items-center space-x-2 overflow-hidden">
              <div className="font-semibold text-lg">Comments ({allComments.length})</div>
            </div>
            <button 
              onClick={() => setShowComments(false)}
              className="text-muted-foreground hover:text-foreground p-1 rounded-full"
            >
              <CloseIcon className="h-4 w-4" />
            </button>
          </div>

          {/* Comments list - Takes remaining space */}
          <ScrollArea className="flex-grow p-3">
            {comments.length > 0 ? (
              <div className="space-y-4">
                {comments.map((comment) => {
                  const allReplies = getAllRepliesFlat(comment.id);
                  return (
                    <div key={comment.id}>
                      <RenderComment comment={comment} isReply={false} />
                      {allReplies.map((reply) => (
                        <RenderComment key={reply.id} comment={reply} isReply={true} />
                      ))}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="flex items-center justify-center h-full">
                <p className="text-sm text-muted-foreground">No comments yet. Be the first!</p>
              </div>
            )}
          </ScrollArea>
          
          {/* Comment form - Sticks to bottom */}
          <div className="p-3 border-t bg-card/95 flex-shrink-0">
            {overlayReplyingTo && overlayReplyingToComment ? (
              <div className="space-y-2">
                <div className="text-xs text-muted-foreground">
                  Replying to <span className="font-semibold">{overlayReplyingToComment.user.name}</span>:<br />
                  <span className="italic">{overlayReplyingToComment.text}</span>
                </div>
                <div className="flex space-x-2">
                  <Textarea 
                    value={overlayReplyText}
                    onChange={(e) => setOverlayReplyText(e.target.value)}
                    placeholder="Write a reply..."
                    className="min-h-[40px] max-h-[100px] resize-none flex-grow bg-background/50"
                    rows={1}
                    autoFocus
                  />
                  <Button 
                    onClick={() => handleOverlayReply(overlayReplyingTo)}
                    disabled={isSubmitting || !overlayReplyText.trim()}
                    size="icon"
                    className="self-end h-9 w-9 flex-shrink-0"
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setOverlayReplyingTo(null);
                    setOverlayReplyText('');
                  }}
                >
                  Cancel
                </Button>
              </div>
            ) : (
              <form 
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSubmitComment();
                }} 
                className="flex space-x-2"
              >
                <Textarea 
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Write a comment..."
                  className="min-h-[40px] max-h-[100px] resize-none flex-grow bg-background/50"
                  rows={1}
                />
                <Button 
                  type="submit" 
                  size="icon" 
                  disabled={!newComment.trim()}
                  className="self-end h-9 w-9 flex-shrink-0"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
} 