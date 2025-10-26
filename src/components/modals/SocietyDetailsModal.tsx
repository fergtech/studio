"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Users, Share2, MapPin, Calendar, ArrowRight, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { formatDistanceToNow } from 'date-fns';
import { triggerHaptic, hapticPatterns } from '@/lib/animations';
import { cn } from '@/lib/utils';
import { Society } from '@/lib/types';
import Image from 'next/image';
import { getLocationDisplay } from '@/lib/location-utils';

interface SocietyDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigateToPage: () => void;
  onShare: () => void;
  society: Society & { 
    creatorName?: string; 
    creatorAvatar?: string;
  };
  currentUserId?: string | null;
  onJoin?: () => void;
  isJoining?: boolean;
}

export function SocietyDetailsModal({
  isOpen,
  onClose,
  onNavigateToPage,
  onShare,
  society: basicSociety,
  currentUserId,
  onJoin,
  isJoining = false
}: SocietyDetailsModalProps) {
  const [fullSociety, setFullSociety] = React.useState<Society | null>(null);
  const [isLoadingData, setIsLoadingData] = React.useState(false);

  // Fetch full society data when modal opens
  React.useEffect(() => {
    if (isOpen && !fullSociety) {
      fetchFullSocietyData();
    }
  }, [isOpen, basicSociety.id]);

  const fetchFullSocietyData = async () => {
    setIsLoadingData(true);
    try {
      const response = await fetch(`/api/societies/${basicSociety.id}/details`);
      if (response.ok) {
        const data = await response.json();
        setFullSociety(data);
      } else {
        // Fallback to basic society if fetch fails
        setFullSociety(basicSociety);
      }
    } catch (error) {
      console.error('Failed to fetch society details:', error);
      setFullSociety(basicSociety);
    } finally {
      setIsLoadingData(false);
    }
  };

  // Use full data if available, otherwise use basic data
  const society = fullSociety || basicSociety;

  useEffect(() => {
    // Prevent body scroll when open
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
      // Reset full society data when modal closes to ensure fresh data next time
      setFullSociety(null);
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  const handleClose = () => {
    triggerHaptic(hapticPatterns.light);
    onClose();
  };

  const handleShare = () => {
    triggerHaptic(hapticPatterns.medium);
    onShare();
  };

  const handleJoin = () => {
    triggerHaptic([...hapticPatterns.success]);
    onJoin?.();
  };

  const handleNavigateToPage = () => {
    triggerHaptic(hapticPatterns.medium);
    onNavigateToPage();
  };

  // Check if user is already a member
  const currentUserMembership = society?.memberships?.find(m => m.user.id === currentUserId);
  const isMember = !!currentUserMembership;
  const memberRole = currentUserMembership?.role;

  // Handle creator data from either basic society or full society
  const creatorName = (society as any).creatorName || society.creator?.name || 'Unknown Creator';
  const creatorAvatar = (society as any).creatorAvatar || society.creator?.image;
  const fallback = creatorName.substring(0, 2).toUpperCase();

  const timeAgo = society.createdAt ? 
    formatDistanceToNow(
      typeof society.createdAt === 'string' 
        ? new Date(society.createdAt)
        : society.createdAt,
      { addSuffix: true }
    ) : '';

  const memberCount = society.memberships?.length || 0;
  const locationText = getLocationDisplay(society.location);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center"
          onClick={handleClose}
        >
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
          
          {/* Modal */}
          <motion.div
            initial={{ y: "100%", opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: "100%", opacity: 0 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="relative bg-background border border-border rounded-t-3xl sm:rounded-2xl w-full sm:max-w-md max-h-[90vh] sm:max-h-[85vh] flex flex-col shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header with Creator Info */}
            <div className="flex items-center justify-between p-6 border-b border-border bg-muted/30">
              <div className="flex items-center gap-3">
                <Avatar className="h-12 w-12">
                  <AvatarImage src={creatorAvatar} alt={creatorName} />
                  <AvatarFallback className="bg-purple-100 text-purple-700">
                    {fallback}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium">{creatorName}</p>
                  <p className="text-sm text-muted-foreground">{timeAgo}</p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClose}
                className="w-8 h-8 p-0 hover:bg-muted"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6 min-h-0">
              {/* Title & Badge */}
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-4">
                  <h2 className="text-2xl font-bold leading-tight flex-1">{society.name}</h2>
                  <Badge variant="secondary" className="shrink-0 bg-purple-100 text-purple-700">
                    <Users className="w-3 h-3 mr-1" />
                    Society
                  </Badge>
                </div>
              </div>

              {/* Description */}
              {society.description && (
                <div className="space-y-2">
                  <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
                    About
                  </h4>
                  <p className="text-foreground leading-relaxed">
                    {society.description}
                  </p>
                </div>
              )}

              {/* Location */}
              {locationText && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <MapPin className="w-4 h-4" />
                  <span>{locationText}</span>
                </div>
              )}

              {/* Stats */}
              <div className="bg-card border border-border rounded-xl p-6">
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">
                    {isLoadingData ? (
                      <Loader2 className="w-6 h-6 animate-spin mx-auto" />
                    ) : (
                      memberCount
                    )}
                  </div>
                  <div className="text-sm text-muted-foreground">Members</div>
                </div>
              </div>

              {/* Membership Status */}
              {isMember && (
                <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-3 h-3 bg-green-500 rounded-full" />
                      <span className="font-medium text-green-800">You are a member</span>
                    </div>
                    {memberRole && (
                      <Badge variant="outline" className="border-green-300 text-green-700">
                        {memberRole}
                      </Badge>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="border-t border-border p-6 space-y-4">
              {/* Primary Action */}
              {currentUserId && !isMember && onJoin && (
                <Button
                  onClick={handleJoin}
                  disabled={isJoining}
                  className="w-full h-12 text-base bg-purple-600 hover:bg-purple-700"
                >
                  <Users className="w-5 h-5 mr-2" />
                  {isJoining ? 'Joining...' : 'Join Society'}
                </Button>
              )}

              {/* Secondary Actions */}
              <div className="flex gap-4">
                <Button
                  onClick={handleNavigateToPage}
                  variant="outline"
                  className="flex-1 h-11 text-base"
                >
                  <ArrowRight className="w-5 h-5 mr-2" />
                  View Full Page
                </Button>
                <Button
                  onClick={handleShare}
                  variant="outline"
                  className="flex-1 h-11 text-base"
                >
                  <Share2 className="w-5 h-5 mr-2" />
                  Share
                </Button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}