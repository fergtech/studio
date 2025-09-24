import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { calculateDistance } from '@/services/location';

interface LocalContentQuery {
  location?: string;
  coordinates?: { lat: number; lng: number };
  radius?: number; // in miles
  type?: 'ideas' | 'issues' | 'initiatives' | 'all';
  limit?: number;
  offset?: number;
}

// Helper function to parse coordinates from location string
function parseLocationCoordinates(location: string): { lat: number; lng: number } | null {
  // This is a simplified parser - in production you'd want a more robust solution
  // For now, we'll use some known locations as examples
  const locationMap: { [key: string]: { lat: number; lng: number } } = {
    'harford county': { lat: 39.5965, lng: -76.3897 },
    'baltimore county': { lat: 39.4403, lng: -76.6186 },
    'cecil county': { lat: 39.6059, lng: -75.9442 },
    'york county': { lat: 39.9777, lng: -76.7260 },
    'anne arundel county': { lat: 39.1634062, lng: -76.5993106 },
    'anne arundel county, maryland': { lat: 39.1634062, lng: -76.5993106 },
    'montgomery county': { lat: 39.1547, lng: -77.2405 },
    'prince george\'s county': { lat: 38.7849, lng: -76.8721 },
    'howard county': { lat: 39.3043, lng: -76.8595 },
    'carroll county': { lat: 39.4967, lng: -77.0316 },
  };

  const normalizedLocation = location.toLowerCase().replace(/,.*$/, '').trim();
  return locationMap[normalizedLocation] || null;
}

// Helper function to filter content by proximity
function filterByProximity<T extends { location?: string | null }>(
  items: T[],
  centerCoords: { lat: number; lng: number },
  radiusMiles: number
): T[] {
  return items.filter(item => {
    if (!item.location) return false;
    
    const itemCoords = parseLocationCoordinates(item.location);
    if (!itemCoords) return false;
    
    const distance = calculateDistance(centerCoords, itemCoords);
    return distance <= radiusMiles;
  });
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    const query: LocalContentQuery = {
      location: searchParams.get('location') || undefined,
      coordinates: searchParams.get('lat') && searchParams.get('lng') 
        ? { 
            lat: parseFloat(searchParams.get('lat')!), 
            lng: parseFloat(searchParams.get('lng')!) 
          }
        : undefined,
      radius: parseInt(searchParams.get('radius') || '25'),
      type: (searchParams.get('type') as any) || 'all',
      limit: parseInt(searchParams.get('limit') || '50'),
      offset: parseInt(searchParams.get('offset') || '0'),
    };

    // Determine center coordinates for proximity filtering
    let centerCoords: { lat: number; lng: number } | null = null;
    
    if (query.coordinates) {
      centerCoords = query.coordinates;
      console.log('🗺️ Using provided coordinates:', centerCoords);
    } else if (query.location) {
      centerCoords = parseLocationCoordinates(query.location);
      console.log('🗺️ Parsed location coordinates:', { location: query.location, coords: centerCoords });
    }

    if (!centerCoords) {
      console.log('🗺️ No valid coordinates found for location:', query.location);
      return NextResponse.json(
        { error: 'Location or coordinates required' },
        { status: 400 }
      );
    }

    // Base query options
    const baseQuery = {
      take: query.limit,
      skip: query.offset,
      orderBy: { createdAt: 'desc' as const },
      include: {
        creator: {
          select: {
            id: true,
            name: true,
            image: true,
            username: true,
          },
        },
      },
    };

    let ideas: any[] = [];
    let issues: any[] = [];
    let initiatives: any[] = [];

    // Fetch content based on type
    if (query.type === 'ideas' || query.type === 'all') {
      const allIdeas = await prisma.idea.findMany({
        ...baseQuery,
        where: {
          location: { not: null },
        },
      });
      ideas = filterByProximity(allIdeas, centerCoords, query.radius!);
    }

    if (query.type === 'issues' || query.type === 'all') {
      const allIssues = await prisma.issue.findMany({
        ...baseQuery,
        where: {
          location: { not: null },
        },
      });
      issues = filterByProximity(allIssues, centerCoords, query.radius!);
    }

    if (query.type === 'initiatives' || query.type === 'all') {
      const allInitiatives = await prisma.initiative.findMany({
        ...baseQuery,
        where: {
          location: { not: null },
        },
      });
      initiatives = filterByProximity(allInitiatives, centerCoords, query.radius!);
    }

    // Calculate distances and add to items
    const addDistanceInfo = (items: any[]) => 
      items.map(item => ({
        ...item,
        distance: item.location 
          ? calculateDistance(centerCoords!, parseLocationCoordinates(item.location) || centerCoords!)
          : null,
      }));

    const result = {
      location: query.location || `${centerCoords.lat}, ${centerCoords.lng}`,
      radius: query.radius,
      centerCoordinates: centerCoords,
      counts: {
        ideas: ideas.length,
        issues: issues.length,
        initiatives: initiatives.length,
        total: ideas.length + issues.length + initiatives.length,
      },
      content: {
        ideas: addDistanceInfo(ideas),
        issues: addDistanceInfo(issues),
        initiatives: addDistanceInfo(initiatives),
      },
    };

    return NextResponse.json(result);
  } catch (error) {
    console.error('Local content API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch local content' },
      { status: 500 }
    );
  }
}