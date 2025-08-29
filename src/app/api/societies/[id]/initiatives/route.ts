import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const societyId = params.id;

    // Check if society exists
    const society = await prisma.society.findUnique({
      where: { id: societyId },
    });

    if (!society) {
      return NextResponse.json({ error: 'Society not found' }, { status: 404 });
    }

    // Get all initiatives for this society
    const initiatives = await prisma.initiative.findMany({
      where: { societyId },
      include: {
        creator: {
          select: {
            id: true,
            name: true,
            image: true,
          },
        },
        memberships: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                image: true,
              },
            },
          },
        },
        _count: {
          select: {
            memberships: true,
            updates: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(initiatives);
  } catch (error) {
    console.error('Error fetching society initiatives:', error);
    return NextResponse.json({ error: 'Failed to fetch society initiatives' }, { status: 500 });
  }
}