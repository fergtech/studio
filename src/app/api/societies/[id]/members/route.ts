import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const societyId = id;

    // Check if society exists
    const society = await prisma.society.findUnique({
      where: { id: societyId },
    });

    if (!society) {
      return NextResponse.json({ error: 'Society not found' }, { status: 404 });
    }

    // Get all members including the creator
    const members = await prisma.societyMembership.findMany({
      where: { societyId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            image: true,
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    });

    // Also include the creator if they're not already in the members list
    const creator = await prisma.user.findUnique({
      where: { id: society.creatorId },
      select: {
        id: true,
        name: true,
        image: true,
      },
    });

    // Combine members and creator, ensuring no duplicates
    const allMembers = members.map(m => ({
      id: m.user.id,
      name: m.user.name,
      image: m.user.image,
      role: m.role,
    }));

    // Add creator if not already in the list
    if (creator && !allMembers.find(m => m.id === creator.id)) {
      allMembers.unshift({
        id: creator.id,
        name: creator.name,
        image: creator.image,
        role: 'ADMIN', // Creator is always admin
      });
    }

    return NextResponse.json(allMembers);
  } catch (error) {
    console.error('Error fetching society members:', error);
    return NextResponse.json({ error: 'Failed to fetch society members' }, { status: 500 });
  }
} 