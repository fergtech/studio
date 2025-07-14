import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest, { params }: { params: { postId: string } }) {
  try {
    const comments = await prisma.societyPostComment.findMany({
      where: { postId: params.postId },
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