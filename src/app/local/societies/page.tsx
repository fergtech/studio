"use client";

import { useRouter } from 'next/navigation';
import { ArrowLeft, X, MapPin, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useSession } from 'next-auth/react';
import { useState, useEffect } from 'react';
import { SocietyCard } from '@/components/SocietyCard';
import Link from 'next/link';

interface LocalSociety {
  id: string;
  name: string;
  description: string | null;
  image: string | null;
  creatorId: string;
  location: string | null;
  latitude: number | null;
  longitude: number | null;
  distance: number;
  createdAt: string;
  creator: {
    id: string;
    name: string | null;
    username: string | null;
    image: string | null;
  };
  _count: {
    memberships: number;
    posts: number;
  };
}

export default function LocalSocietiesPage() {
  const router = useRouter();
  const { data: session } = useSession();
  
  const [societies, setSocieties] = useState<LocalSociety[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [locationName, setLocationName] = useState('');
  const [radius, setRadius] = useState(25);

  useEffect(() => {
    async function loadLocalSocieties() {
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
          setSocieties([]);
          setIsLoading(false);
          return;
        }

        const societiesResponse = await fetch(
          `/api/content/local/societies?lat=${userCoordinates.lat}&lng=${userCoordinates.lng}&radius=${userData.newsRadius || 25}`
        );

        if (!societiesResponse.ok) {
          throw new Error('Failed to fetch local societies');
        }

        const societiesData = await societiesResponse.json();
        setSocieties(societiesData.societies || []);

      } catch (error) {
        console.error('Error loading local societies:', error);
      } finally {
        setIsLoading(false);
      }
    }

    loadLocalSocieties();
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
              Local Societies
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
          ) : societies.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground mb-4">
                No local societies found in your area
              </p>
              <Button asChild>
                <Link href="/societies">View All Societies</Link>
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {societies.map((society) => (
                <div key={society.id} className="relative">
                  <SocietyCard
                    society={society as any}
                    creatorName={society.creator.name || society.creator.username || 'User'}
                    creatorAvatarUrl={society.creator.image || undefined}
                    currentUserId={session?.user?.id}
                  />
                  <div className="absolute top-2 right-2 bg-background/90 backdrop-blur-sm px-2 py-1 rounded text-xs text-muted-foreground border">
                    {Math.round(society.distance)} miles away
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
