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

    // Check if issue exists
    const issue = await prisma.issue.findUnique({
      where: { id },
    });

    if (!issue) {
      return NextResponse.json({ error: 'Issue not found' }, { status: 404 });
    }

    // Check if user has already championed this issue (liked it)
    const existingLike = await prisma.issueLike.findUnique({
      where: {
        issueId_userId: {
          issueId: id,
          userId: userId,
        },
      },
    });

    if (existingLike) {
      return NextResponse.json({ error: 'Already championed' }, { status: 400 });
    }

    // Champion the issue by creating a like
    await prisma.issueLike.create({
      data: {
        issueId: id,
        userId: userId,
      },
    });

    // Update champion count
    const updatedIssue = await prisma.issue.update({
      where: { id },
      data: {
        championCount: {
          increment: 1,
        },
      },
    });

    return NextResponse.json({
      success: true,
      championCount: updatedIssue.championCount,
    });
  } catch (error) {
    console.error('Error championing issue:', error);
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

    // Check if issue exists and user has championed it
    const issue = await prisma.issue.findUnique({
      where: { id },
    });

    if (!issue) {
      return NextResponse.json({ error: 'Issue not found' }, { status: 404 });
    }

    // Check if user has championed this issue (liked it)
    const existingLike = await prisma.issueLike.findUnique({
      where: {
        issueId_userId: {
          issueId: id,
          userId: userId,
        },
      },
    });

    if (!existingLike) {
      return NextResponse.json({ error: 'Not championed by user' }, { status: 400 });
    }

    // Unchampion the issue by deleting the like
    await prisma.issueLike.delete({
      where: {
        issueId_userId: {
          issueId: id,
          userId: userId,
        },
      },
    });

    // Update champion count
    const updatedIssue = await prisma.issue.update({
      where: { id },
      data: {
        championCount: {
          decrement: 1,
        },
      },
    });

    return NextResponse.json({
      success: true,
      championCount: Math.max(0, updatedIssue.championCount), // Ensure non-negative
    });
  } catch (error) {
    console.error('Error unchampioning issue:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}