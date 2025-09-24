import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// Simple haversine distance calculation
function calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371; // Earth's radius in kilometers
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;

  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;

  return distance * 0.621371; // Convert to miles
}

// Use OpenStreetMap Nominatim to find nearby places algorithmically
async function getNearbyPlacesFromNominatim(lat: number, lng: number, radius: number): Promise<string[]> {
  try {
    console.log('🗺️ Using OpenStreetMap Nominatim to find nearby places');

    // Use Nominatim reverse geocoding to get the primary location's details
    const reverseResponse = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&addressdetails=1`,
      {
        headers: { 'User-Agent': 'Society+ App' }
      }
    );

    if (!reverseResponse.ok) {
      console.error('Nominatim reverse geocoding failed:', reverseResponse.statusText);
      // Don't throw, just proceed to search
    }
    
    const reverseData = await reverseResponse.json();
    const currentCity = reverseData?.address?.city || reverseData?.address?.town || reverseData?.address?.village;
    console.log(`📍 Current city from reverse geocoding: ${currentCity}`);

    // Now, search for other cities/towns nearby, but not the current one
    const searchResponse = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=city,town,village&bounded=1&viewbox=${lng - 0.5},${lat + 0.3},${lng + 0.5},${lat - 0.3}&addressdetails=1&limit=20`,
      {
        headers: { 'User-Agent': 'Society+ App' }
      }
    );

    if (!searchResponse.ok) {
      throw new Error('Nominatim search service failed');
    }

    const searchData = await searchResponse.json();
    const nearbyAreas = new Set<string>();

    for (const place of searchData) {
      const placeName = place.address?.city || place.address?.town || place.address?.village;

      if (placeName && placeName.toLowerCase() !== currentCity?.toLowerCase()) {
        const distance = calculateDistance(lat, lng, parseFloat(place.lat), parseFloat(place.lon));
        if (distance <= radius) {
          nearbyAreas.add(placeName);
        }
      }
    }
    
    console.log(`✅ Found ${nearbyAreas.size} distinct nearby places from Nominatim.`);

    // Remove duplicates and limit results
    return [...nearbyAreas].slice(0, 5);
  } catch (error) {
    console.error('Error fetching nearby places from Nominatim:', error);
    return [];
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const lat = parseFloat(searchParams.get('lat') || '0');
    const lng = parseFloat(searchParams.get('lng') || '0');
    const radius = parseFloat(searchParams.get('radius') || '25');

    if (!lat || !lng) {
      return NextResponse.json({ error: 'Missing coordinates' }, { status: 400 });
    }

    console.log(`🗺️ Finding areas near: ${lat}, ${lng} within ${radius} miles`);

    // Get all users with location data
    const usersWithLocations = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        city: true,
        location: true,
      },
      where: {
        AND: [
          { location: { not: null } },
          { city: { not: null } },
          { id: { not: session.user.id } } // Exclude current user
        ]
      }
    });

    const nearbyAreas = new Set<string>();

    // Find areas within radius
    for (const user of usersWithLocations) {
      try {
        if (user.location && user.city) {
          const locationData = JSON.parse(user.location);
          if (locationData.lat && locationData.lng) {
            const distance = calculateDistance(lat, lng, locationData.lat, locationData.lng);

            if (distance <= radius) {
              nearbyAreas.add(user.city);
            }
          }
        }
      } catch (error) {
        // Skip invalid location data
        continue;
      }
    }

    let areas = Array.from(nearbyAreas);

    // If no areas found from users, use algorithmic geolocation API as fallback
    if (areas.length === 0) {
      console.log('📍 No user areas found, using geolocation API to find nearby places');
      areas = await getNearbyPlacesFromNominatim(lat, lng, radius);
    }

    // Limit to 5 areas for better query performance
    areas = areas.slice(0, 5);

    console.log(`✅ Found ${areas.length} nearby areas:`, areas);

    return NextResponse.json({
      success: true,
      areas,
      count: areas.length
    });

  } catch (error) {
    console.error('Error finding nearby areas:', error);
    return NextResponse.json(
      { error: 'Failed to find nearby areas' },
      { status: 500 }
    );
  }
}