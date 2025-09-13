import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Update user's last active timestamp
    await prisma.user.update({
      where: { id: session.user.id },
      data: { lastActiveAt: new Date() },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating user heartbeat:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}