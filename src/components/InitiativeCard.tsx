"use client";
import React from 'react';
import { Initiative } from '@/lib/types';
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Trash2, Users, Target, Share2, MoreVertical, ArrowRight, Check } from 'lucide-react';
import Link from 'next/link';
import { formatDistanceToNow, parseISO } from 'date-fns';
import { useRouter } from 'next/navigation';
import { useToast } from "@/hooks/use-toast";
import { deleteInitiative } from '@/app/actions/initiativeActions';
import { motion } from 'framer-motion';
import { ContentCardMenu } from '@/components/ui/content-card-menu';
import { cn } from '@/lib/utils';
import Image from 'next/image';
import { InitiativeDetailsModal } from '@/components/modals/InitiativeDetailsModal';
import { getLocationDisplay } from '@/lib/location-utils';

interface InitiativeCardProps {
  initiative: Initiative & { creatorId?: string };
  creatorName?: string;
  creatorAvatarUrl?: string;
  currentUserId?: string;
  className?: string;
}

export function InitiativeCard({ initiative, creatorName = "Creator", creatorAvatarUrl, currentUserId, className }: InitiativeCardProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [isDeleting, setIsDeleting] = React.useState(false);
  const [showDetailsModal, setShowDetailsModal] = React.useState(false);
  
  const fallback = creatorName.substring(0, 2).toUpperCase();
  
  // Handle date formatting
  const timeAgo = initiative.createdAt ? 
    formatDistanceToNow(
      typeof initiative.createdAt === 'string' 
        ? parseISO(initiative.createdAt) 
        : initiative.createdAt instanceof Date
          ? initiative.createdAt
          : new Date(initiative.createdAt as any),
      { addSuffix: true }
    ) : '';

  // Check membership status
  const currentUserMembership = initiative?.memberships?.find(m => m.user.id === currentUserId);
  const isMember = !!currentUserMembership;
  const memberRole = currentUserMembership?.role;

  const handleInitiativeClick = () => {
    sessionStorage.setItem('scrollY', window.scrollY.toString());
    router.push(`/initiatives/${initiative.id}`);
  };

  const handleDetailsClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowDetailsModal(true);
  };

  const handleJoinClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!currentUserId) {
      toast({ title: "Please log in to join this initiative", variant: 'destructive' });
      return;
    }
    // Navigate to initiative page with auto-join
    router.push(`/initiatives/${initiative.id}?join=true`);
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: initiative.title,
          text: initiative.description,
          url: window.location.origin + `/initiatives/${initiative.id}`,
        });
      } catch (error) {
        console.log('Share cancelled');
      }
    } else {
      try {
        await navigator.clipboard.writeText(window.location.origin + `/initiatives/${initiative.id}`);
        toast({ title: 'Link copied!' });
      } catch (error) {
        toast({ title: 'Could not share', variant: 'destructive' });
      }
    }
  };

  const handleDelete = async () => {
    if (!currentUserId || initiative.creatorId !== currentUserId) {
      toast({ title: "You are not authorized to delete this initiative.", variant: 'destructive' });
      return;
    }
    if (!confirm("Are you sure you want to delete this initiative? This action cannot be undone.")) {
      return;
    }
    setIsDeleting(true);
    try {
      const result = await deleteInitiative(initiative.id);
      if (result.success) {
        toast({ title: "Initiative deleted successfully" });
        window.dispatchEvent(new CustomEvent('feed:itemDeleted', { detail: { id: initiative.id } }));
      } else {
        toast({ title: result.error || "Failed to delete initiative.", variant: 'destructive' });
      }
    } catch (error) {
      console.error("Error in handleDelete:", error);
      toast({ title: "An unexpected error occurred. Please try again.", variant: 'destructive' });
    } finally {
      setIsDeleting(false);
    }
  };

  const isCreator = currentUserId === initiative.creatorId;

  // Generate vibrant gradient for initiatives without images
  const gradients = [
    'bg-gradient-to-br from-purple-600 via-pink-600 to-blue-600',
    'bg-gradient-to-br from-cyan-500 via-blue-500 to-purple-600',
    'bg-gradient-to-br from-orange-500 via-red-500 to-pink-600',
    'bg-gradient-to-br from-green-500 via-teal-500 to-cyan-600',
    'bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600',
    'bg-gradient-to-br from-yellow-500 via-orange-500 to-red-600',
  ];
  const gradientIndex = initiative.id.split('').reduce((sum, char) => sum + char.charCodeAt(0), 0) % gradients.length;
  const initiativeGradient = gradients[gradientIndex];

  return (
    <>
      <motion.div
        className={cn(
          "relative w-full h-[calc(100vh-8rem)] md:h-[600px] md:max-w-md md:mx-auto bg-card rounded-xl overflow-hidden snap-start group md:mb-6 cursor-pointer",
          className
        )}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        onClick={handleInitiativeClick}
      >
        {/* Background - Image or Vibrant Gradient */}
        <div className="absolute inset-0 w-full h-full">
          {initiative.imageUrl ? (
            <>
              <Image
                src={initiative.imageUrl}
                alt={initiative.title}
                fill
                className="object-cover"
                sizes="100vw"
                priority
              />
              {/* Gradient overlay for readability */}
              <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/80" />
            </>
          ) : (
            /* Vibrant gradient for initiatives without images */
            <div className={`w-full h-full ${initiativeGradient}`}>
              <div className="absolute inset-0 bg-black/10" />
            </div>
          )}
        </div>

        {/* Content Overlay */}
        <div className="absolute inset-0 flex flex-col justify-between p-4 text-white">
          {/* Top Bar - Creator Info & Menu */}
          <div className="flex items-center justify-between z-10">
            <Link
              href={`/profile/${initiative.creatorId}`}
              onClick={(e) => e.stopPropagation()}
              className="flex items-center gap-3"
            >
              <Avatar className="h-12 w-12 border-2 border-white shadow-lg">
                <AvatarImage src={creatorAvatarUrl} alt={creatorName} />
                <AvatarFallback>{fallback}</AvatarFallback>
              </Avatar>
              <div>
                <p className="font-bold text-base drop-shadow-lg">{creatorName}</p>
                <p className="text-xs text-white/90 drop-shadow-md">{timeAgo}</p>
                <p className="text-xs text-white/80 drop-shadow-md">
                  {getLocationDisplay(initiative.location) || 'Online'}
                </p>
              </div>
            </Link>
            <ContentCardMenu
              itemId={initiative.id}
              itemType="initiative"
              itemName={initiative.title}
              isCreator={isCreator}
              onDelete={handleDelete}
            />
          </div>

          {/* Middle - Initiative Content */}
          <div className="flex-1 flex items-center justify-center z-10 px-4 py-8">
            <motion.div
              onClick={handleInitiativeClick}
              className="cursor-pointer max-w-2xl text-center"
              whileTap={{ scale: 0.98 }}
            >
              <h3 className="text-3xl md:text-4xl font-bold mb-4 leading-tight drop-shadow-2xl">
                {initiative.title}
              </h3>
              <p className="text-lg md:text-xl leading-relaxed drop-shadow-lg line-clamp-4 mb-4">
                {initiative.description}
              </p>
              
              {/* Status and Society Info */}
              <div className="flex flex-wrap justify-center gap-2 mb-4">
                <Badge variant="secondary" className="bg-white/20 text-white border-white/30 backdrop-blur-sm">
                  <Target className="w-3 h-3 mr-1" />
                  {initiative.status}
                </Badge>
                {initiative.society && (
                  <Badge variant="outline" className="bg-white/10 text-white border-white/30 backdrop-blur-sm">
                    🏛️ {initiative.society.name}
                  </Badge>
                )}
                {/* Membership Status */}
                {isMember && (
                  <Badge variant="outline" className="bg-green-500/20 text-green-100 border-green-300/50 backdrop-blur-sm">
                    <Check className="w-3 h-3 mr-1" />
                    Member{memberRole ? ` (${memberRole})` : ''}
                  </Badge>
                )}
              </div>

              {/* Roles */}
              {initiative.roles && initiative.roles.length > 0 && (
                <div className="flex flex-wrap justify-center gap-1">
                  {initiative.roles.slice(0, 3).map((role, index) => (
                    <Badge key={`role-${index}`} variant="secondary" className="text-xs bg-white/20 text-white border-white/30 backdrop-blur-sm">
                      {role}
                    </Badge>
                  ))}
                  {initiative.roles.length > 3 && (
                    <Badge key="more-roles-badge" variant="secondary" className="text-xs bg-white/20 text-white border-white/30 backdrop-blur-sm">
                      +{initiative.roles.length - 3} more
                    </Badge>
                  )}
                </div>
              )}
            </motion.div>
          </div>

          {/* Bottom Bar - Action Buttons */}
          <div className="space-y-4 z-10">
            {/* Action Buttons - Horizontal */}
            <div className="flex items-center gap-4">
              {/* Join/Member Status Button */}
              {currentUserId && (
                <motion.button
                  whileTap={{ scale: 0.9 }}
                  onClick={isMember ? handleInitiativeClick : handleJoinClick}
                  className="flex flex-col items-center gap-1 min-w-[60px]"
                >
                  <div className={cn(
                    "w-12 h-12 rounded-full backdrop-blur-sm flex items-center justify-center shadow-lg",
                    isMember 
                      ? "bg-green-500/80" 
                      : "bg-blue-500/80"
                  )}>
                    {isMember ? (
                      <Check className="w-6 h-6 text-white" />
                    ) : (
                      <Users className="w-6 h-6 text-white" />
                    )}
                  </div>
                  <span className="text-xs font-semibold drop-shadow-lg">
                    {isMember ? 'Member' : 'Join'}
                  </span>
                </motion.button>
              )}

              {/* Details */}
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={handleDetailsClick}
                className="flex flex-col items-center gap-1 min-w-[60px]"
              >
                <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                  <Target className="w-6 h-6 text-white" />
                </div>
                <span className="text-xs font-semibold drop-shadow-lg">
                  Details
                </span>
              </motion.button>

              {/* Share */}
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={(e) => {
                  e.stopPropagation();
                  handleShare();
                }}
                className="flex flex-col items-center gap-1 min-w-[60px]"
              >
                <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                  <Share2 className="w-6 h-6 text-white" />
                </div>
                <span className="text-xs font-semibold drop-shadow-lg">
                  Share
                </span>
              </motion.button>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Initiative Details Modal */}
      <InitiativeDetailsModal
        isOpen={showDetailsModal}
        onClose={() => setShowDetailsModal(false)}
        onNavigateToPage={handleInitiativeClick}
        onShare={handleShare}
        initiative={{
          ...initiative,
          creatorName,
          creatorAvatar: creatorAvatarUrl
        }}
        currentUserId={currentUserId}
        onJoin={currentUserId ? () => {
          setShowDetailsModal(false);
          handleJoinClick({ stopPropagation: () => {} } as React.MouseEvent);
        } : undefined}
      />
    </>
  );
}
