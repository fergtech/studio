"use client";

import React, { useState, useEffect } from 'react';
import { formatDistanceToNow } from 'date-fns';
import Link from 'next/link';
import Image from 'next/image';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { ArrowLeft, PlusCircle, Lightbulb, Edit, Save, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { Textarea } from '@/components/ui/textarea';
import AppSidebar, { getDefaultCollapsedState } from '@/components/AppSidebar';
import CommentPanel from '@/components/CommentPanel';
import IdeaReactions from '@/components/IdeaReactions';
import { useModal } from '@/context/ModalContext';

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

interface IdeaData {
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

interface IdeaClientProps {
  idea: IdeaData;
  currentUserId: string | null;
  initiallyChampioned: boolean;
}

export default function IdeaClient({ idea, currentUserId, initiallyChampioned }: IdeaClientProps) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => getDefaultCollapsedState({ type: 'idea' }));
  const [championCount, setChampionCount] = useState(idea.championCount);
  const [isChampioned, setIsChampioned] = useState(initiallyChampioned);
  const [isChampioning, setIsChampioning] = useState(false);
  const [commentPanelOpen, setCommentPanelOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [editTitle, setEditTitle] = useState(idea.title);
  const [editDescription, setEditDescription] = useState(idea.description);
  const [editLoading, setEditLoading] = useState(false);
  const router = useRouter();
  const { openCreateInitiativeModal } = useModal();
  const { toast } = useToast();

  const fallback = idea.creator?.name?.substring(0, 2).toUpperCase() || '??';
  const ideaTime = formatDistanceToNow(idea.createdAt, { addSuffix: true });
  
  const hasMedia = idea.media && idea.media.length > 0;
  const isImage = hasMedia && idea.media[0].type === 'image';

  const handleChampion = async () => {
    if (!currentUserId) return;
    
    setIsChampioning(true);
    try {
      const response = await fetch(`/api/ideas/${idea.id}/champion`, {
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
      console.error('Error championing idea:', error);
    } finally {
      setIsChampioning(false);
    }
  };

  const handleCreateInitiative = () => {
    const imageUrl = hasMedia ? idea.media[0].url : undefined;
    openCreateInitiativeModal(idea.title, idea.description, imageUrl, undefined, idea.id);
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

    if (editTitle === idea.title && editDescription === idea.description) {
      setEditMode(false);
      return;
    }

    setEditLoading(true);
    try {
      const response = await fetch(`/api/ideas/${idea.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: editTitle,
          description: editDescription,
        }),
      });

      if (response.ok) {
        setEditMode(false);
        toast({
          title: "Idea Updated!",
          description: "Your idea has been updated successfully.",
        });
        router.refresh();
      } else {
        toast({
          title: "Update Failed",
          description: "Failed to update your idea. Please try again.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error updating idea:', error);
      toast({
        title: "Update Failed",
        description: "Failed to update your idea. Please try again.",
        variant: "destructive",
      });
    } finally {
      setEditLoading(false);
    }
  };

  return (
    <div className="w-full min-w-0 overflow-hidden">
      <AppSidebar 
        widgets={['userControls', 'navigation', 'suggestions', 'location', 'resources', 'footer']}
        context={{ type: 'idea' }}
        onCollapseChange={setSidebarCollapsed}
      />
      <div className={`transition-all duration-300 px-4 lg:px-6 ${
        sidebarCollapsed ? 'lg:ml-16' : 'lg:ml-80 xl:ml-96'
      }`}>
        <div className="max-w-4xl mx-auto py-6">
          {/* Header with back button */}
          <div className="flex items-center gap-4 mb-6">
            <Button variant="ghost" size="icon" onClick={() => router.back()}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="flex items-center gap-2">
              <Lightbulb className="h-5 w-5 text-yellow-500" />
              <span className="text-sm font-medium text-muted-foreground">Idea</span>
            </div>
          </div>

          <div className="flex flex-col lg:flex-row gap-6 lg:gap-8">
            {/* Main content */}
            <div className="flex-1 space-y-6 pb-20 lg:pb-0">
              {/* Idea header */}
              <div className="space-y-4">
                {editMode ? (
                  <div className="space-y-3">
                    <Textarea
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      className="text-3xl font-bold border-none p-0 resize-none min-h-[3rem] bg-transparent"
                      placeholder="Idea title..."
                      style={{ fontSize: '1.875rem', lineHeight: '2.25rem' }}
                    />
                  </div>
                ) : (
                  <h1 className="text-3xl font-bold">{idea.title}</h1>
                )}
                
                {/* Creator info */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Link href={`/profile/${idea.creator.id}`} className="flex items-center gap-3 hover:opacity-80 transition-opacity">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={idea.creator.image || undefined} alt={idea.creator.name || undefined} />
                        <AvatarFallback>{fallback}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">{idea.creator.name}</p>
                        <p className="text-sm text-muted-foreground">{ideaTime}</p>
                      </div>
                    </Link>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    {/* Edit button - only show for idea creator */}
                    {currentUserId === idea.creatorId && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setEditMode(!editMode)}
                        className="h-8 w-8 p-0"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                    )}
                    
                    {idea.society && (
                      <Link href={`/societies/${idea.society.id}`} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
                        <Avatar className="h-6 w-6">
                          <AvatarImage src={idea.society.image || undefined} alt={idea.society.name} />
                          <AvatarFallback>{idea.society.name.substring(0, 2).toUpperCase()}</AvatarFallback>
                        </Avatar>
                        {idea.society.name}
                      </Link>
                    )}
                  </div>
                </div>
              </div>

              {/* Media */}
              {hasMedia && isImage && (
                <div className="rounded-lg overflow-hidden relative">
                  <Image 
                    src={idea.media[0].url} 
                    alt="Idea image"
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
                      placeholder="Describe your idea in detail..."
                    />
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
                          setEditTitle(idea.title);
                          setEditDescription(idea.description);
                        }}
                        variant="outline"
                        size="sm"
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <p className="text-base leading-relaxed whitespace-pre-wrap">{idea.description}</p>
                )}
              </div>

              {/* Tags */}
              {idea.tags && idea.tags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {idea.tags.map((tag, index) => (
                    <span key={index} className="px-2 py-1 bg-primary/10 text-primary text-sm rounded-md">
                      #{tag}
                    </span>
                  ))}
                </div>
              )}

              {/* Location */}
              {idea.location && (
                <div className="text-sm text-muted-foreground">
                  📍 {idea.location}
                </div>
              )}

              {/* Inline Comments - Hidden on mobile, visible on desktop */}
              <div className="hidden lg:block">
                <div className="mt-6 pt-6 border-t">
                  <h3 className="text-lg font-semibold mb-4">Comments</h3>
                  <div className="text-sm text-muted-foreground">
                    Comments for ideas coming soon. Use the comment button on mobile or the reactions panel to join the discussion.
                  </div>
                </div>
              </div>
            </div>

            {/* Side Panel: Reactions - Fixed bottom on mobile, sticky side on desktop */}
            <div className="fixed bottom-0 left-0 right-0 lg:fixed lg:bottom-auto lg:right-6 lg:top-1/2 lg:-translate-y-1/2 lg:left-auto lg:w-20 z-10">
              <div className="bg-card border-t lg:border lg:rounded-xl shadow-lg p-3 lg:p-4">
                <IdeaReactions 
                  ideaId={idea.id}
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
        postId={idea.id} 
        postType="idea" 
        currentUserId={currentUserId}
        isOpen={commentPanelOpen}
        onClose={() => setCommentPanelOpen(false)}
      />
    </div>
  );
}
