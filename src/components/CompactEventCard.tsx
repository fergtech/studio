"use client";

import { Calendar, MapPin, Video, Users, Clock } from 'lucide-react';
import { format, parseISO } from 'date-fns';
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

interface CompactEventCardProps {
  update: any;
  onClick?: () => void;
}

export function CompactEventCard({ update, onClick }: CompactEventCardProps) {
  const eventDetails = update.details as EventDetails;
  const eventDate = eventDetails?.eventDate ? parseISO(eventDetails.eventDate) : new Date();

  // Calculate attendee count from RSVPs
  const rsvps = update.rsvps || [];
  const attendeeCount = rsvps.filter((r: any) => r.status === 'GOING').length;

  const getEventTypeIcon = () => {
    switch (eventDetails?.eventType) {
      case 'virtual':
        return <Video className="h-4 w-4" />;
      case 'in_person':
        return <MapPin className="h-4 w-4" />;
      case 'hybrid':
        return (
          <div className="flex items-center gap-0.5">
            <MapPin className="h-3.5 w-3.5" />
            <Video className="h-3.5 w-3.5" />
          </div>
        );
      default:
        return <Calendar className="h-4 w-4" />;
    }
  };

  return (
    <div
      onClick={onClick}
      className={cn(
        "flex-shrink-0 w-64 p-3 rounded-lg border bg-card cursor-pointer transition-all",
        "hover:shadow-md hover:border-primary/50 hover:scale-[1.02]"
      )}
    >
      {/* Header with Icon and Type */}
      <div className="flex items-center gap-2 mb-2">
        <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center text-muted-foreground">
          {getEventTypeIcon()}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs text-muted-foreground capitalize">
            {eventDetails?.eventType?.replace('_', ' ')}
          </p>
        </div>
      </div>

      {/* Title */}
      <h4 className="font-semibold text-sm line-clamp-2 mb-2">
        {update.content || 'Untitled Event'}
      </h4>

      {/* Date */}
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1">
        <Calendar className="h-3 w-3" />
        <span>{format(eventDate, 'MMM d, yyyy')}</span>
      </div>

      {/* Time */}
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-2">
        <Clock className="h-3 w-3" />
        <span>{format(eventDate, 'h:mm a')}</span>
      </div>

      {/* Location or Virtual indicator */}
      {eventDetails?.eventType === 'in_person' && eventDetails?.eventLocation && (
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <MapPin className="h-3 w-3" />
          <span className="truncate">{eventDetails.eventLocation}</span>
        </div>
      )}

      {eventDetails?.eventType === 'virtual' && (
        <div className="flex items-center gap-1.5 text-xs text-primary">
          <Video className="h-3 w-3" />
          <span>Virtual Meeting</span>
        </div>
      )}

      {eventDetails?.eventType === 'hybrid' && (
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <span className="text-primary">Hybrid Event</span>
        </div>
      )}

      {/* Attendee count */}
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-2 pt-2 border-t">
        <Users className="h-3 w-3" />
        <span>{attendeeCount} {attendeeCount === 1 ? 'attendee' : 'attended'}</span>
      </div>
    </div>
  );
}
