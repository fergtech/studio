'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
// Add a simple log to check if the component file is being executed
console.log('InitiativeClientPage.tsx loaded');

import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Send, X, CheckCircle, Paperclip, ExternalLink, TrendingUp, Pin, ThumbsUp, PartyPopper, Heart, Lightbulb, Share2, Image as ImageIcon, Archive, UserPlus, Plus, MessageSquare, Twitter, Facebook, Link2, Edit, Menu } from 'lucide-react';
import { cn } from "@/lib/utils";
import { Textarea } from "@/components/ui/textarea";
import { formatDistanceToNow } from 'date-fns';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { useToast } from "@/components/ui/use-toast"; // Ensure this import is present
import type { Initiative, Role, UserSelectableMembershipRole, Member, EnhancedChatMessage, Goal, Milestone, Update, UserForDisplay, InitiativeStatus, Priority, GoalStatus } from "@/lib/types"; 
import { ALL_USER_SELECTABLE_MEMBERSHIP_ROLES } from "@/lib/types";
import { MissionProgressBanner } from './MissionProgressBanner';
import { InitiativeSidebar } from '@/components/initiatives/InitiativeSidebar'; // Corrected import path
import { CreateUpdateForm } from './CreateUpdateForm';
import { ActivityFeed } from './ActivityFeed';
import { EditInitiativeDialog } from './EditInitiativeDialog';
import { RoleSelectionModal } from './RoleSelectionModal';
import { useSession } from "next-auth/react";
import { joinInitiativeAction, updateInitiativeAction, updateInitiativeMembershipAction, leaveInitiativeAction, createUpdate as createUpdateAction } from "@/app/actions/initiativeActions"; // Added updateInitiativeAction and createUpdateAction
import { InitiativeRoleType, UpdateType } from '@prisma/client'; // Added this import
import { CreateGoalDialog } from './CreateGoalDialog'; // Import CreateGoalDialog
import { useIsMobile } from '@/hooks/use-mobile';
import { ChatPanel } from '@/components/initiatives/ChatPanel';
import { io, Socket } from 'socket.io-client';

interface InitiativeClientPageProps {
  initiative: Initiative;
  initiativeId: string;
}

