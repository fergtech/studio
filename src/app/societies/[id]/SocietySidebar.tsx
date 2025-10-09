"use client";

import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { BarChart2, Lightbulb, AlertTriangle, Layers } from 'lucide-react';
import Link from 'next/link';

// Define Member type
interface Member {
  id: string;
  name: string;
  image?: string | null;
  role?: string;
}

interface SocietySidebarProps {
  society: any;
  members: Member[];
  isMobile?: boolean;
  isOpen?: boolean;
  onToggle?: () => void;
}

interface SocietyStats {
  generalPosts: number;
  ideaPosts: number;
  issuePosts: number;
  initiatives: number;
}

export function SocietySidebar({ society, members, isMobile, isOpen, onToggle }: SocietySidebarProps) {
  let computedCardClassName;
  if (isMobile) {
    computedCardClassName = [
      'transition-transform duration-300 ease-in-out',
      'fixed top-0 left-0 bottom-0 z-50 w-80 bg-background overflow-y-auto shadow-xl',
      isOpen ? 'transform translate-x-0' : 'transform -translate-x-full pointer-events-none',
    ].join(' ');
  } else {
    computedCardClassName = 'space-y-6';
  }

  // Fetch quick stats
  const [stats, setStats] = useState<SocietyStats | null>(null);
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);
  
  useEffect(() => {
    fetch(`/api/societies/${society.id}/stats`).then(res => res.json()).then(setStats);
  }, [society.id]);

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
                <BarChart2 className="h-5 w-5 text-blue-500 mb-1" />
                <span className="font-bold text-lg">{stats.generalPosts}</span>
                <span className="text-xs text-muted-foreground">General Posts</span>
              </div>
              <div className="flex flex-col items-center">
                <Lightbulb className="h-5 w-5 text-yellow-500 mb-1" />
                <span className="font-bold text-lg">{stats.ideaPosts}</span>
                <span className="text-xs text-muted-foreground">Ideas</span>
              </div>
              <div className="flex flex-col items-center">
                <AlertTriangle className="h-5 w-5 text-red-500 mb-1" />
                <span className="font-bold text-lg">{stats.issuePosts}</span>
                <span className="text-xs text-muted-foreground">Issues</span>
              </div>
              <div className="flex flex-col items-center">
                <Layers className="h-5 w-5 text-green-500 mb-1" />
                <span className="font-bold text-lg">{stats.initiatives}</span>
                <span className="text-xs text-muted-foreground">Initiatives</span>
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
          {society.description ? (
            <div className="space-y-2">
              <div 
                className={`whitespace-pre-line transition-all duration-300 ${
                  isDescriptionExpanded ? '' : 'line-clamp-4'
                }`}
              >
                {society.description}
              </div>
              {society.description.length > 200 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsDescriptionExpanded(!isDescriptionExpanded)}
                  className="h-auto p-0 text-xs text-muted-foreground hover:text-foreground"
                >
                  {isDescriptionExpanded ? 'Show less' : 'Show more'}
                </Button>
              )}
            </div>
          ) : (
            <div className="text-sm text-muted-foreground italic">No description available</div>
          )}
        </CardContent>
      </Card>
      {/* Members Card */}
      <Card>
        <CardHeader>
          <CardTitle>Members</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {members.map((member: Member) => (
              <Link href={`/profile/${member.id}`} key={member.id} className="flex items-center gap-3 group">
                <Avatar className="h-8 w-8 group-hover:ring-2 group-hover:ring-primary transition-all">
                  <AvatarImage src={member.image ?? undefined} alt={member.name} />
                  <AvatarFallback>{member.name?.[0]?.toUpperCase() || '?'}</AvatarFallback>
                </Avatar>
                <div>
                  <div className="font-medium group-hover:underline">{member.name}</div>
                  {member.role && (
                    <Badge variant="secondary" className="text-xs">{member.role}</Badge>
                  )}
                </div>
              </Link>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}