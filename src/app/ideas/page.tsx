'use client';

export const dynamic = 'force-dynamic';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { IdeaCard } from '@/components/IdeaCard';
import { Idea } from '@/lib/types';
import AppSidebar from '@/components/AppSidebar';
import { Lightbulb, Filter, Plus } from 'lucide-react';
import Link from 'next/link';

export default function IdeasPage() {
  const { data: session } = useSession();
  const [ideas, setIdeas] = useState<Idea[]>([]);
  const [filteredIdeas, setFilteredIdeas] = useState<Idea[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('recent');
  const [isLoading, setIsLoading] = useState(true);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  useEffect(() => {
    fetchIdeas();
  }, []);

  useEffect(() => {
    filterAndSortIdeas();
  }, [ideas, searchQuery, sortBy]);

  const fetchIdeas = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/ideas');
      if (response.ok) {
        const data = await response.json();
        setIdeas(data);
      }
    } catch (error) {
      console.error('Error fetching ideas:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const filterAndSortIdeas = () => {
    let filtered = ideas;

    // Search filter
    if (searchQuery.trim()) {
      filtered = ideas.filter(idea => 
        idea.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        idea.description?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Sort
    switch (sortBy) {
      case 'recent':
        filtered = [...filtered].sort((a, b) => 
          new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
        );
        break;
      case 'popular':
        // Could sort by likes/champions count when available
        filtered = [...filtered].sort((a, b) => (b.championCount || 0) - (a.championCount || 0));
        break;
      case 'alphabetical':
        filtered = [...filtered].sort((a, b) => 
          (a.title || '').localeCompare(b.title || '')
        );
        break;
    }

    setFilteredIdeas(filtered);
  };

  const handleIdeaDeleted = (ideaId: string) => {
    setIdeas(prev => prev.filter(idea => idea.id !== ideaId));
  };

  return (
    <div className="w-full min-w-0 overflow-hidden">
      <AppSidebar 
        widgets={['userControls', 'navigation', 'suggestions', 'location', 'resources', 'footer']}
        context={{ type: 'ideas' }}
        onCollapseChange={setSidebarCollapsed}
      />
      <div className={`transition-all duration-300 px-4 lg:px-6 pt-20 lg:pt-6 ${
        sidebarCollapsed ? 'lg:ml-16' : 'lg:ml-80 xl:ml-96'
      }`}>
        <div className="max-w-5xl mx-auto py-10">
          {/* Header */}
          <div className="flex flex-col sm:flex-row items-center justify-between mb-8">
            <div className="flex items-center gap-3 mb-4 sm:mb-0">
              <div className="p-3 bg-yellow-500/10 rounded-lg">
                <Lightbulb className="h-8 w-8 text-yellow-500" />
              </div>
              <div>
                <h1 className="text-3xl font-bold">Community Ideas</h1>
                <p className="text-lg text-muted-foreground">Solutions and innovations from the community</p>
              </div>
            </div>
            <Button asChild>
              <Link href="/?type=idea">
                <Plus className="h-4 w-4 mr-2" />
                Share Idea
              </Link>
            </Button>
          </div>

          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-4 mb-8">
            <div className="flex-1">
              <Input
                placeholder="Search ideas..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full"
              />
            </div>
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-full sm:w-48">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Sort by..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="recent">Most Recent</SelectItem>
                <SelectItem value="popular">Most Popular</SelectItem>
                <SelectItem value="alphabetical">Alphabetical</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Content */}
          {isLoading ? (
            <div className="text-center py-12">
              <div className="text-lg text-muted-foreground">Loading ideas...</div>
            </div>
          ) : filteredIdeas.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredIdeas.map((idea) => (
                <div key={idea.id} className="w-full">
                  <IdeaCard
                    idea={idea}
                    currentUserId={session?.user?.id}
                    onIdeaDeleted={handleIdeaDeleted}
                  />
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="p-4 bg-yellow-500/10 rounded-full mb-4">
                <Lightbulb className="h-12 w-12 text-yellow-500" />
              </div>
              <h2 className="text-xl font-semibold mb-2">
                {searchQuery.trim() ? 'No matching ideas found' : 'No ideas shared yet'}
              </h2>
              <p className="text-muted-foreground text-center mb-6 max-w-md">
                {searchQuery.trim() 
                  ? 'Try adjusting your search terms or browse all ideas' 
                  : 'Be the first to share an innovative solution or idea with the community'
                }
              </p>
              {!searchQuery.trim() && (
                <Button asChild>
                  <Link href="/?type=idea">
                    <Plus className="h-4 w-4 mr-2" />
                    Share First Idea
                  </Link>
                </Button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}