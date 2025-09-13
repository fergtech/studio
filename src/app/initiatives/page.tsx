"use client";

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import AppSidebar from '@/components/AppSidebar';
import { Search, Target, Users, Calendar } from 'lucide-react';
import { useModal } from '@/context/ModalContext';

export const dynamic = 'force-dynamic';

interface Initiative {
  id: string;
  title: string;
  description: string;
  imageUrl?: string;
  createdAt: string;
  updatedAt: string;
  category?: string;
  creator: {
    id: string;
    name: string;
    image?: string;
  };
  _count: {
    members: number;
  };
}

export default function InitiativesPage() {
  const [initiatives, setInitiatives] = useState<Initiative[]>([]);
  const [loading, setLoading] = useState(true);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState('desc');
  const { openCreateInitiativeModal } = useModal();

  // Debounce search term to avoid excessive API calls
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [searchTerm]);

  // Fetch initiatives when debounced search term or other filters change
  useEffect(() => {
    fetchInitiatives();
  }, [debouncedSearchTerm, sortBy, sortOrder]);

  // Listen for new initiatives created via modal
  useEffect(() => {
    const handleFeedItemCreated = (event: CustomEvent) => {
      const item = event.detail;
      // If it's an initiative, refresh the list
      if ('status' in item && 'roles' in item) {
        fetchInitiatives();
      }
    };
    
    window.addEventListener('feed:itemCreated', handleFeedItemCreated as EventListener);
    return () => {
      window.removeEventListener('feed:itemCreated', handleFeedItemCreated as EventListener);
    };
  }, []);

  const fetchInitiatives = async () => {
    try {
      setLoading(true);
      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || '';
      const params = new URLSearchParams({
        sortBy,
        sortOrder,
      });
      
      if (debouncedSearchTerm) {
        params.append('search', debouncedSearchTerm);
      }

      const res = await fetch(`${baseUrl}/api/initiatives?${params}`, { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        // Data is now directly the initiatives array (like societies)
        setInitiatives(Array.isArray(data) ? data : []);
      }
    } catch (error) {
      console.error('Error fetching initiatives:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  if (loading) {
    return (
      <div className="w-full min-w-0 overflow-hidden">
        <AppSidebar 
          widgets={['userControls', 'navigation', 'suggestions', 'location', 'resources', 'footer']}
          context={{ type: 'initiative' }}
          onCollapseChange={setSidebarCollapsed}
        />
        <div className={`transition-all duration-300 px-4 lg:px-6 pt-20 lg:pt-6 ${
          sidebarCollapsed ? 'lg:ml-16' : 'lg:ml-80 xl:ml-96'
        }`}>
          <div className="max-w-6xl mx-auto py-10">
            <div className="text-center">Loading initiatives...</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full min-w-0 overflow-hidden">
      <AppSidebar 
        widgets={['userControls', 'navigation', 'suggestions', 'location', 'resources', 'footer']}
        context={{ type: 'initiative' }}
        onCollapseChange={setSidebarCollapsed}
      />
      <div className={`transition-all duration-300 px-4 lg:px-6 pt-20 lg:pt-6 ${
        sidebarCollapsed ? 'lg:ml-16' : 'lg:ml-80 xl:ml-96'
      }`}>
        <div className="max-w-6xl mx-auto py-10">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2 flex items-center gap-2">
              <Target className="h-8 w-8 text-primary" />
              All Initiatives
            </h1>
            <p className="text-muted-foreground">
              Discover and join community initiatives that are making a difference
            </p>
          </div>

          {/* Search and Filter Controls */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search initiatives..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="createdAt">Newest</SelectItem>
                <SelectItem value="updatedAt">Recently Active</SelectItem>
                <SelectItem value="members">Most Members</SelectItem>
                <SelectItem value="title">Alphabetical</SelectItem>
              </SelectContent>
            </Select>

            <Button
              variant="outline"
              onClick={() => setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc')}
              className="w-full sm:w-auto"
            >
              {sortOrder === 'desc' ? '↓' : '↑'} 
              {sortOrder === 'desc' ? 'Descending' : 'Ascending'}
            </Button>
          </div>

          {/* Initiatives Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {initiatives.length > 0 ? initiatives.map((initiative) => (
              <Link key={initiative.id} href={`/initiatives/${initiative.id}`} className="block">
                <Card className="h-full hover:shadow-lg hover:ring-2 hover:ring-primary transition-all duration-200">
                  {initiative.imageUrl && (
                    <div className="relative w-full h-48 overflow-hidden rounded-t-lg">
                      <Image 
                        src={initiative.imageUrl} 
                        alt={initiative.title} 
                        fill 
                        className="object-cover"
                      />
                    </div>
                  )}
                  
                  <CardContent className="p-4">
                    <h3 className="font-semibold text-lg mb-2 line-clamp-2">
                      {initiative.title}
                    </h3>
                    
                    <p className="text-sm text-muted-foreground mb-3 line-clamp-3">
                      {initiative.description}
                    </p>
                    
                    {/* Creator Info */}
                    <div className="flex items-center gap-2 mb-3">
                      {initiative.creator.image && (
                        <Image
                          src={initiative.creator.image}
                          alt={initiative.creator.name}
                          width={20}
                          height={20}
                          className="rounded-full"
                        />
                      )}
                      <span className="text-xs text-muted-foreground">
                        by {initiative.creator.name}
                      </span>
                    </div>
                    
                    {/* Stats */}
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Users className="h-3 w-3" />
                        {initiative._count.members} member{initiative._count.members !== 1 ? 's' : ''}
                      </div>
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {formatDate(initiative.createdAt)}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            )) : (
              <div className="col-span-full text-center py-12">
                <Target className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No initiatives found</h3>
                <p className="text-muted-foreground mb-4">
                  {debouncedSearchTerm 
                    ? "Try adjusting your search terms or filters."
                    : "Be the first to create an initiative in your community!"
                  }
                </p>
                <Button onClick={() => openCreateInitiativeModal()}>
                  Create Initiative
                </Button>
              </div>
            )}
          </div>

          {/* Create Initiative CTA */}
          {initiatives.length > 0 && (
            <div className="mt-12 text-center">
              <div className="bg-muted/50 rounded-lg p-6">
                <h3 className="text-lg font-semibold mb-2">Have an idea for change?</h3>
                <p className="text-muted-foreground mb-4">
                  Create your own initiative and gather support from the community
                </p>
                <Button onClick={() => openCreateInitiativeModal()}>
                  Create Initiative
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}