'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, PanInfo } from 'framer-motion';
import { useSession } from 'next-auth/react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { 
  Heart, 
  MessageCircle, 
  Share, 
  X, 
  Send, 
  MoreHorizontal,
  Volume2,
  VolumeX,
  ChevronUp,
  ChevronDown,
  MapPin,
  Target,
  Users
} from 'lucide-react';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { useRouter } from 'next/navigation';
import { formatDistanceToNow } from 'date-fns';

interface IssueUser {
  id: string;
  name: string;
  username: string;
  image?: string;
}

interface IssueComment {
  id: string;
  content: string;
  createdAt: string;
  user: IssueUser;
}

interface TikTokIssue {
  id: string;
  title: string;
  description: string;
  location?: string | null;
  tags: string[];
  mediaUrl?: string;
  mediaType?: string;
  userId: string;
  user: IssueUser;
  createdAt: string;
  interests: number;
  comments: IssueComment[];
  shares: number;
  championCount: number;
  isInterested?: boolean;
  isShared?: boolean;
  championedBy?: IssueUser | null;
  championedByInitiativeId?: string | null;
}

interface TikTokIssueDetailProps {
  issue: TikTokIssue;
  isOpen: boolean;
  onClose: () => void;
}

export function TikTokIssueDetail({ issue, isOpen, onClose }: TikTokIssueDetailProps) {
  const [showComments, setShowComments] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [comments, setComments] = useState<IssueComment[]>(issue.comments || []);
  const [isInterested, setIsInterested] = useState(issue.isInterested || false);
  const [interestCount, setInterestCount] = useState(issue.interests || 0);
  const [shareCount, setShareCount] = useState(issue.shares || 0);
  const [isMuted, setIsMuted] = useState(true);
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const router = useRouter();
  const { data: session } = useSession();

  // Helper function to check if URL is a video
  const isVideoFile = (url: string): boolean => {
    if (!url || typeof url !== 'string') return false;
    const videoExtensions = ['.mp4', '.webm', '.ogg', '.mov', '.avi'];
    return videoExtensions.some(ext => url.toLowerCase().includes(ext));
  };

  const isVideo = issue.mediaUrl ? isVideoFile(issue.mediaUrl) : false;

  // Auto-play video when modal opens
  useEffect(() => {
    if (isOpen && videoRef.current && isVideo) {
      videoRef.current.play().catch(() => {
        // Handle autoplay failure
      });
    }
  }, [isOpen, isVideo]);

  // Fetch live data
  useEffect(() => {
    if (isOpen && issue.id) {
      fetchIssueData();
    }
  }, [isOpen, issue.id]);

  const fetchIssueData = async () => {
    try {
      // Fetch interests (use likes API since interests API doesn't exist yet)
      try {
        const interestRes = await fetch(`/api/issues/likes?issueId=${issue.id}&userId=${session?.user?.id}`);
        if (interestRes.ok) {
          const interestData = await interestRes.json();
          setIsInterested(interestData.liked || false);
          setInterestCount(interestData.count || 0);
        }
      } catch (error) {
        console.log('Interests API not available, using defaults');
        setIsInterested(false);
        setInterestCount(0);
      }

      // Fetch shares
      try {
        const shareRes = await fetch(`/api/issues/shares?issueId=${issue.id}&userId=${session?.user?.id}`);
        if (shareRes.ok) {
          const shareData = await shareRes.json();
          setShareCount(shareData.count || 0);
        }
      } catch (error) {
        console.log('Shares API not available, using defaults');
        setShareCount(0);
      }

      // Fetch comments
      try {
        const commentRes = await fetch(`/api/issues/comments?issueId=${issue.id}`);
        if (commentRes.ok) {
          const commentData = await commentRes.json();
          setComments(Array.isArray(commentData) ? commentData.map((c: any) => ({
            id: c.id,
            content: c.text || c.content,
            createdAt: c.timestamp || c.createdAt,
            user: {
              id: c.userId || c.user?.id,
              name: c.user?.name || 'Anonymous',
              username: c.user?.name?.toLowerCase().replace(/\s+/g, '') || 'anonymous',
              image: c.user?.image
            }
          })) : []);
        }
      } catch (error) {
        console.log('Comments API not available, using defaults');
        setComments([]);
      }
    } catch (error) {
      console.error('Error fetching issue data:', error);
    }
  };

  const handleInterest = async () => {
    if (!session?.user?.id) return;

    const newInterested = !isInterested;
    setIsInterested(newInterested);
    setInterestCount(prev => newInterested ? prev + 1 : prev - 1);

    try {
      const response = await fetch('/api/issues/likes', {
        method: newInterested ? 'POST' : 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          issueId: issue.id,
          userId: session.user.id
        })
      });

      if (!response.ok) {
        // Revert on error
        setIsInterested(!newInterested);
        setInterestCount(prev => newInterested ? prev - 1 : prev + 1);
      }
    } catch (error) {
      // Revert on error
      setIsInterested(!newInterested);
      setInterestCount(prev => newInterested ? prev - 1 : prev + 1);
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: issue.title,
          text: issue.description,
          url: `${window.location.origin}/issues/${issue.id}`,
        });
      } catch (error) {
        console.log('Share cancelled');
      }
    } else {
      try {
        await navigator.clipboard.writeText(`${window.location.origin}/issues/${issue.id}`);
        // Show toast or feedback
      } catch (error) {
        console.error('Could not share:', error);
      }
    }
  };

  const handleAddComment = async () => {
    if (!newComment.trim() || !session?.user?.id || isSubmittingComment) return;

    setIsSubmittingComment(true);
    try {
      const response = await fetch('/api/issues/comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          issueId: issue.id,
          userId: session.user.id,
          text: newComment.trim()
        })
      });

      if (response.ok) {
        const newCommentData = await response.json();
        setComments(prev => [...prev, {
          id: newCommentData.id,
          content: newComment.trim(),
          createdAt: new Date().toISOString(),
          user: {
            id: session.user.id!,
            name: session.user.name || 'You',
            username: session.user.name?.toLowerCase().replace(/\s+/g, '') || 'you',
            image: session.user.image || undefined
          }
        }]);
        setNewComment('');
      }
    } catch (error) {
      console.error('Error adding comment:', error);
    } finally {
      setIsSubmittingComment(false);
    }
  };

  const handleUserClick = () => {
    router.push(`/profile/${issue.user.id}`);
    onClose();
  };

  const handleIssueClick = () => {
    router.push(`/issues/${issue.id}`);
    onClose();
  };

  const handleDragEnd = (event: any, info: PanInfo) => {
    if (info.offset.y > 100 && info.velocity.y > 0) {
      onClose();
    }
  };

  // Parse location display
  const getLocationDisplay = (location: string | null | undefined): string | null => {
    if (!location) return null;
    try {
      const parsed = JSON.parse(location);
      return parsed.name || parsed.address || null;
    } catch {
      return location;
    }
  };

  const locationDisplay = getLocationDisplay(issue.location);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-[9999] bg-black flex"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          onClick={onClose}
        >
          {/* Main content wrapper */}
          <motion.div
            drag="y"
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={0.2}
            onDragEnd={handleDragEnd}
            className="relative w-full h-full flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close button */}
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="absolute top-4 left-4 z-50 bg-black/50 text-white hover:bg-black/70 rounded-full"
            >
              <X className="h-6 w-6" />
            </Button>

            {/* Navigation arrows for future use */}
            {/* Can add prev/next issue navigation here */}

            {/* Media content */}
            <div className="relative flex-1 flex items-center justify-center bg-black">
              {issue.mediaUrl ? (
                isVideo ? (
                <div className="relative w-full h-full flex items-center justify-center">
                  <video
                    ref={videoRef}
                    src={issue.mediaUrl}
                    className="max-w-full max-h-[80vh] w-auto h-auto object-contain"
                    style={{ maxWidth: '100vw', maxHeight: '80vh' }}
                    loop
                    muted={isMuted}
                    playsInline
                    onClick={(e) => {
                      e.stopPropagation();
                      if (e.currentTarget.paused) {
                        e.currentTarget.play();
                      } else {
                        e.currentTarget.pause();
                      }
                    }}
                  />
                  
                  {/* Volume control */}
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setIsMuted(!isMuted)}
                    className="absolute bottom-4 left-4 bg-black/50 text-white hover:bg-black/70"
                  >
                    {isMuted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
                  </Button>
                </div>
              ) : (
                <Image
                  src={issue.mediaUrl}
                  alt={issue.title}
                  fill
                  className="object-contain"
                />
              )
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-red-900 to-orange-900">
                <div className="text-center max-w-md mx-auto p-8">
                  <div className="mb-4">
                    <Badge className="bg-red-500/20 text-red-300 border-red-500/30 mb-4">
                      Issue
                    </Badge>
                  </div>
                  <h2 className="text-2xl font-bold text-white mb-4">{issue.title}</h2>
                  <p className="text-lg text-gray-200 leading-relaxed mb-4">{issue.description}</p>
                  
                  {/* Location */}
                  {locationDisplay && (
                    <div className="flex items-center justify-center gap-2 text-red-300 mb-4">
                      <MapPin className="h-4 w-4" />
                      <span className="text-sm">{locationDisplay}</span>
                    </div>
                  )}

                  {/* Tags */}
                  {issue.tags && issue.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2 justify-center">
                      {issue.tags.map((tag, index) => (
                        <Badge key={index} variant="outline" className="text-xs text-gray-300 border-gray-600">
                          #{tag}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              )}
            </div>

          {/* Right sidebar with actions and info */}
          <motion.div
            className="absolute right-4 bottom-20 flex flex-col items-center space-y-4 z-40"
            drag="y"
            dragConstraints={{ top: 0, bottom: 0 }}
            onDragEnd={handleDragEnd}
          >
            {/* User info */}
            <div className="flex flex-col items-center space-y-2">
              <div className="flex items-center gap-3 mb-3" onClick={handleUserClick}>
                <Avatar className="w-12 h-12 cursor-pointer border-2 border-white">
                  <AvatarImage src={issue.user.image} alt={issue.user.name} />
                  <AvatarFallback>{issue.user.name.substring(0, 2)}</AvatarFallback>
                </Avatar>
              </div>
              <div className="text-center">
                <p className="text-white font-semibold text-sm cursor-pointer" onClick={handleUserClick}>
                  {issue.user.name}
                </p>
                <p className="text-gray-300 text-xs">
                  {formatDistanceToNow(new Date(issue.createdAt), { addSuffix: true })}
                </p>
              </div>
            </div>

            {/* Interest button */}
            <div className="flex flex-col items-center">
              <Button
                variant="ghost"
                size="icon"
                onClick={handleInterest}
                className={cn(
                  "rounded-full w-12 h-12 transition-all",
                  isInterested 
                    ? "bg-red-500 text-white hover:bg-red-600" 
                    : "bg-black/50 text-white hover:bg-black/70"
                )}
              >
                <Heart className={cn("h-6 w-6", isInterested && "fill-current")} />
              </Button>
              <span className="text-white text-xs mt-1">{interestCount}</span>
            </div>

            {/* Comments button */}
            <div className="flex flex-col items-center">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowComments(!showComments)}
                className="bg-black/50 text-white hover:bg-black/70 rounded-full w-12 h-12"
              >
                <MessageCircle className="h-6 w-6" />
              </Button>
              <span className="text-white text-xs mt-1">{comments.length}</span>
            </div>

            {/* Share button */}
            <div className="flex flex-col items-center">
              <Button
                variant="ghost"
                size="icon"
                onClick={handleShare}
                className="bg-black/50 text-white hover:bg-black/70 rounded-full w-12 h-12"
              >
                <Share className="h-6 w-6" />
              </Button>
              <span className="text-white text-xs mt-1">{shareCount}</span>
            </div>

            {/* Champion info */}
            {issue.championCount > 0 && (
              <div className="flex flex-col items-center">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleIssueClick}
                  className="bg-green-500/20 text-green-300 hover:bg-green-500/30 rounded-full w-12 h-12"
                >
                  <Target className="h-6 w-6" />
                </Button>
                <span className="text-green-300 text-xs mt-1">{issue.championCount}</span>
              </div>
            )}

            {/* More actions */}
            <Button
              variant="ghost"
              size="icon"
              className="bg-black/50 text-white hover:bg-black/70 rounded-full w-12 h-12"
            >
              <MoreHorizontal className="h-6 w-6" />
            </Button>
          </motion.div>

          {/* Comments panel */}
          <AnimatePresence>
            {showComments && (
              <motion.div
                className="absolute bottom-0 left-0 right-0 bg-black/90 backdrop-blur-sm max-h-[50vh] z-50"
                initial={{ y: "100%" }}
                animate={{ y: 0 }}
                exit={{ y: "100%" }}
                transition={{ type: "spring", damping: 25, stiffness: 300 }}
              >
                <div className="p-4">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-white font-semibold">Comments ({comments.length})</h3>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setShowComments(false)}
                      className="text-white hover:bg-white/10"
                    >
                      <ChevronDown className="h-5 w-5" />
                    </Button>
                  </div>

                  {/* Comments list */}
                  <div className="max-h-64 overflow-y-auto mb-4 space-y-3">
                    {comments.map((comment) => (
                      <div key={comment.id} className="flex gap-3">
                        <Avatar className="w-8 h-8 flex-shrink-0">
                          <AvatarImage src={comment.user.image} alt={comment.user.name} />
                          <AvatarFallback className="text-xs">
                            {comment.user.name.substring(0, 2)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-white font-medium text-sm">{comment.user.name}</span>
                            <span className="text-gray-400 text-xs">
                              {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}
                            </span>
                          </div>
                          <p className="text-gray-200 text-sm break-words">{comment.content}</p>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Add comment */}
                  {session?.user && (
                    <div className="flex gap-2">
                      <Input
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        placeholder="Add a comment..."
                        className="flex-1 bg-white/10 border-white/20 text-white placeholder:text-gray-400"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            handleAddComment();
                          }
                        }}
                      />
                      <Button
                        onClick={handleAddComment}
                        disabled={!newComment.trim() || isSubmittingComment}
                        size="icon"
                        className="bg-red-500 hover:bg-red-600 text-white"
                      >
                        <Send className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}