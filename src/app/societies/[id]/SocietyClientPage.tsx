"use client";

import Image from 'next/image';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Share2, UserPlus, Menu, X, Edit, Plus, Save, Loader2, MoreHorizontal, Trash2 } from 'lucide-react';
import { useState, useEffect, useCallback, useRef } from 'react';
import { useIsMobile } from '@/hooks/use-mobile';
import { SocietySidebar } from './SocietySidebar';
import { EditSocietyDialog } from './EditSocietyDialog';
import { useSession } from 'next-auth/react';
import { CreateSocietyPostForm } from './CreateSocietyPostForm';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { CreateInitiativeForm } from '@/components/CreateInitiativeForm';
import { VideoPlayer } from '@/components/ui/video-player';
import { AudioPlayer } from '@/components/ui/audio-player';
import { LinkPreview } from '@/components/ui/link-preview';
import { DocumentPreview } from '@/components/ui/document-preview';
import { updateSocietyPostContent, deleteSocietyPost } from '@/app/actions/postActions';
import { LazySocietyStats } from '@/components/LazySocietyStats';
import SocietyPostReactions from '@/components/SocietyPostReactions';
import { formatDistanceToNow } from 'date-fns';
import { useScrollPosition } from '@/hooks/useScrollPosition';
import AppSidebar, { getDefaultCollapsedState } from '@/components/AppSidebar';

// Define Member type
interface Member {
  id: string;
  name: string;
  image?: string | null;
  role?: string;
}

interface SocietyClientPageProps {
  society: any;
  members: Member[];
  posts: any[];
}

