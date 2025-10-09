"use client";

import React, { useState, useEffect, useRef } from 'react';
import { formatDistanceToNow } from 'date-fns';
import Link from 'next/link';
import Image from 'next/image';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { ArrowLeft, PlusCircle, AlertTriangle, Edit, Save, Loader2, Paperclip, X, Upload } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { Textarea } from '@/components/ui/textarea';
import imageCompression from 'browser-image-compression';
import AppSidebar, { getDefaultCollapsedState } from '@/components/AppSidebar';
import CommentPanel from '@/components/CommentPanel';
import IssueReactions from '@/components/IssueReactions';
import { useModal } from '@/context/ModalContext';

// Helper function to parse and display location data
const getLocationDisplay = (location: string | null | undefined): string | null => {
  if (!location) return null;
  try {
    const parsed = JSON.parse(location);
    if (parsed.name) return parsed.name;
    if (parsed.address) return parsed.address;
    return null;
  } catch {
    // If not JSON, return as-is (plain text location)
    return location;
  }
};

interface MediaItem {
  type: string;
  url: string;
}

interface Creator {
  id: string;
  name: string | null;
  image: string | null;
}

interface Society {
  id: string;
  name: string;
  image: string | null;
}

interface IssueData {
  id: string;
  title: string;
  description: string;
  creatorId: string;
  creator: Creator;
  media: MediaItem[];
  createdAt: Date;
  tags: string[];
  location: string | null;
  society: Society | null;
  championCount: number;
  championedById: string | null;
}

interface IssueClientProps {
  issue: IssueData;
  currentUserId: string | null;
  initiallyChampioned: boolean;
}

