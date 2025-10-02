import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

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

    // Check if issue exists and user is the creator
    const existingIssue = await prisma.issue.findUnique({
      where: { id },
      select: { creatorId: true },
    });

    if (!existingIssue) {
      return NextResponse.json({ error: 'Issue not found' }, { status: 404 });
    }

    if (existingIssue.creatorId !== session.user.id) {
      return NextResponse.json({ error: 'Unauthorized: You can only edit your own issues' }, { status: 403 });
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

    // Update the issue
    const updatedIssue = await prisma.issue.update({
      where: { id },
      data: updateData,
      include: {
        media: true,
      },
    });

    return NextResponse.json({ success: true, issue: updatedIssue });
  } catch (error) {
    console.error('Error updating issue:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}