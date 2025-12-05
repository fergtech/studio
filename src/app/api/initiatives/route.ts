import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

// GET: List all initiatives (simplified like societies)
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search');
    const sortBy = searchParams.get('sortBy') || 'createdAt';
    const sortOrder = searchParams.get('sortOrder') || 'desc';

    // Build where clause for search
    const where: any = {};
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    // Build orderBy clause
    let orderBy: any = { createdAt: 'desc' };
    if (sortBy === 'title') {
      orderBy = { title: sortOrder };
    } else if (sortBy === 'updatedAt' || sortBy === 'activity') {
      orderBy = { updatedAt: sortOrder };
    } else {
      orderBy = { createdAt: sortOrder };
    }

    console.log('Fetching initiatives with query:', { where, orderBy });

    const initiatives = await prisma.initiative.findMany({
      where,
      select: {
        id: true,
        title: true,
        description: true,
        imageUrl: true,
        createdAt: true,
        updatedAt: true,
        creatorId: true,
        creator: {
          select: {
            id: true,
            name: true,
            image: true,
          },
        },
        _count: {
          select: {
            memberships: true,
          },
        },
      },
      orderBy,
      take: 10, // Limit results to improve performance
    });

    console.log('Found initiatives:', initiatives.length);

    // Transform data to match the expected format
    const transformedInitiatives = initiatives.map(initiative => ({
      id: initiative.id,
      title: initiative.title,
      description: initiative.description,
      imageUrl: initiative.imageUrl,
      createdAt: initiative.createdAt,
      updatedAt: initiative.updatedAt,
      creatorId: initiative.creatorId,
      creator: initiative.creator,
      _count: {
        members: initiative._count.memberships, // Map memberships count to members for frontend consistency
      },
    }));

    return NextResponse.json(transformedInitiatives);
  } catch (error) {
    console.error('Error fetching initiatives:', error);
    return NextResponse.json({ error: 'Failed to fetch initiatives', details: error }, { status: 500 });
  }
}