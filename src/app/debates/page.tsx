'use client';

export const dynamic = 'force-dynamic';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { MessageSquare, Filter, Plus } from 'lucide-react';
import Link from 'next/link';
import AppSidebar from '@/components/AppSidebar';
import { MobileDebateCard } from '@/components/MobileDebateCard';

interface Debate {
  id: string;
  title: string;
  content: string;
  imageUrl?: string;
  createdAt: string;
  creator: {
    id: string;
    name: string;
    image?: string;
  };
  votes: Array<{ side: 'PRO' | 'CON' }>;
}

export default function DebatesPage() {
  const { data: session } = useSession();
  const [debates, setDebates] = useState<Debate[]>([]);
  const [filteredDebates, setFilteredDebates] = useState<Debate[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('recent');
  const [isLoading, setIsLoading] = useState(true);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    if (typeof window !== 'undefined' && window.localStorage) {
      const stored = localStorage.getItem('sidebarCollapsed:debates');
      if (stored !== null) return stored === 'true';
    }
    return false;
  });

  useEffect(() => {
    fetchDebates();
  }, []);

  useEffect(() => {
    filterAndSortDebates();
  }, [debates, searchQuery, sortBy]);

  const fetchDebates = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/debates');
      if (response.ok) {
        const data = await response.json();
        setDebates(data);
      }
    } catch (error) {
      console.error('Error fetching debates:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const filterAndSortDebates = () => {
    let filtered = debates;

    // Search filter
    if (searchQuery.trim()) {
      filtered = debates.filter(debate =>
        debate.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        debate.content?.toLowerCase().includes(searchQuery.toLowerCase())
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
        filtered = [...filtered].sort((a, b) => b.votes.length - a.votes.length);
        break;
      case 'alphabetical':
        filtered = [...filtered].sort((a, b) =>
          (a.title || '').localeCompare(b.title || '')
        );
        break;
    }

    setFilteredDebates(filtered);
  };

  return (
    <div className="w-full min-w-0 overflow-hidden">
      {/* AppSidebar for desktop (hidden on mobile) */}
      <AppSidebar
        className="hidden lg:flex"
        widgets={['userControls', 'navigation', 'resources', 'footer']}
        context={{ type: 'debates' }}
        onCollapseChange={(collapsed: boolean) => {
          setSidebarCollapsed(collapsed);
          if (typeof window !== 'undefined') {
            localStorage.setItem('sidebarCollapsed:debates', String(collapsed));
          }
        }}
      />
      <div className={`px-4 lg:px-6 pt-20 lg:pt-6 pb-32 transition-all duration-300 ${
        sidebarCollapsed ? 'lg:ml-16' : 'lg:ml-80 xl:ml-96'
      }`}>
        <div className="max-w-5xl mx-auto py-10">
          {/* Header */}
          <div className="flex flex-col sm:flex-row items-center justify-between mb-8">
            <div className="flex items-center gap-3 mb-4 sm:mb-0">
              <div className="p-3 bg-blue-500/10 rounded-lg">
                <MessageSquare className="h-8 w-8 text-blue-500" />
              </div>
              <div>
                <h1 className="text-3xl font-bold">Community Debates</h1>
                <p className="text-lg text-muted-foreground">Join the conversation</p>
              </div>
            </div>
            <Button asChild>
              <Link href="/debates/create">
                <Plus className="h-4 w-4 mr-2" />
                Create Debate
              </Link>
            </Button>
          </div>

          {/* Search and Filter */}
          <div className="flex flex-col sm:flex-row gap-4 mb-8">
            <div className="flex-1">
              <Input
                placeholder="Search debates..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full"
              />
            </div>
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-full sm:w-48">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="recent">Most Recent</SelectItem>
                <SelectItem value="popular">Most Popular</SelectItem>
                <SelectItem value="alphabetical">A-Z</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Debates List */}
          {isLoading ? (
            <div className="text-center text-muted-foreground py-10">
              Loading debates...
            </div>
          ) : filteredDebates.length > 0 ? (
            <div className="grid grid-cols-1 gap-6">
              {filteredDebates.map((debate) => {
                const votes = debate.votes || [];
                const proVotes = votes.filter(v => v.side === 'PRO').length;
                const conVotes = votes.filter(v => v.side === 'CON').length;
                const totalVotes = votes.length;
                // TODO: Replace 0 with actual argument count if available
                const argumentCount = 0;

                return (
                  <MobileDebateCard
                    key={debate.id}
                    id={debate.id}
                    title={debate.title}
                    content={debate.content}
                    imageUrl={debate.imageUrl}
                    createdAt={debate.createdAt}
                    creator={debate.creator}
                    stats={{
                      proVotes,
                      conVotes,
                      totalVotes,
                      proPercentage: totalVotes > 0 ? Math.round((proVotes / totalVotes) * 100) : 0,
                      conPercentage: totalVotes > 0 ? Math.round((conVotes / totalVotes) * 100) : 0,
                      argumentCount,
                    }}
                    currentUserId={session?.user?.id}
                  />
                );
              })}
            </div>
          ) : (
            <div className="text-center py-16">
              <MessageSquare className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-xl font-semibold mb-2">
                {searchQuery ? 'No debates found' : 'No debates yet'}
              </h3>
              <p className="text-muted-foreground mb-4">
                {searchQuery
                  ? 'Try adjusting your search'
                  : 'Be the first to start a debate!'
                }
              </p>
              {!searchQuery && (
                <Button asChild>
                  <Link href="/debates/create">
                    <Plus className="h-4 w-4 mr-2" />
                    Create First Debate
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
