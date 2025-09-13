import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { content, side, parentId } = body;

    if (!content?.trim() || !side || !['PRO', 'CON'].includes(side)) {
      return NextResponse.json(
        { error: 'Content and valid side (PRO or CON) are required' },
        { status: 400 }
      );
    }

    const { id: topicId } = await params;

    // Check if debate topic exists
    const debateTopic = await prisma.debateTopic.findUnique({
      where: { id: topicId },
    });

    if (!debateTopic) {
      return NextResponse.json(
        { error: 'Debate topic not found' },
        { status: 404 }
      );
    }

    // If parentId is provided, check if the parent argument exists and is on the same side
    if (parentId) {
      const parentArgument = await prisma.debateArgument.findUnique({
        where: { id: parentId },
      });

      if (!parentArgument) {
        return NextResponse.json(
          { error: 'Parent argument not found' },
          { status: 404 }
        );
      }

      if (parentArgument.side !== side) {
        return NextResponse.json(
          { error: 'Reply must be on the same side as parent argument' },
          { status: 400 }
        );
      }
    }

    // Create the argument
    const argument = await prisma.debateArgument.create({
      data: {
        content: content.trim(),
        side,
        topicId,
        userId: session.user.id,
        parentId: parentId || null,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            image: true,
            username: true,
          },
        },
        votes: true,
      },
    });

    return NextResponse.json(argument, { status: 201 });
  } catch (error) {
    console.error('Error creating argument:', error);
    return NextResponse.json(
      { error: 'Failed to create argument' },
      { status: 500 }
    );
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { searchParams } = new URL(request.url);
    const side = searchParams.get('side'); // 'PRO', 'CON', or null for both
    const parentId = searchParams.get('parentId'); // For getting replies

    const { id: topicId } = await params;

    const whereCondition: any = {
      topicId,
    };

    if (side && ['PRO', 'CON'].includes(side)) {
      whereCondition.side = side;
    }

    if (parentId === 'null') {
      whereCondition.parentId = null; // Top-level arguments only
    } else if (parentId) {
      whereCondition.parentId = parentId; // Replies to specific argument
    }

    const debateArguments = await prisma.debateArgument.findMany({
      where: whereCondition,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            image: true,
            username: true,
          },
        },
        votes: true,
        replies: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                image: true,
                username: true,
              },
            },
            votes: true,
          },
          orderBy: { createdAt: 'asc' },
        },
        _count: {
          select: {
            replies: true,
            votes: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(debateArguments);
  } catch (error) {
    console.error('Error fetching arguments:', error);
    return NextResponse.json(
      { error: 'Failed to fetch arguments' },
      { status: 500 }
    );
  }
}