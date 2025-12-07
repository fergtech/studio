"use client";

import { useState } from 'react';
import { EventUpdateCard } from './EventUpdateCard';
import { CompactEventCard } from './CompactEventCard';
import { EventDetailsSheet } from './EventDetailsSheet';
import { Button } from './ui/button';
import { ScrollArea, ScrollBar } from './ui/scroll-area';
import { Calendar, ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { parseISO } from 'date-fns';

interface EventsSectionProps {
  events: any[]; // Array of event updates
  currentUserId?: string;
  initiativeId: string;
  onRSVP?: (eventId: string, status: 'GOING' | 'MAYBE' | 'NOT_GOING') => Promise<void>;
  onDelete?: (id: string) => Promise<void>;
}

export function EventsSection({
  events,
  currentUserId,
  initiativeId,
  onRSVP,
  onDelete
}: EventsSectionProps) {
  const [selectedEvent, setSelectedEvent] = useState<any | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [currentEventIndex, setCurrentEventIndex] = useState(0);

  // Separate current/upcoming events from past events
  // An event is "past" only if its end time (or start time if no end time) has passed
  const now = new Date();
  const upcomingEvents = events.filter(event => {
    const eventDate = event.details?.eventDate ? parseISO(event.details.eventDate) : new Date();
    const eventEndDate = event.details?.eventEndDate ? parseISO(event.details.eventEndDate) : null;
    const endTime = eventEndDate || eventDate;
    return endTime >= now;
  }).sort((a, b) => {
    const dateA = parseISO(a.details.eventDate);
    const dateB = parseISO(b.details.eventDate);
    return dateA.getTime() - dateB.getTime();
  });

  const pastEvents = events.filter(event => {
    const eventDate = event.details?.eventDate ? parseISO(event.details.eventDate) : new Date();
    const eventEndDate = event.details?.eventEndDate ? parseISO(event.details.eventEndDate) : null;
    const endTime = eventEndDate || eventDate;
    return endTime < now;
  }).sort((a, b) => {
    const dateA = parseISO(a.details.eventDate);
    const dateB = parseISO(b.details.eventDate);
    return dateB.getTime() - dateA.getTime(); // Most recent first
  });

  const handleViewDetails = (event: any) => {
    setSelectedEvent(event);
    setIsDetailsOpen(true);
  };

  const handleNextEvent = () => {
    if (currentEventIndex < upcomingEvents.length - 1) {
      setCurrentEventIndex(currentEventIndex + 1);
    }
  };

  const handlePrevEvent = () => {
    if (currentEventIndex > 0) {
      setCurrentEventIndex(currentEventIndex - 1);
    }
  };

  if (events.length === 0) {
    return null; // Don't show section if no events
  }

  return (
    <div className="mb-8 mx-auto" style={{ maxWidth: '700px' }}>
      {/* Current/Upcoming Events - Pinned */}
      {upcomingEvents.length > 0 && (
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <Calendar className="h-5 w-5 text-primary" />
              Upcoming Events
            </h2>
            {upcomingEvents.length > 1 && (
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handlePrevEvent}
                  disabled={currentEventIndex === 0}
                  className="h-8 w-8 p-0"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="text-sm text-muted-foreground">
                  {currentEventIndex + 1} / {upcomingEvents.length}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleNextEvent}
                  disabled={currentEventIndex === upcomingEvents.length - 1}
                  className="h-8 w-8 p-0"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>

          {/* Show current event (full size) */}
          <EventUpdateCard
            update={upcomingEvents[currentEventIndex]}
            currentUserId={currentUserId}
            initiativeId={initiativeId}
            onDelete={onDelete}
            onRSVP={onRSVP}
            onViewDetails={() => handleViewDetails(upcomingEvents[currentEventIndex])}
          />

          {/* Event indicator dots */}
          {upcomingEvents.length > 1 && (
            <div className="flex items-center justify-center gap-2 mt-3">
              {upcomingEvents.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentEventIndex(index)}
                  className={cn(
                    "h-2 w-2 rounded-full transition-all",
                    index === currentEventIndex
                      ? "bg-primary w-6"
                      : "bg-muted-foreground/30 hover:bg-muted-foreground/50"
                  )}
                  aria-label={`Go to event ${index + 1}`}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Past Events - Horizontal Scroll */}
      {pastEvents.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-lg font-semibold text-muted-foreground">
              Past Events
            </h3>
            {pastEvents.length > 3 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  // Could open a modal with all past events
                  console.log('View all past events');
                }}
                className="text-xs"
              >
                See All ({pastEvents.length})
              </Button>
            )}
          </div>

          <ScrollArea className="w-full whitespace-nowrap">
            <div className="flex gap-3 pb-4">
              {pastEvents.map((event) => (
                <CompactEventCard
                  key={event.id}
                  update={event}
                  onClick={() => handleViewDetails(event)}
                />
              ))}
            </div>
            <ScrollBar orientation="horizontal" />
          </ScrollArea>
        </div>
      )}

      {/* Event Details Sheet */}
      {selectedEvent && (
        <EventDetailsSheet
          isOpen={isDetailsOpen}
          onClose={() => {
            setIsDetailsOpen(false);
            setSelectedEvent(null);
          }}
          event={selectedEvent}
          currentUserId={currentUserId}
          onRSVP={(status) => {
            if (onRSVP) {
              onRSVP(selectedEvent.id, status);
            }
          }}
        />
      )}
    </div>
  );
}