export function SocietyClientPage({ society: initialSociety, members, posts: initialPosts }: SocietyClientPageProps) {
  const isMobile = useIsMobile();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [society, setSociety] = useState(initialSociety);
  const { data: session } = useSession();
  const userId = session?.user?.id;
  const isCreator = society.creator?.id === userId;
  const isAdmin = members.find(m => m.id === userId)?.role === 'ADMIN';
  const [posts, setPosts] = useState(initialPosts);
  const [initiatives, setInitiatives] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [feedFilter, setFeedFilter] = useState<'ALL' | 'GENERAL' | 'ISSUE' | 'IDEA' | 'INITIATIVES'>('ALL');
  const [isJoining, setIsJoining] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [currentMembers, setCurrentMembers] = useState(members);
  const { toast } = useToast();
  const router = useRouter();
  const [isCreateInitiativeOpen, setIsCreateInitiativeOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => getDefaultCollapsedState({ type: 'society', data: society }));
  // Scroll position restoration for society feed
  const { saveScrollPosition } = useScrollPosition({ key: `societyFeed_${society.id}` });

  // Handler for creating society initiative
  const handleCreateSocietyInitiative = () => {
    if (!userId || !isMember) {
      toast({
        title: "Access Denied",
        description: "You must be a member of this society to create initiatives.",
        variant: "destructive",
      });
      return;
    }
    setIsCreateInitiativeOpen(true);
  };

  // Check if current user is a member
  const isMember = userId && currentMembers.some(m => m.id === userId);


  // State for loading
  const [allContentLoading, setAllContentLoading] = useState(false);
  const [initiativesLoading, setInitiativesLoading] = useState(false);

  // Fetch all content once on component mount
  useEffect(() => {
    async function fetchAllContent() {
      setAllContentLoading(true);
      setInitiativesLoading(true);
      try {
        // Fetch all posts and initiatives in parallel
        const [postsResponse, initiativesResponse] = await Promise.all([
          fetch(`/api/societies/${society.id}/posts`),
          fetch(`/api/societies/${society.id}/initiatives`)
        ]);

        if (postsResponse.ok) {
          const postsData = await postsResponse.json();
          setPosts(postsData.posts || []);
        }

        if (initiativesResponse.ok) {
          const initiativesData = await initiativesResponse.json();
          setInitiatives(initiativesData || []);
        }
      } catch (error) {
        console.error('Failed to fetch society content:', error);
      } finally {
        setAllContentLoading(false);
        setInitiativesLoading(false);
      }
    }

    fetchAllContent();
  }, [society.id]);

  // Fetch stats immediately for tab count
  useEffect(() => {
    async function fetchStats() {
      try {
        const res = await fetch(`/api/societies/${society.id}/stats`);
        if (res.ok) {
          const data = await res.json();
          setStats(data);
        }
      } catch (error) {
        console.error('Error fetching stats:', error);
      }
    }
    fetchStats();
  }, [society.id]);

  // Fetch members on mount and when membership changes
  useEffect(() => {
    async function fetchMembers() {
      const res = await fetch(`/api/societies/${society.id}/members`);
      if (res.ok) {
        const data = await res.json();
        setCurrentMembers(data);
      }
    }
    fetchMembers();
  }, [society.id, isJoining, isLeaving]);

  const handleJoinSociety = async () => {
    if (!userId) {
      toast({
        title: "Authentication Required",
        description: "Please log in to join a society.",
        variant: "destructive",
      });
      return;
    }

    setIsJoining(true);
    try {
      const response = await fetch(`/api/societies/${society.id}/join`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      if (response.ok) {
        toast({
          title: "Success!",
          description: "You have successfully joined the society.",
        });
        // Refresh the page to update the UI
        router.refresh();
      } else {
        const error = await response.json();
        toast({
          title: "Error Joining",
          description: error.error || "Failed to join the society. Please try again.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error joining society:", error);
      toast({
        title: "Unexpected Error",
        description: "An unexpected error occurred while trying to join.",
        variant: "destructive",
      });
    } finally {
      setIsJoining(false);
    }
  };

  const handleLeaveSociety = async () => {
    if (!userId || !isMember) {
      toast({
        title: "Not a Member",
        description: "You are not a member of this society.",
        variant: "destructive",
      });
      return;
    }

    setIsLeaving(true);
    try {
      const response = await fetch(`/api/societies/${society.id}/leave`, {
        method: 'DELETE',
      });

      if (response.ok) {
        toast({
          title: "Left Society",
          description: "You have successfully left the society.",
        });
        // Navigate away to societies page
        router.push('/societies');
      } else {
        const error = await response.json();
        toast({
          title: "Error Leaving Society",
          description: error.error || "Failed to leave the society.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error leaving society:", error);
      toast({
        title: "Unexpected Error",
        description: "An unexpected error occurred while leaving.",
        variant: "destructive",
      });
    } finally {
      setIsLeaving(false);
    }
  };

  const handleDeleteSociety = async () => {
    if (!userId || !isCreator) {
      toast({
        title: "Unauthorized",
        description: "Only the society creator can delete it.",
        variant: "destructive",
      });
      return;
    }

    // Confirm deletion
    if (!confirm(`Are you sure you want to delete "${society.name}"? This action cannot be undone and will delete all posts, initiatives, and content.`)) {
      return;
    }

    setIsDeleting(true);
    try {
      const response = await fetch(`/api/societies/${society.id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        toast({
          title: "Society Deleted",
          description: "The society has been permanently deleted.",
        });
        // Navigate away to societies page
        router.push('/societies');
        router.refresh(); // Refresh to update lists
      } else {
        const error = await response.json();
        toast({
          title: "Error Deleting Society",
          description: error.error || "Failed to delete the society.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error deleting society:", error);
      toast({
        title: "Unexpected Error",
        description: "An unexpected error occurred while deleting.",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
    }
  };

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

  // Simple post card with edit functionality
  function SocietyPostCard({ post, onPostUpdate }: { post: any; onPostUpdate: () => Promise<void> }) {
    const [editMode, setEditMode] = useState(false);
    const [editContent, setEditContent] = useState(post.content);
    const [editLoading, setEditLoading] = useState(false);

    const handleDeletePost = async (postId: string) => {
      const result = await deleteSocietyPost(postId);
      if (result.success) {
        toast({
          title: "Success",
          description: "Post deleted successfully."
        });
        await onPostUpdate();
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to delete post.",
          variant: "destructive"
        });
      }
    };

    const handleEditSubmit = async () => {
      if (!editContent.trim()) {
        toast({
          title: "Missing Content",
          description: "Post content cannot be empty.",
          variant: "destructive",
        });
        return;
      }

      if (editContent === post.content) {
        setEditMode(false);
        return;
      }

      setEditLoading(true);
      try {
        const result = await updateSocietyPostContent(post.id, editContent);
        if (result.success) {
          setEditMode(false);
          toast({
            title: "Post Updated!",
            description: "Your post has been updated successfully.",
          });
          // Refresh posts
          await onPostUpdate();
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

    return (
      <div className="relative mb-2">
        <div className="border rounded-lg p-4 bg-background min-h-[1px] relative">
          {/* Post Header with Profile Picture */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              {/* Profile Picture */}
              <Avatar 
                className="h-10 w-10 cursor-pointer hover:ring-2 hover:ring-primary/20 transition-all"
                onClick={() => {
                  saveScrollPosition();
                  router.push(`/profile/${post.user?.id}`);
                }}
              >
                <AvatarImage src={post.user?.image || ''} alt={post.user?.name || 'User'} />
                <AvatarFallback className="bg-muted text-muted-foreground">
                  {post.user?.name?.substring(0, 2).toUpperCase() || '??'}
                </AvatarFallback>
              </Avatar>
              
              {/* User Info and Time */}
              <div className="flex flex-col">
                <div className="flex items-center gap-2">
                  <span 
                    className="font-semibold text-sm hover:underline cursor-pointer"
                    onClick={() => {
                      saveScrollPosition();
                      router.push(`/profile/${post.user?.id}`);
                    }}
                  >
                    {post.user?.name || 'Unknown'}
                  </span>
                  <Badge variant="secondary" className="text-xs h-5 px-2">{post.type}</Badge>
                </div>
                <span className="text-xs text-muted-foreground">
                  {formatDistanceToNow(new Date(post.createdAt), { addSuffix: true })}
                </span>
              </div>
            </div>
            
            {/* Edit/Delete dropdown - only show for post creator */}
            {userId && post.user?.id === userId && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => setEditMode(!editMode)}>
                    <Edit className="mr-2 h-4 w-4" />
                    Edit
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleDeletePost(post.id)} className="text-destructive focus:text-destructive">
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
          {/* Content - Edit or Display Mode */}
          {editMode ? (
            <div className="mb-2 space-y-2">
              <Textarea
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                className="min-h-[80px] resize-none text-sm"
                placeholder="What's on your mind?"
              />
              <div className="flex gap-2">
                <Button
                  onClick={handleEditSubmit}
                  disabled={editLoading}
                  size="sm"
                  className="h-7 text-xs"
                >
                  {editLoading ? (
                    <>
                      <Loader2 className="w-3 h-3 animate-spin mr-1" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="w-3 h-3 mr-1" />
                      Save
                    </>
                  )}
                </Button>
                <Button
                  onClick={() => {
                    setEditMode(false);
                    setEditContent(post.content);
                  }}
                  variant="outline"
                  size="sm"
                  className="h-7 text-xs"
                >
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <div className="whitespace-pre-line text-sm mb-2">{post.content}</div>
          )}
          {post.imageUrl && (
            <div className="my-2">
              {isVideoFile(post.imageUrl) ? (
                <video 
                  src={post.imageUrl} 
                  controls
                  className="w-full max-h-96 rounded border bg-black"
                  preload="metadata"
                >
                  Your browser does not support the video tag.
                </video>
              ) : isAudioFile(post.imageUrl) ? (
                <AudioPlayer 
                  src={post.imageUrl}
                  className="w-full"
                />
              ) : (
                <Image 
                  src={post.imageUrl} 
                  alt="Post image" 
                  width={800} 
                  height={400} 
                  className="rounded border w-full object-cover" 
                />
              )}
            </div>
          )}
          {/* Display single link (backward compatibility) */}
          {post.linkPreview && (!post.links || post.links.length === 0) && (
            <div className="my-2">
              <LinkPreview 
                metadata={post.linkPreview}
                className="w-full"
              />
            </div>
          )}
          
          {/* Display multiple links */}
          {post.links && post.links.length > 0 && !post.imageUrl && (
            <div className="my-2">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xs font-medium text-muted-foreground">
                  Links ({post.links.length})
                </span>
              </div>
              <div 
                className="flex gap-3 overflow-x-auto pb-2"
                style={{ 
                  scrollbarWidth: 'thin',
                  scrollbarColor: 'rgba(155, 155, 155, 0.5) transparent'
                }}
              >
                {post.links.map((postLink: any) => (
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
          
          {/* Display multiple documents */}
          {post.documents && post.documents.length > 0 && !post.imageUrl && (
            <div className="my-2">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xs font-medium text-muted-foreground">
                  Documents ({post.documents.length})
                </span>
              </div>
              <div 
                className="flex gap-3 overflow-x-auto pb-2"
                style={{ 
                  scrollbarWidth: 'thin',
                  scrollbarColor: 'rgba(155, 155, 155, 0.5) transparent'
                }}
              >
                {post.documents.map((postDocument: any) => (
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
          
          {/* Reaction buttons (like, comment, share) */}
          <SocietyPostReactions 
            postId={post.id} 
            currentUserId={userId} 
            societyId={society.id}
            postType={post.type}
            onCommentClick={() => {
              // Save scroll position before navigating
              saveScrollPosition();
              // Navigate to post detail page with comment intent
              router.push(`/posts/${post.id}?comments=true`);
            }}
          />
        </div>
      </div>
    );
  }

  // Background options for initiatives without cover photos
  const backgroundOptions = [
    'linear-gradient(to right, #ff7e5f, #feb47b)', // Peach
    'linear-gradient(to right, #6a11cb, #2575fc)', // Purple/Blue
    'linear-gradient(to right, #00c6ff, #0072ff)', // Sky Blue
    'linear-gradient(to right, #f7971e, #ffd200)', // Orange/Yellow
    'linear-gradient(to right, #d38312, #a83279)', // Brown/Pink
    '#333333', // Dark Grey
  ];

  // Function to get a deterministic background based on initiative ID
  const getInitiativeBackground = (initiativeId: string) => {
    let hash = 0;
    for (let i = 0; i < initiativeId.length; i++) {
      const char = initiativeId.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return backgroundOptions[Math.abs(hash) % backgroundOptions.length];
  };

  // Initiative card for society feed
  function SocietyInitiativeCard({ initiative }: { initiative: any }) {
    const handleClick = () => {
      saveScrollPosition();
      router.push(`/initiatives/${initiative.id}`);
    };

    const backgroundStyle = initiative.imageUrl 
      ? { backgroundImage: `url(${initiative.imageUrl})`, backgroundSize: 'cover', backgroundPosition: 'center' }
      : { background: getInitiativeBackground(initiative.id) };

    return (
      <div className="w-full">
        <div className="border rounded overflow-hidden bg-background min-h-[1px] relative cursor-pointer hover:shadow-md transition-all duration-300" onClick={handleClick}>
          {/* Header with cover photo or gradient background */}
          <div 
            className="h-32 relative flex items-end justify-start p-4"
            style={backgroundStyle}
          >
            {/* Overlay for better text readability */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
            
            {/* Header content */}
            <div className="relative z-10 w-full">
              <div className="flex items-center gap-2 mb-1">
                <Badge variant="secondary" className="text-xs bg-white/90 text-black border-0">Initiative</Badge>
                <span className="text-xs text-white/80 ml-auto">{new Date(initiative.createdAt).toLocaleString()}</span>
              </div>
              <h3 className="font-semibold text-white text-lg leading-tight line-clamp-2">{initiative.title}</h3>
            </div>
          </div>

          {/* Content section */}
          <div className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-xs text-muted-foreground">{initiative.creator?.name || 'Unknown'}</span>
              <Badge variant="outline" className="text-xs ml-auto">{initiative.status}</Badge>
            </div>
            <p className="text-sm text-muted-foreground mb-3 line-clamp-3">{initiative.description}</p>
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <span>{initiative._count?.memberships || 0} members</span>
              <span>{initiative._count?.updates || 0} updates</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Simple filtering like home feed
  const filteredPostsForDisplay = posts.filter((post: any) => {
    if (feedFilter === 'ALL') return true;
    if (feedFilter === 'GENERAL') return post.type === 'GENERAL';
    if (feedFilter === 'ISSUE') return post.type === 'ISSUE';
    if (feedFilter === 'IDEA') return post.type === 'IDEA';
    return false;
  });

  // Handler for post updates
  const handlePostUpdate = async () => {
    try {
      const res = await fetch(`/api/societies/${society.id}/posts`);
      if (res.ok) {
        const data = await res.json();
        setPosts(data.posts || []);
      }
    } catch (error) {
      console.error('Error refreshing posts:', error);
    }
  };

  const toggleSidebar = () => setIsSidebarOpen((v) => !v);

  async function handleSaveEditSociety(data: { name: string; description: string; imageFile?: File | null; clearImage?: boolean }) {
    try {
      let newImageUrl: string | null | undefined = undefined;
      
      if (data.clearImage) {
        newImageUrl = null;
      } else if (data.imageFile) {
        const formData = new FormData();
        formData.append('file', data.imageFile);
        formData.append('filePath', 'societies/banners');
        
        const response = await fetch('/api/upload', { method: 'POST', body: formData });
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || 'Image upload failed');
        }
        
        const result = await response.json();
        newImageUrl = result.url || result.imageUrl;
      }
      
      const patchRes = await fetch(`/api/societies/${society.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: data.name,
          description: data.description,
          image: newImageUrl === null ? null : newImageUrl ?? society.image,
        }),
      });
      
      if (!patchRes.ok) {
        const errorData = await patchRes.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to update society');
      }
      
      const updated = await patchRes.json();
      setSociety(updated);
      
      toast({
        title: "Society Updated!",
        description: "Your changes have been saved successfully.",
      });
    } catch (error: any) {
      console.error('Error updating society:', error);
      toast({
        title: "Update Failed",
        description: error.message || "An error occurred while updating the society.",
        variant: "destructive",
      });
      throw error; // Re-throw so dialog knows save failed
    }
  }

  return (
    <>

      <AppSidebar 
        context={{ type: 'society', data: society }}
        className="z-30"
        onCollapseChange={setSidebarCollapsed}
      />

      {/* Fixed Society Sidebar for Desktop */}
      {!isMobile && (
        <div className="fixed right-4 top-6 z-30 w-80 h-[calc(100vh-3rem)] overflow-y-auto bg-background/95 backdrop-blur-sm border rounded-lg shadow-lg p-4">
          <SocietySidebar society={society} members={currentMembers} />
        </div>
      )}

      <div className={`relative min-h-screen transition-all duration-300 ${
        sidebarCollapsed ? 'lg:ml-16' : 'lg:ml-80 xl:ml-96'
      } lg:pr-[22rem]`}>
        {/* Overlay for Mobile Sidebar */}
        {isMobile && isSidebarOpen && (
          <div
            className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm transition-opacity duration-300 ease-in-out"
            onClick={toggleSidebar}
            aria-hidden="true"
          />
        )}
        {/* Mobile Sidebar Toggle Button */}
        {isMobile && (
          <Button
            variant="outline"
            size="icon"
            className="fixed top-4 right-4 z-[60] bg-background/95 backdrop-blur-sm border shadow-lg rounded-full p-3 w-12 h-12 flex items-center justify-center hover:bg-background/90 transition-all duration-200"
            onClick={toggleSidebar}
          >
            {isSidebarOpen ? (
              <X className="h-5 w-5" />
            ) : (
              <Menu className="h-5 w-5" />
            )}
            <span className="sr-only">{isSidebarOpen ? "Close menu" : "Open menu"}</span>
          </Button>
        )}

        <div className="container mx-auto p-0 sm:p-4">
        {/* Banner/Header */}
        <Card className="mb-6 rounded-none border-x-0 border-t-0">
          <div className="relative w-full aspect-[16/9] md:aspect-[21/9]">
            {society.imageUrl || society.image ? (
              <Image src={society.imageUrl || society.image} alt={society.name} fill className="object-cover" priority />
            ) : (
              <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-primary/5" />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-background via-background/70 to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 p-3 md:p-6">
              <div className="flex flex-col gap-3">
                <div className="space-y-1.5">
                  <div className="flex items-start justify-between gap-4">
                    <h1 className="text-lg md:text-3xl font-bold text-foreground line-clamp-2 pr-2">
                      {society.name}
                    </h1>
                    {(isAdmin || isCreator) && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-foreground hover:text-foreground hover:bg-card/30 h-8 w-8 p-0"
                        onClick={() => setIsEditDialogOpen(true)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    <Badge variant="secondary" className="bg-card/30 text-foreground text-xs backdrop-blur-sm">
                      {currentMembers.length} members
                    </Badge>
                  </div>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  <Button variant="outline" size="sm" className="bg-card/30 text-foreground hover:bg-card/50 h-8 text-xs backdrop-blur-sm">
                    <Share2 className="h-3 w-3 mr-1" /> Share
                  </Button>
                  <Button variant="outline" size="sm" className="bg-card/30 text-foreground hover:bg-card/50 h-8 text-xs backdrop-blur-sm">
                    <UserPlus className="h-3 w-3 mr-1" /> Invite
                  </Button>
                  {/* Show Join Society for non-members */}
                  {userId && !isMember && (
                    <Button 
                      size="sm" 
                      className="bg-primary text-white font-medium h-8 text-xs"
                      onClick={handleJoinSociety}
                      disabled={isJoining}
                    >
                      {isJoining ? "Joining..." : "Join Society"}
                    </Button>
                  )}
                  {/* Show Delete for creator, Leave for regular members */}
                  {userId && isCreator && (
                    <Button variant="destructive" size="sm" className="h-8 text-xs" onClick={handleDeleteSociety} disabled={isDeleting}>
                      {isDeleting ? "Deleting..." : "Delete Society"}
                    </Button>
                  )}
                  {userId && isMember && !isCreator && (
                    <Button variant="destructive" size="sm" className="h-8 text-xs" onClick={handleLeaveSociety} disabled={isLeaving}>
                      {isLeaving ? "Leaving..." : "Leave Society"}
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </Card>
        <EditSocietyDialog
          society={society}
          isOpen={isEditDialogOpen}
          onClose={() => setIsEditDialogOpen(false)}
          onSave={handleSaveEditSociety}
        />
  {/* Main Content */}
  <div className="space-y-6 mx-auto" style={{ maxWidth: '700px' }}>
            {/* Create Initiative Button for Members - now above post form and more subtle */}
            {userId && isMember && (
              <div className="rounded border border-dashed bg-muted/40 px-3 py-2 mb-2 flex items-center justify-between">
                <div>
                  <span className="font-medium text-sm text-foreground">Create Initiative</span>
                  <span className="block text-xs text-muted-foreground">Start a new initiative for this society</span>
                </div>
                <Button onClick={handleCreateSocietyInitiative} size="sm" variant="outline" className="ml-2 px-3 py-1 h-7 text-xs">
                  <Plus className="h-4 w-4 mr-1" />
                  New Initiative
                </Button>
              </div>
            )}

            {/* Post Form */}
            <CreateSocietyPostForm
              societyId={society.id}
              userId={userId}
              isMember={isMember}
              onPostCreated={async (post) => {
                // Add new post to the top of the list
                setPosts([post, ...posts]);
                
                // Also refresh stats to update tab counts
                try {
                  const res = await fetch(`/api/societies/${society.id}/stats`);
                  if (res.ok) {
                    const data = await res.json();
                    setStats(data);
                  }
                } catch (error) {
                  console.error('Error refreshing stats:', error);
                }
              }}
            />
            {/* Feed Tabs */}
            <Card>
              <CardHeader>
                <CardTitle>Feed</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex gap-2 mb-4 overflow-x-auto scrollbar-hide pb-1">
                  <Button size="sm" variant={feedFilter === 'ALL' ? 'secondary' : 'ghost'} onClick={() => setFeedFilter('ALL')} className="flex-shrink-0">
                    All ({posts.length + initiatives.length})
                  </Button>
                  <Button size="sm" variant={feedFilter === 'GENERAL' ? 'secondary' : 'ghost'} onClick={() => setFeedFilter('GENERAL')} className="flex-shrink-0">
                    General ({posts.filter(p => p.type === 'GENERAL').length})
                  </Button>
                  <Button size="sm" variant={feedFilter === 'ISSUE' ? 'secondary' : 'ghost'} onClick={() => setFeedFilter('ISSUE')} className="flex-shrink-0">
                    Issues ({posts.filter(p => p.type === 'ISSUE').length})
                  </Button>
                  <Button size="sm" variant={feedFilter === 'IDEA' ? 'secondary' : 'ghost'} onClick={() => setFeedFilter('IDEA')} className="flex-shrink-0">
                    Ideas ({posts.filter(p => p.type === 'IDEA').length})
                  </Button>
                  <Button size="sm" variant={feedFilter === 'INITIATIVES' ? 'secondary' : 'ghost'} onClick={() => setFeedFilter('INITIATIVES')} className="flex-shrink-0">
                    Initiatives ({initiatives.length})
                  </Button>
                </div>
                
                {/* Initiatives content */}
                <div style={{ display: feedFilter === 'INITIATIVES' ? 'block' : 'none' }}>
                  {initiativesLoading ? (
                    <div className="text-center text-muted-foreground">Loading initiatives...</div>
                  ) : initiatives.length === 0 ? (
                    <div className="text-center text-muted-foreground">No initiatives yet.</div>
                  ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-2 gap-4 max-w-[1200px]">
                      {initiatives.map((initiative: any) => (
                        <div key={initiative.id} className="max-w-[550px] w-full">
                          <SocietyInitiativeCard initiative={initiative} />
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Posts content */}
                <div style={{ display: feedFilter !== 'INITIATIVES' ? 'block' : 'none' }}>
                  {allContentLoading ? (
                    <div className="space-y-4">
                      {[1, 2, 3].map((i) => (
                        <div key={i} className="animate-pulse">
                          <div className="bg-muted h-32 rounded-lg"></div>
                        </div>
                      ))}
                    </div>
                  ) : filteredPostsForDisplay.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      {feedFilter === 'ALL' && "No posts yet. Be the first to share something!"}
                      {feedFilter === 'GENERAL' && "No general posts yet."}
                      {feedFilter === 'ISSUE' && "No issues yet."}
                      {feedFilter === 'IDEA' && "No ideas yet."}
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {filteredPostsForDisplay.map((post: any) => (
                        <SocietyPostCard 
                          key={post.id} 
                          post={post} 
                          onPostUpdate={handlePostUpdate} 
                        />
                      ))}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
            
        </div>
        </div>
      </div>
        
      {/* Mobile Sidebar (sliding panel) */}
      {isMobile && (
        <SocietySidebar
          society={society}
          members={currentMembers}
          isMobile={true}
          isOpen={isSidebarOpen}
          onToggle={toggleSidebar}
        />
      )}
      
      {/* Create Initiative Dialog */}
      <Dialog open={isCreateInitiativeOpen} onOpenChange={setIsCreateInitiativeOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create Initiative for {society.name}</DialogTitle>
          </DialogHeader>
          <CreateInitiativeForm 
            onSuccess={async () => {
              setIsCreateInitiativeOpen(false);
              
              // Refresh initiatives list
              const res = await fetch(`/api/societies/${society.id}/initiatives`);
              if (res.ok) {
                const data = await res.json();
                setInitiatives(data);
              }
              
              // Switch to Initiatives tab to show the new initiative
              setFeedFilter('INITIATIVES');
              
              toast({
                title: "Initiative Created!",
                description: "Your society initiative has been created successfully.",
              });
            }}
            societyId={society.id}
          />
        </DialogContent>
      </Dialog>
    </>
  );
} 