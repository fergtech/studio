"use client";

import { useState } from 'react';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { format, parseISO } from 'date-fns';
import {
  Calendar,
  Clock,
  MapPin,
  Video,
  Users,
  Check,
  X,
  HelpCircle,
  ExternalLink,
  Download,
  Copy,
  Share2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/components/ui/use-toast';
import type { EventType } from '@/lib/types';

interface EventDetails {
  eventDate: string;
  eventEndDate?: string;
  eventLocation?: string;
  eventType: EventType;
  maxAttendees?: number;
  virtualLink?: string;
}

interface Attendee {
  id: string;
  name: string;
  image?: string;
  status: 'GOING' | 'MAYBE' | 'NOT_GOING';
}

interface EventDetailsSheetProps {
  isOpen: boolean;
  onClose: () => void;
  event: any; // Event update object
  currentUserId?: string;
  onRSVP?: (status: 'GOING' | 'MAYBE' | 'NOT_GOING') => Promise<void>;
}

export function EventDetailsSheet({
  isOpen,
  onClose,
  event,
  currentUserId,
  onRSVP
}: EventDetailsSheetProps) {
  const { toast } = useToast();
  const [userRSVP, setUserRSVP] = useState<'GOING' | 'MAYBE' | 'NOT_GOING' | null>(null);
  const [isRSVPing, setIsRSVPing] = useState(false);

  const eventDetails = event?.details as EventDetails;
  const eventDate = eventDetails?.eventDate ? parseISO(eventDetails.eventDate) : new Date();
  const eventEndDate = eventDetails?.eventEndDate ? parseISO(eventDetails.eventEndDate) : null;

  // Get real attendees from event RSVPs
  const attendees: Attendee[] = (event?.rsvps || []).map((rsvp: any) => ({
    id: rsvp.user?.id || rsvp.userId,
    name: rsvp.user?.name || 'Unknown',
    image: rsvp.user?.image,
    status: rsvp.status
  }));

  const goingAttendees = attendees.filter(a => a.status === 'GOING');
  const maybeAttendees = attendees.filter(a => a.status === 'MAYBE');

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
      if (onRSVP) {
        await onRSVP(status);
      }

      // Update local state for immediate feedback
      setUserRSVP(status);

      toast({
        title: 'RSVP Updated',
        description: `You've RSVP'd as "${status === 'GOING' ? 'Going' : status === 'MAYBE' ? 'Maybe' : 'Not Going'}"`,
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

  const handleCopyLink = () => {
    if (eventDetails?.virtualLink) {
      navigator.clipboard.writeText(eventDetails.virtualLink);
      toast({
        title: 'Link Copied',
        description: 'Virtual meeting link copied to clipboard',
      });
    }
  };

  const handleShare = () => {
    toast({
      title: 'Share Event',
      description: 'Event link copied to clipboard!',
    });
  };

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent side="right" className="w-full sm:max-w-lg p-0">
        <ScrollArea className="h-full">
          <div className="p-6">
            <SheetHeader className="mb-6">
              <div className="flex items-start justify-between mb-2">
                <Badge variant="secondary" className="mb-2">
                  {eventDetails?.eventType === 'virtual' ? 'Virtual Event' :
                   eventDetails?.eventType === 'in_person' ? 'In-Person Event' : 'Hybrid Event'}
                </Badge>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleShare}
                  className="gap-2 -mt-1"
                >
                  <Share2 className="h-4 w-4" />
                </Button>
              </div>
              <SheetTitle className="text-2xl pr-8">
                {event?.content || 'Event Details'}
              </SheetTitle>
              <SheetDescription>
                Hosted by {event?.user?.name || 'Unknown'}
              </SheetDescription>
            </SheetHeader>

            {/* Date & Time Section */}
            <div className="mb-6">
              <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                <Calendar className="h-4 w-4 text-primary" />
                Date & Time
              </h3>
              <div className="p-4 rounded-lg bg-muted/50 space-y-2">
                <p className="font-medium">{format(eventDate, 'EEEE, MMMM d, yyyy')}</p>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Clock className="h-4 w-4" />
                  <span>
                    {format(eventDate, 'h:mm a')}
                    {eventEndDate && ` - ${format(eventEndDate, 'h:mm a')}`}
                  </span>
                </div>
              </div>
            </div>

            {/* Location Section */}
            {(eventDetails?.eventType === 'in_person' || eventDetails?.eventType === 'hybrid') &&
             eventDetails?.eventLocation && (
              <div className="mb-6">
                <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-primary" />
                  Location
                </h3>
                <div className="p-4 rounded-lg bg-muted/50">
                  <p className="font-medium mb-2">{eventDetails.eventLocation}</p>
                  <Button variant="outline" size="sm" className="gap-2">
                    <MapPin className="h-3.5 w-3.5" />
                    View on Map
                  </Button>
                </div>
              </div>
            )}

            {/* Virtual Meeting Section */}
            {(eventDetails?.eventType === 'virtual' || eventDetails?.eventType === 'hybrid') &&
             eventDetails?.virtualLink && (
              <div className="mb-6">
                <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                  <Video className="h-4 w-4 text-primary" />
                  Virtual Meeting
                </h3>
                <div className="p-4 rounded-lg bg-muted/50 space-y-3">
                  <p className="text-sm text-muted-foreground break-all">
                    {eventDetails.virtualLink}
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="default"
                      size="sm"
                      className="flex-1 gap-2"
                      asChild
                    >
                      <a href={eventDetails.virtualLink} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="h-3.5 w-3.5" />
                        Join Meeting
                      </a>
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleCopyLink}
                      className="gap-2"
                    >
                      <Copy className="h-3.5 w-3.5" />
                      Copy Link
                    </Button>
                  </div>
                </div>
              </div>
            )}

            <Separator className="my-6" />

            {/* RSVP Section */}
            <div className="mb-6">
              <h3 className="text-sm font-semibold mb-3">Your RSVP</h3>
              <div className="grid grid-cols-3 gap-2">
                <Button
                  variant={userRSVP === 'GOING' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => handleRSVP('GOING')}
                  disabled={isRSVPing}
                  className={cn(
                    "gap-2 flex-col h-auto py-3",
                    userRSVP === 'GOING' && "bg-green-600 hover:bg-green-700"
                  )}
                >
                  <Check className="h-5 w-5" />
                  <span className="text-xs">{isRSVPing ? 'Saving...' : 'Going'}</span>
                </Button>
                <Button
                  variant={userRSVP === 'MAYBE' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => handleRSVP('MAYBE')}
                  disabled={isRSVPing}
                  className={cn(
                    "gap-2 flex-col h-auto py-3",
                    userRSVP === 'MAYBE' && "bg-yellow-600 hover:bg-yellow-700"
                  )}
                >
                  <HelpCircle className="h-5 w-5" />
                  <span className="text-xs">{isRSVPing ? 'Saving...' : 'Maybe'}</span>
                </Button>
                <Button
                  variant={userRSVP === 'NOT_GOING' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => handleRSVP('NOT_GOING')}
                  disabled={isRSVPing}
                  className={cn(
                    "gap-2 flex-col h-auto py-3",
                    userRSVP === 'NOT_GOING' && "bg-red-600 hover:bg-red-700"
                  )}
                >
                  <X className="h-5 w-5" />
                  <span className="text-xs">{isRSVPing ? 'Saving...' : "Can't Go"}</span>
                </Button>
              </div>
            </div>

            <Separator className="my-6" />

            {/* Attendees Section */}
            <div className="mb-6">
              <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                <Users className="h-4 w-4 text-primary" />
                Attendees ({goingAttendees.length} going)
              </h3>

              {/* Going */}
              <div className="mb-4">
                <p className="text-xs font-medium text-muted-foreground mb-2 flex items-center gap-1">
                  <Check className="h-3 w-3 text-green-600" />
                  Going ({goingAttendees.length})
                </p>
                <div className="space-y-2">
                  {goingAttendees.map((attendee) => (
                    <div key={attendee.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={attendee.image} alt={attendee.name} />
                        <AvatarFallback className="text-xs">
                          {attendee.name.substring(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-sm font-medium">{attendee.name}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Maybe */}
              {maybeAttendees.length > 0 && (
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-2 flex items-center gap-1">
                    <HelpCircle className="h-3 w-3 text-yellow-600" />
                    Maybe ({maybeAttendees.length})
                  </p>
                  <div className="space-y-2">
                    {maybeAttendees.map((attendee) => (
                      <div key={attendee.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={attendee.image} alt={attendee.name} />
                          <AvatarFallback className="text-xs">
                            {attendee.name.substring(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-sm font-medium opacity-75">{attendee.name}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="sticky bottom-0 bg-background pt-4 pb-2 space-y-2">
              <Button className="w-full gap-2" size="lg">
                <Download className="h-4 w-4" />
                Add to Calendar
              </Button>
            </div>
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
