"use client";

import React, { useState, useEffect } from 'react';
import { formatDistanceToNow } from 'date-fns';
import Link from 'next/link';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { ArrowLeft, PlusCircle, AlertTriangle, Edit, Save, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { Textarea } from '@/components/ui/textarea';
import AppSidebar from '@/components/AppSidebar';
import CommentPanel from '@/components/CommentPanel';
import IssueReactions from '@/components/IssueReactions';
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
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [championCount, setChampionCount] = useState(issue.championCount);
  const [isChampioned, setIsChampioned] = useState(initiallyChampioned);
  const [isChampioning, setIsChampioning] = useState(false);
  const [commentPanelOpen, setCommentPanelOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [editTitle, setEditTitle] = useState(issue.title);
  const [editDescription, setEditDescription] = useState(issue.description);
  const [editLoading, setEditLoading] = useState(false);
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

  const handleEditSubmit = async () => {
    if (!editTitle.trim() || !editDescription.trim()) {
      toast({
        title: "Missing Content",
        description: "Title and description cannot be empty.",
        variant: "destructive",
      });
      return;
    }

    if (editTitle === issue.title && editDescription === issue.description) {
      setEditMode(false);
      return;
    }

    setEditLoading(true);
    try {
      const response = await fetch(`/api/issues/${issue.id}`, {
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
        widgets={['userControls', 'navigation', 'suggestions', 'location', 'resources', 'footer']}
        context={{ type: 'issue' }}
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
              <AlertTriangle className="h-5 w-5 text-red-500" />
              <span className="text-sm font-medium text-muted-foreground">Issue</span>
            </div>
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
                <div className="rounded-lg overflow-hidden">
                  <img 
                    src={issue.media[0].url} 
                    alt="Issue image"
                    className="w-full h-auto max-h-96 object-cover"
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
              {issue.location && (
                <div className="text-sm text-muted-foreground">
                  📍 {issue.location}
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
