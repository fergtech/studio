'use client';

import { useState } from 'react';
import { useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Send, X, CheckCircle, Paperclip, ExternalLink, TrendingUp, Pin, ThumbsUp, PartyPopper, Heart, Lightbulb, Share2, Image as ImageIcon, Archive, UserPlus, Plus, MessageSquare, Twitter, Facebook, Link2 } from 'lucide-react';
import { cn } from "@/lib/utils";
import { Textarea } from "@/components/ui/textarea";
import { formatDistanceToNow } from 'date-fns';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { useToast } from "@/components/ui/use-toast";
import type { Initiative, Role } from "@/lib/types";
import { MissionProgressBanner } from './MissionProgressBanner';
import { InitiativeSidebar } from './InitiativeSidebar';
import { CreateUpdateForm } from './CreateUpdateForm';
import { ActivityFeed } from './ActivityFeed';
import { EditInitiativeDialog } from './EditInitiativeDialog';
import { RoleSelectionModal } from './RoleSelectionModal';

export function InitiativeClientPage({ 
  initiative, 
  initiativeId 
}: { 
  initiative: Initiative;
  initiativeId: string;
}) {
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isShareOpen, setIsShareOpen] = useState(false);
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [isRoleSelectionOpen, setIsRoleSelectionOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [roles, setRoles] = useState<Role[]>([]);
  const { toast } = useToast();

  const handleSave = async () => {
    setIsSaving(true);
    try {
      // If there's a new image selected, upload it first
      let finalImageUrl = initiative?.imageUrl;
      if (selectedImage) {
        const formData = new FormData();
        formData.append('file', selectedImage);
        formData.append('initiativeId', initiativeId);

        const response = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        });

        if (!response.ok) {
          throw new Error('Failed to upload image');
        }

        const data = await response.json();
        finalImageUrl = data.url;
      }

      // Update the initiative with the new image URL
      if (initiative) {
        const updatedInitiative = {
          ...initiative,
          imageUrl: finalImageUrl
        };
        // Handle the update here
      }
    } catch (error) {
      console.error('Error saving initiative:', error);
      toast({
        title: "Error",
        description: "Failed to save initiative. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleRoleSelect = (role: Role) => {
    setRoles(prev => [...prev, role]);
  };

  return (
    <div className="container mx-auto py-8 px-4">
      {/* Header Card */}
      <Card className="mb-6 rounded-none border-x-0 border-t-0">
        <div className="relative w-full aspect-[16/9] md:aspect-[21/9]">
          {initiative.imageUrl ? (
            <Image
              src={initiative.imageUrl}
              alt={initiative.title}
              fill
              className="object-cover"
              priority
            />
          ) : (
            <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-primary/5" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/70 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 p-3 md:p-6">
            <div className="flex flex-col gap-3">
              {/* Title and Status Section */}
              <div className="space-y-1.5">
                <div className="flex items-start justify-between gap-4">
                  <h1 className="text-lg md:text-3xl font-bold text-foreground line-clamp-2 pr-2">
                    {initiative.title}
                  </h1>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-foreground hover:text-foreground hover:bg-card/30 h-8 w-8 p-0"
                    onClick={() => setIsEditDialogOpen(true)}
                  >
                    <Edit className="h-3 w-3" />
                  </Button>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  <Badge variant="secondary" className="bg-card/30 text-foreground text-xs backdrop-blur-sm">
                    {initiative.status}
                  </Badge>
                  <Badge variant="secondary" className="bg-card/30 text-foreground text-xs backdrop-blur-sm">
                    {initiative.members?.length || 0} members
                  </Badge>
                  <Badge variant="secondary" className="bg-accent/20 text-accent text-xs backdrop-blur-sm">
                    {initiative.members?.filter(m => m.lastActive && new Date(m.lastActive).getTime() > Date.now() - 5 * 60 * 1000).length || 0} online now
                  </Badge>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap gap-1.5">
                <Button
                  variant="outline"
                  size="sm"
                  className="bg-card/30 text-foreground hover:bg-card/50 h-8 text-xs backdrop-blur-sm"
                  onClick={() => setIsShareOpen(true)}
                >
                  <Share2 className="h-3 w-3 mr-1" />
                  Share
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="bg-card/30 text-foreground hover:bg-card/50 h-8 text-xs backdrop-blur-sm"
                  onClick={() => setIsInviteOpen(true)}
                >
                  <UserPlus className="h-3 w-3 mr-1" />
                  Invite
                </Button>
                <Button 
                  size="sm"
                  className="bg-primary text-white font-medium h-8 text-xs"
                  onClick={() => setIsRoleSelectionOpen(true)}
                >
                  <UserPlus className="h-3 w-3 mr-1" />
                  Join
                </Button>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Main Content Column */}
        <div className="md:col-span-2 space-y-6">
          {/* Mission Progress Banner */}
          <MissionProgressBanner 
            initiative={initiative} 
            milestones={initiative.milestones || []} 
            onContributeClick={() => setIsRoleSelectionOpen(true)}
          />

          {/* Goals Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">Goals</h2>
              <Button
                variant="outline"
                size="sm"
                className="h-8"
                onClick={() => {/* TODO: Open create goal dialog */}}
              >
                <Plus className="h-4 w-4 mr-1" />
                Add Goal
              </Button>
            </div>
            
            {initiative.goals && initiative.goals.length > 0 ? (
              <ScrollArea className="w-full">
                <div className="flex gap-4 pb-4">
                  {initiative.goals.map((goal) => (
                    <Card key={goal.id} className="min-w-[300px] flex-shrink-0">
                      <CardHeader>
                        <CardTitle className="text-base">{goal.title}</CardTitle>
                        <CardDescription className="line-clamp-2">{goal.description}</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">Progress</span>
                            <span className="font-medium">{goal.progress}%</span>
                          </div>
                          <div className="h-2 bg-muted rounded-full">
                            <div 
                              className="h-2 bg-primary rounded-full transition-all"
                              style={{ width: `${goal.progress}%` }}
                            />
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="text-xs">
                              {goal.status}
                            </Badge>
                            <Badge variant="outline" className="text-xs">
                              {goal.priority}
                            </Badge>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
                <ScrollBar orientation="horizontal" />
              </ScrollArea>
            ) : (
              <Card className="bg-muted/50">
                <CardContent className="p-6 text-center">
                  <p className="text-muted-foreground">No goals added yet</p>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="mt-2"
                    onClick={() => {/* TODO: Open create goal dialog */}}
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Add First Goal
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Updates Section */}
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Updates</h2>
            <CreateUpdateForm 
              initiativeId={initiativeId} 
              onPostUpdate={(updateData) => {
                // Handle update creation
                console.log('New update:', updateData);
              }} 
            />
            {initiative.updates && initiative.updates.length > 0 ? (
              <ActivityFeed 
                updates={initiative.updates} 
                onLoadMore={() => {}} 
                hasMore={false} 
              />
            ) : (
              <Card className="bg-muted/50">
                <CardContent className="p-6 text-center">
                  <p className="text-muted-foreground">No updates yet</p>
                  <p className="text-sm mt-2">Be the first to share progress!</p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {/* Sidebar Column */}
        <div className="md:col-span-1">
          <InitiativeSidebar 
            initiative={initiative} 
            members={initiative.members || []} 
          />
        </div>
      </div>

      {/* Chat Panel */}
      <div className="fixed bottom-4 right-4 z-50">
        <Button
          onClick={() => setIsChatOpen(!isChatOpen)}
          className="rounded-full h-12 w-12 shadow-lg"
        >
          <MessageSquare className="h-5 w-5" />
        </Button>
      </div>

      {/* Edit Dialog */}
      <EditInitiativeDialog
        initiative={initiative}
        isOpen={isEditDialogOpen}
        onClose={() => setIsEditDialogOpen(false)}
        onSave={handleSave}
      />

      {/* Share Dialog */}
      <Dialog open={isShareOpen} onOpenChange={setIsShareOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Share Initiative</DialogTitle>
            <DialogDescription>
              Share this initiative with others to grow the community.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1">
                <Twitter className="h-4 w-4 mr-2" />
                Twitter
              </Button>
              <Button variant="outline" className="flex-1">
                <Facebook className="h-4 w-4 mr-2" />
                Facebook
              </Button>
              <Button variant="outline" className="flex-1">
                <Link2 className="h-4 w-4 mr-2" />
                Copy Link
              </Button>
            </div>
            <div className="space-y-2">
              <Label>Custom Message</Label>
              <Textarea
                placeholder="Add a message to your share..."
                defaultValue={`Check out this initiative: ${initiative.title}`}
              />
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Invite Dialog */}
      <Dialog open={isInviteOpen} onOpenChange={setIsInviteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Invite Members</DialogTitle>
            <DialogDescription>
              Invite others to join this initiative.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Email Addresses</Label>
              <Textarea
                placeholder="Enter email addresses, separated by commas"
                className="h-24"
              />
            </div>
            <div className="space-y-2">
              <Label>Custom Message</Label>
              <Textarea
                placeholder="Add a personal message..."
                defaultValue={`I'd like to invite you to join our initiative: ${initiative.title}`}
              />
            </div>
            <Button className="w-full">
              <Send className="h-4 w-4 mr-2" />
              Send Invitations
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Role Selection Modal */}
      <RoleSelectionModal
        initiative={initiative}
        isOpen={isRoleSelectionOpen}
        onClose={() => setIsRoleSelectionOpen(false)}
        onRoleSelect={handleRoleSelect}
      />
    </div>
  );
} 