"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertTriangle, Lightbulb, Plus, Filter } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { IssueCard } from "@/components/IssueCard";
import { IdeaCard } from "@/components/IdeaCard";
import { Issue, Idea } from '@/lib/types';
import { MediaType } from '@prisma/client';
import Link from 'next/link';
import { useSession } from 'next-auth/react';

// API response types (with string dates)
interface IssueResponse {
  id: string;
  title: string;
  description: string;
  createdAt: string;
  creatorId: string;
  creator: {
    id: string;
    name: string | null;
    image: string | null;
  };
  tags: string[];
  championCount: number;
  media: Array<{
    id: string;
    url: string;
    type: string;
  }>;
}

interface IdeaResponse {
  id: string;
  title: string;
  description: string;
  createdAt: string;
  creatorId: string;
  creator: {
    id: string;
    name: string | null;
    image: string | null;
  };
  tags: string[];
  championCount: number;
  media: Array<{
    id: string;
    url: string;
    type: string;
  }>;
}

interface SocietyIssuesIdeasFeedProps {
  societyId: string;
  isMember: boolean;
}

export function SocietyIssuesIdeasFeed({ societyId, isMember }: SocietyIssuesIdeasFeedProps) {
  const { data: session } = useSession();
  const [issues, setIssues] = useState<Issue[]>([]);
  const [ideas, setIdeas] = useState<Idea[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('issues');
  const [sortBy, setSortBy] = useState('recent');

  useEffect(() => {
    fetchSocietyContent();
  }, [societyId, sortBy]);

  const fetchSocietyContent = async () => {
    try {
      setLoading(true);
      
      // Fetch issues
      const issuesResponse = await fetch(`/api/societies/${societyId}/issues?sort=${sortBy}`);
      if (issuesResponse.ok) {
        const issuesData: IssueResponse[] = await issuesResponse.json();
        // Convert API response to proper Issue type
        const convertedIssues: Issue[] = issuesData.map(issue => ({
          ...issue,
          createdAt: new Date(issue.createdAt),
          media: issue.media.map((media, index) => ({
            ...media,
            type: media.type as MediaType,
            order: index,
            issueId: issue.id,
            ideaId: null,
          })),
        }));
        setIssues(convertedIssues);
      }
      
      // Fetch ideas
      const ideasResponse = await fetch(`/api/societies/${societyId}/ideas?sort=${sortBy}`);
      if (ideasResponse.ok) {
        const ideasData: IdeaResponse[] = await ideasResponse.json();
        // Convert API response to proper Idea type
        const convertedIdeas: Idea[] = ideasData.map(idea => ({
          ...idea,
          createdAt: new Date(idea.createdAt),
          media: idea.media.map((media, index) => ({
            ...media,
            type: media.type as MediaType,
            order: index,
            issueId: null,
            ideaId: idea.id,
          })),
        }));
        setIdeas(convertedIdeas);
      }
    } catch (error) {
      console.error('Error fetching society content:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleIssueDeleted = (issueId: string) => {
    setIssues(prev => prev.filter(issue => issue.id !== issueId));
  };

  const handleIdeaDeleted = (ideaId: string) => {
    setIdeas(prev => prev.filter(idea => idea.id !== ideaId));
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-orange-500" />
            <Lightbulb className="h-5 w-5 text-yellow-500" />
            Society Issues & Ideas
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            Loading society content...
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-orange-500" />
            <Lightbulb className="h-5 w-5 text-yellow-500" />
            Society Issues & Ideas
          </CardTitle>
          <div className="flex items-center gap-2">
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-32">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="recent">Recent</SelectItem>
                <SelectItem value="popular">Popular</SelectItem>
                <SelectItem value="alphabetical">A-Z</SelectItem>
              </SelectContent>
            </Select>
            {isMember && (
              <Button size="sm" asChild>
                <Link href={`/?type=issue&societyId=${societyId}`}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add
                </Link>
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="issues" className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              Issues ({issues.length})
            </TabsTrigger>
            <TabsTrigger value="ideas" className="flex items-center gap-2">
              <Lightbulb className="h-4 w-4" />
              Ideas ({ideas.length})
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="issues" className="mt-4">
            {issues.length > 0 ? (
              <div className="grid grid-cols-1 gap-4">
                {issues.map((issue) => (
                  <IssueCard
                    key={issue.id}
                    issue={issue}
                    currentUserId={session?.user?.id}
                    onIssueDeleted={handleIssueDeleted}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <AlertTriangle className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No issues reported</h3>
                <p className="text-muted-foreground mb-4">
                  This society hasn't reported any issues yet.
                </p>
                {isMember && (
                  <Button asChild>
                    <Link href={`/?type=issue&societyId=${societyId}`}>
                      <Plus className="h-4 w-4 mr-2" />
                      Report First Issue
                    </Link>
                  </Button>
                )}
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="ideas" className="mt-4">
            {ideas.length > 0 ? (
              <div className="grid grid-cols-1 gap-4">
                {ideas.map((idea) => (
                  <IdeaCard
                    key={idea.id}
                    idea={idea}
                    currentUserId={session?.user?.id}
                    onIdeaDeleted={handleIdeaDeleted}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Lightbulb className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No ideas shared</h3>
                <p className="text-muted-foreground mb-4">
                  This society hasn't shared any innovative ideas yet.
                </p>
                {isMember && (
                  <Button asChild>
                    <Link href={`/?type=idea&societyId=${societyId}`}>
                      <Plus className="h-4 w-4 mr-2" />
                      Share First Idea
                    </Link>
                  </Button>
                )}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}