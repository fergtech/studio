import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(req: NextRequest) {
  try {
    const { postId, userId, text, parentCommentId } = await req.json();
    if (!postId || !userId || !text) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }
    const comment = await prisma.generalPostComment.create({
      data: {
        postId,
        userId,
        text,
        parentCommentId: parentCommentId || null,
      },
      include: { user: true },
    });
    return NextResponse.json(comment, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to add comment' }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const postId = searchParams.get('postId');
    if (!postId) {
      return NextResponse.json({ error: 'Missing postId' }, { status: 400 });
    }
    // Fetch all comments for the post, including user info
    const allComments = await prisma.generalPostComment.findMany({
      where: { postId },
      include: { user: true },
      orderBy: { timestamp: 'asc' },
    });

    // Organize comments into threads (parent comments with replies)
    const parentComments = allComments.filter((comment) => !comment.parentCommentId);
    const replies = allComments.filter((comment) => comment.parentCommentId);

    // Attach replies to their parent comments (one level only)
    const organizedComments = parentComments.map((comment) => ({
      ...comment,
      replies: replies.filter((reply) => reply.parentCommentId === comment.id),
    }));

    return NextResponse.json({ allComments, organizedComments }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch comments' }, { status: 500 });
  }
} 
