'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
// Add a simple log to check if the component file is being executed
console.log('InitiativeClientPage.tsx loaded');

import Link from 'next/link';
import Image from 'next/image';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Send, X, CheckCircle, Paperclip, ExternalLink, TrendingUp, Pin, ThumbsUp, PartyPopper, Heart, Lightbulb, Share2, Image as ImageIcon, Archive, UserPlus, Plus, MessageSquare, Twitter, Facebook, Link2, Edit, Menu, Trash2, Download, Info, RefreshCw, Users } from 'lucide-react';
import { cn } from "@/lib/utils";
import { Textarea } from "@/components/ui/textarea";
import { formatDistanceToNow } from 'date-fns';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { useToast } from "@/components/ui/use-toast"; // Ensure this import is present
import imageCompression from 'browser-image-compression';
import type { Initiative, Role, UserSelectableMembershipRole, Member, EnhancedChatMessage, Goal, Milestone, Update, UserForDisplay, InitiativeStatus, Priority, GoalStatus, Action, StepStatus } from "@/lib/types"; 
import { ALL_USER_SELECTABLE_MEMBERSHIP_ROLES } from "@/lib/types";
import { MissionProgressBanner } from './MissionProgressBanner';
import { InitiativeSidebar } from '@/components/initiatives/InitiativeSidebar'; // Corrected import path
import AppSidebar, { getDefaultCollapsedState } from '@/components/AppSidebar'; // Add global AppSidebar
import { CreateUpdateForm } from './CreateUpdateForm';
import { UpdateCard } from '@/components/UpdateCard';
import { EditInitiativeDialog } from './EditInitiativeDialog';
import { RoleSelectionModal } from './RoleSelectionModal';
import { useSession } from "next-auth/react";
import { joinInitiativeAction, updateInitiativeAction, updateInitiativeMembershipAction, leaveInitiativeAction, createUpdate as createUpdateAction, deleteInitiative } from "@/app/actions/initiativeActions"; // Added updateInitiativeAction, createUpdateAction, and deleteInitiative
import { InitiativeRoleType, UpdateType } from '@prisma/client'; // Added this import
import { CreateGoalDialog } from './CreateGoalDialog'; // Import CreateGoalDialog
import { useIsMobile } from '@/hooks/use-mobile';
import { ChatPanel } from '@/components/initiatives/ChatPanel';
// import { io, Socket } from 'socket.io-client'; // Temporarily disabled for Vercel deployment
import { SuggestedGoalTag } from '@/components/initiatives/SuggestedGoalTag';
import { deleteGoal } from '@/app/actions/goalActions';
import { SocialShareDialog } from '@/components/social/SocialShareDialog';

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

