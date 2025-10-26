'use client';

export const dynamic = 'force-dynamic';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { IssueCard } from '@/components/IssueCard';
import { Issue } from '@/lib/types';
import { AlertTriangle, Filter, Plus } from 'lucide-react';
import Link from 'next/link';

export default function IssuesPage() {
  const { data: session } = useSession();
  const [issues, setIssues] = useState<Issue[]>([]);
  const [filteredIssues, setFilteredIssues] = useState<Issue[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('recent');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchIssues();
  }, []);

  useEffect(() => {
    filterAndSortIssues();
  }, [issues, searchQuery, sortBy]);

  const fetchIssues = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/issues');
      if (response.ok) {
        const data = await response.json();
        setIssues(data);
      }
    } catch (error) {
      console.error('Error fetching issues:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const filterAndSortIssues = () => {
    let filtered = issues;

    // Search filter
    if (searchQuery.trim()) {
      filtered = issues.filter(issue => 
        issue.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        issue.description?.toLowerCase().includes(searchQuery.toLowerCase())
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

    setFilteredIssues(filtered);
  };

  const handleIssueDeleted = (issueId: string) => {
    setIssues(prev => prev.filter(issue => issue.id !== issueId));
  };

  return (
    <div className="w-full min-w-0 overflow-hidden">
      <div className="px-4 lg:px-6 pt-20 lg:pt-6 pb-24">
        <div className="max-w-5xl mx-auto py-10">
          {/* Header */}
          <div className="flex flex-col sm:flex-row items-center justify-between mb-8">
            <div className="flex items-center gap-3 mb-4 sm:mb-0">
              <div className="p-3 bg-red-500/10 rounded-lg">
                <AlertTriangle className="h-8 w-8 text-red-500" />
              </div>
              <div>
                <h1 className="text-3xl font-bold">Community Issues</h1>
                <p className="text-lg text-muted-foreground">Problems that need solving</p>
              </div>
            </div>
            <Button asChild>
              <Link href="/?type=issue">
                <Plus className="h-4 w-4 mr-2" />
                Report Issue
              </Link>
            </Button>
          </div>

          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-4 mb-8">
            <div className="flex-1">
              <Input
                placeholder="Search issues..."
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
              <div className="text-lg text-muted-foreground">Loading issues...</div>
            </div>
          ) : filteredIssues.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredIssues.map((issue) => (
                <div key={issue.id} className="w-full">
                  <IssueCard
                    issue={issue}
                    currentUserId={session?.user?.id}
                    onIssueDeleted={handleIssueDeleted}
                  />
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="p-4 bg-red-500/10 rounded-full mb-4">
                <AlertTriangle className="h-12 w-12 text-red-500" />
              </div>
              <h2 className="text-xl font-semibold mb-2">
                {searchQuery.trim() ? 'No matching issues found' : 'No issues reported yet'}
              </h2>
              <p className="text-muted-foreground text-center mb-6 max-w-md">
                {searchQuery.trim() 
                  ? 'Try adjusting your search terms or browse all issues' 
                  : 'Be the first to report a problem that needs community attention'
                }
              </p>
              {!searchQuery.trim() && (
                <Button asChild>
                  <Link href="/?type=issue">
                    <Plus className="h-4 w-4 mr-2" />
                    Report First Issue
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