"use client";

import React, { useState, useRef, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Paperclip, Send, Palette, AlertCircle, MessageCircle, AlertTriangle, Lightbulb, ChevronDown } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { createGeneralPost } from '@/app/actions/postActions';
import { createIssue } from '@/app/actions/issueActions';
import { createIdea } from '@/app/actions/ideaActions';
import { useToast } from '@/hooks/use-toast';
import imageCompression from 'browser-image-compression';

// Define some background options
const backgroundOptions = [
  'linear-gradient(to right, #ff7e5f, #feb47b)', // Peach
  'linear-gradient(to right, #6a11cb, #2575fc)', // Purple/Blue
  'linear-gradient(to right, #00c6ff, #0072ff)', // Sky Blue
  'linear-gradient(to right, #f7971e, #ffd200)', // Orange/Yellow
  'linear-gradient(to right, #d38312, #a83279)', // Brown/Pink
  '#333333', // Dark Grey
];

// Mock user avatars matching main feed pattern
const mockUserAvatars: Record<string, string | undefined> = {
  "user1": "https://i.pravatar.cc/40?u=user1",
  "user3": "https://i.pravatar.cc/40?u=user3",
  "user5": "https://i.pravatar.cc/40?u=user5",
  "user7": "https://i.pravatar.cc/40?u=user7",
};

type PostType = 'general' | 'issue' | 'idea';

interface PostTypeConfig {
  label: string;
  icon: React.ReactNode;
  placeholder: string;
  titlePlaceholder: string;
  buttonText: string;
  background: string;
}

const postTypeConfigs: Record<PostType, PostTypeConfig> = {
  general: {
    label: 'General',
    icon: <MessageCircle className="h-4 w-4" />,
    placeholder: "What's happening?",
    titlePlaceholder: "What's on your mind?",
    buttonText: 'Post',
    background: backgroundOptions[1] // Purple/Blue gradient
  },
  issue: {
    label: 'Issue',
    icon: <AlertTriangle className="h-4 w-4" />,
    placeholder: "Describe the problem you've noticed...",
    titlePlaceholder: "What's the issue?",
    buttonText: 'Report Issue',
    background: 'linear-gradient(to right, #ff6b6b, #ee5a24)' // Red gradient
  },
  idea: {
    label: 'Idea',
    icon: <Lightbulb className="h-4 w-4" />,
    placeholder: "Share your solution or innovative idea...",
    titlePlaceholder: "What's your idea?",
    buttonText: 'Share Idea',
    background: 'linear-gradient(to right, #4ecdc4, #44a08d)' // Teal gradient
  }
};

interface CreatePostFormProps {
  onPostCreated: () => void;
  societyId?: string | null;
  context?: 'general' | 'society' | 'initiative';
}

