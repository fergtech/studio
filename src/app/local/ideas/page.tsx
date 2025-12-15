"use client";

import { useRouter } from 'next/navigation';
import { ArrowLeft, X, MapPin, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useSession } from 'next-auth/react';
import { useState, useEffect } from 'react';
import { IdeaCard } from '@/components/IdeaCard';
import Link from 'next/link';

interface LocalIdea {
  id: string;
  title: string;
  description: string;
  creatorId: string;
  location: string | null;
  latitude: number | null;
  longitude: number | null;
  distance: number;
  createdAt: string;
  tags: string[];
  media?: Array<{
    id: string;
    url: string;
    type: string;
  }>;
  creator: {
    id: string;
    name: string | null;
    username: string | null;
    image: string | null;
  };
  _count: {
    comments: number;
    likes: number;
  };
}

export default function LocalIdeasPage() {
  const router = useRouter();
  const { data: session } = useSession();
  
  const [ideas, setIdeas] = useState<LocalIdea[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [locationName, setLocationName] = useState('');
  const [radius, setRadius] = useState(25);

  useEffect(() => {
    async function loadLocalIdeas() {
      try {
        setIsLoading(true);

        if (!session?.user) {
          setIsLoading(false);
          return;
        }

        const userResponse = await fetch(`/api/auth/me?_t=${Date.now()}`);
        if (!userResponse.ok) {
          throw new Error('Failed to fetch user profile');
        }

        const userData = await userResponse.json();
        let userCoordinates: { lat: number; lng: number } | null = null;
        let userLocation: string | null = null;

        if (userData.location) {
          try {
            const parsedLocation = JSON.parse(userData.location);
            userLocation = parsedLocation.displayName;
            userCoordinates = parsedLocation.coordinates;
          } catch (error) {
            console.error('Failed to parse location:', error);
          }
        }

        if (!userCoordinates && userData.latitude && userData.longitude) {
          userCoordinates = {
            lat: userData.latitude,
            lng: userData.longitude
          };
        }

        if (!userLocation) {
          userLocation = userData.city || 'Your Area';
        }

        setLocationName(userLocation || '');
        setRadius(userData.newsRadius || 25);

        if (!userCoordinates) {
          setIdeas([]);
          setIsLoading(false);
          return;
        }

        const contentResponse = await fetch(
          `/api/content/local?lat=${userCoordinates.lat}&lng=${userCoordinates.lng}&radius=${userData.newsRadius || 25}&type=ideas`
        );

        if (!contentResponse.ok) {
          throw new Error('Failed to fetch local ideas');
        }

        const contentData = await contentResponse.json();
        setIdeas(contentData.content.ideas || []);

      } catch (error) {
        console.error('Error loading local ideas:', error);
      } finally {
        setIsLoading(false);
      }
    }

    loadLocalIdeas();
  }, [session?.user]);

  return (
    <div className="fixed inset-0 z-50 bg-background flex flex-col">
      {/* Header - Full Width */}
      <div className="sticky top-0 z-50 bg-background border-b px-4 sm:px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.back()}
            className="h-9 w-9 p-0 hover:bg-muted"
          >
            <ArrowLeft className="h-5 w-5" />
            <span className="sr-only">Go back</span>
          </Button>
          <div>
            <h1 className="text-xl font-semibold flex items-center gap-2">
              <MapPin className="h-5 w-5 text-primary" />
              Local Ideas
            </h1>
            {locationName && (
              <p className="text-sm text-muted-foreground">
                {locationName} • Within {radius} miles
              </p>
            )}
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.back()}
          className="h-9 w-9 p-0 hover:bg-muted"
        >
          <X className="h-5 w-5" />
          <span className="sr-only">Close</span>
        </Button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 py-6">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : ideas.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground mb-4">
                No local ideas found in your area
              </p>
              <Button asChild>
                <Link href="/ideas">View All Ideas</Link>
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {ideas.map((idea) => (
                <div key={idea.id} className="relative">
                  <IdeaCard
                    idea={idea as any}
                    currentUserId={session?.user?.id}
                  />
                  <div className="absolute top-2 right-2 bg-background/90 backdrop-blur-sm px-2 py-1 rounded text-xs text-muted-foreground border">
                    {Math.round(idea.distance)} miles away
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
