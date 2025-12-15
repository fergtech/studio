import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string; resourceId: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id: initiativeId, resourceId } = await context.params;
  const body = await request.json();

  try {
    // Verify user is a member of the initiative
    const membership = await prisma.initiativeMembership.findUnique({
      where: {
        userId_initiativeId: {
          userId: session.user.id,
          initiativeId,
        },
      },
    });

    if (!membership) {
      return NextResponse.json({ error: 'Not a member of this initiative' }, { status: 403 });
    }

    // Verify resource exists and belongs to initiative
    const existingResource = await prisma.resourceMetadata.findUnique({
      where: { id: resourceId },
    });

    if (!existingResource || existingResource.initiativeId !== initiativeId) {
      return NextResponse.json({ error: 'Resource not found' }, { status: 404 });
    }

    // Update resource metadata
    const updated = await prisma.resourceMetadata.update({
      where: { id: resourceId },
      data: {
        category: body.category !== undefined ? body.category : undefined,
        tags: body.tags !== undefined ? body.tags : undefined,
        isPinned: body.isPinned !== undefined ? body.isPinned : undefined,
        description: body.description !== undefined ? body.description : undefined,
        title: body.title !== undefined ? body.title : undefined,
      },
    });

    revalidatePath(`/initiatives/${initiativeId}`);
    return NextResponse.json(updated);
  } catch (error) {
    console.error('Error updating resource:', error);
    return NextResponse.json({ error: 'Failed to update resource' }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  context: { params: Promise<{ id: string; resourceId: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id: initiativeId, resourceId } = await context.params;

  try {
    // Verify resource exists and belongs to initiative
    const resource = await prisma.resourceMetadata.findUnique({
      where: { id: resourceId },
    });

    if (!resource || resource.initiativeId !== initiativeId) {
      return NextResponse.json({ error: 'Resource not found' }, { status: 404 });
    }

    // Check if user is the creator or an admin of the initiative
    if (resource.createdBy !== session.user.id) {
      const membership = await prisma.initiativeMembership.findFirst({
        where: {
          initiativeId,
          userId: session.user.id,
          role: 'ADMIN',
        },
      });

      if (!membership) {
        return NextResponse.json({ error: 'Not authorized to delete this resource' }, { status: 403 });
      }
    }

    // Delete resource metadata
    await prisma.resourceMetadata.delete({ where: { id: resourceId } });

    revalidatePath(`/initiatives/${initiativeId}`);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting resource:', error);
    return NextResponse.json({ error: 'Failed to delete resource' }, { status: 500 });
  }
}