export default function CreatePostForm({ onPostCreated, societyId, context = 'general' }: CreatePostFormProps) {
  const { data: session, status } = useSession();
  const { toast } = useToast();
  
  // Debug logging
  console.log('CreatePostForm - Session status:', status);
  console.log('CreatePostForm - Session data:', session);
  const [postType, setPostType] = useState<PostType>('general');
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedMedia, setSelectedMedia] = useState<File | null>(null);
  const [mediaPreview, setMediaPreview] = useState<string | null>(null);
  const [selectedBackground, setSelectedBackground] = useState<string>(postTypeConfigs.general.background);
  const [isTypeDropdownOpen, setIsTypeDropdownOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const currentUser = session?.user;
  const currentConfig = postTypeConfigs[postType];

  // Update background when post type changes
  useEffect(() => {
    if (!selectedMedia) {
      setSelectedBackground(currentConfig.background);
    }
  }, [postType, currentConfig.background, selectedMedia]);

  // Show loading state while session is loading
  if (status === "loading") {
    return (
      <Card className="mb-6 shadow-sm border-none bg-card/80 backdrop-blur overflow-hidden">
        <CardContent className="p-4 text-center text-muted-foreground">
          Loading...
        </CardContent>
      </Card>
    );
  }

  // Generate fallback initials matching main feed pattern
  const getInitials = (name?: string | null) => {
    if (!name) return "U";
    return name.substring(0, 2).toUpperCase();
  };

  // Get avatar URL with fallback pattern matching main feed
  const getAvatarUrl = (userId?: string, sessionImage?: string | null) => {
    return sessionImage || mockUserAvatars[userId || ''] || "https://i.pravatar.cc/40?u=anonymous";
  };

  const fallback = getInitials(currentUser?.name);

  // Compress media files if they're too large
  const compressFile = async (file: File): Promise<File | null> => {
    const maxSizeInMB = 25; // Vercel's effective limit for reliable uploads
    const fileSizeMB = file.size / 1024 / 1024;
    
    if (file.size <= maxSizeInMB * 1024 * 1024) {
      return file; // No compression needed
    }

    try {
      if (file.type.startsWith('image/')) {
        const options = {
          maxSizeMB: maxSizeInMB,
          maxWidthOrHeight: 1920,
          useWebWorker: true,
          fileType: file.type,
        };
        return await imageCompression(file, options);
      } else if (file.type.startsWith('video/')) {
        // For videos, we don't compress - they'll be handled in handleMediaChange
        return file;
      }
    } catch (error) {
      console.error('Compression failed:', error);
      toast({
        title: "Compression Failed",
        description: "Could not compress file. Please try a smaller file or compress manually.",
        variant: "destructive",
      });
      return null;
    }
    
    return file;
  };

  const createVideoThumbnail = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const video = document.createElement('video');
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      video.onloadedmetadata = () => {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        video.currentTime = 0.1; // Seek to 0.1 seconds
      };
      
      video.onseeked = () => {
        if (ctx) {
          ctx.drawImage(video, 0, 0);
          const thumbnail = canvas.toDataURL('image/jpeg', 0.8);
          resolve(thumbnail);
        } else {
          reject(new Error('Could not get canvas context'));
        }
        // Clean up
        URL.revokeObjectURL(video.src);
      };
      
      video.onerror = () => reject(new Error('Could not load video'));
      
      video.src = URL.createObjectURL(file);
      video.load();
    });
  };

  const handleMediaChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const fileSizeMB = file.size / 1024 / 1024;
      
      // For large videos (>25MB), create thumbnail instead of data URL
      if (file.type.startsWith('video/') && fileSizeMB > 25) {
        try {
          setSelectedMedia(file); // Keep original file for upload
          const thumbnail = await createVideoThumbnail(file);
          setMediaPreview(thumbnail); // Use thumbnail for preview
          setSelectedBackground('');
          toast({
            title: "Large Video Selected",
            description: `Video is ${Math.round(fileSizeMB)}MB. Showing thumbnail preview. Video will upload in full quality.`,
          });
        } catch (error) {
          console.error('Failed to create video thumbnail:', error);
          toast({
            title: "Preview Error",
            description: "Could not create video preview, but file is selected for upload.",
            variant: "destructive",
          });
          setSelectedMedia(file);
          setMediaPreview(null);
          setSelectedBackground('');
        }
        return;
      }
      
      // For smaller files, use existing compression logic
      const processedFile = await compressFile(file);
      
      if (processedFile) {
        setSelectedMedia(processedFile);
        
        // Create a preview URL
        const reader = new FileReader();
        reader.onloadend = () => {
          setMediaPreview(reader.result as string);
        };
        reader.readAsDataURL(processedFile);
        setSelectedBackground(''); // Clear background if media is selected
      } else {
        // Reset file input if compression failed
        if (event.target) {
          event.target.value = '';
        }
        setSelectedMedia(null);
        setMediaPreview(null);
      }
    } else {
      setSelectedMedia(null);
      setMediaPreview(null);
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation based on post type
    if (postType === 'general' && !content.trim()) return;
    if ((postType === 'issue' || postType === 'idea') && (!title.trim() || !content.trim())) return;
    
    if (isSubmitting) return;
    if (!currentUser?.id) {
      toast({
        title: "Error",
        description: "You must be logged in to create a post.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      // First, upload media files if any
      let uploadedMediaUrls: string[] = [];
      let uploadedMediaTypes: string[] = [];

      if (selectedMedia) {
        const uploadFormData = new FormData();
        uploadFormData.append('file', selectedMedia);
        
        try {
          const uploadResponse = await fetch('/api/upload', {
            method: 'POST',
            body: uploadFormData,
          });

          if (!uploadResponse.ok) {
            throw new Error(`Upload failed: ${uploadResponse.statusText}`);
          }

          const uploadResult = await uploadResponse.json();
          if (uploadResult.imageUrl) {
            uploadedMediaUrls.push(uploadResult.imageUrl);
            // Determine media type
            let mediaType = '';
            if (selectedMedia.type.startsWith('image/')) {
              mediaType = 'image';
            } else if (selectedMedia.type.startsWith('video/')) {
              mediaType = 'video';
            }
            uploadedMediaTypes.push(mediaType);
          }
        } catch (uploadError) {
          console.error('Media upload failed:', uploadError);
          toast({
            title: "Upload Error",
            description: "Failed to upload media. Please try again.",
            variant: "destructive",
          });
          setIsSubmitting(false);
          return;
        }
      }

      // Call appropriate creation function based on post type
      let result: any;
      
      if (postType === 'general') {
        // Create general post with existing logic
        const formData = new FormData();
        formData.append('content', content);

        if (uploadedMediaUrls.length > 0) {
          // Add uploaded media URLs and types
          uploadedMediaUrls.forEach((url, index) => {
            formData.append('mediaUrls', url);
            formData.append('mediaTypes', uploadedMediaTypes[index]);
          });
        } else if (selectedBackground) {
          // Only send formBackground if no media is selected
          formData.append('formBackground', selectedBackground);
        }

        result = await createGeneralPost(formData);
      } else {
        // Create issue or idea
        const createData = {
          title: title.trim(),
          description: content.trim(),
          tags: [], // Could be enhanced with tag input later
          location: null,
          mediaUrl: uploadedMediaUrls.length > 0 ? uploadedMediaUrls[0] : null,
          societyId: societyId || null,
        };
        
        console.log(`Creating ${postType} with data:`, createData);
        console.log('Title length:', title.trim().length);
        console.log('Description length:', content.trim().length);
        
        if (postType === 'issue') {
          result = await createIssue(createData);
        } else {
          result = await createIdea(createData);
        }
      }

      if (result.success && (result.post || result.issue || result.idea)) {
        // Reset form
        setTitle('');
        setContent('');
        setSelectedMedia(null);
        setMediaPreview(null);
        setSelectedBackground(currentConfig.background);
        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
        toast({
          title: "Success!",
          description: `Your ${postType} has been created.`,
        });
        onPostCreated(); // Callback to refresh the feed or show success
      } else {
        console.error(`Failed to create ${postType}:`, result.error);
        toast({
          title: `Error Creating ${currentConfig.label}`,
          description: result.error || "An unknown error occurred.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error submitting post:", error);
      toast({
        title: "Submission Error",
        description: "An unexpected error occurred while submitting your post.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!currentUser) {
    return (
      <Card className="mb-6 shadow-sm border-none bg-card/80 backdrop-blur overflow-hidden">
        <CardContent className="p-4 text-center text-muted-foreground">
          <AlertCircle className="mx-auto h-8 w-8 mb-2" />
          Please log in to create a post.
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="mb-6 shadow-sm border-none bg-card/80 backdrop-blur overflow-hidden">
      {/* Media Preview or Selected Background Preview */}
      <div className="h-32 relative flex items-center justify-center text-muted-foreground overflow-hidden">
        {selectedMedia && selectedMedia.type.startsWith('video/') && mediaPreview ? (
          // Video preview - check if it's a thumbnail (data:image) or actual video (data:video or blob)
          mediaPreview.startsWith('data:image') ? (
            // Thumbnail preview for large videos
            <div
              className="w-full h-full bg-cover bg-center relative"
              style={{ backgroundImage: `url(${mediaPreview})` }}
            >
              <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                <div className="bg-black/50 text-white px-2 py-1 rounded text-xs">
                  Video Preview
                </div>
              </div>
            </div>
          ) : (
            // Auto-playing video for smaller videos
            <video
              src={mediaPreview}
              className="w-full h-full object-cover"
              muted
              autoPlay
              loop
              playsInline
              preload="metadata"
              controls={false}
              style={{ display: 'block' }}
              onLoadedMetadata={(e) => {
                const video = e.target as HTMLVideoElement;
                video.play().catch(() => {
                  // Fallback if autoplay fails - show first frame
                  video.currentTime = 0.1;
                });
              }}
            />
          )
        ) : selectedMedia && selectedMedia.type.startsWith('image/') && mediaPreview ? (
          // Image preview
          <div
            className="w-full h-full bg-cover bg-center"
            style={{ backgroundImage: `url(${mediaPreview})` }}
          />
        ) : (
          // Color background when no media
          <div
            className="w-full h-full flex items-center justify-center"
            style={{ background: selectedBackground }}
          >
            <Palette className="w-8 h-8" />
          </div>
        )}
        {mediaPreview && <div className="absolute inset-0 bg-black/20"></div>} {/* Overlay */}
      </div>

      <CardContent className="p-4">
        <form onSubmit={handleSubmit}>

          <div className="flex items-start space-x-3">
            <Avatar className="h-10 w-10 mt-1">
              <AvatarImage 
                src={getAvatarUrl(currentUser?.id, currentUser?.image)} 
                alt={currentUser?.name || 'User'} 
              />
              <AvatarFallback>{fallback}</AvatarFallback>
            </Avatar>
            <div className="flex-1 space-y-3">
              {/* Title field for Issues and Ideas */}
              {(postType === 'issue' || postType === 'idea') && (
                <Input
                  placeholder={currentConfig.titlePlaceholder}
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="border-0 focus-visible:ring-0 focus-visible:ring-offset-0 bg-transparent text-lg font-medium placeholder:text-muted-foreground/70"
                />
              )}
              <Textarea
                placeholder={currentConfig.placeholder}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="resize-none border-0 focus-visible:ring-0 focus-visible:ring-offset-0 bg-transparent min-h-[80px] sm:min-h-[60px] placeholder:text-muted-foreground/70"
                rows={3}
              />
            </div>
          </div>
          <div className="flex justify-between items-center mt-3 pt-3 border-t border-border/50">
            <div className="flex items-center gap-2">
              {/* Hidden File Input */}
              <input
                type="file"
                accept="image/*,video/*"
                ref={fileInputRef}
                onChange={handleMediaChange}
                className="hidden"
              />
              {/* Attachment Button */}
              <Button variant="ghost" size="icon" type="button" onClick={triggerFileInput} className="text-muted-foreground hover:text-primary min-h-[44px] min-w-[44px]">
                <Paperclip className="h-5 w-5" />
                <span className="sr-only">Attach media</span>
              </Button>

              {/* Background Selector - Show only if no media selected */}
              {!selectedMedia && (
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="ghost" size="icon" type="button" className="text-muted-foreground hover:text-primary min-h-[44px] min-w-[44px]">
                      <Palette className="h-5 w-5" />
                      <span className="sr-only">Choose background</span>
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-2">
                    <div className="grid grid-cols-3 gap-2">
                      {backgroundOptions.map((bg) => (
                        <button
                          key={bg}
                          type="button"
                          className={`min-w-[44px] min-h-[44px] rounded border ${selectedBackground === bg ? 'ring-2 ring-primary ring-offset-2' : ''}`}
                          style={{ background: bg }}
                          onClick={() => setSelectedBackground(bg)}
                        />
                      ))}
                    </div>
                  </PopoverContent>
                </Popover>
              )}
              
              {/* Post Type Pill Selector */}
              <Popover open={isTypeDropdownOpen} onOpenChange={setIsTypeDropdownOpen}>
                <PopoverTrigger asChild>
                  <Button 
                    variant="secondary" 
                    size="sm" 
                    type="button" 
                    className="flex items-center gap-1.5 px-3 py-1.5 h-8 bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20 rounded-full"
                  >
                    {currentConfig.icon}
                    <span className="text-sm font-medium">{currentConfig.label}</span>
                    <ChevronDown className="h-3 w-3" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-48 p-2" align="start">
                  <div className="space-y-1">
                    {Object.entries(postTypeConfigs).map(([type, config]) => (
                      <button
                        key={type}
                        type="button"
                        onClick={() => {
                          setPostType(type as PostType);
                          setIsTypeDropdownOpen(false);
                        }}
                        className={`w-full flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors text-left ${
                          postType === type 
                            ? 'bg-primary/10 text-primary' 
                            : 'text-muted-foreground hover:text-foreground hover:bg-accent'
                        }`}
                      >
                        {config.icon}
                        {config.label}
                      </button>
                    ))}
                  </div>
                </PopoverContent>
              </Popover>
            </div>

            <Button 
              type="submit" 
              disabled={
                isSubmitting || 
                (postType === 'general' && !content.trim()) ||
                ((postType === 'issue' || postType === 'idea') && (!title.trim() || !content.trim()))
              } 
              size="sm" 
              className="min-h-[44px] px-4"
            >
              {isSubmitting ? `${currentConfig.buttonText}ing...` : <>{currentConfig.buttonText} <Send className="ml-1 h-4 w-4" /></>}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
