'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Shield, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';

interface PendingContent {
  id: string;
  contentType: 'post' | 'issue' | 'idea';
  content?: string;
  title?: string;
  description?: string;
  moderationFlags: string[];
  moderationScore?: number;
  moderationReasoning?: string;
  creator: {
    id: string;
    name: string | null;
    email: string;
    image: string | null;
  };
  media?: Array<{ url: string; type: string }>;
  timestamp?: Date;
  createdAt?: Date;
}

export default function ModerationQueuePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { toast } = useToast();
  const [pendingContent, setPendingContent] = useState<PendingContent[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/');
    }
  }, [status, router]);

  useEffect(() => {
    fetchPendingContent();
  }, []);

  const fetchPendingContent = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/moderation');

      if (!response.ok) {
        if (response.status === 403) {
          toast({
            title: 'Access Denied',
            description: 'You do not have moderator permissions',
            variant: 'destructive'
          });
          router.push('/');
          return;
        }
        throw new Error('Failed to fetch moderation queue');
      }

      const data = await response.json();
      setPendingContent(data.pending || []);
    } catch (error) {
      console.error('Error fetching moderation queue:', error);
      toast({
        title: 'Error',
        description: 'Failed to load moderation queue',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleModeration = async (contentId: string, contentType: string, action: 'approve' | 'reject') => {
    setProcessingId(contentId);

    try {
      const response = await fetch('/api/admin/moderation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contentId, contentType, action })
      });

      if (!response.ok) {
        throw new Error(`Failed to ${action} content`);
      }

      toast({
        title: action === 'approve' ? 'Content Approved' : 'Content Rejected',
        description: `${contentType} has been ${action}d`,
      });

      // Remove from list
      setPendingContent(prev => prev.filter(c => c.id !== contentId));

    } catch (error) {
      console.error(`Error ${action}ing content:`, error);
      toast({
        title: 'Error',
        description: `Failed to ${action} content`,
        variant: 'destructive'
      });
    } finally {
      setProcessingId(null);
    }
  };

  if (status === 'loading' || loading) {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="flex items-center justify-center h-64">
          <div className="text-lg text-muted-foreground">Loading moderation queue...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4 max-w-5xl">
      <div className="flex items-center gap-3 mb-6">
        <Shield className="h-8 w-8 text-primary" />
        <div>
          <h1 className="text-3xl font-bold">Content Moderation Queue</h1>
          <p className="text-muted-foreground">Review and moderate flagged content</p>
        </div>
      </div>

      {pendingContent.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <CheckCircle className="h-16 w-16 mx-auto text-green-500 mb-4" />
            <h2 className="text-2xl font-semibold mb-2">All Clear!</h2>
            <p className="text-muted-foreground">No content pending review</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          <div className="text-sm text-muted-foreground mb-4">
            {pendingContent.length} item{pendingContent.length !== 1 ? 's' : ''} pending review
          </div>

          {pendingContent.map((item) => (
            <Card key={item.id} className="overflow-hidden">
              <CardHeader className="bg-muted/50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Badge variant="outline" className="capitalize">
                      {item.contentType}
                    </Badge>
                    {item.moderationFlags.length > 0 && (
                      <div className="flex gap-1">
                        {item.moderationFlags.map((flag) => (
                          <Badge key={flag} variant="destructive" className="text-xs">
                            <AlertTriangle className="h-3 w-3 mr-1" />
                            {flag}
                          </Badge>
                        ))}
                      </div>
                    )}
                    {item.moderationScore && (
                      <Badge variant="secondary" className="text-xs">
                        Score: {(item.moderationScore * 100).toFixed(0)}%
                      </Badge>
                    )}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    By: {item.creator.name || item.creator.email}
                  </div>
                </div>
              </CardHeader>

              <CardContent className="pt-4">
                {/* Content Preview */}
                <div className="mb-4">
                  {item.title && (
                    <h3 className="text-lg font-semibold mb-2">{item.title}</h3>
                  )}
                  <p className="text-sm whitespace-pre-wrap line-clamp-6">
                    {item.content || item.description}
                  </p>
                </div>

                {/* Media Preview */}
                {item.media && item.media.length > 0 && (
                  <div className="mb-4 flex gap-2">
                    {item.media.slice(0, 3).map((media, idx) => (
                      <div key={idx} className="relative w-24 h-24 rounded border overflow-hidden">
                        {media.type === 'image' ? (
                          <img src={media.url} alt="Content media" className="w-full h-full object-cover" />
                        ) : (
                          <div className="flex items-center justify-center w-full h-full bg-muted text-xs">
                            Video
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {/* AI Reasoning */}
                {item.moderationReasoning && (
                  <div className="mb-4 p-3 bg-muted rounded text-sm">
                    <div className="font-medium mb-1">AI Analysis:</div>
                    <div className="text-muted-foreground">{item.moderationReasoning}</div>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex gap-3">
                  <Button
                    onClick={() => handleModeration(item.id, item.contentType, 'approve')}
                    disabled={processingId === item.id}
                    className="flex-1"
                    variant="default"
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Approve
                  </Button>
                  <Button
                    onClick={() => handleModeration(item.id, item.contentType, 'reject')}
                    disabled={processingId === item.id}
                    className="flex-1"
                    variant="destructive"
                  >
                    <XCircle className="h-4 w-4 mr-2" />
                    Reject
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
