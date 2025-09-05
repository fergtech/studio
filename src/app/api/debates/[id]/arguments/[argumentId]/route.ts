import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; argumentId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { argumentId } = await params;

    // First, verify the user owns this argument
    const argument = await prisma.debateArgument.findUnique({
      where: { id: argumentId },
      select: { userId: true }
    });

    if (!argument) {
      return NextResponse.json({ error: 'Argument not found' }, { status: 404 });
    }

    if (argument.userId !== session.user.id) {
      return NextResponse.json({ error: 'Not authorized to delete this argument' }, { status: 403 });
    }

    // Delete the argument and all its replies (cascading delete)
    // This will automatically delete all replies due to the cascade relationship in Prisma schema
    await prisma.debateArgument.delete({
      where: { id: argumentId }
    });

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Error deleting argument:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}