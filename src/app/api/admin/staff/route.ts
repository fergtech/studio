import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET: Fetch all moderators and admins
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    // Check if user is admin or moderator (both can view staff)
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { isAdmin: true, isModerator: true }
    });

    if (!user?.isAdmin && !user?.isModerator) {
      return NextResponse.json({ error: 'Access denied - moderator or admin role required' }, { status: 403 });
    }

    // Fetch all users with moderator or admin roles
    const staffUsers = await prisma.user.findMany({
      where: {
        OR: [
          { isModerator: true },
          { isAdmin: true }
        ]
      },
      select: {
        id: true,
        name: true,
        email: true,
        username: true,
        image: true,
        isModerator: true,
        isAdmin: true,
        dateCreated: true,
        lastActiveAt: true
      },
      orderBy: [
        { isAdmin: 'desc' },
        { isModerator: 'desc' },
        { dateCreated: 'asc' }
      ]
    });

    return NextResponse.json({ staff: staffUsers });

  } catch (error) {
    console.error('Staff management API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch staff members' },
      { status: 500 }
    );
  }
}

// POST: Update user roles (promote/demote moderators/admins)
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    // Check if user is admin (only admins can manage roles)
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { isAdmin: true }
    });

    if (!user?.isAdmin) {
      return NextResponse.json({ error: 'Access denied - admin role required' }, { status: 403 });
    }

    const { userId, action, role } = await request.json();

    if (!userId || !action || !role) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Prevent self-demotion of admin role
    if (userId === session.user.id && action === 'remove' && role === 'admin') {
      return NextResponse.json({ error: 'Cannot remove your own admin role' }, { status: 400 });
    }

    const updateData: { isModerator?: boolean; isAdmin?: boolean } = {};

    if (role === 'moderator') {
      updateData.isModerator = action === 'add';
    } else if (role === 'admin') {
      updateData.isAdmin = action === 'add';
      // If removing admin, also remove moderator
      if (action === 'remove') {
        updateData.isModerator = false;
      }
      // If adding admin, also add moderator
      if (action === 'add') {
        updateData.isModerator = true;
      }
    }

    // Update user role
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        username: true,
        image: true,
        isModerator: true,
        isAdmin: true
      }
    });

    return NextResponse.json({ 
      success: true,
      user: updatedUser,
      message: `User ${action === 'add' ? 'promoted to' : 'removed from'} ${role} role`
    });

  } catch (error) {
    console.error('Role management API error:', error);
    return NextResponse.json(
      { error: 'Failed to update user role' },
      { status: 500 }
    );
  }
}