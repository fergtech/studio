import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

// DELETE - Remove an update
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const updateId = params.id;

    // Check if the update exists and belongs to the user
    const update = await prisma.update.findUnique({
      where: { id: updateId },
    });

    if (!update) {
      return NextResponse.json({ error: 'Update not found' }, { status: 404 });
    }

    if (update.userId !== session.user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Delete the update (cascade will handle related media)
    await prisma.update.delete({
      where: { id: updateId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting update:', error);
    return NextResponse.json({ error: 'Failed to delete update' }, { status: 500 });
  }
}
