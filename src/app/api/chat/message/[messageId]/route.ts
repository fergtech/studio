import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';

// DELETE /api/chat/message/[messageId] - Delete a specific message (soft delete)
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ messageId: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { messageId } = await params;
    const currentUserId = session.user.id;

    console.log('Delete request for messageId:', messageId, 'by user:', currentUserId);

    // Verify the message exists and belongs to the user
    const message = await prisma.chatMessage.findUnique({
      where: { id: messageId },
      select: { senderId: true, isDeleted: true }
    });

    console.log('Found message:', message);

    if (!message) {
      console.log('Message not found');
      return NextResponse.json({ error: 'Message not found' }, { status: 404 });
    }

    if (message.senderId !== currentUserId) {
      console.log('Permission denied - message belongs to:', message.senderId, 'user is:', currentUserId);
      return NextResponse.json({ error: 'You can only delete your own messages' }, { status: 403 });
    }

    if (message.isDeleted) {
      console.log('Message already deleted');
      return NextResponse.json({ error: 'Message already deleted' }, { status: 400 });
    }

    // Soft delete the message
    const updatedMessage = await prisma.chatMessage.update({
      where: { id: messageId },
      data: {
        isDeleted: true,
        deletedAt: new Date()
      }
    });

    console.log('Message deleted successfully:', updatedMessage.id, 'isDeleted:', updatedMessage.isDeleted);

    return NextResponse.json({ success: true, messageId });
  } catch (error) {
    console.error('Error deleting message:', error);
    return NextResponse.json({ 
      error: 'Internal server error', 
      details: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 });
  }
}