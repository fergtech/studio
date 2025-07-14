"use client";

import Image from 'next/image';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Share2, UserPlus, Menu, X, Edit } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useIsMobile } from '@/hooks/use-mobile';
import { SocietySidebar } from './SocietySidebar';
import { EditSocietyDialog } from './EditSocietyDialog';
import { useSession } from 'next-auth/react';
import { CreateSocietyPostForm } from './CreateSocietyPostForm';
import { SocietyPostComments } from './SocietyPostComments';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';

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
  const [feedFilter, setFeedFilter] = useState('ALL');
  const [isJoining, setIsJoining] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);
  const [currentMembers, setCurrentMembers] = useState(members);
  const { toast } = useToast();
  const router = useRouter();

  // Check if current user is a member
  const isMember = userId && currentMembers.some(m => m.id === userId);

  // Fetch posts on mount
  useEffect(() => {
    async function fetchPosts() {
      const res = await fetch(`/api/societies/${society.id}/posts`);
      if (res.ok) {
        const data = await res.json();
        setPosts(data);
      }
    }
    fetchPosts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
        // Refresh the page to update the UI
        router.refresh();
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

  // Simple post card
  function SocietyPostCard({ post }: { post: any }) {
    return (
      <div className="relative mb-2">
        <div className="border rounded p-4 bg-background min-h-[1px] relative">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-semibold px-2 py-0.5 rounded bg-muted mr-2">{post.type}</span>
            <span className="text-xs text-muted-foreground">{post.user?.name || 'Unknown'}</span>
            <span className="text-xs text-muted-foreground ml-auto">{new Date(post.createdAt).toLocaleString()}</span>
          </div>
          <div className="whitespace-pre-line text-sm mb-2">{post.content}</div>
          {post.imageUrl && (
            <div className="my-2">
              <Image src={post.imageUrl} alt="Post image" width={800} height={400} className="rounded border w-full object-cover" />
            </div>
          )}
          <SocietyPostComments postId={post.id} userId={userId} societyId={society.id} />
        </div>
      </div>
    );
  }

  // Filter posts by type
  const filteredPosts = feedFilter === 'ALL'
    ? posts
    : posts.filter((post: any) => post.type === feedFilter);

  const toggleSidebar = () => setIsSidebarOpen((v) => !v);

  async function handleSaveEditSociety(data: { name: string; description: string; imageFile?: File | null; clearImage?: boolean }) {
    let newImageUrl: string | null | undefined = undefined;
    if (data.clearImage) {
      newImageUrl = null;
    } else if (data.imageFile) {
      const formData = new FormData();
      formData.append('file', data.imageFile);
      formData.append('filePath', 'societies/banners');
      const response = await fetch('/api/upload', { method: 'POST', body: formData });
      if (!response.ok) throw new Error('Image upload failed');
      const result = await response.json();
      newImageUrl = result.imageUrl;
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
    if (!patchRes.ok) throw new Error('Failed to update society');
    const updated = await patchRes.json();
    setSociety(updated);
  }

  return (
    <div className="relative min-h-screen">
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
          className="fixed bottom-4 left-4 z-[60] bg-background shadow-lg rounded-full p-3 w-14 h-14 flex items-center justify-center"
          onClick={toggleSidebar}
        >
          {isSidebarOpen ? (
            <X className="h-6 w-6" />
          ) : (
            <Menu className="h-6 w-6" />
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
                  {/* Only show Leave Society if user is a member */}
                  {userId && isMember && (
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
        {/* Main Content Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Main Content Column */}
          <div className="md:col-span-2 space-y-6">
            {/* Post Form */}
            <CreateSocietyPostForm
              societyId={society.id}
              userId={userId}
              onPostCreated={post => setPosts([post, ...posts])}
            />
            {/* Feed Tabs */}
            <Card>
              <CardHeader>
                <CardTitle>Feed</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex gap-2 mb-4">
                  <Button size="sm" variant={feedFilter === 'ALL' ? 'secondary' : 'ghost'} onClick={() => setFeedFilter('ALL')}>All</Button>
                  <Button size="sm" variant={feedFilter === 'GENERAL' ? 'secondary' : 'ghost'} onClick={() => setFeedFilter('GENERAL')}>General</Button>
                  <Button size="sm" variant={feedFilter === 'ISSUE' ? 'secondary' : 'ghost'} onClick={() => setFeedFilter('ISSUE')}>Issues</Button>
                  <Button size="sm" variant={feedFilter === 'IDEA' ? 'secondary' : 'ghost'} onClick={() => setFeedFilter('IDEA')}>Ideas</Button>
                  <Button size="sm" variant="ghost" disabled>Initiatives</Button>
                </div>
                {filteredPosts.length === 0 ? (
                  <div className="text-center text-muted-foreground">No posts yet.</div>
                ) : (
                  <div className="flex flex-col gap-2">
                    {filteredPosts.map((post: any) => (
                      <SocietyPostCard key={post.id} post={post} />
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
          {/* Sidebar Column (desktop only) */}
          {!isMobile && (
            <div className="md:col-span-1 space-y-6">
              <SocietySidebar society={society} members={currentMembers} />
            </div>
          )}
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
      </div>
    </div>
  );
} 