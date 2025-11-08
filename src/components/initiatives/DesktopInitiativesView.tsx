'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, Target, Users, Calendar, Grid3X3, LayoutGrid } from 'lucide-react';
// Use local Initiative interface from the initiatives page
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
import { SimpleInitiativeCard } from './SimpleInitiativeCard';
import Link from 'next/link';
import Image from 'next/image';
import { cn } from '@/lib/utils';

interface DesktopInitiativesViewProps {
  initiatives: Initiative[];
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  sortBy: string;
  setSortBy: (sort: string) => void;
  sortOrder: 'asc' | 'desc';
  setSortOrder: (order: 'asc' | 'desc') => void;
  viewMode: 'grid' | 'tiktok';
  setViewMode: (mode: 'grid' | 'tiktok') => void;
  debouncedSearchTerm: string;
  openCreateInitiativeModal: () => void;
}

// Helper function to format dates
const formatDate = (date: any) => {
  try {
    const parsedDate = typeof date === 'string' ? new Date(date) : date;
    return parsedDate.toLocaleDateString();
  } catch {
    return 'Unknown date';
  }
};

export function DesktopInitiativesView({
  initiatives,
  searchTerm,
  setSearchTerm,
  sortBy,
  setSortBy,
  sortOrder,
  setSortOrder,
  viewMode,
  setViewMode,
  debouncedSearchTerm,
  openCreateInitiativeModal
}: DesktopInitiativesViewProps) {
  
  return (
    <div className="max-w-6xl mx-auto py-10">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2 flex items-center gap-2">
          <Target className="h-8 w-8 text-primary" />
          All Projects
        </h1>
        <p className="text-muted-foreground">
          Discover and join community projects that speaks to you.
        </p>
      </div>

      {/* Search and Filter Controls */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search projects..."
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

        {/* View Mode Toggle */}
        <div className="flex border rounded-lg p-1">
          <Button
            variant={viewMode === 'grid' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setViewMode('grid')}
            className="h-8"
          >
            <LayoutGrid className="h-4 w-4" />
          </Button>
          <Button
            variant={viewMode === 'tiktok' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setViewMode('tiktok')}
            className="h-8"
          >
            <Grid3X3 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Initiatives Display */}
      {viewMode === 'tiktok' ? (
        // TikTok-style grid view (desktop)
        <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {initiatives.length > 0 ? initiatives.map((initiative) => (
            <SimpleInitiativeCard
              key={initiative.id}
              initiative={initiative}
              className="aspect-[9/12]"
            />
          )) : (
            <div className="col-span-full text-center py-12">
              <Target className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No projects found</h3>
              <p className="text-muted-foreground mb-4">
                {debouncedSearchTerm 
                  ? "Try adjusting your search terms or filters."
                  : "Be the first to create a project in your community!"
                }
              </p>
              <Button onClick={() => openCreateInitiativeModal()}>
                Create Project
              </Button>
            </div>
          )}
        </div>
      ) : (
        // Traditional grid view
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
                    {initiative.creator?.image && (
                      <Image
                        src={initiative.creator.image}
                        alt={initiative.creator.name || 'Creator'}
                        width={20}
                        height={20}
                        className="rounded-full"
                      />
                    )}
                    <span className="text-xs text-muted-foreground">
                      by {initiative.creator?.name || 'Unknown'}
                    </span>
                  </div>
                  
                  {/* Stats */}
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Users className="h-3 w-3" />
                      {initiative._count?.members || 0} member{(initiative._count?.members || 0) !== 1 ? 's' : ''}
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
              <h3 className="text-lg font-semibold mb-2">No projects found</h3>
              <p className="text-muted-foreground mb-4">
                {debouncedSearchTerm 
                  ? "Try adjusting your search terms or filters."
                  : "Be the first to create a project in your community!"
                }
              </p>
              <Button onClick={() => openCreateInitiativeModal()}>
                Create Project
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Create Initiative CTA */}
      {initiatives.length > 0 && (
        <div className="mt-12 text-center">
          <div className="bg-muted/50 rounded-lg p-6">
            <h3 className="text-lg font-semibold mb-2">Have an idea for change?</h3>
            <p className="text-muted-foreground mb-4">
              Create your own project and gather support from the community
            </p>
            <Button onClick={() => openCreateInitiativeModal()}>
              Create Project
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}