"use client";
import { formatDistanceToNow, parseISO } from 'date-fns';
import Link from 'next/link';
import Image from 'next/image';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import PostReactions from '@/components/PostReactions';
import CommentPanel from '@/components/CommentPanel';
import React, { useRef, useState, useEffect } from 'react';
import { Pause, Play, Maximize2, ArrowLeft, Edit, Save, Loader2 } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { VideoPlayer } from '@/components/ui/video-player';
import { AudioPlayer } from '@/components/ui/audio-player';
import { LinkPreview } from '@/components/ui/link-preview';
import { DocumentPreview } from '@/components/ui/document-preview';
import AppSidebar, { getDefaultCollapsedState } from '@/components/AppSidebar';
import { updateGeneralPostContent, updateSocietyPostContent } from '@/app/actions/postActions';

// Helper function to detect video files
const isVideoFile = (url: string) => {
  if (!url) return false;
  const videoExtensions = ['.mp4', '.webm', '.mov', '.avi', '.mkv', '.wmv', '.flv', '.m4v'];
  const lowerUrl = url.toLowerCase();
  return videoExtensions.some(ext => lowerUrl.includes(ext));
};

// Helper function to detect audio files
const isAudioFile = (url: string) => {
  if (!url) return false;
  const audioExtensions = ['.mp3', '.wav', '.m4a', '.aac', '.ogg', '.flac'];
  const lowerUrl = url.toLowerCase();
  return audioExtensions.some(ext => lowerUrl.includes(ext));
};

interface MediaItem {
  type: string;
  url: string;
}

interface PostDetailClientProps {
  id: string;
  content: string;
  creatorId: string;
  creatorName: string;
  creatorAvatar?: string | null;
  media?: MediaItem[];
  timestamp: string | Date;
  currentUserId?: string | null;
  postType?: string;
  society?: {
    id: string;
    name: string;
    image?: string | null;
  };
  societyPostType?: string;
  linkPreview?: {
    url: string;
    title?: string;
    description?: string;
    image?: string;
    siteName?: string;
    favicon?: string;
    type?: string;
  } | null;
  links?: {
    id: string;
    order: number;
    linkPreview: {
      url: string;
      title?: string;
      description?: string;
      image?: string;
      siteName?: string;
      favicon?: string;
      type?: string;
    };
  }[];
  documents?: {
    id: string;
    order: number;
    document: {
      url: string;
      filename: string;
      fileType: string;
      fileSize: number;
      extension: string;
      title?: string;
      description?: string;
    };
  }[];
}

