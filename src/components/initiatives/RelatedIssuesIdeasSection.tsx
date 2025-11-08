"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Lightbulb, ExternalLink } from 'lucide-react';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';

interface RelatedItem {
  id: string;
  title: string;
  description: string;
  createdAt: string;
  creator: {
    id: string;
    name: string | null;
    image: string | null;
  };
  tags: string[];
  championCount?: number;
}

interface RelatedIssuesIdeasSectionProps {
  initiativeId: string;
}

export function RelatedIssuesIdeasSection({ initiativeId }: RelatedIssuesIdeasSectionProps) {
  const [originatingIssue, setOriginatingIssue] = useState<RelatedItem | null>(null);
  const [originatingIdea, setOriginatingIdea] = useState<RelatedItem | null>(null);
  const [relatedItems, setRelatedItems] = useState<RelatedItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRelatedItems();
  }, [initiativeId]);

  const fetchRelatedItems = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/initiatives/${initiativeId}/related-issues-ideas`);
      if (response.ok) {
        const data = await response.json();
        setOriginatingIssue(data.originatingIssue);
        setOriginatingIdea(data.originatingIdea);
        setRelatedItems(data.relatedItems || []);
      }
    } catch (error) {
      console.error('Error fetching related items:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-orange-500" />
            <Lightbulb className="h-5 w-5 text-yellow-500" />
            Related Posts
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4 text-muted-foreground">
            Loading related items...
          </div>
        </CardContent>
      </Card>
    );
  }

  const hasRelatedContent = originatingIssue || originatingIdea || relatedItems.length > 0;

  if (!hasRelatedContent) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-orange-500" />
            <Lightbulb className="h-5 w-5 text-yellow-500" />
            Related Posts
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4 text-muted-foreground">
            <p className="mb-2">No related content yet.</p>
            <p className="text-sm">
              This project can originate from community debates, problems or innovative ideas.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const ItemCard = ({ item, type, relationship }: { item: RelatedItem; type: 'issue' | 'idea'; relationship: string }) => (
    <div className="border rounded-lg p-3 space-y-2">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2">
          {type === 'issue' ? (
            <AlertTriangle className="h-4 w-4 text-orange-500 flex-shrink-0 mt-0.5" />
          ) : (
            <Lightbulb className="h-4 w-4 text-yellow-500 flex-shrink-0 mt-0.5" />
          )}
          <div>
            <Badge variant="secondary" className="text-xs">
              {relationship}
            </Badge>
          </div>
        </div>
        <Link href={`/${type === 'issue' ? 'issues' : 'ideas'}/${item.id}`}>
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
            <ExternalLink className="h-3 w-3" />
          </Button>
        </Link>
      </div>
      
      <div>
        <h4 className="font-medium text-sm line-clamp-1">{item.title}</h4>
        <p className="text-xs text-muted-foreground line-clamp-2 mt-1">
          {item.description}
        </p>
      </div>
      
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>by {item.creator.name || 'Anonymous'}</span>
        <span>{formatDistanceToNow(new Date(item.createdAt), { addSuffix: true })}</span>
      </div>
      
      {item.tags.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {item.tags.slice(0, 3).map((tag, idx) => (
            <Badge key={idx} variant="outline" className="text-xs px-1 py-0">
              {tag}
            </Badge>
          ))}
          {item.tags.length > 3 && (
            <Badge variant="outline" className="text-xs px-1 py-0">
              +{item.tags.length - 3}
            </Badge>
          )}
        </div>
      )}
    </div>
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg font-semibold flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-orange-500" />
          <Lightbulb className="h-5 w-5 text-yellow-500" />
          Related Issues & Ideas
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {originatingIssue && (
          <div>
            <h3 className="font-medium text-sm mb-2 text-orange-600">Originating Issue</h3>
            <ItemCard 
              item={originatingIssue} 
              type="issue" 
              relationship="Addressed by this initiative"
            />
          </div>
        )}
        
        {originatingIdea && (
          <div>
            <h3 className="font-medium text-sm mb-2 text-yellow-600">Originating Idea</h3>
            <ItemCard 
              item={originatingIdea} 
              type="idea" 
              relationship="Implemented by this initiative"
            />
          </div>
        )}
        
        {relatedItems.length > 0 && (
          <div>
            <h3 className="font-medium text-sm mb-2">Related Items</h3>
            <div className="space-y-2">
              {relatedItems.map((item) => (
                <ItemCard 
                  key={item.id} 
                  item={item} 
                  type={item.tags.includes('issue') ? 'issue' : 'idea'}
                  relationship="Related to this initiative"
                />
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}