import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/db';

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string; argumentId: string } }
) {
  try {
    const { userId } = auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { argumentId } = params;

    // First, verify the user owns this argument
    const argument = await prisma.argument.findUnique({
      where: { id: argumentId },
      select: { userId: true }
    });

    if (!argument) {
      return NextResponse.json({ error: 'Argument not found' }, { status: 404 });
    }

    if (argument.userId !== userId) {
      return NextResponse.json({ error: 'Not authorized to delete this argument' }, { status: 403 });
    }

    // Delete the argument and all its replies (cascading delete)
    // This will automatically delete all replies due to the cascade relationship in Prisma schema
    await prisma.argument.delete({
      where: { id: argumentId }
    });

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Error deleting argument:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}