export default function PostDetailClient({
  id,
  content,
  creatorId,
  creatorName,
  creatorAvatar,
  media,
  timestamp,
  currentUserId = null,
  postType,
  society,
  societyPostType,
  linkPreview,
  links,
  documents,
}: PostDetailClientProps) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => getDefaultCollapsedState({ type: 'post' }));
  const [commentPanelOpen, setCommentPanelOpen] = useState(false);
  const [commentCount, setCommentCount] = useState(0);
  const searchParams = useSearchParams();
  const { toast } = useToast();
  
  // Edit functionality state
  const [editMode, setEditMode] = useState(false);
  const [editContent, setEditContent] = useState(content);
  const [editLoading, setEditLoading] = useState(false);
  
  // Defensive checks for required props
  if (!id || !content || !creatorId || !creatorName || (postType === 'society' && (!society || !society.id))) {
    console.error('Missing required post data', { id, content, creatorId, creatorName, society });
    return <div className="text-red-500 p-8">Error: Missing required post data. Please try again later.</div>;
  }

  const router = useRouter();

  // Auto-open comment panel if arriving via comment intent
  useEffect(() => {
    const shouldOpenComments = searchParams.get('comments') === 'true';
    if (shouldOpenComments) {
      setCommentPanelOpen(true);
      // Clean up the URL parameter after opening
      const url = new URL(window.location.href);
      url.searchParams.delete('comments');
      window.history.replaceState({}, '', url.pathname);
    }
  }, [searchParams]);
  
  // Handle edit submit
  const handleEditSubmit = async () => {
    if (!editContent.trim()) {
      toast({
        title: "Missing Content",
        description: "Post content cannot be empty.",
        variant: "destructive",
      });
      return;
    }

    if (editContent === content) {
      setEditMode(false);
      return;
    }

    setEditLoading(true);
    try {
      const result = postType === 'society' 
        ? await updateSocietyPostContent(id, editContent)
        : await updateGeneralPostContent(id, editContent);
      if (result.success) {
        setEditMode(false);
        toast({
          title: "Post Updated!",
          description: "Your post has been updated successfully.",
        });
        // Refresh the page to show updated content
        router.refresh();
      } else {
        toast({
          title: "Update Failed",
          description: result.error || 'Failed to update post',
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error updating post:', error);
      toast({
        title: "Update Failed",
        description: "Could not update post. Please try again.",
        variant: "destructive",
      });
    } finally {
      setEditLoading(false);
    }
  };
  
  // Time-ago formatting
  const postTime = timestamp
    ? formatDistanceToNow(typeof timestamp === 'string' ? parseISO(timestamp) : timestamp, { addSuffix: true })
    : 'Just now';

  // Always use an array for media
  const safeMedia = Array.isArray(media) ? media : [];
  const hasVideo = safeMedia.length > 0 && (safeMedia[0].type === 'video' || isVideoFile(safeMedia[0].url));
  const hasAudio = safeMedia.length > 0 && (safeMedia[0].type === 'audio' || isAudioFile(safeMedia[0].url));
  const hasImage = safeMedia.length > 0 && safeMedia[0].type === 'image' && !isVideoFile(safeMedia[0].url) && !isAudioFile(safeMedia[0].url);
  const imageUrl = hasImage ? safeMedia[0].url : null;
  const videoUrl = hasVideo ? safeMedia[0].url : null;
  const audioUrl = hasAudio ? safeMedia[0].url : null;

  // Video controls state
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isVideoPlaying, setIsVideoPlaying] = useState(true);
  const [isVideoMuted, setIsVideoMuted] = useState(true);

  const handleVideoToggle = () => {
    if (!videoRef.current) return;
    if (videoRef.current.paused) {
      videoRef.current.play();
      setIsVideoPlaying(true);
    } else {
      videoRef.current.pause();
      setIsVideoPlaying(false);
    }
  };

  const handleMuteToggle = () => {
    setIsVideoMuted((prev) => {
      const newMuted = !prev;
      if (videoRef.current) {
        videoRef.current.muted = newMuted;
      }
      return newMuted;
    });
  };

  const handleFullscreen = () => {
    if (videoRef.current) {
      if (videoRef.current.requestFullscreen) {
        videoRef.current.requestFullscreen();
      } else if ((videoRef.current as any).webkitRequestFullscreen) {
        (videoRef.current as any).webkitRequestFullscreen();
      } else if ((videoRef.current as any).msRequestFullscreen) {
        (videoRef.current as any).msRequestFullscreen();
      }
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Sidebar - blurred when comment panel is open */}
      <div className={commentPanelOpen ? 'blur-sm pointer-events-none' : ''}>
        <AppSidebar 
          widgets={['userControls', 'navigation', 'suggestions', 'location', 'resources', 'footer']}
          context={{ type: 'post' }}
          onCollapseChange={setSidebarCollapsed}
        />
      </div>
      
      {/* Main Content - with dynamic left margin based on sidebar state and blur when comment panel open */}
      <div className={`transition-all duration-300 ${sidebarCollapsed ? 'lg:ml-16' : 'lg:ml-80 xl:ml-96'} ${commentPanelOpen ? 'blur-sm pointer-events-none' : ''}`}>
        {/* Back Button - positioned to avoid mobile sidebar toggle */}
        <div className="max-w-6xl mx-auto pt-6 lg:pt-2 px-2 flex items-start">
          <button
            className="flex items-center gap-1 text-muted-foreground hover:text-foreground text-sm px-2 py-1 rounded hover:bg-muted/40 transition shadow-none border-none bg-transparent ml-16 lg:ml-0"
            onClick={() => router.back()}
            type="button"
            aria-label="Back"
          >
            <ArrowLeft className="h-4 w-4" />
            <span className="hidden sm:inline">Back</span>
          </button>
        </div>
        {/* Main Content */}
        <div className="flex flex-col lg:flex-row max-w-4xl mx-auto py-4 px-2 gap-6 pb-20 lg:pb-4">
        {/* Main Post Content */}
        <div className="flex-1 min-w-0 max-w-3xl">
          <div className="bg-card rounded-xl shadow-lg border border-border overflow-hidden">
            {/* Author Header */}
            <div className="p-4 border-b border-border">
              <div className="flex flex-row items-center justify-between">
                <div className="flex flex-row items-center gap-2 md:gap-4">
                  <Link href={`/profile/${creatorId}`} className="flex flex-row items-center gap-2 hover:opacity-80 transition-opacity">
                    <Avatar className="w-10 h-10 md:w-12 md:h-12 ring-2 ring-border">
                      {creatorAvatar ? (
                        <AvatarImage src={creatorAvatar} alt={creatorName || 'User'} />
                      ) : (
                        <AvatarFallback className="bg-muted">{creatorName?.substring(0,2).toUpperCase() || '??'}</AvatarFallback>
                      )}
                    </Avatar>
                    <span className="font-semibold text-foreground text-base md:text-lg">{creatorName}</span>
                  </Link>
                </div>
                {/* Edit button - only show for post creator */}
                {currentUserId === creatorId && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setEditMode(!editMode)}
                    className="h-8 w-8 p-0"
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                )}
              </div>
              <div className="text-xs text-muted-foreground ml-12 mt-1 md:ml-0 md:mt-0 md:ml-2 md:block">{postTime}</div>
              {/* Desktop: Society badge + post type in header */}
              {postType === 'society' && society && (
                <div className="hidden md:flex flex-row items-center gap-2 mt-2 md:mt-0 md:ml-auto">
                  <Link href={`/societies/${society.id}`} className="flex flex-row items-center gap-2 px-2 py-1 rounded-full bg-blue-500 text-white hover:bg-blue-600 transition text-xs md:text-sm font-semibold">
                    <Avatar className="h-7 w-7 md:h-8 md:w-8">
                      {society.image ? (
                        <AvatarImage src={society.image} alt={society.name} />
                      ) : (
                        <AvatarFallback>{society.name?.[0]?.toUpperCase() || '?'}</AvatarFallback>
                      )}
                    </Avatar>
                    <span>{society.name}</span>
                  </Link>
                  {societyPostType && (
                    <span className="px-2 py-0.5 rounded bg-white/20 text-xs font-medium text-blue-900 bg-blue-100">{societyPostType}</span>
                  )}
                </div>
              )}
            </div>
            {/* Post Content */}
            <div className="px-4 py-2">
              {/* Media Content */}
              {videoUrl && (
                <div className="my-4">
                  <VideoPlayer 
                    src={videoUrl}
                    className="w-full max-h-[70vh] rounded-lg"
                    controls={true}
                    autoPlay={false}
                    muted={false}
                  />
                </div>
              )}
              {audioUrl && (
                <div className="my-4">
                  <AudioPlayer 
                    src={audioUrl}
                    className="w-full"
                  />
                </div>
              )}
              {imageUrl && (
                <div className="bg-muted relative w-full" style={{ maxHeight: '70vh' }}>
                  <Image 
                    src={imageUrl} 
                    alt="Post media" 
                    width={800}
                    height={600}
                    className="w-full h-auto max-h-[70vh] object-contain mx-auto"
                    priority
                  />
                </div>
              )}
              {/* Content - Edit or Display Mode */}
              {editMode ? (
                <div className="mt-2 space-y-3">
                  <Textarea
                    value={editContent}
                    onChange={(e) => setEditContent(e.target.value)}
                    className="min-h-[120px] resize-none"
                    placeholder="What's on your mind?"
                  />
                  <div className="flex gap-2">
                    <Button
                      onClick={handleEditSubmit}
                      disabled={editLoading}
                      size="sm"
                      className="bg-primary hover:bg-primary/90"
                    >
                      {editLoading ? (
                        <>
                          <Loader2 className="w-3 h-3 animate-spin mr-2" />
                          Saving...
                        </>
                      ) : (
                        <>
                          <Save className="w-3 h-3 mr-2" />
                          Save
                        </>
                      )}
                    </Button>
                    <Button
                      onClick={() => {
                        setEditMode(false);
                        setEditContent(content);
                      }}
                      variant="outline"
                      size="sm"
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="mt-2 text-foreground whitespace-pre-line">{content}</div>
              )}
              
              {/* Single link preview (backward compatibility) */}
              {linkPreview && !hasImage && !hasVideo && !hasAudio && (!links || links.length === 0) && (
                <div className="my-4">
                  <LinkPreview 
                    metadata={linkPreview}
                    className="w-full"
                  />
                </div>
              )}
              
              {/* Multiple links display */}
              {links && links.length > 0 && (
                <div className="my-2">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xs font-medium text-muted-foreground">
                      Links ({links.length})
                    </span>
                  </div>
                  <div 
                    className="flex gap-3 overflow-x-auto pb-2"
                    style={{ 
                      scrollbarWidth: 'thin',
                      scrollbarColor: 'rgba(155, 155, 155, 0.5) transparent'
                    }}
                  >
                    {links.map((postLink) => (
                      <div key={postLink.id} className="flex-shrink-0 w-80">
                        <LinkPreview 
                          metadata={postLink.linkPreview}
                          compact={true}
                          className="w-full"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Multiple documents display */}
              {documents && documents.length > 0 && (
                <div className="my-2">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xs font-medium text-muted-foreground">
                      Documents ({documents.length})
                    </span>
                  </div>
                  <div 
                    className="flex gap-3 overflow-x-auto pb-2"
                    style={{ 
                      scrollbarWidth: 'thin',
                      scrollbarColor: 'rgba(155, 155, 155, 0.5) transparent'
                    }}
                  >
                    {documents.map((postDocument) => (
                      <div key={postDocument.id} className="flex-shrink-0 w-80">
                        <DocumentPreview 
                          metadata={postDocument.document}
                          compact={true}
                          className="w-full"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Mobile: Society badge + post type below content */}
              {postType === 'society' && society && (
                <div className="flex md:hidden flex-row items-center gap-2 pt-2">
                  <Link href={`/societies/${society.id}`} className="flex flex-row items-center gap-2 px-2 py-1 rounded-full bg-blue-500 text-white hover:bg-blue-600 transition text-xs font-semibold">
                    <Avatar className="h-7 w-7">
                      {society.image ? (
                        <AvatarImage src={society.image} alt={society.name} />
                      ) : (
                        <AvatarFallback>{society.name?.[0]?.toUpperCase() || '?'}</AvatarFallback>
                      )}
                    </Avatar>
                    <span>{society.name}</span>
                  </Link>
                  {societyPostType && (
                    <span className="px-2 py-0.5 rounded bg-white/20 text-xs font-medium text-blue-900 bg-blue-100">{societyPostType}</span>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Side Panel: Reactions - Fixed bottom on mobile, fixed right on desktop */}
        <div className="fixed bottom-0 left-0 right-0 lg:fixed lg:bottom-auto lg:right-6 lg:top-1/2 lg:-translate-y-1/2 lg:left-auto lg:w-20 z-10">
          <div className="bg-card border-t lg:border lg:rounded-xl shadow-lg p-3 lg:p-4">
            <PostReactions 
              postId={id} 
              currentUserId={currentUserId} 
              postType={postType} 
              societyId={society?.id}
              societyPostType={societyPostType}
              onCommentClick={() => setCommentPanelOpen(true)}
            />
          </div>
        </div>
        </div>
      </div>

      {/* Sliding Comment Panel */}
      <CommentPanel
        postId={id}
        currentUserId={currentUserId}
        postType={postType}
        societyId={society?.id}
        isOpen={commentPanelOpen}
        onClose={() => setCommentPanelOpen(false)}
        onCommentUpdate={(newCount) => setCommentCount(newCount)}
      />
    </div>
  );
}