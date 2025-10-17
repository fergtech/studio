import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    // Check if idea exists and user is the creator
    const existingIdea = await prisma.idea.findUnique({
      where: { id },
      select: { creatorId: true },
    });

    if (!existingIdea) {
      return NextResponse.json({ error: 'Idea not found' }, { status: 404 });
    }

    if (existingIdea.creatorId !== session.user.id) {
      return NextResponse.json({ error: 'Unauthorized: You can only delete your own ideas' }, { status: 403 });
    }

    // Delete the idea (cascade will handle related records)
    await prisma.idea.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting idea:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const { title, description, mediaUrl } = await request.json();

    if (!title?.trim() || !description?.trim()) {
      return NextResponse.json({ error: 'Title and description are required' }, { status: 400 });
    }

    // Check if idea exists and user is the creator
    const existingIdea = await prisma.idea.findUnique({
      where: { id },
      select: { creatorId: true },
    });

    if (!existingIdea) {
      return NextResponse.json({ error: 'Idea not found' }, { status: 404 });
    }

    if (existingIdea.creatorId !== session.user.id) {
      return NextResponse.json({ error: 'Unauthorized: You can only edit your own ideas' }, { status: 403 });
    }

    // Prepare update data
    const updateData: any = {
      title: title.trim(),
      description: description.trim(),
    };

    // Handle media update if provided in request
    if (mediaUrl !== undefined) {
      if (mediaUrl === null) {
        // Remove existing media
        updateData.media = { deleteMany: {} };
      } else if (mediaUrl) {
        // Add or replace media
        updateData.media = {
          deleteMany: {}, // Clear existing media first
          create: [{
            type: 'image', // Default to image, could be enhanced to detect type
            url: mediaUrl,
          }],
        };
      }
    }

    // Update the idea
    const updatedIdea = await prisma.idea.update({
      where: { id },
      data: updateData,
      include: {
        media: true,
      },
    });

    return NextResponse.json({ success: true, idea: updatedIdea });
  } catch (error) {
    console.error('Error updating idea:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}