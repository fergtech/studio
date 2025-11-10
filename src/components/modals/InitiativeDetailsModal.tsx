"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Users, Target, Share2, MapPin, Calendar, ArrowRight, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { formatDistanceToNow } from 'date-fns';
import { triggerHaptic, hapticPatterns } from '@/lib/animations';
import { cn } from '@/lib/utils';
import { Initiative } from '@/lib/types';
import Image from 'next/image';
import { getLocationDisplay } from '@/lib/location-utils';

interface InitiativeDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigateToPage: () => void;
  onShare: () => void;
  initiative: Initiative & { 
    creatorName?: string; 
    creatorAvatar?: string;
  };
  currentUserId?: string | null;
  onJoin?: () => void;
  isJoining?: boolean;
}

export function InitiativeDetailsModal({
  isOpen,
  onClose,
  onNavigateToPage,
  onShare,
  initiative: basicInitiative,
  currentUserId,
  onJoin,
  isJoining = false
}: InitiativeDetailsModalProps) {
  const [fullInitiative, setFullInitiative] = React.useState<Initiative | null>(null);
  const [isLoadingData, setIsLoadingData] = React.useState(false);

  // Fetch full initiative data when modal opens
  React.useEffect(() => {
    if (isOpen && !fullInitiative) {
      fetchFullInitiativeData();
    }
  }, [isOpen, basicInitiative.id]);

  const fetchFullInitiativeData = async () => {
    setIsLoadingData(true);
    try {
      const response = await fetch(`/api/initiatives/${basicInitiative.id}`);
      if (response.ok) {
        const data = await response.json();
        setFullInitiative(data);
      } else {
        // Fallback to basic initiative if fetch fails
        setFullInitiative(basicInitiative);
      }
    } catch (error) {
      console.error('Failed to fetch initiative details:', error);
      setFullInitiative(basicInitiative);
    } finally {
      setIsLoadingData(false);
    }
  };

  // Use full data if available, otherwise use basic data
  const initiative = fullInitiative || basicInitiative;

  useEffect(() => {
    // Prevent body scroll when open
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
      // Reset full initiative data when modal closes to ensure fresh data next time
      setFullInitiative(null);
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
  const currentUserMembership = initiative?.memberships?.find(m => m.user.id === currentUserId);
  const isMember = !!currentUserMembership;
  const memberRole = currentUserMembership?.role;

  // Handle creator data from either basic initiative or full initiative
  const creatorName = (initiative as any).creatorName || initiative.creator?.name || 'Unknown Creator';
  const creatorAvatar = (initiative as any).creatorAvatar || initiative.creator?.image;
  const fallback = creatorName.substring(0, 2).toUpperCase();

  const timeAgo = initiative.createdAt ? 
    formatDistanceToNow(
      typeof initiative.createdAt === 'string' 
        ? new Date(initiative.createdAt)
        : initiative.createdAt,
      { addSuffix: true }
    ) : '';

  const memberCount = initiative.memberships?.length || 0;
  const goalCount = initiative.goals?.length || 0;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 z-[100] backdrop-blur-sm"
            onClick={handleClose}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 pb-20 md:pb-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-full max-w-2xl max-h-full bg-background border border-border rounded-2xl shadow-2xl flex flex-col">
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-border">
                <div className="flex items-center gap-3">
                  <Avatar className="w-10 h-10">
                    <AvatarImage src={creatorAvatar || undefined} />
                    <AvatarFallback>{fallback}</AvatarFallback>
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
                {/* Title & Status */}
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-4">
                    <h2 className="text-2xl font-bold leading-tight flex-1">{initiative.title}</h2>
                    <Badge variant="secondary" className="shrink-0">
                      <Target className="w-3 h-3 mr-1" />
                      {initiative.status}
                    </Badge>
                  </div>
                  
                  {/* Society info */}
                  {initiative.society && (
                    <Badge variant="outline" className="w-fit">
                      🏛️ {initiative.society.name}
                    </Badge>
                  )}
                </div>
                
                {/* Description */}
                <p className="text-muted-foreground leading-relaxed text-base">{initiative.description}</p>

                {/* Location */}
                {getLocationDisplay(initiative.location) && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <MapPin className="w-4 h-4" />
                    <span>{getLocationDisplay(initiative.location)}</span>
                  </div>
                )}

                {/* Image if present */}
                {initiative.imageUrl && (
                  <div className="relative aspect-video rounded-xl overflow-hidden">
                    <Image 
                      src={initiative.imageUrl} 
                      alt={initiative.title}
                      fill
                      className="object-cover"
                    />
                  </div>
                )}

                {/* Roles needed */}
                {initiative.roles && initiative.roles.length > 0 && (
                  <div className="bg-card border border-border rounded-xl p-6">
                    <div className="flex items-center gap-2 mb-3">
                      <Users className="w-4 h-4" />
                      <span className="font-medium">Roles Needed</span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {initiative.roles.map((role, index) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {role}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Stats */}
                <div className="bg-card border border-border rounded-xl p-6">
                  <div className="grid grid-cols-2 gap-4 text-center">
                    <div>
                      <div className="text-2xl font-bold text-blue-600">
                        {isLoadingData ? (
                          <Loader2 className="w-6 h-6 animate-spin mx-auto" />
                        ) : (
                          memberCount
                        )}
                      </div>
                      <div className="text-sm text-muted-foreground">Members</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-green-600">
                        {isLoadingData ? (
                          <Loader2 className="w-6 h-6 animate-spin mx-auto" />
                        ) : (
                          goalCount
                        )}
                      </div>
                      <div className="text-sm text-muted-foreground">Goals</div>
                    </div>
                  </div>
                </div>

                {/* Membership Status */}
                {isMember && (
                  <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                    <div className="flex items-center gap-2 text-green-700">
                      <Users className="w-4 h-4" />
                      <span className="font-medium">You are a participant</span>
                      {memberRole && (
                        <Badge variant="outline" className="text-green-700 border-green-300">
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
                    className="w-full h-12 text-base bg-blue-600 hover:bg-blue-700"
                  >
                    <Users className="w-5 h-5 mr-2" />
                    {isJoining ? 'Joining...' : 'Participate'}
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
                    View Project
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
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}