import React, { useState, useEffect, useRef } from 'react';
import { X, Reply } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import Link from 'next/link';

interface Comment {
  id: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  text: string;
  timestamp: string | Date;
  parentCommentId?: string;
  replies?: Comment[];
}

interface CommentPanelProps {
  postId: string;
  currentUserId: string | null;
  postType?: string;
  societyId?: string;
  isOpen: boolean;
  onClose: () => void;
  onCommentUpdate?: (newCount: number) => void;
}

export default function CommentPanel({ 
  postId, 
  currentUserId, 
  postType = 'general', 
  societyId,
  isOpen,
  onClose,
  onCommentUpdate 
}: CommentPanelProps) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [allComments, setAllComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [loadingComments, setLoadingComments] = useState(false);
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');
  const commentRefs = useRef<{ [id: string]: HTMLDivElement | null }>({});
  const [highlightedId, setHighlightedId] = useState<string | null>(null);
  const [expandedThreads, setExpandedThreads] = useState<Set<string>>(new Set());

  // Helper to get comments API endpoint
  const commentsApi = (() => {
    if (postType === 'society' && societyId) {
      return `/api/societies/${societyId}/posts/${postId}/comments`;
    } else if (postType === 'issue') {
      return `/api/issues/comments?issueId=${postId}`;
    } else if (postType === 'idea') {
      return `/api/ideas/comments?ideaId=${postId}`;
    } else {
      return `/api/general-posts/comments?postId=${postId}`;
    }
  })();

  // Fetch comments with threading
  const fetchComments = async () => {
    setLoadingComments(true);
    try {
      const response = await fetch(commentsApi);
      if (response.ok) {
        const data = await response.json();
        const commentsArray = data.allComments || (Array.isArray(data) ? data : []);
        
        // Store all comments flat for counting and referencing
        const mappedComments = commentsArray.map((c: any) => ({
          id: c.id,
          userId: c.userId,
          userName: c.user?.name || 'Unknown',
          userAvatar: c.user?.image || undefined,
          text: c.text,
          timestamp: c.timestamp || c.createdAt,
          parentCommentId: c.parentCommentId
        }));
        
        setAllComments(mappedComments);
        
        // Organize comments into threads (parent comments with nested replies)
        const parentComments = mappedComments.filter((comment: Comment) => !comment.parentCommentId);
        const replies = mappedComments.filter((comment: Comment) => comment.parentCommentId);
        
        // Attach replies to their parent comments recursively
        const organizedComments = parentComments.map((comment: Comment) => ({
          ...comment,
          replies: getRepliesRecursively(comment.id, replies)
        }));
        
        setComments(organizedComments);
        
        // Update parent component with new count
        if (onCommentUpdate) {
          onCommentUpdate(mappedComments.length);
        }
      }
    } catch (error) {
      console.error('Failed to fetch comments:', error);
    } finally {
      setLoadingComments(false);
    }
  };

  // Helper function to get replies recursively for threading
  const getRepliesRecursively = (parentId: string, allReplies: Comment[]): Comment[] => {
    const directReplies = allReplies.filter(reply => reply.parentCommentId === parentId);
    return directReplies.map(reply => ({
      ...reply,
      replies: getRepliesRecursively(reply.id, allReplies)
    }));
  };

  useEffect(() => {
    if (!isOpen) return;
    fetchComments();
  }, [postId, commentsApi, isOpen]);

  // Comment submit
  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || !currentUserId) return;
    
    try {
      let res;
      if (postType === 'society' && societyId) {
        res = await fetch(`/api/societies/${societyId}/posts/${postId}/comments`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: currentUserId, text: newComment })
        });
      } else if (postType === 'issue') {
        res = await fetch('/api/issues/comments', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ issueId: postId, userId: currentUserId, text: newComment })
        });
      } else if (postType === 'idea') {
        res = await fetch('/api/ideas/comments', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ideaId: postId, userId: currentUserId, text: newComment })
        });
      } else {
        res = await fetch('/api/general-posts/comments', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ postId, userId: currentUserId, text: newComment })
        });
      }
      
      if (res.ok) {
        setNewComment('');
        fetchComments(); // Re-fetch comments with new threading logic
      }
    } catch (error) {
      console.error('Error submitting comment:', error);
    }
  };

  // Reply submit
  const handleSubmitReply = async () => {
    if (!replyText.trim() || !currentUserId || !replyingTo) return;
    
    try {
      let res;
      if (postType === 'society' && societyId) {
        res = await fetch(`/api/societies/${societyId}/posts/${postId}/comments`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            userId: currentUserId, 
            text: replyText,
            parentCommentId: replyingTo
          })
        });
      } else if (postType === 'issue') {
        res = await fetch('/api/issues/comments', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            issueId: postId, 
            userId: currentUserId, 
            text: replyText,
            parentCommentId: replyingTo
          })
        });
      } else if (postType === 'idea') {
        res = await fetch('/api/ideas/comments', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            ideaId: postId, 
            userId: currentUserId, 
            text: replyText,
            parentCommentId: replyingTo
          })
        });
      } else {
        res = await fetch('/api/general-posts/comments', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            postId, 
            userId: currentUserId, 
            text: replyText,
            parentCommentId: replyingTo
          })
        });
      }
      
      if (res.ok) {
        setReplyText('');
        setReplyingTo(null);
        fetchComments(); // Re-fetch comments
      }
    } catch (error) {
      console.error('Error submitting reply:', error);
    }
  };

  // Find comment by ID for reply context
  const findCommentById = (id: string | null): Comment | null => {
    if (!id) return null;
    return allComments.find(c => c.id === id) || null;
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

  // Format date helper
  const formatDate = (dateString: string | Date) => {
    const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
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

  // Render a single comment (parent or reply) with recursive depth
  const RenderComment = ({ comment, isReply = false, depth = 0 }: { comment: Comment; isReply?: boolean; depth?: number }) => {
    const maxInitialDepth = 3; // Show up to 3 levels before requiring "view more" (depth 0,1,2)
    const shouldShowReplies = depth < maxInitialDepth || expandedThreads.has(comment.id);
    const hasHiddenReplies = comment.replies && comment.replies.length > 0 && depth >= maxInitialDepth && !expandedThreads.has(comment.id);
    
    // Debug logging to see what's happening
    if (comment.replies && comment.replies.length > 0) {
      console.log(`Comment "${comment.text}" at depth ${depth}: shouldShowReplies=${shouldShowReplies}, hasHiddenReplies=${hasHiddenReplies}, replies count=${comment.replies.length}`);
    }
    
    // If this is a reply, show a reference line
    let reference: null | { user: string; snippet: string; parentId: string } = null;
    if (isReply && comment.parentCommentId) {
      const parent = findCommentById(comment.parentCommentId);
      if (parent) {
        reference = {
          user: parent.userName,
          snippet: parent.text.length > 40 ? parent.text.slice(0, 40) + '…' : parent.text,
          parentId: parent.id,
        };
      }
    }

    return (
      <div>
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
            <Link href={`/profile/${comment.userId}`} className="hover:opacity-80 transition-opacity flex-shrink-0">
              <Avatar className="w-8 h-8">
                {comment.userAvatar ? (
                  <AvatarImage src={comment.userAvatar} alt={comment.userName} />
                ) : (
                  <AvatarFallback>{comment.userName?.charAt(0) || 'U'}</AvatarFallback>
                )}
              </Avatar>
            </Link>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <Link href={`/profile/${comment.userId}`} className="hover:underline">
                  <span className="text-sm font-medium">{comment.userName}</span>
                </Link>
                <span className="text-xs text-muted-foreground">
                  {formatDate(comment.timestamp)}
                </span>
              </div>
              <p className="text-sm text-foreground mb-2">{comment.text}</p>
              {currentUserId && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 px-2 text-xs"
                  onClick={() => {
                    setReplyingTo(comment.id);
                    setReplyText('');
                  }}
                >
                  <Reply className="h-3 w-3 mr-1" />
                  Reply
                </Button>
              )}
            </div>
          </div>
        </div>
        
        {/* Render replies recursively */}
        {shouldShowReplies && comment.replies && comment.replies.map(reply => (
          <RenderComment key={reply.id} comment={reply} isReply={true} depth={depth + 1} />
        ))}
        
        {/* Show "view more replies" button if there are hidden replies */}
        {hasHiddenReplies && (
          <div className="ml-8 mb-2">
            <Button
              variant="ghost"
              size="sm"
              className="h-6 px-2 text-xs text-blue-600 hover:text-blue-700"
              onClick={() => {
                setExpandedThreads(prev => new Set([...prev, comment.id]));
              }}
            >
              View {comment.replies?.length} more {comment.replies?.length === 1 ? 'reply' : 'replies'}
            </Button>
          </div>
        )}
        
        {/* Show "hide replies" button if thread is expanded */}
        {depth >= maxInitialDepth && expandedThreads.has(comment.id) && comment.replies && comment.replies.length > 0 && (
          <div className="ml-8 mb-2">
            <Button
              variant="ghost"
              size="sm"
              className="h-6 px-2 text-xs text-gray-600 hover:text-gray-700"
              onClick={() => {
                setExpandedThreads(prev => {
                  const newSet = new Set(prev);
                  newSet.delete(comment.id);
                  return newSet;
                });
              }}
            >
              Hide replies
            </Button>
          </div>
        )}
      </div>
    );
  };

  const replyingToComment = findCommentById(replyingTo);

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 lg:hidden"
          onClick={onClose}
        />
      )}
      
      {/* Comment Panel */}
      <div 
        className={`fixed top-0 right-0 h-full w-full max-w-md bg-card border-l border-border shadow-xl z-50 transform transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h3 className="font-semibold text-lg">Comments ({allComments.length})</h3>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="h-8 w-8 p-0"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Comments List */}
        <div className="flex-1 flex flex-col h-[calc(100vh-140px)]">
          <ScrollArea className="flex-1 p-4">
            {loadingComments ? (
              <div className="text-sm text-gray-400">Loading comments...</div>
            ) : comments.length === 0 ? (
              <div className="text-sm text-gray-400">No comments yet. Be the first to comment!</div>
            ) : (
              <div className="space-y-4">
                {comments.map(comment => (
                  <RenderComment key={comment.id} comment={comment} isReply={false} depth={0} />
                ))}
              </div>
            )}
          </ScrollArea>

          {/* Comment Form */}
          <div className="p-4 border-t border-border">
            {replyingTo && replyingToComment ? (
              <div className="space-y-3 mb-4">
                <div className="text-xs text-muted-foreground">
                  Replying to <span className="font-semibold">{replyingToComment.userName}</span>:<br />
                  <span className="italic">{replyingToComment.text}</span>
                </div>
                <Textarea
                  value={replyText}
                  onChange={e => setReplyText(e.target.value)}
                  placeholder="Write a reply..."
                  className="min-h-[60px] resize-none"
                  rows={2}
                  autoFocus
                />
                <div className="flex gap-2">
                  <Button 
                    size="sm" 
                    onClick={handleSubmitReply}
                    disabled={!replyText.trim() || !currentUserId}
                  >
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
            ) : (
              <form onSubmit={handleSubmitComment} className="space-y-3">
                <Textarea
                  value={newComment}
                  onChange={e => setNewComment(e.target.value)}
                  placeholder="Add a comment..."
                  className="min-h-[80px] resize-none"
                  rows={3}
                />
                <div className="flex justify-end">
                  <Button 
                    type="submit" 
                    size="sm" 
                    disabled={!newComment.trim() || !currentUserId}
                    className="bg-primary hover:bg-primary/90"
                  >
                    Post Comment
                  </Button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </>
  );
}