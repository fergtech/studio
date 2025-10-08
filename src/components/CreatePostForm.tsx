"use client";

import React, { useState, useRef, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Paperclip, Send, Palette, AlertCircle, MessageCircle, AlertTriangle, Lightbulb, ChevronDown, Globe, MapPin, Users } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { createGeneralPost } from '@/app/actions/postActions';
import { createIssue } from '@/app/actions/issueActions';
import { createIdea } from '@/app/actions/ideaActions';
import { useToast } from '@/hooks/use-toast';
import imageCompression from 'browser-image-compression';
import { ResolvedLocation } from '@/services/location';
import { extractHashtags, mergeHashtagsWithTopics, analyzeContent } from '@/utils/hashtagUtils';

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

type LocationScope = 'user' | 'global' | 'custom';

interface LocationOption {
  scope: LocationScope;
  label: string;
  description: string;
  icon: React.ReactNode;
}

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
  onPostCreated?: () => void;
  onSuccess?: () => void;
  societyId?: string | null;
  context?: 'general' | 'society' | 'initiative';
  battleContext?: {
    battleId: string;
    battleTitle?: string;
  };
  initialTopic?: string | null;
}

export default function CreatePostForm({ onPostCreated, onSuccess, societyId, context = 'general', battleContext, initialTopic }: CreatePostFormProps) {
  const { data: session, status } = useSession();
  const { toast } = useToast();

  // Collapsible state - starts collapsed
  const [isExpanded, setIsExpanded] = useState(false);
  
  // Location configuration
  const locationOptions: LocationOption[] = [
    {
      scope: 'user',
      label: 'My Location',
      description: 'Share to your area',
      icon: <MapPin className="h-4 w-4" />
    },
    {
      scope: 'global',
      label: 'Everywhere',
      description: 'Share globally',
      icon: <Globe className="h-4 w-4" />
    },
    {
      scope: 'custom',
      label: 'Other Location',
      description: 'Pick different area',
      icon: <Users className="h-4 w-4" />
    }
  ];
  
  // State for user location data
  const [userLocation, setUserLocation] = useState<ResolvedLocation | null>(null);
  
  // Fetch user's location data
  useEffect(() => {
    const fetchUserLocation = async () => {
      if (session?.user?.id) {
        try {
          const response = await fetch('/api/auth/me');
          if (response.ok) {
            const userData = await response.json();
            if (userData.location) {
              const parsedLocation: ResolvedLocation = JSON.parse(userData.location);
              setUserLocation(parsedLocation);
            }
          }
        } catch (error) {
          console.error('Failed to fetch user location:', error);
        }
      }
    };
    
    fetchUserLocation();
  }, [session?.user?.id]);
  
  // Get effective location for post creation
  const getEffectiveLocation = (): string | null => {
    switch (selectedLocation) {
      case 'user':
        return userLocation ? userLocation.displayName : null;
      case 'custom':
        return customLocation ? customLocation.displayName : null;
      case 'global':
      default:
        return null;
    }
  };
  
  const [postType, setPostType] = useState<PostType>('general');
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedMedia, setSelectedMedia] = useState<File | null>(null);
  const [mediaPreview, setMediaPreview] = useState<string | null>(null);
  const [selectedBackground, setSelectedBackground] = useState<string>(postTypeConfigs.general.background);
  const [isTypeDropdownOpen, setIsTypeDropdownOpen] = useState(false);
  const [isLocationDropdownOpen, setIsLocationDropdownOpen] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<LocationScope>('user');
  const [customLocation, setCustomLocation] = useState<ResolvedLocation | null>(null);
  const [topics, setTopics] = useState<string[]>([]);
  const [topicInput, setTopicInput] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Auto-detect hashtags from content and merge with topics
  // Only runs when user hits space or enters new line
  const updateTopicsFromContent = (content: string, title: string = '') => {
    const combinedText = `${title} ${content}`;
    const detectedHashtags = extractHashtags(combinedText);

    if (detectedHashtags.length > 0) {
      setTopics(prevTopics => {
        const mergedTopics = mergeHashtagsWithTopics(prevTopics, detectedHashtags);
        return mergedTopics.slice(0, 5); // Limit to 5 topics
      });
    }
  };

  // Detect hashtags only when user hits space or Enter
  const handleKeyPress = (e: React.KeyboardEvent, fieldContent: string, isTitle: boolean = false) => {
    if (e.key === ' ' || e.key === 'Enter') {
      if (isTitle) {
        updateTopicsFromContent(content, fieldContent);
      } else {
        updateTopicsFromContent(fieldContent, title);
      }
    }
  };

  // Check for topic URL parameter or initialTopic prop and pre-fill
  useEffect(() => {
    const topicsToAdd: string[] = [];

    // Handle initialTopic prop first
    if (initialTopic && !topics.includes(initialTopic)) {
      topicsToAdd.push(initialTopic);
    }

    // Handle URL parameter for home page usage (only if no initialTopic)
    if (!initialTopic && typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const topicParam = urlParams.get('topic');
      if (topicParam && !topics.includes(topicParam) && !topicsToAdd.includes(topicParam)) {
        topicsToAdd.push(topicParam);
        // Clear the URL parameter after using it
        const url = new URL(window.location.href);
        url.searchParams.delete('topic');
        window.history.replaceState({}, '', url.pathname);
      }
    }

    // Add all new topics at once
    if (topicsToAdd.length > 0) {
      setTopics(prev => {
        const newTopics = [...prev];
        topicsToAdd.forEach(topic => {
          if (!newTopics.includes(topic)) {
            newTopics.push(topic);
          }
        });
        return newTopics;
      });
    }
  }, [initialTopic]);

  // Get current location option
  const currentLocationOption = locationOptions.find(opt => opt.scope === selectedLocation) || locationOptions[0];

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
    // Vercel has a 4.5MB limit for API route request bodies in production
    // We'll target 4MB to be safe, with aggressive compression for larger files
    const maxSizeInMB = 4;
    const fileSizeMB = file.size / 1024 / 1024;

    console.log(`[compressFile] Original file size: ${fileSizeMB.toFixed(2)}MB`);

    try {
      if (file.type.startsWith('image/')) {
        // Always compress images to ensure they're under the limit
        const options = {
          maxSizeMB: maxSizeInMB,
          maxWidthOrHeight: fileSizeMB > 10 ? 1280 : 1920, // Smaller dimensions for very large files
          useWebWorker: true,
          fileType: 'image/webp', // Force WebP for better compression
          quality: fileSizeMB > 10 ? 0.7 : 0.85, // More aggressive compression for large files
          initialQuality: fileSizeMB > 10 ? 0.7 : 0.85,
        };
        console.log(`[compressFile] Compressing image with options:`, options);
        const compressed = await imageCompression(file, options);
        const compressedSizeMB = compressed.size / 1024 / 1024;
        console.log(`[compressFile] Compressed size: ${compressedSizeMB.toFixed(2)}MB`);

        if (compressed.size > maxSizeInMB * 1024 * 1024) {
          toast({
            title: "File Too Large",
            description: `Image is still ${compressedSizeMB.toFixed(1)}MB after compression. Please use a smaller image (max 4MB).`,
            variant: "destructive",
          });
          return null;
        }

        return compressed;
      } else if (file.type.startsWith('video/')) {
        // Videos can't be compressed client-side effectively
        if (fileSizeMB > maxSizeInMB) {
          toast({
            title: "Video Too Large",
            description: `Video is ${fileSizeMB.toFixed(1)}MB. Please compress it to under 4MB before uploading.`,
            variant: "destructive",
          });
          return null;
        }
        return file;
      }
    } catch (error) {
      console.error('[compressFile] Compression failed:', error);
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
          const thumbnail = canvas.toDataURL('image/webp', 0.85);
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

  const handleTopicInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',' || e.key === ' ') {
      e.preventDefault();
      addTopic();
    }
  };

  const addTopic = () => {
    const topic = topicInput.trim().toLowerCase().replace(/^#/, ''); // Remove # prefix if exists
    if (topic && !topics.includes(topic) && topics.length < 5) { // Limit to 5 topics
      setTopics([...topics, topic]);
      setTopicInput('');
    }
  };

  const removeTopic = (topicToRemove: string) => {
    setTopics(topics.filter(topic => topic !== topicToRemove));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    console.log('[CreatePostForm] handleSubmit called', { postType, contentLength: content.length, titleLength: title.length });

    // Validation based on post type
    if (postType === 'general' && !content.trim()) {
      console.log('[CreatePostForm] Validation failed: empty content for general post');
      return;
    }
    if ((postType === 'issue' || postType === 'idea') && (!title.trim() || !content.trim())) {
      console.log('[CreatePostForm] Validation failed: empty title or content for issue/idea');
      return;
    }

    if (isSubmitting) {
      console.log('[CreatePostForm] Already submitting, ignoring');
      return;
    }

    if (!currentUser?.id) {
      console.error('[CreatePostForm] No user ID found');
      toast({
        title: "Error",
        description: "You must be logged in to create a post.",
        variant: "destructive",
      });
      return;
    }

    console.log('[CreatePostForm] Starting submission...', { userId: currentUser.id });
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

        // Add topics to form data
        topics.forEach(topic => {
          formData.append('topics', topic);
        });

        // Add battle context if provided
        if (battleContext) {
          formData.append('relatedBattleId', battleContext.battleId);
          if (battleContext.battleTitle) {
            formData.append('battleTitle', battleContext.battleTitle);
          }
        }

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

        console.log('[CreatePostForm] Calling createGeneralPost with formData');
        result = await createGeneralPost(formData);
        console.log('[CreatePostForm] createGeneralPost result:', result);
      } else {
        // Create issue or idea
        const createData = {
          title: title.trim(),
          description: content.trim(),
          tags: [], // Could be enhanced with tag input later
          location: getEffectiveLocation(),
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
        setTopics([]);
        setTopicInput('');
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
        // Call the appropriate callback
        onPostCreated?.(); // Legacy callback for existing uses
        onSuccess?.(); // New callback for modal/battle context
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
              {/* Battle Context Indicator */}
              {battleContext && (
                <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 mb-3">
                  <div className="flex items-center gap-2 text-orange-700">
                    <span className="text-lg">🔥</span>
                    <span className="font-medium text-sm">Adding your take to a Hot Take Battle</span>
                  </div>
                  {battleContext.battleTitle && (
                    <p className="text-orange-600 text-sm mt-1">
                      Responding to: <span className="font-medium">{battleContext.battleTitle}</span>
                    </p>
                  )}
                </div>
              )}
              {/* Title field for Issues and Ideas */}
              {(postType === 'issue' || postType === 'idea') && (
                <Input
                  placeholder={currentConfig.titlePlaceholder}
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  onKeyDown={(e) => handleKeyPress(e, e.currentTarget.value, true)}
                  className="border-0 focus-visible:ring-0 focus-visible:ring-offset-0 bg-transparent text-lg font-medium placeholder:text-muted-foreground/70"
                />
              )}
              <Textarea
                placeholder={battleContext ? "Share your unique perspective on this Hot Take Battle..." : currentConfig.placeholder}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                onKeyDown={(e) => handleKeyPress(e, e.currentTarget.value, false)}
                className="resize-none border-0 focus-visible:ring-0 focus-visible:ring-offset-0 bg-transparent min-h-[80px] sm:min-h-[60px] placeholder:text-muted-foreground/70"
                rows={3}
              />

              {/* Topics Input */}
              <div className="space-y-2">
                {/* Display selected topics */}
                {topics.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {topics.map((topic, index) => (
                      <span
                        key={`${topic}-${index}`}
                        className="inline-flex items-center gap-1 px-2 py-1 bg-primary/10 text-primary rounded-full text-xs font-medium"
                      >
                        #{topic}
                        <button
                          type="button"
                          onClick={() => removeTopic(topic)}
                          className="hover:text-primary/70 ml-1"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                )}

                {/* Topic input field */}
                <Input
                  placeholder="Add topics (#housing, #climate, #education...)"
                  value={topicInput}
                  onChange={(e) => setTopicInput(e.target.value)}
                  onKeyDown={handleTopicInputKeyDown}
                  onBlur={addTopic}
                  className="border-0 focus-visible:ring-0 focus-visible:ring-offset-0 bg-transparent text-sm placeholder:text-muted-foreground/60"
                  disabled={topics.length >= 5}
                />
                {topics.length >= 5 && (
                  <p className="text-xs text-muted-foreground/60">Maximum 5 topics</p>
                )}
              </div>
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

              {/* Location Selector */}
              <Popover open={isLocationDropdownOpen} onOpenChange={setIsLocationDropdownOpen}>
                <PopoverTrigger asChild>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    type="button" 
                    className="text-muted-foreground hover:text-primary min-h-[44px] min-w-[44px] relative"
                    title={`Sharing to: ${currentLocationOption.label}`}
                  >
                    {currentLocationOption.icon}
                    {selectedLocation === 'user' && !userLocation && (
                      <div className="absolute -top-1 -right-1 w-3 h-3 bg-orange-500 rounded-full flex items-center justify-center">
                        <AlertCircle className="h-2 w-2 text-white" />
                      </div>
                    )}
                    <span className="sr-only">Choose location</span>
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-64 p-3" align="center">
                  <div className="space-y-2">
                    <h4 className="font-medium text-sm mb-3">Share Location</h4>
                    {locationOptions.map((option) => (
                      <button
                        key={option.scope}
                        type="button"
                        onClick={() => {
                          setSelectedLocation(option.scope);
                          setIsLocationDropdownOpen(false);
                        }}
                        disabled={option.scope === 'user' && !userLocation}
                        className={`w-full flex items-start gap-3 px-3 py-2 rounded-md text-sm transition-colors text-left disabled:opacity-50 disabled:cursor-not-allowed ${
                          selectedLocation === option.scope 
                            ? 'bg-primary/10 text-primary border border-primary/20' 
                            : 'text-muted-foreground hover:text-foreground hover:bg-accent'
                        }`}
                      >
                        <div className="mt-0.5">{option.icon}</div>
                        <div className="flex-1 min-w-0">
                          <div className="font-medium">{option.label}</div>
                          <div className="text-xs opacity-70">{option.description}</div>
                          {option.scope === 'user' && userLocation && (
                            <div className="text-xs mt-1 opacity-60">{userLocation.displayName}</div>
                          )}
                          {option.scope === 'user' && !userLocation && (
                            <div className="text-xs mt-1 text-orange-600">Set location in profile</div>
                          )}
                        </div>
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
              {isSubmitting ?
                (battleContext ? "Adding Take..." : `${currentConfig.buttonText}ing...`) :
                <>{battleContext ? "🔥 Add Your Take" : currentConfig.buttonText} <Send className="ml-1 h-4 w-4" /></>
              }
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
