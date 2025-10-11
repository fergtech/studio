import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    const lat = searchParams.get('lat');
    const lng = searchParams.get('lng');
    const radius = parseInt(searchParams.get('radius') || '25');

    if (!lat || !lng) {
      return NextResponse.json(
        { error: 'Coordinates (lat/lng) required' },
        { status: 400 }
      );
    }

    const centerCoords = {
      lat: parseFloat(lat),
      lng: parseFloat(lng)
    };

    // Fetch societies using geo-filtering with Haversine formula
    const societies = await prisma.$queryRaw<any[]>`
      SELECT
        s.*,
        (3959 * acos(
          cos(radians(${centerCoords.lat})) *
          cos(radians(s.latitude)) *
          cos(radians(s.longitude) - radians(${centerCoords.lng})) +
          sin(radians(${centerCoords.lat})) *
          sin(radians(s.latitude))
        )) as distance
      FROM "Society" s
      WHERE s.latitude IS NOT NULL
        AND s.longitude IS NOT NULL
        AND (3959 * acos(
          cos(radians(${centerCoords.lat})) *
          cos(radians(s.latitude)) *
          cos(radians(s.longitude) - radians(${centerCoords.lng})) +
          sin(radians(${centerCoords.lat})) *
          sin(radians(s.latitude))
        )) <= ${radius}
      ORDER BY s."createdAt" DESC
    `;

    return NextResponse.json({
      count: societies.length,
      societies
    });
  } catch (error) {
    console.error('Local societies API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch local societies' },
      { status: 500 }
    );
  }
}
