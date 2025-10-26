import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

// GET comments for a debate
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  try {
    const comments = await prisma.debateArgument.findMany({
      where: { topicId: id },
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
    });

    const session = await getServerSession(authOptions);
    const userId = session?.user?.id;

    const formattedComments = comments.map(comment => {
      const isLiked = userId ? comment.votes.some(vote => vote.userId === userId && vote.isUpvote) : false;
      return {
        id: comment.id,
        content: comment.content,
        createdAt: comment.createdAt.toISOString(),
        user: comment.user,
        likes: comment.votes.filter(vote => vote.isUpvote).length,
        isLiked: isLiked,
        replies: [], // TODO: Implement nested replies
      };
    });

    return NextResponse.json({ comments: formattedComments });
  } catch (error) {
    console.error(`Error fetching comments for debate ${id}:`, error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}

// POST a new comment to a debate
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }
  const userId = session.user.id;

  try {
    const { id } = await params;
    const body = await req.json();
    const { content, parentId } = body;

    if (!content) {
      return NextResponse.json({ message: 'Comment content is required' }, { status: 400 });
    }

    // Determine the side of the user in the debate
    const userVote = await prisma.debateVote.findUnique({
        where: { topicId_userId: { topicId: id, userId } },
    });

    if (!userVote) {
        return NextResponse.json({ message: 'You must vote on the debate before commenting.' }, { status: 403 });
    }

    const newComment = await prisma.debateArgument.create({
      data: {
        content,
        topicId: id,
        userId,
        side: userVote.side,
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

    const formattedComment = {
        id: newComment.id,
        content: newComment.content,
        createdAt: newComment.createdAt.toISOString(),
        user: newComment.user,
        likes: 0,
        isLiked: false,
        replies: [],
    };

    return NextResponse.json(formattedComment, { status: 201 });
  } catch (error) {
    console.error('Error posting comment:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
