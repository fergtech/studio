import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET: List all societies
export async function GET(req: NextRequest) {
  try {
    const societies = await prisma.society.findMany({
      include: {
        memberships: true,
        creator: true,
      },
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json(societies);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch societies', details: error }, { status: 500 });
  }
}

// POST: Create a new society
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, description, image } = body;
    // TODO: Replace with real user ID from auth/session
    const userId = body.userId || 'mock-user-id';
    if (!name || !userId) {
      return NextResponse.json({ error: 'Name and userId are required' }, { status: 400 });
    }
    const society = await prisma.society.create({
      data: {
        name,
        description,
        image,
        creatorId: userId,
      },
    });
    return NextResponse.json(society, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create society', details: error }, { status: 500 });
  }
} 