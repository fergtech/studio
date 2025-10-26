"use client";
import React from 'react';
import { Society } from '@/lib/types';
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Trash2, Users, Share2, MoreVertical, ArrowRight, Check, MapPin, Target, LogIn } from 'lucide-react';
import Link from 'next/link';
import { formatDistanceToNow, parseISO } from 'date-fns';
import { useRouter } from 'next/navigation';
import { useToast } from "@/hooks/use-toast";
import { motion } from 'framer-motion';
import { ContentCardMenu } from '@/components/ui/content-card-menu';
import { cn } from '@/lib/utils';
import Image from 'next/image';
import { SocietyDetailsModal } from '@/components/modals/SocietyDetailsModal';
import { getLocationDisplay } from '@/lib/location-utils';

interface SocietyCardProps {
  society: Society & { creatorId?: string };
  creatorName?: string;
  creatorAvatarUrl?: string;
  currentUserId?: string;
  className?: string;
}

export function SocietyCard({ society, creatorName = "Creator", creatorAvatarUrl, currentUserId, className }: SocietyCardProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [isDeleting, setIsDeleting] = React.useState(false);
  const [showDetailsModal, setShowDetailsModal] = React.useState(false);
  
  const fallback = creatorName.substring(0, 2).toUpperCase();
  
  // Handle date formatting
  const timeAgo = society.createdAt ? 
    formatDistanceToNow(
      typeof society.createdAt === 'string' 
        ? parseISO(society.createdAt) 
        : society.createdAt instanceof Date
          ? society.createdAt
          : new Date(society.createdAt as any),
      { addSuffix: true }
    ) : '';

  // Check membership status
  const currentUserMembership = society?.memberships?.find(m => m.user.id === currentUserId);
  const isMember = !!currentUserMembership;
  const memberRole = currentUserMembership?.role;

  const handleSocietyClick = () => {
    sessionStorage.setItem('scrollY', window.scrollY.toString());
    router.push(`/societies/${society.id}`);
  };

  const handleDetailsClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowDetailsModal(true);
  };

  const handleJoinClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!currentUserId) {
      toast({ title: "Please log in to join this society", variant: 'destructive' });
      return;
    }
    // Navigate to society page with auto-join
    router.push(`/societies/${society.id}?join=true`);
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: society.name,
          text: society.description || '',
          url: `${window.location.origin}/societies/${society.id}`,
        });
      } catch (error) {
        // User cancelled sharing
      }
    } else {
      // Fallback: copy to clipboard
      await navigator.clipboard.writeText(`${window.location.origin}/societies/${society.id}`);
      toast({ title: "Link copied to clipboard!" });
    }
  };

  const handleDelete = async () => {
    if (!confirm(`Are you sure you want to delete "${society.name}"? This action cannot be undone.`)) {
      return;
    }

    setIsDeleting(true);
    try {
      const response = await fetch(`/api/societies/${society.id}`, { 
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' }
      });

      if (!response.ok) {
        throw new Error('Failed to delete society');
      }

      toast({ title: "Society deleted successfully" });
      router.refresh();
    } catch (error) {
      toast({ title: "Failed to delete society", variant: "destructive" });
    } finally {
      setIsDeleting(false);
    }
  };

  const isCreator = currentUserId === society.creatorId || currentUserId === society.creator?.id;
  const locationText = getLocationDisplay(society.location);
  const memberCount = society.memberships?.length || 0;

  // Generate vibrant gradient for societies without images
  const gradients = [
    'bg-gradient-to-br from-purple-600 via-pink-600 to-blue-600',
    'bg-gradient-to-br from-cyan-500 via-blue-500 to-purple-600',
    'bg-gradient-to-br from-orange-500 via-red-500 to-pink-600',
    'bg-gradient-to-br from-green-500 via-teal-500 to-cyan-600',
    'bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600',
    'bg-gradient-to-br from-yellow-500 via-orange-500 to-red-600',
  ];
  const gradientIndex = society.id.split('').reduce((sum, char) => sum + char.charCodeAt(0), 0) % gradients.length;
  const societyGradient = gradients[gradientIndex];

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
        onClick={handleSocietyClick}
      >
        {/* Background - Image or Vibrant Gradient */}
        <div className="absolute inset-0 w-full h-full">
          {society.image ? (
            <>
              <Image
                src={society.image}
                alt={society.name}
                fill
                className="object-cover"
                sizes="100vw"
                priority
              />
              {/* Soft overlay for better text readability */}
              <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/80" />
            </>
          ) : (
            /* Vibrant gradient for societies without images */
            <div className={`w-full h-full ${societyGradient}`}>
              <div className="absolute inset-0 bg-black/10" />
            </div>
          )}
        </div>

        {/* Content Overlay */}
        <div className="absolute inset-0 flex flex-col justify-between p-4 text-white">
          {/* Top Bar - Creator Info & Menu */}
          <div className="flex items-center justify-between z-10">
            <Link
              href={`/profile/${society.creator?.id}`}
              onClick={(e) => e.stopPropagation()}
              className="flex items-center gap-3"
            >
              <Avatar className="h-10 w-10 border-2 border-white/30">
                <AvatarImage src={creatorAvatarUrl} />
                <AvatarFallback className="bg-gray-700 text-white">{fallback}</AvatarFallback>
              </Avatar>
              <div>
                <p className="font-semibold text-sm">{creatorName}</p>
                <p className="text-xs text-white/80">{timeAgo}</p>
              </div>
            </Link>
            <ContentCardMenu
              itemId={society.id}
              itemType="society"
              itemName={society.name}
              isCreator={isCreator}
              onDelete={handleDelete}
            />
          </div>

          {/* Middle - Society Content */}
          <div className="flex-1 flex items-center justify-center z-10 px-4 py-8">
            <motion.div
              onClick={handleSocietyClick}
              className="cursor-pointer max-w-2xl text-center"
              whileTap={{ scale: 0.98 }}
            >
              <Badge variant="secondary" className="bg-white/20 text-white border-white/30 backdrop-blur-sm mb-4">
                <Users className="w-3 h-3 mr-1.5" />
                Society
              </Badge>
              <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight leading-tight drop-shadow-lg">
                {society.name}
              </h2>
              {society.description && (
                <p className="mt-3 text-base text-white/90 max-w-md mx-auto drop-shadow-md line-clamp-3">
                  {society.description}
                </p>
              )}
              
              {locationText && (
                <div className="mt-4 flex items-center justify-center gap-1.5 text-sm text-white/80">
                  <MapPin className="w-4 h-4" />
                  <span>{locationText}</span>
                </div>
              )}
            </motion.div>
          </div>

          {/* Bottom Bar - Action Buttons */}
          <div className="space-y-4 z-10">
            {/* Stats */}
            <div className="flex items-center justify-center gap-6 text-sm">
              <div className="flex flex-col items-center">
                <span className="font-bold">{memberCount}</span>
                <span className="text-xs text-white/70">Members</span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-stretch justify-center gap-3">
              {!isMember ? (
                <Button
                  onClick={handleJoinClick}
                  className="flex-1 bg-white/20 text-white backdrop-blur-md border border-white/30 hover:bg-white/30"
                  size="lg"
                >
                  <LogIn className="w-4 h-4 mr-2" />
                  Join
                </Button>
              ) : (
                <Button
                  onClick={handleSocietyClick}
                  className="flex-1 bg-green-500/20 text-white backdrop-blur-md border border-green-400/30 hover:bg-green-500/30"
                  size="lg"
                >
                  <Check className="w-4 h-4 mr-2" />
                  Member ({memberRole})
                </Button>
              )}
              <Button
                onClick={handleDetailsClick}
                className="flex-1 bg-black/20 text-white backdrop-blur-md border border-white/30 hover:bg-black/30"
                size="lg"
              >
                <Target className="w-4 h-4 mr-2" />
                Details
              </Button>
              <Button
                onClick={handleShare}
                className="px-4 bg-black/20 text-white backdrop-blur-md border border-white/30 hover:bg-black/30"
                size="lg"
                aria-label="Share"
              >
                <Share2 className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Society Details Modal */}
      <SocietyDetailsModal
        isOpen={showDetailsModal}
        onClose={() => setShowDetailsModal(false)}
        onNavigateToPage={handleSocietyClick}
        onShare={handleShare}
        society={{
          ...society,
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