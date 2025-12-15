'use client';

import { Pin, Link as LinkIcon, File, Image, MoreVertical } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface ResourceCardProps {
  resource: any;
  onUpdate: () => void;
}

export default function ResourceCard({ resource, onUpdate }: ResourceCardProps) {
  const getIcon = () => {
    switch (resource.resourceType) {
      case 'LINK':
        return <LinkIcon className="h-4 w-4" />;
      case 'DOCUMENT':
        return <File className="h-4 w-4" />;
      case 'MEDIA':
        return <Image className="h-4 w-4" />;
      default:
        return <File className="h-4 w-4" />;
    }
  };

  const getTypeLabel = () => {
    switch (resource.resourceType) {
      case 'LINK':
        return 'Link';
      case 'DOCUMENT':
        return 'Document';
      case 'MEDIA':
        return 'Media';
      default:
        return 'Resource';
    }
  };

  const getTypeBadgeColor = () => {
    switch (resource.resourceType) {
      case 'LINK':
        return 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300';
      case 'DOCUMENT':
        return 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300';
      case 'MEDIA':
        return 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300';
      default:
        return 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300';
    }
  };

  async function togglePin() {
    try {
      const res = await fetch(
        `/api/initiatives/${resource.initiativeId}/resources/${resource.id}`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ isPinned: !resource.isPinned }),
        }
      );

      if (res.ok) {
        onUpdate();
      } else {
        console.error('Failed to toggle pin');
      }
    } catch (error) {
      console.error('Error toggling pin:', error);
    }
  }

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-2">
          <div className="flex items-center gap-2">
            {getIcon()}
            <span className={`text-xs px-2 py-0.5 rounded ${getTypeBadgeColor()}`}>
              {getTypeLabel()}
            </span>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={togglePin}>
                <Pin className="h-4 w-4 mr-2" />
                {resource.isPinned ? 'Unpin' : 'Pin'}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <h4 className="font-semibold text-sm mb-1 line-clamp-2">{resource.title}</h4>
        {resource.description && (
          <p className="text-xs text-muted-foreground mb-2 line-clamp-2">
            {resource.description}
          </p>
        )}

        {resource.category && (
          <span className="inline-block px-2 py-1 bg-primary/10 text-primary text-xs rounded mb-2">
            {resource.category}
          </span>
        )}

        <div className="flex items-center gap-2 mt-2">
          <a
            href={resource.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-blue-600 hover:underline"
          >
            Open Resource →
          </a>
        </div>

        <div className="text-xs text-muted-foreground mt-2">
          Added by {resource.creator?.name || 'Unknown'}
        </div>
      </CardContent>
    </Card>
  );
}
