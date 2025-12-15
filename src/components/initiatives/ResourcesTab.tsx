'use client';

import { useState, useEffect } from 'react';
import { Search, Pin, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import ResourceCard from './ResourceCard';

interface ResourcesTabProps {
  initiativeId: string;
  userId: string;
}

export default function ResourcesTab({ initiativeId, userId }: ResourcesTabProps) {
  const [resources, setResources] = useState([]);
  const [search, setSearch] = useState('');
  const [activeType, setActiveType] = useState('ALL');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchResources();
  }, [activeType, search, initiativeId]);

  async function fetchResources() {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (activeType !== 'ALL') params.set('type', activeType);
      if (search) params.set('search', search);

      const res = await fetch(`/api/initiatives/${initiativeId}/resources?${params}`);
      if (res.ok) {
        const data = await res.json();
        setResources(data);
      } else {
        console.error('Failed to fetch resources');
      }
    } catch (error) {
      console.error('Error fetching resources:', error);
    } finally {
      setLoading(false);
    }
  }

  const pinnedResources = resources.filter((r: any) => r.isPinned);
  const unpinnedResources = resources.filter((r: any) => !r.isPinned);

  return (
    <div className="space-y-4">
      {/* Search Bar */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search resources..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {/* Type Filter Tabs */}
      <Tabs value={activeType} onValueChange={setActiveType}>
        <TabsList>
          <TabsTrigger value="ALL">All</TabsTrigger>
          <TabsTrigger value="LINK">Links</TabsTrigger>
          <TabsTrigger value="DOCUMENT">Documents</TabsTrigger>
          <TabsTrigger value="MEDIA">Media</TabsTrigger>
        </TabsList>
      </Tabs>

      {loading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      )}

      {!loading && (
        <>
          {/* Pinned Resources */}
          {pinnedResources.length > 0 && (
            <div>
              <h3 className="flex items-center gap-2 text-sm font-semibold mb-3 text-foreground">
                <Pin className="h-4 w-4" />
                Pinned Resources
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {pinnedResources.map((resource: any) => (
                  <ResourceCard key={resource.id} resource={resource} onUpdate={fetchResources} />
                ))}
              </div>
            </div>
          )}

          {/* All Resources */}
          <div>
            {unpinnedResources.length === 0 && pinnedResources.length === 0 && (
              <p className="text-muted-foreground text-center py-8">
                No resources found. Add resources via updates to see them here.
              </p>
            )}
            {unpinnedResources.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {unpinnedResources.map((resource: any) => (
                  <ResourceCard key={resource.id} resource={resource} onUpdate={fetchResources} />
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
