"use client";

import { useState } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { formatDistanceToNow, format, parseISO } from 'date-fns';
import {
  Calendar,
  Clock,
  MapPin,
  Video,
  Users,
  Check,
  X,
  HelpCircle,
  MoreHorizontal,
  ExternalLink,
  Download
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import type { EventType } from '@/lib/types';

interface EventDetails {
  eventDate: string;
  eventEndDate?: string;
  eventLocation?: string;
  eventType: EventType;
  maxAttendees?: number;
  virtualLink?: string;
}

interface EventUpdateCardProps {
  update: any; // Same structure as regular update
  currentUserId?: string;
  initiativeId: string;
  onDelete?: (id: string) => Promise<void>;
  onRSVP?: (eventId: string, status: 'GOING' | 'MAYBE' | 'NOT_GOING') => Promise<void>;
  onViewDetails?: () => void;
}

export function EventUpdateCard({
  update,
  currentUserId,
  initiativeId,
  onDelete,
  onRSVP,
  onViewDetails
}: EventUpdateCardProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [isDeleting, setIsDeleting] = useState(false);
  const [isRSVPing, setIsRSVPing] = useState(false);
  const [userRSVP, setUserRSVP] = useState<'GOING' | 'MAYBE' | 'NOT_GOING' | null>(null);

  const isOwner = currentUserId === update.userId;
  const eventDetails = update.details as EventDetails;

  // Parse event date
  const eventDate = eventDetails?.eventDate ? parseISO(eventDetails.eventDate) : new Date();
  const eventEndDate = eventDetails?.eventEndDate ? parseISO(eventDetails.eventEndDate) : null;
  // Event is past if the end time (or start time if no end time) has passed
  const now = new Date();
  const isPast = (eventEndDate || eventDate) < now;

  // Calculate real RSVP counts from the event data
  const rsvps = update.rsvps || [];
  const rsvpCounts = {
    going: rsvps.filter((r: any) => r.status === 'GOING').length,
    maybe: rsvps.filter((r: any) => r.status === 'MAYBE').length,
    notGoing: rsvps.filter((r: any) => r.status === 'NOT_GOING').length,
  };

  const handleDelete = async () => {
    if (!onDelete || !confirm('Are you sure you want to delete this event?')) return;
    setIsDeleting(true);
    try {
      await onDelete(update.id);
    } catch (error) {
      console.error('Error deleting event:', error);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleRSVP = async (status: 'GOING' | 'MAYBE' | 'NOT_GOING') => {
    if (!currentUserId) {
      toast({
        title: 'Login Required',
        description: 'Please log in to RSVP to events',
        variant: 'destructive',
      });
      return;
    }

    setIsRSVPing(true);
    try {
      // Call the callback first (which will handle the API call and refresh)
      if (onRSVP) {
        await onRSVP(update.id, status);
      }

      // Update local state for immediate feedback
      setUserRSVP(status);

      toast({
        title: 'RSVP Updated',
        description: `You've RSVP'd as "${status === 'GOING' ? 'Going' : status === 'MAYBE' ? 'Maybe' : "Can't Go"}"`,
      });
    } catch (error) {
      console.error('Error RSVPing:', error);
      toast({
        title: 'Error',
        description: 'Failed to update RSVP. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsRSVPing(false);
    }
  };

  const getEventTypeIcon = () => {
    switch (eventDetails?.eventType) {
      case 'virtual':
        return <Video className="h-4 w-4" />;
      case 'in_person':
        return <MapPin className="h-4 w-4" />;
      case 'hybrid':
        return (
          <div className="flex items-center gap-1">
            <MapPin className="h-3.5 w-3.5" />
            <Video className="h-3.5 w-3.5" />
          </div>
        );
      default:
        return <Calendar className="h-4 w-4" />;
    }
  };

  const getEventTypeLabel = () => {
    switch (eventDetails?.eventType) {
      case 'virtual':
        return 'Virtual Event';
      case 'in_person':
        return 'In-Person Event';
      case 'hybrid':
        return 'Hybrid Event';
      default:
        return 'Event';
    }
  };

  return (
    <div className={cn(
      "border rounded-lg bg-card mb-4 overflow-hidden transition-all hover:shadow-md",
      isPast && "opacity-75"
    )}>
      {/* Event Banner - Gradient Header */}
      <div className="h-24 bg-gradient-to-r from-primary/20 via-primary/10 to-primary/5 relative overflow-hidden">
        <div className="absolute inset-0 bg-grid-white/10" />
        <div className="relative h-full flex items-center justify-between px-6">
          <div className="flex items-center gap-3">
            <div className="h-14 w-14 rounded-full bg-background/90 backdrop-blur-sm flex items-center justify-center shadow-lg">
              <Calendar className="h-7 w-7 text-primary" />
            </div>
            <div>
              <Badge variant="secondary" className="mb-1">
                {getEventTypeLabel()}
              </Badge>
              <h3 className="font-semibold text-lg text-foreground line-clamp-1">
                {update.content || 'Untitled Event'}
              </h3>
            </div>
          </div>

          {/* Actions Menu */}
          {isOwner && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8 bg-background/50">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={handleDelete} disabled={isDeleting}>
                  {isDeleting ? 'Deleting...' : 'Delete Event'}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>

      <div className="p-6">
        {/* Creator Info */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <Avatar
              className="h-9 w-9 cursor-pointer hover:ring-2 hover:ring-primary/20 transition-all"
              onClick={() => router.push(`/profile/${update.user?.id}`)}
            >
              <AvatarImage src={update.user?.image || ''} alt={update.user?.name || 'User'} />
              <AvatarFallback className="bg-muted text-muted-foreground text-xs">
                {update.user?.name?.substring(0, 2).toUpperCase() || '??'}
              </AvatarFallback>
            </Avatar>

            <div className="flex flex-col">
              <span
                className="font-medium text-sm hover:underline cursor-pointer"
                onClick={() => router.push(`/profile/${update.user?.id}`)}
              >
                {update.user?.name || 'Unknown'}
              </span>
              <span className="text-xs text-muted-foreground">
                Created {formatDistanceToNow(new Date(update.createdAt), { addSuffix: true })}
              </span>
            </div>
          </div>

          {isPast && (
            <Badge variant="outline" className="text-xs">
              Past Event
            </Badge>
          )}
        </div>

        {/* Event Details Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
          {/* Date & Time */}
          <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
            <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
              <Calendar className="h-4 w-4 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-muted-foreground mb-0.5">Date</p>
              <p className="text-sm font-semibold">{format(eventDate, 'EEEE, MMMM d, yyyy')}</p>
              <div className="flex items-center gap-1 mt-1">
                <Clock className="h-3 w-3 text-muted-foreground" />
                <p className="text-xs text-muted-foreground">
                  {format(eventDate, 'h:mm a')}
                  {eventEndDate && ` - ${format(eventEndDate, 'h:mm a')}`}
                </p>
              </div>
            </div>
          </div>

          {/* Location / Virtual Link */}
          {eventDetails?.eventType === 'in_person' && eventDetails?.eventLocation && (
            <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
              <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                <MapPin className="h-4 w-4 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-muted-foreground mb-0.5">Location</p>
                <p className="text-sm font-medium line-clamp-2">{eventDetails.eventLocation}</p>
              </div>
            </div>
          )}

          {eventDetails?.eventType === 'virtual' && eventDetails?.virtualLink && (
            <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
              <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                <Video className="h-4 w-4 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-muted-foreground mb-0.5">Virtual Meeting</p>
                <a
                  href={eventDetails.virtualLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm font-medium text-primary hover:underline flex items-center gap-1"
                >
                  Join Meeting <ExternalLink className="h-3 w-3" />
                </a>
              </div>
            </div>
          )}

          {eventDetails?.eventType === 'hybrid' && (
            <>
              {eventDetails?.eventLocation && (
                <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                  <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <MapPin className="h-4 w-4 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-muted-foreground mb-0.5">Location</p>
                    <p className="text-sm font-medium line-clamp-2">{eventDetails.eventLocation}</p>
                  </div>
                </div>
              )}
              {eventDetails?.virtualLink && (
                <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                  <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Video className="h-4 w-4 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-muted-foreground mb-0.5">Virtual Option</p>
                    <a
                      href={eventDetails.virtualLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm font-medium text-primary hover:underline flex items-center gap-1"
                    >
                      Join Online <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Attendees Info */}
        <div className="flex items-center gap-4 mb-4 p-3 rounded-lg bg-muted/30">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">
              <span className="text-primary">{rsvpCounts.going}</span> going
            </span>
          </div>
          <div className="h-4 w-px bg-border" />
          <div className="flex items-center gap-2">
            <HelpCircle className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">{rsvpCounts.maybe} maybe</span>
          </div>
          {eventDetails?.maxAttendees && (
            <>
              <div className="h-4 w-px bg-border" />
              <span className="text-xs text-muted-foreground">
                Max: {eventDetails.maxAttendees}
              </span>
            </>
          )}
        </div>

        {/* RSVP Buttons */}
        {!isPast && (
          <div className="grid grid-cols-3 gap-2 mb-3">
            <Button
              variant={userRSVP === 'GOING' ? 'default' : 'outline'}
              size="sm"
              onClick={() => handleRSVP('GOING')}
              disabled={isRSVPing}
              className={cn(
                "gap-2",
                userRSVP === 'GOING' && "bg-green-600 hover:bg-green-700"
              )}
            >
              <Check className="h-4 w-4" />
              {isRSVPing ? 'Saving...' : 'Going'}
            </Button>
            <Button
              variant={userRSVP === 'MAYBE' ? 'default' : 'outline'}
              size="sm"
              onClick={() => handleRSVP('MAYBE')}
              disabled={isRSVPing}
              className={cn(
                "gap-2",
                userRSVP === 'MAYBE' && "bg-yellow-600 hover:bg-yellow-700"
              )}
            >
              <HelpCircle className="h-4 w-4" />
              {isRSVPing ? 'Saving...' : 'Maybe'}
            </Button>
            <Button
              variant={userRSVP === 'NOT_GOING' ? 'default' : 'outline'}
              size="sm"
              onClick={() => handleRSVP('NOT_GOING')}
              disabled={isRSVPing}
              className={cn(
                "gap-2",
                userRSVP === 'NOT_GOING' && "bg-red-600 hover:bg-red-700"
              )}
            >
              <X className="h-4 w-4" />
              {isRSVPing ? 'Saving...' : "Can't Go"}
            </Button>
          </div>
        )}

        {/* View Details / Add to Calendar */}
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={onViewDetails}
            className="flex-1"
          >
            View Full Details
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="gap-2"
            onClick={() => {
              // Mock download .ics file
              console.log('Download calendar file');
            }}
          >
            <Download className="h-4 w-4" />
            Add to Calendar
          </Button>
        </div>
      </div>
    </div>
  );
}
