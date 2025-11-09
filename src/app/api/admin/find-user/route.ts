import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET: Find user by email (for role management)
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    // Check if user is admin (only admins can find users for role management)
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { isAdmin: true }
    });

    if (!user?.isAdmin) {
      return NextResponse.json({ error: 'Access denied - admin role required' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const email = searchParams.get('email');

    if (!email) {
      return NextResponse.json({ error: 'Email parameter required' }, { status: 400 });
    }

    // Find user by email
    const foundUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
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

    if (!foundUser) {
      return NextResponse.json({ error: 'User not found with that email' }, { status: 404 });
    }

    return NextResponse.json(foundUser);

  } catch (error) {
    console.error('Find user API error:', error);
    return NextResponse.json(
      { error: 'Failed to find user' },
      { status: 500 }
    );
  }
}