// Simple QR Code generator using canvas
const generateQRCodeDataURL = (text: string): string => {
  // Using a simple QR code pattern for demonstration
  // In production, you might want to use a proper QR code library
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';
  
  const size = 200;
  canvas.width = size;
  canvas.height = size;
  
  // Clear canvas with white background
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, size, size);
  
  // Simple grid pattern - this is a placeholder implementation
  // For a real QR code, you'd need a proper QR code generation algorithm
  const modules = 25; // QR code modules
  const moduleSize = size / modules;
  
  ctx.fillStyle = '#000000';
  
  // Create a simple pattern based on the text
  const hash = text.split('').reduce((a, b) => {
    a = ((a << 5) - a) + b.charCodeAt(0);
    return a & a;
  }, 0);
  
  // Generate pattern
  for (let row = 0; row < modules; row++) {
    for (let col = 0; col < modules; col++) {
      const value = (hash + row * modules + col) % 3;
      if (value === 0) {
        ctx.fillRect(col * moduleSize, row * moduleSize, moduleSize, moduleSize);
      }
    }
  }
  
  // Add finder patterns (corner squares) for QR code appearance
  const finderSize = moduleSize * 7;
  
  // Top-left finder pattern
  ctx.fillStyle = '#000000';
  ctx.fillRect(0, 0, finderSize, finderSize);
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(moduleSize, moduleSize, finderSize - 2 * moduleSize, finderSize - 2 * moduleSize);
  ctx.fillStyle = '#000000';
  ctx.fillRect(moduleSize * 2, moduleSize * 2, finderSize - 4 * moduleSize, finderSize - 4 * moduleSize);
  
  // Top-right finder pattern
  ctx.fillStyle = '#000000';
  ctx.fillRect(size - finderSize, 0, finderSize, finderSize);
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(size - finderSize + moduleSize, moduleSize, finderSize - 2 * moduleSize, finderSize - 2 * moduleSize);
  ctx.fillStyle = '#000000';
  ctx.fillRect(size - finderSize + moduleSize * 2, moduleSize * 2, finderSize - 4 * moduleSize, finderSize - 4 * moduleSize);
  
  // Bottom-left finder pattern
  ctx.fillStyle = '#000000';
  ctx.fillRect(0, size - finderSize, finderSize, finderSize);
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(moduleSize, size - finderSize + moduleSize, finderSize - 2 * moduleSize, finderSize - 2 * moduleSize);
  ctx.fillStyle = '#000000';
  ctx.fillRect(moduleSize * 2, size - finderSize + moduleSize * 2, finderSize - 4 * moduleSize, finderSize - 4 * moduleSize);
  
  return canvas.toDataURL();
};

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

  // console.log('ENV SOCKET URL:', process.env.NEXT_PUBLIC_SOCKET_SERVER_URL); // Temporarily disabled for Vercel deployment

  const { data: session } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast(); // Call useToast to get the toast function
  const userId = session?.user?.id; 

  // Initialize main initiative state (Revert type to Initiative)
  const [initiative, setInitiative] = useState<Initiative>(initialInitiative);

  // Local state for updates to enable immediate UI updates
  const [localUpdates, setLocalUpdates] = useState<Update[]>(initialInitiative.updates || []);

  // State for response context
  const [respondingTo, setRespondingTo] = useState<{ id: string; content: string } | null>(null);

  // Log the initiative state right after initialization
  console.log('InitiativeClientPage: Initiative state after useState initialization:', initiative);

  // const [socket, setSocket] = useState<Socket | null>(null); // Temporarily disabled for Vercel deployment
  const socket = null; // Socket disabled for Vercel deployment

  // Memoize the transformed chat messages, dependent directly on the initiative state (not just initialInitiative)
  const transformedMessages = useMemo(() => {
    return initiative.chatMessages?.map(transformDatabaseChatMessage) || [];
  }, [initiative.chatMessages]);

  useEffect(() => {
    // Socket connection temporarily disabled for Vercel deployment
    // TODO: Re-enable real-time chat after implementing polling system
    // const socketUrl = process.env.NEXT_PUBLIC_SOCKET_SERVER_URL || 'http://localhost:9003';
    // console.log('Attempting to connect to socket server at:', socketUrl, 'with path:', '/api/socketio');
    // const socketInstance = io(socketUrl, {
    //   path: '/api/socketio',
    //   transports: ['websocket', 'polling']
    // });
    // setSocket(socketInstance);

    // socketInstance.on('connect', () => {
    //   console.log('InitiativeClientPage: Socket instance connected successfully!');
    //   socketInstance.emit('joinInitiativeRoom', initiativeId);
    // });

    // return () => {
    //   console.log('InitiativeClientPage: Disconnecting socket instance.');
    //   socketInstance.disconnect();
    // };
  }, []);

  // Auto-join functionality - check for ?join=true parameter
  useEffect(() => {
    const shouldAutoJoin = searchParams.get('join') === 'true';
    if (shouldAutoJoin && userId) {
      // Check if user is already a member
      const isAlreadyMember = initiative.memberships?.some(membership => membership.userId === userId);
      if (!isAlreadyMember) {
        setIsRoleSelectionOpen(true);
      }
    }
  }, [searchParams, userId, initiative.memberships]);

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
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => getDefaultCollapsedState({ type: 'initiative', data: initiative })); // State for sidebar collapsed
  const isMobile = useIsMobile();

  // State for suggested goals
  const [suggestedGoals, setSuggestedGoals] = useState<Array<{ title: string; description: string }>>([]);
  const [selectedSuggestedGoal, setSelectedSuggestedGoal] = useState<{ title: string; description: string } | null>(null);
  const [isLoadingGoals, setIsLoadingGoals] = useState(false);
  const [goalsFromCache, setGoalsFromCache] = useState(false);
  
  // State for QR code
  const [qrCodeDataURL, setQrCodeDataURL] = useState<string>('');

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

  const handleCopyLink = async () => {
    const autoJoinUrl = `${window.location.origin}/initiatives/${initiativeId}?join=true`;
    try {
      await navigator.clipboard.writeText(autoJoinUrl);
      toast({
        title: "Link copied!",
        description: "The auto-join link has been copied to your clipboard.",
      });
    } catch (error) {
      toast({
        title: "Failed to copy",
        description: "Could not copy the link to clipboard.",
        variant: "destructive",
      });
    }
  };

  // Generate QR code when share modal opens
  useEffect(() => {
    if (isShareOpen && typeof window !== 'undefined') {
      const autoJoinUrl = `${window.location.origin}/initiatives/${initiativeId}?join=true`;
      const qrDataURL = generateQRCodeDataURL(autoJoinUrl);
      setQrCodeDataURL(qrDataURL);
    }
  }, [isShareOpen, initiativeId]);

  const handleDownloadQRCode = () => {
    if (!qrCodeDataURL) return;
    
    const link = document.createElement('a');
    link.download = `initiative-${initiative.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}-qr-code.png`;
    link.href = qrCodeDataURL;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast({
      title: "QR Code Downloaded!",
      description: "The QR code has been saved to your downloads.",
    });
  };

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
        title: "Not a Participant",
        description: "You are not a participant of this project.",
        variant: "destructive",
      });
      return;
    }

    setIsLeaving(true);
    try {
      const result = await leaveInitiativeAction({ initiativeId: initiative.id });
      if (result.success) {
        toast({
          title: "Left Project",
          description: "You have successfully left the project.",
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

  const handleSaveEditDialog = async (data: { title: string; description: string; imageFile?: File | null; clearImage?: boolean; roles: string[] }): Promise<void> => {
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
        // Compress image before uploading to avoid 413 (payload too large) errors
        const options = {
          maxSizeMB: 3, // Max 3MB to stay well under Vercel's 4.5MB limit
          maxWidthOrHeight: 1920,
          useWebWorker: true,
          fileType: 'image/jpeg',
        };

        console.log('Compressing image...', {
          originalSize: (data.imageFile.size / 1024 / 1024).toFixed(2) + 'MB',
          originalType: data.imageFile.type
        });

        const compressedFile = await imageCompression(data.imageFile, options);

        console.log('Image compressed:', {
          compressedSize: (compressedFile.size / 1024 / 1024).toFixed(2) + 'MB',
          reduction: ((1 - compressedFile.size / data.imageFile.size) * 100).toFixed(1) + '%'
        });

        const formData = new FormData();
        formData.append("file", compressedFile);
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
        imageUrl: newImageUrl === null ? undefined : newImageUrl,
        roles: data.roles,
      });

      if (result.success && result.initiative) {
        setInitiative(prev => ({
          ...prev,
          ...result.initiative
        }));
        toast({
          title: "Initiative Updated",
          description: "Your changes have been saved successfully.",
        });
        setIsEditDialogOpen(false);
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

  const handleGoalCreated = (newGoal: Goal) => {
    setIsCreateGoalDialogOpen(false);
    // Update the initiative state by adding the new goal to the goals array
    setInitiative(prevInitiative => ({
      ...prevInitiative,
      goals: [...(prevInitiative.goals || []), newGoal],
    }));
    toast({
      title: "Goal Created!",
      description: "Your new goal has been added to the initiative.",
    });
    // Clear selected suggested goal after creation
    setSelectedSuggestedGoal(null);
  };

  const handleSuggestedGoalClick = (goal: { title: string; description: string }) => {
    setSelectedSuggestedGoal(goal);
    setIsCreateGoalDialogOpen(true);
  };

  const handleRefreshGoals = async () => {
    if (!initiativeId) return;

    setIsLoadingGoals(true);
    setGoalsFromCache(false);
    clearCachedGoals(initiativeId);

    try {
      const response = await fetch(`/api/initiatives/${initiativeId}/suggest-goals`);
      if (!response.ok) {
        console.error('Failed to fetch suggested goals:', response.statusText);
        setSuggestedGoals([]);
        toast({
          title: "Failed to refresh goals",
          description: "Please try again later.",
          variant: "destructive",
        });
        return;
      }
      const data = await response.json();
      setSuggestedGoals(data);
      setCachedGoals(initiativeId, data);

      toast({
        title: "Goals refreshed!",
        description: "New AI-suggested goals have been generated.",
      });
    } catch (error) {
      console.error('Error refreshing goals:', error);
      toast({
        title: "Error refreshing goals",
        description: "Please try again later.",
        variant: "destructive",
      });
    } finally {
      setIsLoadingGoals(false);
    }
  };

  // localStorage helper functions for AI suggested goals
  const getCachedGoals = (initiativeId: string) => {
    try {
      const cacheKey = `aiGoals_${initiativeId}`;
      const cached = localStorage.getItem(cacheKey);
      if (!cached) return null;

      const parsed = JSON.parse(cached);
      const now = Date.now();

      // Check if cache is expired (7 days)
      if (parsed.expiresAt && now > parsed.expiresAt) {
        localStorage.removeItem(cacheKey);
        return null;
      }

      return parsed.goals;
    } catch (error) {
      console.error('Error reading cached goals:', error);
      return null;
    }
  };

  const setCachedGoals = (initiativeId: string, goals: Array<{ title: string; description: string }>) => {
    try {
      const cacheKey = `aiGoals_${initiativeId}`;
      const cacheData = {
        goals,
        timestamp: Date.now(),
        expiresAt: Date.now() + (7 * 24 * 60 * 60 * 1000), // 7 days
      };
      localStorage.setItem(cacheKey, JSON.stringify(cacheData));
    } catch (error) {
      console.error('Error caching goals:', error);
    }
  };

  const clearCachedGoals = (initiativeId: string) => {
    try {
      const cacheKey = `aiGoals_${initiativeId}`;
      localStorage.removeItem(cacheKey);
    } catch (error) {
      console.error('Error clearing cached goals:', error);
    }
  };

  // Effect to fetch suggested goals when the initiativeId changes
  useEffect(() => {
    const fetchSuggestedGoals = async (forceRefresh = false) => {
      if (!initiativeId) return;

      // Check cache first unless force refresh
      if (!forceRefresh) {
        const cached = getCachedGoals(initiativeId);
        if (cached) {
          console.log('Using cached suggested goals for initiative:', initiativeId);
          setSuggestedGoals(cached);
          setGoalsFromCache(true);
          return;
        }
      }

      // Fetch from API
      console.log('Fetching suggested goals from API for initiative:', initiativeId);
      setIsLoadingGoals(true);
      setGoalsFromCache(false);

      try {
        const response = await fetch(`/api/initiatives/${initiativeId}/suggest-goals`);
        if (!response.ok) {
          console.error('Failed to fetch suggested goals:', response.statusText);
          setSuggestedGoals([]); // Clear suggestions on error
          return;
        }
        const data = await response.json();
        setSuggestedGoals(data);

        // Cache the results
        setCachedGoals(initiativeId, data);
      } catch (error) {
        console.error('Error fetching suggested goals:', error);
        setSuggestedGoals([]); // Clear suggestions on error
      } finally {
        setIsLoadingGoals(false);
      }
    };

    fetchSuggestedGoals();
  }, [initiativeId]); // Removed setSuggestedGoals and toast from dependencies

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
      text: messageText, 
      content: messageText,
      timestamp: new Date(dbMessage.timestamp),
      sender: dbMessage.sender ? {
        id: dbMessage.sender.id,
        name: dbMessage.sender.name || 'Unknown Sender',
        image: dbMessage.sender.image || undefined,
      } : {
        id: dbMessage.senderId || 'unknown',
        name: dbMessage.senderName || 'Unknown Sender',
        image: undefined
      },
      senderName: dbMessage.sender?.name || dbMessage.senderName || 'Unknown Sender',
      senderImage: dbMessage.sender?.image || undefined,
      user: dbMessage.sender ? {
        id: dbMessage.sender.id,
        name: dbMessage.user?.name || dbMessage.sender.name || 'Unknown User',
        image: dbMessage.user?.image || dbMessage.sender.image || undefined
      } : {
        id: dbMessage.senderId || 'unknown',
        name: dbMessage.senderName || 'Unknown User',
        image: undefined
      },
      receiverId: dbMessage.receiverId || null,
      createdAt: dbMessage.createdAt ? new Date(dbMessage.createdAt) : new Date(dbMessage.timestamp),
      replyToId: dbMessage.replyToId ?? null,
      isDeleted: dbMessage.isDeleted ?? false,
      deletedAt: dbMessage.deletedAt ? new Date(dbMessage.deletedAt) : null,
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

      // Socket event temporarily disabled for Vercel deployment
      // TODO: Re-enable real-time message broadcasting after implementing polling system
      // if (socket) {
      //   socket.emit('sendMessage', transformDatabaseChatMessage(savedMessage));
      // }
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

  // Add delete handler
  const handleDeleteInitiative = async () => {
    if (!window.confirm("Are you sure you want to delete this initiative? This action cannot be undone.")) return;
    const result = await deleteInitiative(initiative.id);
    if (result.success) {
      toast({ title: "Initiative Deleted", description: "The initiative has been deleted." });
      router.push('/');
    } else {
      toast({ title: "Error", description: result.error || "Failed to delete initiative.", variant: "destructive" });
    }
  };

  // Delete update handler
  const handleDeleteUpdate = async (updateId: string) => {
    try {
      const response = await fetch(`/api/updates/${updateId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete update');
      }

      // Remove update from local state
      setLocalUpdates(prev => prev.filter(update => update.id !== updateId));

      toast({
        title: "Update Deleted",
        description: "The update has been removed.",
      });
    } catch (error) {
      console.error('Error deleting update:', error);
      toast({
        title: "Error",
        description: "Failed to delete update. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <>

      {/* Global AppSidebar for consistent navigation - matches society page pattern */}
      <AppSidebar 
        context={{ type: 'initiative', data: initiative }}
        className="z-30"
        onCollapseChange={setSidebarCollapsed}
      />

      {/* Fixed Initiative Sidebar for Desktop - matches society pattern */}
      {!isMobile && (
        <div className="fixed right-4 top-6 z-30 w-80 h-[calc(100vh-3rem)] overflow-y-auto bg-background/95 backdrop-blur-sm border rounded-lg shadow-lg p-4">
          <InitiativeSidebar
            initiative={initiative}
            members={initiative.memberships?.map(mem => ({
              id: mem.user.id,
              name: mem.user.name || 'Unknown',
              image: mem.user.image || null,
              email: undefined,
              role: mem.role,
              customRole: mem.customRole || null,
              joinedAt: new Date(),
              lastActive: mem.user.lastActive,
            })) || []}
            isMobile={isMobile}
            onToggleChat={() => setIsChatOpen(!isChatOpen)}
            isChatOpen={isChatOpen}
            isMember={isMember}
            currentUserId={userId}
          />
        </div>
      )}

      {/* Mobile Initiative Sidebar - overlay when needed */}
      {isMobile && isSidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm transition-opacity duration-300 ease-in-out"
          onClick={() => setIsSidebarOpen(false)}
          aria-hidden="true"
        />
      )}
      
      {/* Mobile Initiative Sidebar - only render when mobile and needed */}
      {isMobile && (
        <InitiativeSidebar
          initiative={initiative}
          members={initiative.memberships?.map(mem => ({
            id: mem.user.id,
            name: mem.user.name || 'Unknown',
            image: mem.user.image || null,
            email: undefined,
            role: mem.role,
            customRole: mem.customRole || null,
            joinedAt: new Date(),
            lastActive: mem.user.lastActive,
          })) || []}
          isMobile={isMobile}
          isOpen={isSidebarOpen}
          onToggle={() => setIsSidebarOpen(false)}
          onToggleChat={() => setIsChatOpen(!isChatOpen)}
          isChatOpen={isChatOpen}
          isMember={isMember}
          currentUserId={userId}
        />
      )}

      {/* Mobile Initiative Info Toggle Button */}
      {isMobile && (
        <Button
          variant="outline"
          size="icon"
          className="fixed top-4 right-4 z-[60] bg-background/95 backdrop-blur-sm border shadow-lg rounded-full p-3 w-12 h-12 flex items-center justify-center hover:bg-background/90 transition-all duration-200"
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
        >
          {isSidebarOpen ? (
            <X className="h-5 w-5" />
          ) : (
            <Info className="h-5 w-5" />
          )}
          <span className="sr-only">{isSidebarOpen ? "Close initiative info" : "Open initiative info"}</span>
        </Button>
      )}

      <div className={`relative min-h-screen transition-all duration-300 ${
        sidebarCollapsed ? 'lg:ml-16' : 'lg:ml-80 xl:ml-96'
      } lg:pr-[22rem] pb-16 md:pb-0`}>
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
                    {initiative.society && (
                      <Link href={`/societies/${initiative.society.id}`} className="hover:opacity-80 transition-opacity">
                        <Badge variant="outline" className="bg-white/10 text-foreground border-white/30 text-xs backdrop-blur-sm cursor-pointer hover:bg-white/20 transition-colors">
                          🏛️ {initiative.society.name}
                        </Badge>
                      </Link>
                    )}
                    <Badge variant="secondary" className="bg-card/30 text-foreground text-xs backdrop-blur-sm">
                      {initiative.memberships?.length || 0} participants
                    </Badge>
                    <Badge variant="secondary" className="bg-card/30 text-foreground text-xs backdrop-blur-sm">
                      {getLocationDisplay(initiative.location) || 'Online'}
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
                  {isMember && currentUserMembership?.role !== InitiativeRoleType.ADMIN && initiative.creator?.id !== userId && (
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
                  {isMember && initiative.creator?.id !== userId && (
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
                  {isMember && initiative.creator?.id === userId && (
                    <Button
                      variant="destructive"
                      size="sm"
                      className="h-8 text-xs"
                      onClick={handleDeleteInitiative}
                    >
                      Delete Initiative
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* Main Content - Full width with right sidebar space */}
        <div className="space-y-6">
            {/* Mission Progress Banner */}
            <MissionProgressBanner
              initiative={initiative}
              milestones={initiative.milestones || []}
              onContributeClick={() => setIsRoleSelectionOpen(true)}
              isMember={isMember}
            />

            {/* Goals Section - Member Only */}
            {isMember && (
            <div className="mb-8">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-semibold">Goals</h2>
                <Button onClick={() => setIsCreateGoalDialogOpen(true)}>
                  <Plus className="mr-2 h-4 w-4" /> Add Goal
                </Button>
              </div>
              {initiative.goals && initiative.goals.length > 0 ? (
                <ScrollArea className="w-full">
                  <div className="flex gap-4 pb-4">
                    {initiative.goals.map((goal) => {
                      // Count actions and completed actions if available
                      const actionsCount = Array.isArray(goal.actions) ? goal.actions.length : 0;
                      const completedActions = Array.isArray(goal.actions)
                        ? goal.actions.filter((a: Action) => a.status === 'Done').length
                        : 0;
                      return (
                        <Link key={goal.id} href={`/initiatives/${initiativeId}/goals/${goal.id}`} passHref>
                          <Card className="min-w-[300px] max-w-[298px] flex-shrink-0 cursor-pointer hover:shadow-lg transition-shadow relative">
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
                                  {/* Show actions count */}
                                  <span className="ml-2 text-xs text-muted-foreground">
                                    {actionsCount > 0
                                      ? `${completedActions}/${actionsCount} actions done`
                                      : '0 actions'}
                                  </span>
                                </div>
                                {goal.owner && (
                                  <div className="flex items-center text-sm">
                                    <Avatar className="h-6 w-6 mr-2">
                                      <AvatarImage src={goal.owner.image || undefined} alt={goal.owner.name || 'User'} />
                                      <AvatarFallback>{goal.owner.name?.charAt(0) || 'U'}</AvatarFallback>
                                    </Avatar>
                                    <span>{goal.owner.name || 'Unknown Owner'}</span>
                                  </div>
                                )}
                              </div>
                            </CardContent>
                            {initiative.creator?.id === userId && (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="absolute top-2 right-2 text-red-500 hover:bg-red-100"
                                onClick={async (e) => {
                                  e.preventDefault();
                                  const result = await deleteGoal(goal.id, userId);
                                  if (result.success) {
                                    setInitiative((prev) => ({
                                      ...prev,
                                      goals: prev.goals.filter((g) => g.id !== goal.id),
                                    }));
                                    toast({ title: 'Goal deleted', description: 'The goal was removed.' });
                                  } else {
                                    toast({ title: 'Error', description: result.error || 'Failed to delete goal.', variant: 'destructive' });
                                  }
                                }}
                                aria-label="Delete Goal"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            )}
                          </Card>
                        </Link>
                      );
                    })}
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
              {/* Suggested Goals Section */}
              <div className="mt-6">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-lg font-semibold">Suggested Goals</h3>
                  <div className="flex items-center gap-2">
                    {goalsFromCache && (
                      <span className="text-xs text-muted-foreground">Cached</span>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleRefreshGoals}
                      disabled={isLoadingGoals}
                      className="h-8"
                    >
                      <RefreshCw className={cn("h-4 w-4", isLoadingGoals && "animate-spin")} />
                      <span className="ml-1 text-xs">Refresh</span>
                    </Button>
                  </div>
                </div>
                {/* Placeholder for suggested goals */}
                <div className="flex flex-wrap gap-2">
                  {isLoadingGoals ? (
                    <p className="text-sm text-muted-foreground">Loading new suggestions...</p>
                  ) : suggestedGoals.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No suggestions available</p>
                  ) : (
                    suggestedGoals.map((goal, index) => (
                    <SuggestedGoalTag
                      key={index}
                      title={goal.title}
                      description={goal.description}
                      onClick={() => handleSuggestedGoalClick(goal)}
                    />
                  ))
                  )}
                </div>
              </div>
            </div>
            )}

            {/* Updates Section */}
            <div className="space-y-4 mx-auto" style={{ maxWidth: '700px' }}>
              <h2 className="text-xl font-semibold">Updates</h2>
              {isMember ? (
                <>
                  {respondingTo && (
                    <div className="mb-3 p-3 bg-muted/50 rounded-md border-l-2 border-primary">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <span className="text-xs text-muted-foreground font-medium">Responding to:</span>
                          <p className="text-xs text-muted-foreground italic line-clamp-2 mt-0.5">
                            "{respondingTo.content}"
                          </p>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setRespondingTo(null)}
                          className="h-6 w-6 p-0"
                        >
                          <X className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  )}
                  <CreateUpdateForm
                    initiativeId={initiativeId}
                    onPostUpdate={async (updateData) => {
                      if (!userId) {
                        toast({
                          title: "Authentication Error",
                          description: "You must be logged in to post an update.",
                          variant: "destructive",
                        });
                        return;
                      }
                      try {
                        // Prepare details object for links, documents, and response context
                        const details: any = {
                          links: updateData.links || [],
                          documents: updateData.documents || []
                        };

                        // Add parent update reference if responding
                        if (respondingTo) {
                          details.parentUpdateId = respondingTo.id;
                          details.parentContent = respondingTo.content.length > 150
                            ? respondingTo.content.substring(0, 150) + '...'
                            : respondingTo.content;
                        }

                        const result = await createUpdateAction({
                          initiativeId: initiativeId,
                          userId: userId,
                          content: updateData.content,
                          type: UpdateType.post,
                          media: updateData.imageUrl && updateData.mediaType
                            ? [{ url: updateData.imageUrl, type: updateData.mediaType }]
                            : undefined,
                          details: (details.links.length > 0 || details.documents.length > 0 || details.parentUpdateId) ? details : undefined,
                        });

                        if (result.success && result.update) {
                          // Immediately add the new update to local state
                          setLocalUpdates(prev => [result.update, ...prev]);

                          toast({
                            title: respondingTo ? "Response Posted!" : "Update Posted!",
                            description: respondingTo
                              ? "Your response has been added to the initiative."
                              : "Your update has been added to the initiative.",
                          });

                          // Clear responding state
                          setRespondingTo(null);

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

                  {/* Updates Feed - Only visible to members */}
                  {localUpdates && localUpdates.length > 0 ? (
                    <div className="space-y-4">
                      {localUpdates.map((update) => (
                        <UpdateCard
                          key={update.id}
                          update={update}
                          currentUserId={userId}
                          onDelete={handleDeleteUpdate}
                          onResponse={(parentId, parentContent) => {
                            setRespondingTo({ id: parentId, content: parentContent });
                            // Scroll to top where the form is
                            window.scrollTo({ top: 0, behavior: 'smooth' });
                          }}
                        />
                      ))}
                    </div>
                  ) : (
                    <Card className="bg-muted/50">
                      <CardContent className="p-6 text-center">
                        <p className="text-muted-foreground">No updates yet</p>
                        <p className="text-sm mt-2">Be the first to share progress!</p>
                      </CardContent>
                    </Card>
                  )}
                </>
              ) : (
                <Card className="bg-muted/50">
                  <CardContent className="p-6 text-center">
                    <Users className="h-12 w-12 text-muted-foreground/50 mx-auto mb-3" />
                    <h3 className="font-semibold mb-2">Join to View Updates</h3>
                    <p className="text-sm text-muted-foreground">
                      Become a member to see project updates and participate in discussions!
                    </p>
                  </CardContent>
                </Card>
              )}
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

        {/* Share Dialog - Use proper social sharing component */}
        <SocialShareDialog
          open={isShareOpen}
          onOpenChange={setIsShareOpen}
          contentType="initiative"
          contentId={initiativeId}
          contentTitle={initiative.title}
        />

        {/* Invite Dialog */}
        <Dialog open={isInviteOpen} onOpenChange={setIsInviteOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Invite Participants</DialogTitle>
              <DialogDescription>
                Invite others in on this project.
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
          customRoles={initiative.roles || []}
          isOpen={isRoleSelectionOpen}
          onClose={() => setIsRoleSelectionOpen(false)}
          onRoleSelect={handleRoleSelectedAndJoin}
        />

        {/* Change Role Modal (similar to RoleSelectionModal but for existing members) */}
        {currentUserMembership && currentUserMembership.role !== InitiativeRoleType.ADMIN && (
          <RoleSelectionModal
            title="Change Your Role"
            description="Select a new role for yourself in this initiative."
            availableMembershipRoles={ALL_USER_SELECTABLE_MEMBERSHIP_ROLES.filter(r => r !== currentUserMembership.role)}
            customRoles={initiative.roles || []}
            isOpen={isChangeRoleModalOpen}
            onClose={() => setIsChangeRoleModalOpen(false)}
            onRoleSelect={handleRoleChange}
            currentRole={currentUserMembership.role as UserSelectableMembershipRole}
          />
        )}

        {/* Create Goal Dialog */}
        {isCreateGoalDialogOpen && (
          <CreateGoalDialog
            initiativeId={initiativeId}
            isOpen={isCreateGoalDialogOpen}
            onClose={() => {
              setIsCreateGoalDialogOpen(false);
              setSelectedSuggestedGoal(null); // Clear selected suggested goal on close
            }}
            onGoalCreated={handleGoalCreated} // Pass the callback
            initialTitle={selectedSuggestedGoal?.title}
            initialDescription={selectedSuggestedGoal?.description}
          />
        )}

        {/* Chat Panel - Members Only */}
        {isMember && (
          <ChatPanel
            isOpen={isChatOpen}
            onClose={() => setIsChatOpen(false)}
            initiativeId={initiative.id}
            currentUserId={userId}
            mode="modal" // You can make this dynamic: mode={chatMode}
          />
        )}
      </div>
    </div>
    </>
  );
}