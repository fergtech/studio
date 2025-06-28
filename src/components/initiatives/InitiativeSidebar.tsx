import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Initiative, Member } from '@/lib/types';
import { Users, CalendarDays, Info, X, MessageSquare, Lightbulb } from 'lucide-react'; // Added X and Lightbulb icons
import { cn } from '@/lib/utils';
import { useState } from 'react'; // Import useState
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'; // Added Dialog components
import Link from 'next/link';

interface InitiativeSidebarProps {
  initiative: Initiative;
  members: Member[];
  isMobile?: boolean;
  isOpen?: boolean;
  onToggle?: () => void;
  onToggleChat: () => void; // Add new prop for toggling chat
  isChatOpen: boolean; // Add new prop to indicate if chat is open
}

export const InitiativeSidebar: React.FC<InitiativeSidebarProps> = ({
  initiative,
  members,
  isMobile,
  isOpen,
  onToggle,
  onToggleChat, // Destructure new prop
  isChatOpen, // Destructure new prop
}) => {
  const [isAiGuidanceDialogOpen, setIsAiGuidanceDialogOpen] = useState(false); // State for AI Guidance Dialog

  const toggleAiGuidanceDialog = () => {
    setIsAiGuidanceDialogOpen(!isAiGuidanceDialogOpen);
  };

  const generateHtmlFromGuidance = (text: string | null | undefined): string => {
    if (!text) return '';
    let htmlText = text;

    // Process ***bold*** (non-greedy)
    htmlText = htmlText.replace(/\*\*\*(.+?)\*\*\*/g, '<strong>$1</strong>');
    // Process **bold** (non-greedy)
    htmlText = htmlText.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
    
    // Convert newlines to <br /> tags for HTML
    htmlText = htmlText.replace(/\n/g, '<br />');
    return htmlText;
  };

  const cardBaseClasses = "transition-transform duration-300 ease-in-out";
  let computedCardClassName;

  if (isMobile) {
    computedCardClassName = cn(
      cardBaseClasses,
      "fixed top-0 left-0 bottom-0 z-50 w-80 bg-background overflow-y-auto shadow-xl",
      isOpen ? "transform translateX(0)" : "transform -translate-x-full pointer-events-none"
    );
  } else {
    computedCardClassName = "md:sticky md:top-20 h-fit";
  }

  return (
    <Card className={computedCardClassName}>
      {isMobile && isOpen && (
        <Button
          variant="ghost"
          size="lg"
          className="absolute top-3 right-3 z-[51] p-1"
          onClick={onToggle}
          aria-label="Close sidebar"
        >
          <X className="h-6 w-6" />
        </Button>
      )}
      <CardHeader className={cn("border-b", { "pt-12 sm:pt-4": isMobile && isOpen })}>
        <CardTitle className="text-lg">About Initiative</CardTitle>
      </CardHeader>
      <CardContent className={cn("space-y-4 py-4", { "pb-4": isMobile && isOpen })}>
        <div>
          <h3 className="font-semibold text-sm mb-1">Description</h3>
          <p className="text-xs text-muted-foreground line-clamp-3">
            {initiative.description || 'No description provided.'}
          </p>
        </div>

        <Separator /> {/* Added Separator */}

        <div> {/* AI Guidance Section - always visible */}
          <h3 className="font-semibold text-sm mb-2 flex items-center">
            <Lightbulb className="h-4 w-4 mr-2 text-muted-foreground" />
            AI Guidance
          </h3>
          <Button
            variant="outline"
            className="w-full justify-start text-sm"
            onClick={toggleAiGuidanceDialog} // onClick is fine, disabled state handles it
            disabled={!initiative.aiGuidance}
          >
            <Lightbulb className="h-4 w-4 mr-1.5" />
            {initiative.aiGuidance ? (isAiGuidanceDialogOpen ? 'Hide AI Guidance' : 'View AI Guidance') : 'No AI Guidance Available'}
          </Button>
        </div>

        <Separator /> {/* This separator now correctly follows the AI Guidance section */}
        
        <div className="py-0"> {/* Ensure this div doesn't add unwanted vertical space if Button is self-spacing */}
          <Button variant="outline" className="w-full" onClick={onToggleChat}>
            <MessageSquare className="h-4 w-4 mr-2" />
            {isChatOpen ? 'Close Chat' : 'Open Chat'}
          </Button>
        </div>
        <Separator />
        <div>
          <h3 className="font-semibold text-sm mb-2 flex items-center">
            <Users className="h-4 w-4 mr-2 text-muted-foreground" />
            Members ({members.length})
          </h3>
          <div className="space-y-2">
            {members.slice(0, 5).map((member: Member) => (
              <div key={member.id} className="flex items-center space-x-2">
                <Link href={`/profile/${member.id}`} className="cursor-pointer hover:opacity-80 transition-opacity">
                  <Avatar className="h-6 w-6">
                    <AvatarImage src={member.image || undefined} alt={member.name} />
                    <AvatarFallback>{member.name?.charAt(0).toUpperCase() || 'U'}</AvatarFallback>
                  </Avatar>
                </Link>
                <div className="text-xs">
                  <Link href={`/profile/${member.id}`} className="cursor-pointer hover:underline">
                    <p className="font-medium">{member.name}</p>
                  </Link>
                  <div className="flex gap-1 items-center">
                    <Badge variant="outline" className="text-xs px-1 py-0">
                      {member.role}
                    </Badge>
                    {member.customRole && (
                      <Badge variant="secondary" className="text-xs px-1 py-0 ml-1">
                        {member.customRole}
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            ))}
            {members.length > 5 && (
              <Button variant="link" size="sm" className="text-xs p-0 h-auto">
                View all members
              </Button>
            )}
          </div>
        </div>
        <Separator />
        <div>
          <h3 className="font-semibold text-sm mb-2 flex items-center">
            <Info className="h-4 w-4 mr-2 text-muted-foreground" />
            Details
          </h3>
          <div className="space-y-1 text-xs">
            <div className="flex items-center">
              <CalendarDays className="h-3 w-3 mr-1.5 text-muted-foreground" />
              Created: {new Date(initiative.createdAt).toLocaleDateString()}
            </div>
            {/* Add more details as needed */}
          </div>
        </div>
        {/* Add more sections like "Settings", "Roles" etc. if applicable */}
      </CardContent>

      {initiative.aiGuidance && (
        <Dialog open={isAiGuidanceDialogOpen} onOpenChange={setIsAiGuidanceDialogOpen}>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle className="flex items-center">
                <Lightbulb className="h-5 w-5 mr-2" />
                AI Guidance
              </DialogTitle>
            </DialogHeader>
            <DialogDescription asChild>
              <div
                className="prose dark:prose-invert prose-sm sm:prose-base max-h-[70vh] overflow-y-auto"
                dangerouslySetInnerHTML={{ __html: generateHtmlFromGuidance(initiative.aiGuidance) }}
              />
            </DialogDescription>
            {/* Removed explicit close button, relying on onOpenChange and the toggle button */}
          </DialogContent>
        </Dialog>
      )}
    </Card>
  );
};