export function InitiativeClientPage({ 
  initiative: initialInitiative, 
  initiativeId 
}: InitiativeClientPageProps) {
  // Log the initial initiative data received as a prop
  console.log('InitiativeClientPage: initialInitiative prop received:', initialInitiative);

  // Log initialInitiative right before useState
  console.log('InitiativeClientPage: initialInitiative before useState:', initialInitiative);

  // Log stringified chatMessages from initialInitiative right before useState
  console.log('InitiativeClientPage: stringified initialInitiative.chatMessages before useState:', JSON.stringify(initialInitiative.chatMessages));

  const { data: session } = useSession();
  const router = useRouter();
  const { toast } = useToast(); // Call useToast to get the toast function
  const userId = session?.user?.id; 

  // Initialize main initiative state (Revert type to Initiative)
  const [initiative, setInitiative] = useState<Initiative>(initialInitiative);

  // Log the initiative state right after initialization
  console.log('InitiativeClientPage: Initiative state after useState initialization:', initiative);

  const [socket, setSocket] = useState<Socket | null>(null);

  // Memoize the transformed chat messages, dependent directly on the initialInitiative prop's chatMessages
  const transformedMessages = useMemo(() => {
    console.log('useMemo: Transforming chat messages from initialInitiative prop directly.', initialInitiative?.chatMessages);
    return initialInitiative.chatMessages?.map(transformDatabaseChatMessage) || [];
  }, [initialInitiative.chatMessages]); // Depend directly on initialInitiative.chatMessages

  useEffect(() => {
    // Initialize socket connection
    // Ensure the client connects directly to the socket server port (9003)
    const socketUrl = process.env.NEXT_PUBLIC_SOCKET_SERVER_URL || 'http://localhost:9003';
    console.log('Attempting to connect to socket server at:', socketUrl, 'with path:', '/api/socketio');
    const socketInstance = io(socketUrl, {
      path: '/api/socketio', // Use the explicitly set path
      // Add transport options for better compatibility if needed
      transports: ['websocket', 'polling']
    });
    setSocket(socketInstance);

    // Add a listener here to see if the socket object itself connects
    socketInstance.on('connect', () => {
      console.log('InitiativeClientPage: Socket instance connected successfully!');
    });

    // Cleanup on unmount
    return () => {
      console.log('InitiativeClientPage: Disconnecting socket instance.');
      socketInstance.disconnect();
    };
  }, []);

  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isShareOpen, setIsShareOpen] = useState(false);
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [isRoleSelectionOpen, setIsRoleSelectionOpen] = useState(false);
  const [isJoining, setIsJoining] = useState(false); 
  const [isLeaving, setIsLeaving] = useState(false);
  const [isUpdatingRole, setIsUpdatingRole] = useState(false);
  const [selectedRoleForChange, setSelectedRoleForChange] = useState<UserSelectableMembershipRole | null>(null);
  const [isChangeRoleModalOpen, setIsChangeRoleModalOpen] = useState(false);
  const [isCreateGoalDialogOpen, setIsCreateGoalDialogOpen] = useState(false); // State for goal dialog
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const isMobile = useIsMobile();

  useEffect(() => {
    // Close sidebar if window is resized from mobile to desktop
    if (!isMobile && isSidebarOpen) {
      setIsSidebarOpen(false);
    }
  }, [isMobile, isSidebarOpen]);

  // Ensure sidebar is closed by default on mobile
  useEffect(() => {
    if (isMobile === true && isSidebarOpen) { // Check for true explicitly
      // This effect now primarily handles the resize scenario.
      // Initial state is handled by useState(false)
    } else if (isMobile === false && isSidebarOpen) {
      setIsSidebarOpen(false);
    }
  }, [isMobile]); // Removed isSidebarOpen from dependencies to avoid loop with toggle

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  if (!initiative) {
    return null; // or a loading spinner, depending on your UX preference
  }

  // Determine if the current user is a member and their role
  // Ensure initiative and initiative.memberships are defined before trying to access them
  const currentUserMembership = initiative?.memberships?.find(m => m.user.id === userId);
  const isMember = !!currentUserMembership;
  const isAdmin = currentUserMembership?.role === InitiativeRoleType.ADMIN;

  // Determine if the current user is the creator (legacy check, can be removed if admin role is sufficient)
  // const isCreator = initiative.creator?.id === userId;

  const handleOpenRoleSelection = () => {
    if (!userId) {
      toast({
        title: "Authentication Required",
        description: "Please log in to join an initiative.",
        variant: "destructive",
      });
      return;
    }
    // Check if the initiative has skill roles defined to offer them, 
    // otherwise, proceed directly to membership role selection.
    // For now, we always open the membership role selection.
    setIsRoleSelectionOpen(true);
  };

  const handleOpenChangeRoleModal = () => {
    if (currentUserMembership && currentUserMembership.role !== InitiativeRoleType.ADMIN) {
      setSelectedRoleForChange(currentUserMembership.role as UserSelectableMembershipRole);
      setIsChangeRoleModalOpen(true);
    } else {
      toast({
        title: "Action Not Allowed",
        description: "ADMINs cannot change their role this way, or you are not a member.",
        variant: "destructive",
      });
    }
  };

  const handleRoleChange = async (newRole: UserSelectableMembershipRole) => {
    if (!userId || !currentUserMembership) { // Removed redundant newRole === InitiativeRoleType.ADMIN check
      toast({
        title: "Invalid Action",
        description: "Invalid user state for changing role.",
        variant: "destructive",
      });
      return;
    }

    setIsUpdatingRole(true);
    setIsChangeRoleModalOpen(false);

    try {
      const result = await updateInitiativeMembershipAction({
        initiativeId: initiative.id,
        newRole: newRole,
      });

      if (result.success && result.initiative) {
        setInitiative(result.initiative as Initiative);
        toast({
          title: "Role Updated",
          description: `Your role has been changed to ${newRole}.`,
        });
      } else {
        toast({
          title: "Error Updating Role",
          description: result.error || "Failed to update your role.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error updating role:", error);
      toast({
        title: "Unexpected Error",
        description: "An unexpected error occurred while updating your role.",
        variant: "destructive",
      });
    } finally {
      setIsUpdatingRole(false);
    }
  };

  const handleLeaveInitiative = async () => {
    if (!userId || !currentUserMembership) {
      toast({
        title: "Not a Member",
        description: "You are not a member of this initiative.",
        variant: "destructive",
      });
      return;
    }

    setIsLeaving(true);
    try {
      const result = await leaveInitiativeAction({ initiativeId: initiative.id });
      if (result.success) {
        toast({
          title: "Left Initiative",
          description: "You have successfully left the initiative.",
        });
        // Option 1: Navigate away or refresh to reflect the change
        router.push('/'); // Or router.refresh() if staying on a list page
        // Option 2: If staying on the page and it should show a non-member view:
        // Refetch initiative data or update local state to reflect non-membership.
        // For simplicity, navigating away is often cleaner.
      } else {
        toast({
          title: "Error Leaving Initiative",
          description: result.error || "Failed to leave the initiative.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error leaving initiative:", error);
      toast({
        title: "Unexpected Error",
        description: "An unexpected error occurred while leaving.",
        variant: "destructive",
      });
    } finally {
      setIsLeaving(false);
    }
  };

  const handleRoleSelectedAndJoin = async (selectedRoleType: UserSelectableMembershipRole) => { // Changed parameter from selectedRole: Role
    if (!userId) return;

    setIsJoining(true);
    setIsRoleSelectionOpen(false);

    try {
      const result = await joinInitiativeAction({
        initiativeId: initiative.id,
        roleType: selectedRoleType, // Pass the selected UserSelectableMembershipRole string directly
      });

      if (result.success && result.initiative) {
        toast({
          title: "Success!",
          description: "Successfully joined the initiative.",
        });
        // Update local state with the full initiative data returned from the server action
        // This ensures the UI reflects the new membership and role immediately.
        setInitiative(result.initiative as Initiative); 
        // router.refresh(); // Re-fetch from server, might be redundant if server action returns full data
      } else {
        toast({
          title: "Error Joining",
          description: result.error || "Failed to join the initiative. Please try again.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error joining initiative:", error);
      toast({
        title: "Unexpected Error",
        description: "An unexpected error occurred while trying to join.",
        variant: "destructive",
      });
    } finally {
      setIsJoining(false);
    }
  };

  const handleSaveEditDialog = async (data: { title: string; description: string; imageFile?: File | null; clearImage?: boolean }): Promise<void> => {
    console.log("handleSaveEditDialog called with:", data);

    if (!isAdmin) {
      toast({
        title: "Unauthorized",
        description: "You do not have permission to edit this initiative.",
        variant: "destructive",
      });
      return;
    }

    let newImageUrl: string | null | undefined = undefined; // undefined means no change, null means clear

    if (data.clearImage) {
      newImageUrl = null; // Explicitly set to null to clear the image
      console.log("Image flagged to be cleared.");
    } else if (data.imageFile) {
      console.log("New image file provided, attempting upload...");
      try {
        const formData = new FormData();
        formData.append("file", data.imageFile);
        // Pass a filePath prefix to the upload API if you want to store initiative images in a specific "folder"
        formData.append("filePath", "initiatives/banners"); 

        const response = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || `Image upload failed with status: ${response.status}`);
        }

        const result = await response.json();
        newImageUrl = result.imageUrl; // Azure Blob URL from our API
        console.log("Image uploaded, URL:", newImageUrl);
      } catch (uploadError: any) {
        console.error("Error uploading image:", uploadError);
        toast({
          title: "Image Upload Failed",
          description: uploadError.message || "Could not upload the new image. Please try again.",
          variant: "destructive",
        });
        return; // Stop if image upload fails
      }
    }
    // If newImageUrl is still undefined here, it means no new image was uploaded and clearImage was false.
    // So, we don't want to change the existing imageUrl.

    try {
      console.log("Calling updateInitiativeAction with imageUrl:", newImageUrl);
      const result = await updateInitiativeAction({
        initiativeId: initiative.id,
        title: data.title,
        description: data.description,
        // Only pass imageUrl if it's a new URL (string) or null (to clear).
        // If undefined, the action should not update the image.
        imageUrl: newImageUrl, 
      });

      if (result.success && result.initiative) {
        // CRITICAL: Update the local state with the full initiative data returned from the server action.
        // This ensures the UI reflects the new image URL or its absence.
        setInitiative(result.initiative as Initiative); 
        toast({
          title: "Initiative Updated",
          description: "Your changes have been saved successfully.",
        });
        setIsEditDialogOpen(false);
        // router.refresh(); // This might be an alternative if setInitiative doesn't correctly update,
                           // but setInitiative should be preferred for a smoother UX.
      } else {
        toast({
          title: "Update Failed",
          description: result.error || "Could not save changes. Please try again.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error updating initiative:", error);
      toast({
        title: "Unexpected Error",
        description: "An error occurred while saving your changes.",
        variant: "destructive",
      });
    }
  };

  const handleGoalCreated = () => {
    setIsCreateGoalDialogOpen(false);
    router.refresh(); // Refresh data to show the new goal
    toast({
      title: "Goal Created!",
      description: "Your new goal has been added to the initiative.",
    });
  };

  // Helper to transform backend update to frontend Update type
  function transformRawUpdate(rawUpdate: any): Initiative['updates'][number] {
    return {
      id: rawUpdate.id,
      content: rawUpdate.content,
      userId: rawUpdate.userId,
      user: {
        id: rawUpdate.user.id,
        name: rawUpdate.user.name || 'Unknown User',
        image: rawUpdate.user.image || null,
      },
      media: (rawUpdate.media || []).map((m: any) => ({
        id: m.id,
        url: m.url,
        type: m.type,
        updateId: m.updateId ?? null,
        postId: m.postId ?? null,
      })),
      type: rawUpdate.type,
      timestamp: new Date(rawUpdate.createdAt),
      createdAt: new Date(rawUpdate.createdAt),
      updatedAt: new Date(rawUpdate.updatedAt || rawUpdate.createdAt),
      reactionCount: rawUpdate.reactionCount || 0,
      commentCount: rawUpdate.commentCount || 0,
      details: rawUpdate.details || {},
    };
  }

  // Helper to transform database chat message to frontend EnhancedChatMessage type
  function transformDatabaseChatMessage(dbMessage: any): EnhancedChatMessage {
    // Log the complete dbMessage object received by the function
    console.log('transformDatabaseChatMessage: received dbMessage:', dbMessage);

    console.log('transformDatabaseChatMessage: raw dbMessage:', dbMessage);
    const messageText = dbMessage.text || dbMessage.content || '';
    console.log('transformDatabaseChatMessage: evaluated text value:', messageText);
    const transformedMessage = {
      id: dbMessage.id,
      // Use text if available, otherwise use content
      text: messageText, 
      content: messageText, // Keep content for compatibility if needed elsewhere
      timestamp: new Date(dbMessage.timestamp), // Ensure it's a Date object
      sender: dbMessage.sender ? {
        id: dbMessage.sender.id,
        name: dbMessage.sender.name || 'Unknown Sender',
        image: dbMessage.sender.image || undefined, // Map null to undefined
      } : {
        id: dbMessage.senderId || 'unknown', // Use senderId if sender object is missing
        name: dbMessage.senderName || 'Unknown Sender',
        image: undefined
      },
      senderName: dbMessage.sender?.name || dbMessage.senderName || 'Unknown Sender',
      senderImage: dbMessage.sender?.image || undefined, // Map null to undefined
      user: dbMessage.sender ? { // Map sender to user property for EnhancedChatMessage
        id: dbMessage.sender.id,
        name: dbMessage.user?.name || dbMessage.sender.name || 'Unknown User', // Added dbMessage.user?.name as a fallback
        image: dbMessage.user?.image || dbMessage.sender.image || undefined
      } : { // Fallback if sender object is missing
        id: dbMessage.senderId || 'unknown',
        name: dbMessage.senderName || 'Unknown User',
        image: undefined
      },
    };
    console.log('transformDatabaseChatMessage: transformed message:', transformedMessage);
    return transformedMessage;
  }

  const handleSendMessage = async (message: string) => {
    if (!message.trim()) return;

    const messagePayload = {
      initiativeId,
      text: message,
      senderId: session?.user?.id,
      senderName: session?.user?.name || 'Anonymous',
    };

    console.log('handleSendMessage: Sending message payload:', messagePayload);

    try {
      const response = await fetch('/api/chat/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(messagePayload),
      });

      if (!response.ok) {
        throw new Error('Failed to send message');
      }

      const savedMessage = await response.json();

      // Update the main initiative state with the raw saved message
      setInitiative(prev => ({
        ...prev,
        chatMessages: [...(prev.chatMessages || []), savedMessage as any] // Add raw message to main state
      }));

      // useMemo will automatically re-calculate transformedMessages because initiative.chatMessages changed
      console.log('handleSendMessage: Main initiative state updated with new raw message.');

      // Emit socket event for real-time updates
      if (socket) {
        // Emit the transformed message to ensure consistency on other clients
        socket.emit('sendMessage', transformDatabaseChatMessage(savedMessage));
      }
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: "Error",
        description: "Failed to send message. Please try again.",
        variant: "destructive",
      });
    }
  };

  const transformedOnlineMembers = initiative.memberships?.map((membership) => ({
    id: membership.user.id,
    name: membership.user.name || 'Unknown User',
    lastActive: membership.user.lastActive || new Date(), // Default to current date if undefined
  })) || [];

  return (
    <div className="relative min-h-screen">
      {/* Overlay for Mobile Sidebar */}
      {isMobile && isSidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm transition-opacity duration-300 ease-in-out"
          onClick={toggleSidebar} // Close sidebar when overlay is clicked
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
                    {isAdmin && ( // Show Edit button only if user is ADMIN
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-foreground hover:text-foreground hover:bg-card/30 h-8 w-8 p-0"
                        onClick={() => setIsEditDialogOpen(true)}
                      >
                        <Edit className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    <Badge variant="secondary" className="bg-card/30 text-foreground text-xs backdrop-blur-sm">
                      {initiative.status}
                    </Badge>
                    <Badge variant="secondary" className="bg-card/30 text-foreground text-xs backdrop-blur-sm">
                      {initiative.memberships?.length || 0} members
                    </Badge>
                    {/* TODO: Update online members count based on a more reliable presence system if needed */}
                    {/* <Badge variant="secondary" className="bg-accent/20 text-accent text-xs backdrop-blur-sm">
                      {initiative.memberships?.filter(m => m.user.lastActive && new Date(m.user.lastActive).getTime() > Date.now() - 5 * 60 * 1000).length || 0} online now
                    </Badge> */}
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
                  {!isMember && userId && (
                    <Button 
                      size="sm"
                      className="bg-primary text-white font-medium h-8 text-xs"
                      onClick={handleOpenRoleSelection}
                      disabled={isJoining}
                    >
                      {isJoining ? (
                        <>
                          Joining...
                        </>
                      ) : (
                        <>
                          <UserPlus className="h-3 w-3 mr-1" />
                          Join
                        </>
                      )}
                    </Button>
                  )}
                  {isMember && currentUserMembership?.role !== InitiativeRoleType.ADMIN && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="bg-card/30 text-foreground hover:bg-card/50 h-8 text-xs backdrop-blur-sm"
                      onClick={handleOpenChangeRoleModal}
                      disabled={isUpdatingRole}
                    >
                      {isUpdatingRole ? "Updating..." : "Change Role"}
                    </Button>
                  )}
                  {isMember && (
                    <Button
                      variant="destructive"
                      size="sm"
                      className="h-8 text-xs"
                      onClick={handleLeaveInitiative}
                      disabled={isLeaving}
                    >
                      {isLeaving ? "Leaving..." : "Leave Initiative"}
                    </Button>
                  )}
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
            <div className="mb-8">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-semibold">Goals</h2>
                {isMember && (
                  <Button onClick={() => setIsCreateGoalDialogOpen(true)}>
                    <Plus className="mr-2 h-4 w-4" /> Add Goal
                  </Button>
                )}
              </div>
              {initiative.goals && initiative.goals.length > 0 ? (
                <ScrollArea className="w-full">
                  <div className="flex gap-4 pb-4">
                    {initiative.goals.map((goal) => (
                      <Link key={goal.id} href={`/initiatives/${initiativeId}/goals/${goal.id}`} passHref>
                        <Card className="min-w-[300px] flex-shrink-0 cursor-pointer hover:shadow-lg transition-shadow">
                          <CardHeader>
                            <CardTitle className="text-base">{goal.title}</CardTitle>
                            <CardDescription className="line-clamp-2">{goal.description}</CardDescription>
                          </CardHeader>
                          <CardContent>
                            <div className="space-y-2">
                              <div className="flex items-center text-sm text-muted-foreground">
                                <Badge variant={goal.status === 'Completed' ? 'default' : 'secondary'} className="mr-2">
                                  {goal.status}
                                </Badge>
                                {goal.priority && (
                                  <Badge variant="outline" className="mr-2">{goal.priority}</Badge>
                                )}
                                {goal.progress !== undefined && (
                                  <span className="text-xs">{goal.progress}%</span>
                                )}
                              </div>
                              {goal.ownerName && (
                                <div className="flex items-center text-sm">
                                  <Avatar className="h-6 w-6 mr-2">
                                    <AvatarImage src={goal.ownerAvatar || undefined} alt={goal.ownerName} />
                                    <AvatarFallback>{goal.ownerName.charAt(0)}</AvatarFallback>
                                  </Avatar>
                                  <span>{goal.ownerName}</span>
                                </div>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      </Link>
                    ))}
                  </div>
                  <ScrollBar orientation="horizontal" />
                </ScrollArea>
              ) : (
                <Card className="text-center py-8">
                  <CardContent>
                    <TrendingUp className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                    <p className="text-muted-foreground mb-4">
                      No goals set yet. Be the first to define a target!
                    </p>
                    {isMember && (
                      <Button onClick={() => setIsCreateGoalDialogOpen(true)}>
                        <Plus className="mr-2 h-4 w-4" /> Add Goal
                      </Button>
                    )}
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Updates Section */}
            <div className="space-y-4">
              <h2 className="text-xl font-semibold">Updates</h2>
              {(isMember || isAdmin) && (
                <CreateUpdateForm 
                  initiativeId={initiativeId} 
                  onPostUpdate={async (updateData) => {
                    console.log('Attempting to post new update:', updateData);
                    if (!userId) {
                      toast({
                        title: "Authentication Error",
                        description: "You must be logged in to post an update.",
                        variant: "destructive",
                      });
                      return;
                    }
                    try {
                      const result = await createUpdateAction({
                        initiativeId: initiativeId,
                        userId: userId,
                        content: updateData.content,
                        type: UpdateType.post, // Corrected to use UpdateType.post
                        media: updateData.imageUrl ? [{ url: updateData.imageUrl, type: 'IMAGE' as const }] : undefined,
                      });

                      if (result.success) {
                        toast({
                          title: "Update Posted!",
                          description: "Your update has been added to the initiative.",
                        });
                        router.refresh();
                      } else {
                        toast({
                          title: "Error Posting Update",
                          description: result.error || "Could not post your update.",
                          variant: "destructive",
                        });
                      }
                    } catch (error) {
                      console.error("Error in onPostUpdate:", error);
                      toast({
                        title: "Unexpected Error",
                        description: "An error occurred while posting the update.",
                        variant: "destructive",
                      });
                    }
                  }} 
                />
              )}
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
              members={initiative.memberships?.map(mem => ({
                id: mem.user.id,
                name: mem.user.name || 'Unknown',
                image: mem.user.image || null,
                email: undefined, // email is not in UserForDisplay
                role: mem.role,
                joinedAt: new Date(), // Placeholder for joinedAt
                lastActive: mem.user.lastActive,
              })) || []} 
              isMobile={isMobile}
              isOpen={isSidebarOpen}
              onToggle={toggleSidebar}
              onToggleChat={() => setIsChatOpen(!isChatOpen)}
              isChatOpen={isChatOpen}
            />
          </div>
        </div>

        {/* Edit Dialog */}
        {isAdmin && ( // Conditionally render EditInitiativeDialog based on isAdmin
          <EditInitiativeDialog
            initiative={initiative}
            isOpen={isEditDialogOpen}
            onClose={() => setIsEditDialogOpen(false)}
            onSave={handleSaveEditDialog} 
          />
        )}

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
          availableMembershipRoles={ALL_USER_SELECTABLE_MEMBERSHIP_ROLES} 
          isOpen={isRoleSelectionOpen}
          onClose={() => setIsRoleSelectionOpen(false)}
          onRoleSelect={handleRoleSelectedAndJoin} // This now correctly passes UserSelectableMembershipRole
        />

        {/* Change Role Modal (similar to RoleSelectionModal but for existing members) */}
        {currentUserMembership && currentUserMembership.role !== InitiativeRoleType.ADMIN && (
          <RoleSelectionModal
            title="Change Your Role"
            description="Select a new role for yourself in this initiative."
            availableMembershipRoles={ALL_USER_SELECTABLE_MEMBERSHIP_ROLES.filter(r => r !== currentUserMembership.role)}
            isOpen={isChangeRoleModalOpen}
            onClose={() => setIsChangeRoleModalOpen(false)}
            onRoleSelect={handleRoleChange} // New handler for changing role
            currentRole={currentUserMembership.role as UserSelectableMembershipRole}
          />
        )}

        {/* Create Goal Dialog */}
        {isCreateGoalDialogOpen && (
          <CreateGoalDialog
            initiativeId={initiativeId}
            isOpen={isCreateGoalDialogOpen}
            onClose={() => setIsCreateGoalDialogOpen(false)}
            onGoalCreated={handleGoalCreated} // Pass the callback
          />
        )}

        {/* Chat Panel */}
        <ChatPanel
          isOpen={isChatOpen}
          messages={transformedMessages}
          onSendMessage={handleSendMessage}
          onClose={() => setIsChatOpen(false)}
          socket={socket}
          currentUserId={userId}
        />
      </div>
    </div>
  );
}