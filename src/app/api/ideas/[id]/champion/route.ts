import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const { userId } = await request.json();

    if (userId !== session.user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if idea exists
    const idea = await prisma.idea.findUnique({
      where: { id },
    });

    if (!idea) {
      return NextResponse.json({ error: 'Idea not found' }, { status: 404 });
    }

    // Check if user has already championed this idea (liked it)
    const existingLike = await prisma.ideaLike.findUnique({
      where: {
        ideaId_userId: {
          ideaId: id,
          userId: userId,
        },
      },
    });

    if (existingLike) {
      return NextResponse.json({ error: 'Already championed' }, { status: 400 });
    }

    // Champion the idea by creating a like
    await prisma.ideaLike.create({
      data: {
        ideaId: id,
        userId: userId,
      },
    });

    // Update champion count
    const updatedIdea = await prisma.idea.update({
      where: { id },
      data: {
        championCount: {
          increment: 1,
        },
      },
    });

    return NextResponse.json({
      success: true,
      championCount: updatedIdea.championCount,
    });
  } catch (error) {
    console.error('Error championing idea:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const { userId } = await request.json();

    if (userId !== session.user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if idea exists and user has championed it
    const idea = await prisma.idea.findUnique({
      where: { id },
    });

    if (!idea) {
      return NextResponse.json({ error: 'Idea not found' }, { status: 404 });
    }

    // Check if user has championed this idea (liked it)
    const existingLike = await prisma.ideaLike.findUnique({
      where: {
        ideaId_userId: {
          ideaId: id,
          userId: userId,
        },
      },
    });

    if (!existingLike) {
      return NextResponse.json({ error: 'Not championed by user' }, { status: 400 });
    }

    // Unchampion the idea by deleting the like
    await prisma.ideaLike.delete({
      where: {
        ideaId_userId: {
          ideaId: id,
          userId: userId,
        },
      },
    });

    // Update champion count
    const updatedIdea = await prisma.idea.update({
      where: { id },
      data: {
        championCount: {
          decrement: 1,
        },
      },
    });

    return NextResponse.json({
      success: true,
      championCount: Math.max(0, updatedIdea.championCount), // Ensure non-negative
    });
  } catch (error) {
    console.error('Error unchampioning idea:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}