export default function IssueClient({ issue, currentUserId, initiallyChampioned }: IssueClientProps) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => getDefaultCollapsedState({ type: 'issue' }));
  const [championCount, setChampionCount] = useState(issue.championCount);
  const [isChampioned, setIsChampioned] = useState(initiallyChampioned);
  const [isChampioning, setIsChampioning] = useState(false);
  const [commentPanelOpen, setCommentPanelOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [editTitle, setEditTitle] = useState(issue.title);
  const [editDescription, setEditDescription] = useState(issue.description);
  const [editLoading, setEditLoading] = useState(false);
  const [selectedMedia, setSelectedMedia] = useState<File | null>(null);
  const [mediaPreview, setMediaPreview] = useState<string | null>(null);
  const [removeExistingMedia, setRemoveExistingMedia] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const { openCreateInitiativeModal } = useModal();
  const { toast } = useToast();

  const fallback = issue.creator?.name?.substring(0, 2).toUpperCase() || '??';
  const issueTime = formatDistanceToNow(issue.createdAt, { addSuffix: true });
  
  const hasMedia = issue.media && issue.media.length > 0;
  const isImage = hasMedia && issue.media[0].type === 'image';

  const handleChampion = async () => {
    if (!currentUserId) return;
    
    setIsChampioning(true);
    try {
      const response = await fetch(`/api/issues/${issue.id}/champion`, {
        method: isChampioned ? 'DELETE' : 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId: currentUserId }),
      });

      if (response.ok) {
        const data = await response.json();
        setChampionCount(data.championCount);
        setIsChampioned(!isChampioned);
      }
    } catch (error) {
      console.error('Error championing issue:', error);
    } finally {
      setIsChampioning(false);
    }
  };

  const handleCreateInitiative = () => {
    const imageUrl = hasMedia ? issue.media[0].url : undefined;
    openCreateInitiativeModal(issue.title, issue.description, imageUrl, issue.id, undefined);
  };

  // Media handling functions
  const compressFile = async (file: File): Promise<File | null> => {
    const maxSizeInMB = 25;

    if (file.size <= maxSizeInMB * 1024 * 1024) {
      return file;
    }

    try {
      if (file.type.startsWith('image/')) {
        const options = {
          maxSizeMB: maxSizeInMB,
          maxWidthOrHeight: 1920,
          useWebWorker: true,
          fileType: 'image/webp',
          quality: 0.85,
          initialQuality: 0.85,
        };
        return await imageCompression(file, options);
      }
      return file;
    } catch (error) {
      console.error('Compression failed:', error);
      toast({
        title: "Compression Failed",
        description: "Could not compress file. Please try a smaller file.",
        variant: "destructive",
      });
      return null;
    }
  };

  const handleMediaChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const processedFile = await compressFile(file);

      if (processedFile) {
        setSelectedMedia(processedFile);

        const reader = new FileReader();
        reader.onloadend = () => {
          setMediaPreview(reader.result as string);
        };
        reader.readAsDataURL(processedFile);
        setRemoveExistingMedia(false);
      } else {
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

  const removeMedia = () => {
    setSelectedMedia(null);
    setMediaPreview(null);
    setRemoveExistingMedia(true);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleEditSubmit = async () => {
    if (!editTitle.trim() || !editDescription.trim()) {
      toast({
        title: "Missing Content",
        description: "Title and description cannot be empty.",
        variant: "destructive",
      });
      return;
    }

    const hasChanges = editTitle !== issue.title ||
                      editDescription !== issue.description ||
                      selectedMedia !== null ||
                      removeExistingMedia;

    if (!hasChanges) {
      setEditMode(false);
      return;
    }

    setEditLoading(true);
    try {
      let uploadedMediaUrl: string | null = null;

      // Handle media upload if there's a new file
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
            uploadedMediaUrl = uploadResult.imageUrl;
          }
        } catch (uploadError) {
          console.error('Media upload failed:', uploadError);
          toast({
            title: "Upload Error",
            description: "Failed to upload media. Please try again.",
            variant: "destructive",
          });
          setEditLoading(false);
          return;
        }
      }

      // Update the issue
      const updateData: any = {
        title: editTitle,
        description: editDescription,
      };

      // Handle media changes
      if (removeExistingMedia && !selectedMedia) {
        updateData.mediaUrl = null;
      } else if (uploadedMediaUrl) {
        updateData.mediaUrl = uploadedMediaUrl;
      }

      const response = await fetch(`/api/issues/${issue.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData),
      });

      if (response.ok) {
        setEditMode(false);
        setSelectedMedia(null);
        setMediaPreview(null);
        setRemoveExistingMedia(false);
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
        toast({
          title: "Issue Updated!",
          description: "Your issue has been updated successfully.",
        });
        router.refresh();
      } else {
        toast({
          title: "Update Failed",
          description: "Failed to update your issue. Please try again.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error updating issue:', error);
      toast({
        title: "Update Failed",
        description: "Failed to update your issue. Please try again.",
        variant: "destructive",
      });
    } finally {
      setEditLoading(false);
    }
  };

  return (
    <div className="w-full min-w-0 overflow-hidden">
      <AppSidebar 
        widgets={['userControls', 'navigation', 'resources', 'footer']}
        context={{ type: 'issue' }}
        onCollapseChange={setSidebarCollapsed}
      />
      <div className={`transition-all duration-300 px-4 lg:px-6 ${
        sidebarCollapsed ? 'lg:ml-16' : 'lg:ml-80 xl:ml-96'
      }`}>
        <div className="max-w-4xl mx-auto py-6">
          {/* Header with close button and type indicator on right */}
          <div className="flex items-center justify-end gap-4 mb-6">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-500" />
              <span className="text-sm font-medium text-muted-foreground">Issue</span>
            </div>
            <Button variant="ghost" size="icon" onClick={() => router.push('/')}>
              <X className="h-5 w-5" />
            </Button>
          </div>

          <div className="flex flex-col lg:flex-row gap-6 lg:gap-8">
            {/* Main content */}
            <div className="flex-1 space-y-6 pb-20 lg:pb-0">
              {/* Issue header */}
              <div className="space-y-4">
                {editMode ? (
                  <div className="space-y-3">
                    <Textarea
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      className="text-3xl font-bold border-none p-0 resize-none min-h-[3rem] bg-transparent"
                      placeholder="Issue title..."
                      style={{ fontSize: '1.875rem', lineHeight: '2.25rem' }}
                    />
                  </div>
                ) : (
                  <h1 className="text-3xl font-bold">{issue.title}</h1>
                )}
                
                {/* Creator info */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Link href={`/profile/${issue.creator.id}`} className="flex items-center gap-3 hover:opacity-80 transition-opacity">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={issue.creator.image || undefined} alt={issue.creator.name || undefined} />
                        <AvatarFallback>{fallback}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">{issue.creator.name}</p>
                        <p className="text-sm text-muted-foreground">{issueTime}</p>
                      </div>
                    </Link>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    {/* Edit button - only show for issue creator */}
                    {currentUserId === issue.creatorId && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setEditMode(!editMode)}
                        className="h-8 w-8 p-0"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                    )}
                    
                    {issue.society && (
                      <Link href={`/societies/${issue.society.id}`} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
                        <Avatar className="h-6 w-6">
                          <AvatarImage src={issue.society.image || undefined} alt={issue.society.name} />
                          <AvatarFallback>{issue.society.name.substring(0, 2).toUpperCase()}</AvatarFallback>
                        </Avatar>
                        {issue.society.name}
                      </Link>
                    )}
                  </div>
                </div>
              </div>

              {/* Media */}
              {hasMedia && isImage && (
                <div className="rounded-lg overflow-hidden relative">
                  <Image 
                    src={issue.media[0].url} 
                    alt="Issue image"
                    width={600}
                    height={384}
                    className="w-full h-auto max-h-96 object-cover"
                    priority
                  />
                </div>
              )}

              {/* Description */}
              <div className="bg-card rounded-lg p-6">
                {editMode ? (
                  <div className="space-y-4">
                    <Textarea
                      value={editDescription}
                      onChange={(e) => setEditDescription(e.target.value)}
                      className="min-h-[200px] resize-none border-none bg-transparent p-0 text-base"
                      placeholder="Describe the issue in detail..."
                    />

                    {/* Media Editing Section */}
                    <div className="space-y-3 pt-4 border-t">
                      <h4 className="text-sm font-medium text-muted-foreground">Media</h4>

                      {/* Current media or preview */}
                      {mediaPreview ? (
                        <div className="relative rounded-lg overflow-hidden">
                          <Image
                            src={mediaPreview}
                            alt="Media preview"
                            width={400}
                            height={250}
                            className="w-full h-auto max-h-64 object-cover"
                          />
                          <Button
                            onClick={removeMedia}
                            variant="destructive"
                            size="sm"
                            className="absolute top-2 right-2"
                          >
                            <X className="w-3 h-3" />
                          </Button>
                        </div>
                      ) : hasMedia && !removeExistingMedia ? (
                        <div className="relative rounded-lg overflow-hidden">
                          <Image
                            src={issue.media[0].url}
                            alt="Current media"
                            width={400}
                            height={250}
                            className="w-full h-auto max-h-64 object-cover"
                          />
                          <Button
                            onClick={removeMedia}
                            variant="destructive"
                            size="sm"
                            className="absolute top-2 right-2"
                          >
                            <X className="w-3 h-3" />
                          </Button>
                        </div>
                      ) : (
                        <div className="border-2 border-dashed border-muted-foreground/20 rounded-lg p-8 text-center">
                          <Upload className="w-8 h-8 mx-auto mb-2 text-muted-foreground/40" />
                          <p className="text-sm text-muted-foreground mb-3">
                            {hasMedia && removeExistingMedia ? 'Media will be removed' : 'No media selected'}
                          </p>
                          <Button
                            onClick={triggerFileInput}
                            variant="outline"
                            size="sm"
                            className="flex items-center gap-2"
                          >
                            <Paperclip className="w-3 h-3" />
                            Choose File
                          </Button>
                        </div>
                      )}

                      {/* File input */}
                      <input
                        type="file"
                        accept="image/*,video/*"
                        ref={fileInputRef}
                        onChange={handleMediaChange}
                        className="hidden"
                      />

                      {/* Upload new media button */}
                      {!mediaPreview && !(hasMedia && !removeExistingMedia) && (
                        <Button
                          onClick={triggerFileInput}
                          variant="outline"
                          size="sm"
                          className="w-full flex items-center gap-2"
                        >
                          <Paperclip className="w-3 h-3" />
                          Add Media
                        </Button>
                      )}
                    </div>

                    <div className="flex gap-2 pt-4 border-t">
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
                          setEditTitle(issue.title);
                          setEditDescription(issue.description);
                          setSelectedMedia(null);
                          setMediaPreview(null);
                          setRemoveExistingMedia(false);
                          if (fileInputRef.current) {
                            fileInputRef.current.value = '';
                          }
                        }}
                        variant="outline"
                        size="sm"
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <p className="text-base leading-relaxed whitespace-pre-wrap">{issue.description}</p>
                )}
              </div>

              {/* Tags */}
              {issue.tags && issue.tags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {issue.tags.map((tag, index) => (
                    <span key={index} className="px-2 py-1 bg-primary/10 text-primary text-sm rounded-md">
                      #{tag}
                    </span>
                  ))}
                </div>
              )}

              {/* Location */}
              {getLocationDisplay(issue.location) && (
                <div className="text-sm text-muted-foreground">
                  📍 {getLocationDisplay(issue.location)}
                </div>
              )}

              {/* Inline Comments - Hidden on mobile, visible on desktop */}
              <div className="hidden lg:block">
                <div className="mt-6 pt-6 border-t">
                  <h3 className="text-lg font-semibold mb-4">Comments</h3>
                  <div className="text-sm text-muted-foreground">
                    Comments for issues coming soon. Use the comment button on mobile or the reactions panel to join the discussion.
                  </div>
                </div>
              </div>
            </div>

            {/* Side Panel: Reactions - Fixed bottom on mobile, sticky side on desktop */}
            <div className="fixed bottom-0 left-0 right-0 lg:fixed lg:bottom-auto lg:right-6 lg:top-1/2 lg:-translate-y-1/2 lg:left-auto lg:w-20 z-10">
              <div className="bg-card border-t lg:border lg:rounded-xl shadow-lg p-3 lg:p-4">
                <IssueReactions 
                  issueId={issue.id}
                  currentUserId={currentUserId}
                  initialChampionCount={championCount}
                  isInitiallyChampioned={isChampioned}
                  onCommentClick={() => setCommentPanelOpen(true)}
                  onCreateInitiative={handleCreateInitiative}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Sliding Comment Panel */}
      <CommentPanel 
        postId={issue.id} 
        postType="issue" 
        currentUserId={currentUserId}
        isOpen={commentPanelOpen}
        onClose={() => setCommentPanelOpen(false)}
      />
    </div>
  );
}
