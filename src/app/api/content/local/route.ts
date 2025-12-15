import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';

interface LocalContentQuery {
  location?: string;
  coordinates?: { lat: number; lng: number };
  radius?: number; // in miles
  type?: 'ideas' | 'issues' | 'initiatives' | 'all';
  limit?: number;
  offset?: number;
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
    }

    if (!centerCoords) {
      console.log('🗺️ No valid coordinates provided');
      return NextResponse.json(
        { error: 'Coordinates (lat/lng) required' },
        { status: 400 }
      );
    }

    const radiusMiles = query.radius!;

    // Haversine formula SQL for distance calculation in miles
    // Earth radius = 3959 miles
    const distanceFormula = Prisma.sql`
      (3959 * acos(
        cos(radians(${centerCoords.lat})) *
        cos(radians(latitude)) *
        cos(radians(longitude) - radians(${centerCoords.lng})) +
        sin(radians(${centerCoords.lat})) *
        sin(radians(latitude))
      ))
    `;

    // Base query options
    const baseInclude = {
      creator: {
        select: {
          id: true,
          name: true,
          image: true,
          username: true,
        },
      },
    };

    let ideas: any[] = [];
    let issues: any[] = [];
    let initiatives: any[] = [];

    // Fetch content based on type using raw SQL for geo-filtering
    if (query.type === 'ideas' || query.type === 'all') {
      ideas = await prisma.$queryRaw`
        SELECT
          i.*,
          (3959 * acos(
            cos(radians(${centerCoords.lat})) *
            cos(radians(i.latitude)) *
            cos(radians(i.longitude) - radians(${centerCoords.lng})) +
            sin(radians(${centerCoords.lat})) *
            sin(radians(i.latitude))
          )) as distance
        FROM "Idea" i
        WHERE i.latitude IS NOT NULL
          AND i.longitude IS NOT NULL
          AND (3959 * acos(
            cos(radians(${centerCoords.lat})) *
            cos(radians(i.latitude)) *
            cos(radians(i.longitude) - radians(${centerCoords.lng})) +
            sin(radians(${centerCoords.lat})) *
            sin(radians(i.latitude))
          )) <= ${radiusMiles}
        ORDER BY i."createdAt" DESC
        LIMIT ${query.limit}
        OFFSET ${query.offset}
      `;

      // Fetch creators and media for ideas
      const ideaIds = ideas.map(i => i.id);
      if (ideaIds.length > 0) {
        const creators = await prisma.user.findMany({
          where: { id: { in: ideas.map(i => i.creatorId) } },
          select: { id: true, name: true, image: true, username: true },
        });
        const creatorMap = new Map(creators.map(c => [c.id, c]));
        
        const media = await prisma.mediaItem.findMany({
          where: { ideaId: { in: ideaIds } },
        });
        const mediaMap = new Map<string, any[]>();
        media.forEach(m => {
          if (!mediaMap.has(m.ideaId!)) mediaMap.set(m.ideaId!, []);
          mediaMap.get(m.ideaId!)!.push(m);
        });
        
        ideas = ideas.map(i => ({ 
          ...i, 
          creator: creatorMap.get(i.creatorId),
          media: mediaMap.get(i.id) || []
        }));
      }
    }

    if (query.type === 'issues' || query.type === 'all') {
      issues = await prisma.$queryRaw`
        SELECT
          i.*,
          (3959 * acos(
            cos(radians(${centerCoords.lat})) *
            cos(radians(i.latitude)) *
            cos(radians(i.longitude) - radians(${centerCoords.lng})) +
            sin(radians(${centerCoords.lat})) *
            sin(radians(i.latitude))
          )) as distance
        FROM "Issue" i
        WHERE i.latitude IS NOT NULL
          AND i.longitude IS NOT NULL
          AND (3959 * acos(
            cos(radians(${centerCoords.lat})) *
            cos(radians(i.latitude)) *
            cos(radians(i.longitude) - radians(${centerCoords.lng})) +
            sin(radians(${centerCoords.lat})) *
            sin(radians(i.latitude))
          )) <= ${radiusMiles}
        ORDER BY i."createdAt" DESC
        LIMIT ${query.limit}
        OFFSET ${query.offset}
      `;

      // Fetch creators and media for issues
      const issueIds = issues.map(i => i.id);
      if (issueIds.length > 0) {
        const creators = await prisma.user.findMany({
          where: { id: { in: issues.map(i => i.creatorId) } },
          select: { id: true, name: true, image: true, username: true },
        });
        const creatorMap = new Map(creators.map(c => [c.id, c]));
        
        const media = await prisma.mediaItem.findMany({
          where: { issueId: { in: issueIds } },
        });
        const mediaMap = new Map<string, any[]>();
        media.forEach(m => {
          if (!mediaMap.has(m.issueId!)) mediaMap.set(m.issueId!, []);
          mediaMap.get(m.issueId!)!.push(m);
        });
        
        issues = issues.map(i => ({ 
          ...i, 
          creator: creatorMap.get(i.creatorId),
          media: mediaMap.get(i.id) || []
        }));
      }
    }

    if (query.type === 'initiatives' || query.type === 'all') {
      initiatives = await prisma.$queryRaw`
        SELECT
          i.*,
          (3959 * acos(
            cos(radians(${centerCoords.lat})) *
            cos(radians(i.latitude)) *
            cos(radians(i.longitude) - radians(${centerCoords.lng})) +
            sin(radians(${centerCoords.lat})) *
            sin(radians(i.latitude))
          )) as distance
        FROM "Initiative" i
        WHERE i.latitude IS NOT NULL
          AND i.longitude IS NOT NULL
          AND (3959 * acos(
            cos(radians(${centerCoords.lat})) *
            cos(radians(i.latitude)) *
            cos(radians(i.longitude) - radians(${centerCoords.lng})) +
            sin(radians(${centerCoords.lat})) *
            sin(radians(i.latitude))
          )) <= ${radiusMiles}
        ORDER BY i."createdAt" DESC
        LIMIT ${query.limit}
        OFFSET ${query.offset}
      `;

      // Fetch creators for initiatives
      const initiativeIds = initiatives.map(i => i.id);
      if (initiativeIds.length > 0) {
        const creators = await prisma.user.findMany({
          where: { id: { in: initiatives.map(i => i.creatorId) } },
          select: { id: true, name: true, image: true, username: true },
        });
        const creatorMap = new Map(creators.map(c => [c.id, c]));
        initiatives = initiatives.map(i => ({ ...i, creator: creatorMap.get(i.creatorId) }));
      }
    }

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
        ideas,
        issues,
        initiatives,
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