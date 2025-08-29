"use client";
import { formatDistanceToNow, parseISO } from 'date-fns';
import Link from 'next/link';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import PostSocialPanel from '@/components/PostSocialPanel';
import React, { useRef, useState } from 'react';
import { Pause, Play, Maximize2, ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { VideoPlayer } from '@/components/ui/video-player';
import { AudioPlayer } from '@/components/ui/audio-player';
import { LinkPreview } from '@/components/ui/link-preview';
import { DocumentPreview } from '@/components/ui/document-preview';

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
  // Defensive checks for required props
  if (!id || !content || !creatorId || !creatorName || (postType === 'society' && (!society || !society.id))) {
    console.error('Missing required post data', { id, content, creatorId, creatorName, society });
    return <div className="text-red-500 p-8">Error: Missing required post data. Please try again later.</div>;
  }

  const router = useRouter();
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
      {/* Back Button - minimal, top left, small */}
      <div className="max-w-6xl mx-auto pt-2 px-2 flex items-start">
        <button
          className="flex items-center gap-1 text-muted-foreground hover:text-foreground text-sm px-2 py-1 rounded hover:bg-muted/40 transition shadow-none border-none bg-transparent"
          onClick={() => router.back()}
          type="button"
          aria-label="Back"
        >
          <ArrowLeft className="h-4 w-4" />
          <span className="hidden sm:inline">Back</span>
        </button>
      </div>
      {/* Main Content */}
      <div className="flex flex-col lg:flex-row max-w-6xl mx-auto py-4 px-2 gap-6">
        {/* Main Post Content */}
        <div className="flex-1 min-w-0">
          <div className="bg-card rounded-xl shadow-lg border border-border overflow-hidden">
            {/* Author Header */}
            <div className="p-4 border-b border-border">
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
                <div className="bg-muted">
                  <img 
                    src={imageUrl} 
                    alt="Post media" 
                    className="w-full h-auto max-h-[70vh] object-contain mx-auto"
                  />
                </div>
              )}
              <div className="mt-2 text-foreground whitespace-pre-line">{content}</div>
              
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
              {links && links.length > 0 && !hasImage && !hasVideo && !hasAudio && (!documents || documents.length === 0) && (
                <div className="my-4">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-sm font-medium text-muted-foreground">
                      Links ({links.length})
                    </span>
                  </div>
                  <div 
                    className="flex gap-4 overflow-x-auto pb-2" 
                    style={{ 
                      scrollbarWidth: 'thin',
                      scrollbarColor: 'rgba(155, 155, 155, 0.5) transparent'
                    }}
                  >
                    {links.map((postLink) => (
                      <div key={postLink.id} className="flex-shrink-0 w-96">
                        <LinkPreview 
                          metadata={postLink.linkPreview}
                          className="w-full"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Multiple documents display */}
              {documents && documents.length > 0 && !hasImage && !hasVideo && !hasAudio && (
                <div className="my-4">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-sm font-medium text-muted-foreground">
                      Documents ({documents.length})
                    </span>
                  </div>
                  <div 
                    className="flex gap-4 overflow-x-auto pb-2" 
                    style={{ 
                      scrollbarWidth: 'thin',
                      scrollbarColor: 'rgba(155, 155, 155, 0.5) transparent'
                    }}
                  >
                    {documents.map((postDocument) => (
                      <div key={postDocument.id} className="flex-shrink-0 w-96">
                        <DocumentPreview 
                          metadata={postDocument.document}
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

        {/* Side Panel: Comments + Social Actions */}
        <div className="w-full lg:w-[380px] lg:flex-shrink-0">
          <div className="bg-card rounded-xl shadow-lg border border-border sticky top-6">
            <PostSocialPanel postId={id} currentUserId={currentUserId} postType={postType} societyId={society?.id} />
          </div>
        </div>
      </div>
    </div>
  );
}