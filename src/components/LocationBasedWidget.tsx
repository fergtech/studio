import { MapPin, Target, Lightbulb, Handshake, Users, ChevronRight, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { findNearbyAreas, findNearbyAreasByLocation, ResolvedLocation, calculateDistance } from '@/services/location';

interface LocalContentCounts {
  issues: number;
  ideas: number;
  initiatives: number;
  societies: number;
}

interface LocationData {
  primary: {
    name: string;
    counts: LocalContentCounts;
    coordinates?: { lat: number; lng: number };
  };
  neighboring: Array<{
    name: string;
    distance: string;
    coordinates?: { lat: number; lng: number };
  }>;
}

export default function LocationBasedWidget() {
  const { data: session } = useSession();
  const [locationData, setLocationData] = useState<LocationData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadLocationData() {
      try {
        setIsLoading(true);
        setError(null);

        // Get user's location from session/profile
        if (!session?.user) {
          // If no user session, show default mock data
          setLocationData({
            primary: {
              name: "Set your location",
              counts: { issues: 0, ideas: 0, initiatives: 0, societies: 0 }
            },
            neighboring: []
          });
          return;
        }

        // Fetch user profile to get location (with cache busting)
        const userResponse = await fetch(`/api/auth/me?_t=${Date.now()}`);
        if (!userResponse.ok) {
          throw new Error('Failed to fetch user profile');
        }
        
        const userData = await userResponse.json();
        console.log('🗺️ LocationBasedWidget userData:', {
          location: userData.location,
          city: userData.city,
          latitude: userData.latitude || 'not available',
          longitude: userData.longitude || 'not available',
          id: userData.id
        });

        // Try to get location from the new structured location field first
        let userLocation: string | null = null;
        let userCoordinates: { lat: number; lng: number } | null = null;

        if (userData.location) {
          try {
            const parsedLocation: ResolvedLocation = JSON.parse(userData.location);
            userLocation = parsedLocation.displayName;
            userCoordinates = parsedLocation.coordinates;
            console.log('🗺️ Parsed location:', { userLocation, userCoordinates });
          } catch (error) {
            console.error('Failed to parse location data:', error);
          }
        }

        // If we didn't get coordinates from JSON, try separate lat/lng fields
        if (!userCoordinates && userData.latitude && userData.longitude) {
          userCoordinates = {
            lat: userData.latitude,
            lng: userData.longitude
          };
          console.log('🗺️ Using separate lat/lng fields:', userCoordinates);
        }

        // Fallback to city field if no structured location
        if (!userLocation) {
          userLocation = userData.city;
          console.log('🗺️ Using fallback city:', userLocation);
        }
        
        if (!userLocation) {
          // User hasn't set location yet
          setLocationData({
            primary: {
              name: "Set your location",
              counts: { issues: 0, ideas: 0, initiatives: 0, societies: 0 }
            },
            neighboring: []
          });
          return;
        }

        // Fetch local content data including societies
        // Use coordinates if available, otherwise fall back to location string
        const contentUrl = userCoordinates
          ? `/api/content/local?lat=${userCoordinates.lat}&lng=${userCoordinates.lng}&radius=25`
          : `/api/content/local?location=${encodeURIComponent(userLocation)}&radius=25`;

        const contentResponse = await fetch(contentUrl);

        if (!contentResponse.ok) {
          throw new Error('Failed to fetch local content');
        }

        const contentData = await contentResponse.json();

        // Fetch geo-filtered societies
        const societiesUrl = userCoordinates
          ? `/api/content/local/societies?lat=${userCoordinates.lat}&lng=${userCoordinates.lng}&radius=25`
          : `/api/content/local/societies?location=${encodeURIComponent(userLocation)}&radius=25`;

        const societiesResponse = await fetch(societiesUrl);
        const societiesCount = societiesResponse.ok
          ? (await societiesResponse.json()).count || 0
          : 0;

        // Format neighboring areas - only if we have coordinates
        let formattedNeighboring: Array<{
          name: string;
          distance: string;
          coordinates?: { lat: number; lng: number };
        }> = [];
        
        // Try to get nearby areas using coordinates first
        if (userCoordinates || contentData.centerCoordinates) {
          const centerCoords = userCoordinates || contentData.centerCoordinates;
          console.log('🗺️ LocationBasedWidget: Attempting to find nearby areas with coordinates:', centerCoords);

          try {
            const neighboring = await findNearbyAreas(centerCoords);
            console.log('🗺️ LocationBasedWidget: findNearbyAreas returned:', neighboring);

            formattedNeighboring = neighboring.map(area => ({
              name: area.displayName,
              distance: `${Math.round(calculateDistance(centerCoords, area.coordinates))} miles`,
              coordinates: area.coordinates
            }));

            console.log('🗺️ LocationBasedWidget: Formatted neighboring areas:', formattedNeighboring);
          } catch (error) {
            console.error('🗺️ LocationBasedWidget: Error finding nearby areas:', error);
          }
        }
        // Fallback: use location string (zip code, city name, etc.)
        else if (userLocation && userLocation !== "Set your location") {
          console.log('🗺️ LocationBasedWidget: No coordinates, trying location string:', userLocation);

          try {
            const neighboring = await findNearbyAreasByLocation(userLocation);
            console.log('🗺️ LocationBasedWidget: findNearbyAreasByLocation returned:', neighboring);

            // For location string, we can't calculate exact distance, so use the service's distance
            formattedNeighboring = neighboring.slice(0, 3).map((area, index) => ({
              name: area.displayName,
              distance: `${Math.round((index + 1) * 12)} miles`, // Approximate distances
              coordinates: area.coordinates
            }));

            console.log('🗺️ LocationBasedWidget: Formatted neighboring areas from location:', formattedNeighboring);
          } catch (error) {
            console.error('🗺️ LocationBasedWidget: Error finding nearby areas by location:', error);
          }
        } else {
          console.log('🗺️ LocationBasedWidget: No coordinates or location available for nearby areas', {
            userCoordinates,
            centerCoordinates: contentData.centerCoordinates,
            userLocation
          });
        }

        setLocationData({
          primary: {
            name: userLocation,
            counts: {
              issues: contentData.counts.issues,
              ideas: contentData.counts.ideas,
              initiatives: contentData.counts.initiatives,
              societies: societiesCount
            },
            coordinates: userCoordinates || contentData.centerCoordinates
          },
          neighboring: formattedNeighboring
        });

      } catch (err) {
        console.error('Error loading location data:', err);
        setError('Failed to load local content');      } finally {
        setIsLoading(false);
      }
    }

    loadLocationData();
  }, [session?.user]);

  if (isLoading) {
    return (
      <div className="rounded-2xl bg-background/80 backdrop-blur-xl shadow-none p-0 mb-4">
        <div className="py-2 px-0 flex items-center gap-2">
          <MapPin className="h-4 w-4 text-primary" />
          <span className="text-base font-semibold tracking-tight">Local Content</span>
        </div>
        <div className="py-8 flex items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  if (!locationData) {
    return null;
  }

  const { primary, neighboring } = locationData;

  const categoryItems = [
    { 
      icon: Target, 
      label: 'Issues', 
      count: primary.counts.issues, 
      href: '/local/issues',
      color: 'text-red-600'
    },
    { 
      icon: Lightbulb, 
      label: 'Ideas', 
      count: primary.counts.ideas, 
      href: '/local/ideas',
      color: 'text-yellow-600'
    },
    { 
      icon: Handshake, 
      label: 'Initiatives', 
      count: primary.counts.initiatives, 
      href: '/local/initiatives',
      color: 'text-blue-600'
    },
    { 
      icon: Users, 
      label: 'Societies', 
      count: primary.counts.societies, 
      href: '/local/societies',
      color: 'text-green-600'
    },
  ];
  return (
    <div className="rounded-2xl bg-background/80 backdrop-blur-xl shadow-none p-0 mb-4">
      <div className="py-2 px-0 flex items-center gap-2">
        <MapPin className="h-4 w-4 text-primary" />
        <span className="text-base font-semibold tracking-tight">Local Content</span>
      </div>
      <div className="py-2 px-0 space-y-3">
        {error && (
          <div className="text-xs text-muted-foreground text-center py-2">
            {error}
          </div>
        )}

        {/* Primary Location */}
        <div className="px-3">
          <div className="flex items-center gap-2 mb-2">
            <h4 className="font-semibold text-sm tracking-tight">{primary.name}</h4>
            {primary.name !== "Set your location" && (
              <span className="text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded">Your area</span>
            )}
          </div>

          {primary.name === "Set your location" ? (
            <div className="text-center py-4">
              <p className="text-xs text-muted-foreground mb-2">
                Set your location to see local content
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  // Use the user's ID or username for the profile edit URL
                  const username = (session?.user as any)?.username;
                  const userId = session?.user?.id;
                  const identifier = username || userId || 'me';
                  const profilePath = `/profile/${identifier}/edit`;
                  window.location.href = profilePath;
                }}
              >
                Set Location
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-1">
              {categoryItems.map((item) => {
                const IconComponent = item.icon;
                return (
                  <Link
                    key={item.label}
                    href={item.href}
                    className="flex flex-col items-center justify-center gap-1 rounded-lg py-3 transition-colors group hover:bg-accent/40"
                  >
                    <IconComponent className={`h-5 w-5 ${item.color} group-hover:scale-110 transition-transform`} />
                    <span className="text-xs font-medium text-muted-foreground group-hover:text-foreground tracking-tight">{item.label}</span>
                    <span className="text-sm font-semibold tracking-tight">{item.count}</span>
                  </Link>
                );
              })}
            </div>
          )}
        </div>

        {/* Neighboring Areas */}
        {neighboring.length > 0 && (
          <div className="px-3">
            <h4 className="font-semibold text-sm mb-2 text-muted-foreground tracking-tight">Nearby Areas</h4>
            <div className="space-y-1">
              {neighboring.map((area) => (
                <div
                  key={area.name}
                  className="flex items-center justify-between rounded-lg px-2 py-1 transition-colors group hover:bg-accent/40"
                >
                  <span className="text-xs font-medium text-muted-foreground group-hover:text-foreground tracking-tight">{area.name}</span>
                  <span className="text-xs text-muted-foreground group-hover:text-foreground">{area.distance}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* View All Link */}
        <div className="px-3">
          <Button
            variant="ghost"
            size="sm"
            className="w-full text-xs h-7 text-muted-foreground hover:text-foreground"
            asChild
          >
            <Link href="/explore">Explore all content →</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}