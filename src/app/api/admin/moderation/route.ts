import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET: Fetch content pending moderation
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    console.log('Moderation API - Session:', session?.user?.id ? 'authenticated' : 'not authenticated');

    if (!session?.user?.id) {
      console.log('Moderation API - No session, returning 401');
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    // Check if user is moderator or admin
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { isModerator: true, isAdmin: true }
    });

    console.log('Moderation API - User roles:', { isModerator: user?.isModerator, isAdmin: user?.isAdmin });

    if (!user?.isModerator && !user?.isAdmin) {
      console.log('Moderation API - User not authorized, returning 403');
      return NextResponse.json({ error: 'Access denied - moderator role required' }, { status: 403 });
    }

    // Fetch pending content
    const [pendingPosts, pendingIssues, pendingIdeas, pendingDebates] = await Promise.all([
      prisma.generalPost.findMany({
        where: { moderationStatus: 'pending_review' },
        include: {
          creator: { select: { id: true, name: true, image: true, email: true } },
          media: true
        },
        orderBy: { timestamp: 'desc' },
        take: 50
      }),
      prisma.issue.findMany({
        where: { moderationStatus: 'pending_review' },
        include: {
          creator: { select: { id: true, name: true, image: true, email: true } },
          media: true
        },
        orderBy: { createdAt: 'desc' },
        take: 50
      }),
      prisma.idea.findMany({
        where: { moderationStatus: 'pending_review' },
        include: {
          creator: { select: { id: true, name: true, image: true, email: true } },
          media: true
        },
        orderBy: { createdAt: 'desc' },
        take: 50
      }),
      prisma.debateTopic.findMany({
        where: { moderationStatus: 'pending_review' },
        include: {
          creator: { select: { id: true, name: true, image: true, email: true } }
        },
        orderBy: { createdAt: 'desc' },
        take: 50
      })
    ]);

    // Combine and format results
    const pendingContent = [
      ...pendingPosts.map(p => ({ ...p, contentType: 'post' as const })),
      ...pendingIssues.map(i => ({ ...i, contentType: 'issue' as const })),
      ...pendingIdeas.map(i => ({ ...i, contentType: 'idea' as const })),
      ...pendingDebates.map(d => ({ ...d, contentType: 'debate' as const }))
    ];

    return NextResponse.json({
      success: true,
      pending: pendingContent,
      count: pendingContent.length
    });

  } catch (error) {
    console.error('Moderation queue fetch error:', error);
    console.error('Error details:', error instanceof Error ? error.message : String(error));
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace');
    return NextResponse.json({
      error: 'Failed to fetch moderation queue',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}

// POST: Approve or reject content
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    // Check if user is moderator or admin
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { isModerator: true, isAdmin: true }
    });

    if (!user?.isModerator && !user?.isAdmin) {
      return NextResponse.json({ error: 'Access denied - moderator role required' }, { status: 403 });
    }

    const { contentId, contentType, action } = await request.json();

    if (!contentId || !contentType || !action) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    if (!['approve', 'reject'].includes(action)) {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    // Update content status based on type
    const newStatus = action === 'approve' ? 'approved' : 'rejected';

    switch (contentType) {
      case 'post':
        await prisma.generalPost.update({
          where: { id: contentId },
          data: { moderationStatus: newStatus }
        });
        break;
      case 'issue':
        await prisma.issue.update({
          where: { id: contentId },
          data: { moderationStatus: newStatus }
        });
        break;
      case 'idea':
        await prisma.idea.update({
          where: { id: contentId },
          data: { moderationStatus: newStatus }
        });
        break;
      case 'debate':
        await prisma.debateTopic.update({
          where: { id: contentId },
          data: { moderationStatus: newStatus }
        });
        break;
      default:
        return NextResponse.json({ error: 'Invalid content type' }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      message: `Content ${action}d successfully`
    });

  } catch (error) {
    console.error('Moderation action error:', error);
    return NextResponse.json({ error: 'Failed to perform moderation action' }, { status: 500 });
  }
}
