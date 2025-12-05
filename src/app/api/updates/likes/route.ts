import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

// GET - Fetch like count and user's like status for an update
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const updateId = searchParams.get('updateId');
    const userId = searchParams.get('userId');

    if (!updateId) {
      return NextResponse.json({ error: 'Update ID is required' }, { status: 400 });
    }

    // Get total like count
    const likeCount = await prisma.updateLike.count({
      where: { updateId }
    });

    // Check if user has liked (if userId provided)
    let liked = false;
    if (userId) {
      const userLike = await prisma.updateLike.findUnique({
        where: {
          updateId_userId: {
            updateId,
            userId
          }
        }
      });
      liked = !!userLike;
    }

    return NextResponse.json({ count: likeCount, liked });
  } catch (error) {
    console.error('Error fetching update likes:', error);
    return NextResponse.json({ error: 'Failed to fetch likes' }, { status: 500 });
  }
}

// POST - Add a like to an update
export async function POST(request: NextRequest) {
  try {
    const { updateId, userId } = await request.json();

    if (!updateId || !userId) {
      return NextResponse.json({ error: 'Update ID and User ID are required' }, { status: 400 });
    }

    // Create like (using upsert to handle duplicates)
    await prisma.updateLike.upsert({
      where: {
        updateId_userId: {
          updateId,
          userId
        }
      },
      create: {
        updateId,
        userId
      },
      update: {} // No update needed if already exists
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error adding update like:', error);
    return NextResponse.json({ error: 'Failed to add like' }, { status: 500 });
  }
}

// DELETE - Remove a like from an update
export async function DELETE(request: NextRequest) {
  try {
    const { updateId, userId } = await request.json();

    if (!updateId || !userId) {
      return NextResponse.json({ error: 'Update ID and User ID are required' }, { status: 400 });
    }

    // Delete like
    await prisma.updateLike.delete({
      where: {
        updateId_userId: {
          updateId,
          userId
        }
      }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error removing update like:', error);
    return NextResponse.json({ error: 'Failed to remove like' }, { status: 500 });
  }
}
