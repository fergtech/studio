'use client';

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Target, Users, CheckCircle2, Calendar, X, MessageSquare, Lightbulb } from "lucide-react";
import type { Initiative, Member } from "@/lib/types";
import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { RelatedIssuesIdeasSection } from './RelatedIssuesIdeasSection';

interface InitiativeSidebarProps {
  initiative: Initiative;
  members: Member[];
  isMobile?: boolean;
  isOpen?: boolean;
  onToggle?: () => void;
  onToggleChat: () => void;
  isChatOpen: boolean;
}

interface InitiativeStats {
  goals: number;
  completedGoals: number;
  updates: number;
  members: number;
}

export const InitiativeSidebar: React.FC<InitiativeSidebarProps> = ({
  initiative,
  members,
  isMobile,
  isOpen,
  onToggle,
  onToggleChat,
  isChatOpen,
}) => {
  // Stats state
  const [stats, setStats] = useState<InitiativeStats | null>(null);
  const [isAiGuidanceDialogOpen, setIsAiGuidanceDialogOpen] = useState(false);
  const [isGeneratingGuidance, setIsGeneratingGuidance] = useState(false);
  const [currentGuidance, setCurrentGuidance] = useState<string | null>(initiative.aiGuidance ?? null);
  const [guidanceError, setGuidanceError] = useState<string | null>(null);
  
  // Description truncation logic
  const [showFullDescription, setShowFullDescription] = useState(false);
  const maxDescriptionLength = 160;
  const isLongDescription = initiative.description && initiative.description.length > maxDescriptionLength;
  const displayedDescription = showFullDescription || !isLongDescription
    ? initiative.description
    : initiative.description.slice(0, maxDescriptionLength) + '...';

  // Set stats directly from initiative data (no API call needed)
  useEffect(() => {
    setStats({
      goals: initiative.goals?.length || 0,
      completedGoals: initiative.goals?.filter(g => g.status === 'Completed').length || 0,
      updates: initiative.updates?.length || 0,
      members: members.length
    });
  }, [initiative.goals, initiative.updates, members.length]);

  const toggleAiGuidanceDialog = () => {
    setIsAiGuidanceDialogOpen(!isAiGuidanceDialogOpen);
  };

  const handleGenerateGuidance = async () => {
    if (currentGuidance) {
      setIsAiGuidanceDialogOpen(true);
      return;
    }

    setIsGeneratingGuidance(true);
    setGuidanceError(null);
    
    try {
      const response = await fetch('/api/initiatives/generate-guidance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ initiativeId: initiative.id })
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.guidance) {
          setCurrentGuidance(data.guidance);
          setIsAiGuidanceDialogOpen(true);
        } else {
          setGuidanceError(data.error || 'Failed to generate guidance');
        }
      } else {
        setGuidanceError('Failed to generate guidance. Please try again.');
      }
    } catch (error) {
      setGuidanceError('Network error. Please check your connection and try again.');
    } finally {
      setIsGeneratingGuidance(false);
    }
  };

  const generateHtmlFromGuidance = (text: string | null | undefined): string => {
    if (!text) return '';
    let htmlText = text;

    // Process markdown headers
    htmlText = htmlText.replace(/^### (.+)$/gm, '<h3 class="text-lg font-semibold mt-4 mb-2">$1</h3>');
    htmlText = htmlText.replace(/^## (.+)$/gm, '<h2 class="text-xl font-bold mt-6 mb-3">$1</h2>');
    htmlText = htmlText.replace(/^# (.+)$/gm, '<h1 class="text-2xl font-bold mt-8 mb-4">$1</h1>');
    
    // Process bold text
    htmlText = htmlText.replace(/\*\*\*(.+?)\*\*\*/g, '<strong>$1</strong>');
    htmlText = htmlText.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
    
    // Process bullet points
    htmlText = htmlText.replace(/^\* (.+)$/gm, '<li class="ml-4 mb-1">$1</li>');
    
    // Wrap consecutive list items in ul tags
    htmlText = htmlText.replace(/(<li[^>]*>.*?<\/li>\s*)+/gs, '<ul class="list-disc list-inside mb-4">$&</ul>');
    
    // Process numbered lists
    htmlText = htmlText.replace(/^\d+\.\d+\s+(.+)$/gm, '<div class="ml-6 mb-2 font-medium">$1</div>');
    htmlText = htmlText.replace(/^\d+\.\s+(.+)$/gm, '<div class="mb-3 font-medium">$1</div>');
    
    // Convert newlines to line breaks, but preserve existing HTML
    htmlText = htmlText.replace(/\n(?![<\/])/g, '<br />');
    
    // Clean up extra br tags around block elements
    htmlText = htmlText.replace(/<br \/>\s*(<h[1-6]|<ul|<div)/g, '$1');
    htmlText = htmlText.replace(/(<\/h[1-6]>|<\/ul>|<\/div>)\s*<br \/>/g, '$1');
    
    return htmlText;
  };

  let computedCardClassName;
  if (isMobile) {
    computedCardClassName = cn(
      'transition-transform duration-300 ease-in-out',
      'fixed top-0 right-0 bottom-0 z-50 w-80 bg-background overflow-y-auto shadow-xl border-l',
      isOpen ? 'transform translate-x-0' : 'transform translate-x-full pointer-events-none',
    );
  } else {
    computedCardClassName = 'space-y-6 md:sticky md:top-20 h-fit';
  }

  return (
    <div className={computedCardClassName}>
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

      {/* Quick Stats Card */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Quick Stats</CardTitle>
        </CardHeader>
        <CardContent>
          {stats ? (
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col items-center">
                <Target className="h-5 w-5 text-blue-500 mb-1" />
                <span className="font-bold text-lg">{stats.goals}</span>
                <span className="text-xs text-muted-foreground">Goals</span>
              </div>
              <div className="flex flex-col items-center">
                <CheckCircle2 className="h-5 w-5 text-green-500 mb-1" />
                <span className="font-bold text-lg">{stats.completedGoals}</span>
                <span className="text-xs text-muted-foreground">Completed</span>
              </div>
              <div className="flex flex-col items-center">
                <Calendar className="h-5 w-5 text-purple-500 mb-1" />
                <span className="font-bold text-lg">{stats.updates}</span>
                <span className="text-xs text-muted-foreground">Updates</span>
              </div>
              <div className="flex flex-col items-center">
                <Users className="h-5 w-5 text-orange-500 mb-1" />
                <span className="font-bold text-lg">{stats.members}</span>
                <span className="text-xs text-muted-foreground">Members</span>
              </div>
            </div>
          ) : (
            <div className="text-xs text-muted-foreground">Loading stats...</div>
          )}
        </CardContent>
      </Card>

      {/* About Card */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>About</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="whitespace-pre-line text-sm text-muted-foreground">
            {displayedDescription || 'No description provided.'}
            {isLongDescription && (
              <button
                className="ml-2 text-primary underline text-xs focus:outline-none"
                onClick={() => setShowFullDescription(v => !v)}
              >
                {showFullDescription ? 'Show less' : 'Show more'}
              </button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* AI Guidance Card */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Lightbulb className="h-4 w-4 mr-2 text-muted-foreground" />
            AI Guidance
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Button
            variant="outline"
            className="w-full"
            onClick={handleGenerateGuidance}
            disabled={isGeneratingGuidance}
          >
            <Lightbulb className="h-4 w-4 mr-2" />
            {isGeneratingGuidance 
              ? 'Generating...' 
              : currentGuidance 
                ? 'View AI Guidance' 
                : 'Generate AI Guidance'
            }
          </Button>
          {guidanceError && (
            <div className="mt-2 text-xs text-red-500 text-center">
              {guidanceError}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Related Issues & Ideas Section */}
      <RelatedIssuesIdeasSection initiativeId={initiative.id} />

      {/* Chat Toggle Card */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Communication</CardTitle>
        </CardHeader>
        <CardContent>
          <Button 
            variant="outline" 
            className="w-full" 
            onClick={onToggleChat}
          >
            <MessageSquare className="h-4 w-4 mr-2" />
            {isChatOpen ? 'Close Chat' : 'Open Chat'}
          </Button>
        </CardContent>
      </Card>

      {/* Members Card */}
      <Card>
        <CardHeader>
          <CardTitle>Participants</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {members.slice(0, 5).map((member) => (
              <Link href={`/profile/${member.id}`} key={member.id} className="flex items-center gap-3 group">
                <Avatar className="h-8 w-8 group-hover:ring-2 group-hover:ring-primary transition-all">
                  <AvatarImage src={member.image ?? undefined} alt={member.name} />
                  <AvatarFallback>{member.name?.[0]?.toUpperCase() || '?'}</AvatarFallback>
                </Avatar>
                <div>
                  <div className="font-medium group-hover:underline">{member.name}</div>
                  <div className="flex gap-1">
                    {member.role && (
                      <Badge variant="secondary" className="text-xs">{member.role}</Badge>
                    )}
                    {member.customRole && (
                      <Badge variant="outline" className="text-xs">{member.customRole}</Badge>
                    )}
                  </div>
                </div>
              </Link>
            ))}
            {members.length > 5 && (
              <Button variant="link" size="sm" className="text-xs p-0 h-auto">
                View all {members.length} members
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* AI Guidance Dialog */}
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
              dangerouslySetInnerHTML={{ __html: generateHtmlFromGuidance(currentGuidance) }}
            />
          </DialogDescription>
        </DialogContent>
      </Dialog>
    </div>
  );
};