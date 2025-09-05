import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest, { params }: { params: Promise<{ postId: string }> }) {
  try {
    const { postId } = await params;
    const comments = await prisma.societyPostComment.findMany({
      where: { postId },
      include: { user: true },
      orderBy: { createdAt: 'asc' },
    });
    return NextResponse.json(comments);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch comments', details: error }, { status: 500 });
  }
}

export async function POST(req: NextRequest, { params }: { params: { postId: string } }) {
  try {
    const body = await req.json();
    const { userId, text, parentCommentId } = body;
    if (!userId || !text) {
      return NextResponse.json({ error: 'userId and text are required' }, { status: 400 });
    }

    // Get the society ID from the post
    const post = await prisma.societyPost.findUnique({
      where: { id: params.postId },
      select: { societyId: true }
    });

    if (!post) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }

    // Check if user is a member of the society
    const membership = await prisma.societyMembership.findUnique({
      where: {
        userId_societyId: {
          userId,
          societyId: post.societyId
        }
      }
    });

    if (!membership) {
      return NextResponse.json({ error: 'You must be a member of this society to comment on posts' }, { status: 403 });
    }

    const comment = await prisma.societyPostComment.create({
      data: {
        postId: params.postId,
        userId,
        text,
        parentCommentId: parentCommentId || null,
      },
      include: { user: true },
    });
    return NextResponse.json(comment, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create comment', details: error }, { status: 500 });
  }
} 