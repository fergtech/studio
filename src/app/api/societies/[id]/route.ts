import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const society = await prisma.society.findUnique({
      where: { id },
      include: { creator: true },
    });
    if (!society) {
      return NextResponse.json({ error: 'Society not found' }, { status: 404 });
    }
    return NextResponse.json(society);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch society', details: error }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { name, description, image } = body;
    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (image !== undefined) updateData.image = image;
    const updated = await prisma.society.update({
      where: { id },
      data: updateData,
      include: { creator: true },
    });
    return NextResponse.json(updated);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update society', details: error }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'User not authenticated' }, { status: 401 });
    }

    const { id } = await params;
    const userId = session.user.id;

    // Check if society exists and user is the creator
    const society = await prisma.society.findUnique({
      where: { id },
      select: { creatorId: true },
    });

    if (!society) {
      return NextResponse.json({ error: 'Society not found' }, { status: 404 });
    }

    if (society.creatorId !== userId) {
      return NextResponse.json({ error: 'Only the society creator can delete the society' }, { status: 403 });
    }

    // Delete all related data in a transaction
    await prisma.$transaction(async (tx) => {
      // Delete society memberships
      await tx.societyMembership.deleteMany({ where: { societyId: id } });

      // Delete society posts
      await tx.societyPost.deleteMany({ where: { societyId: id } });

      // Delete initiatives (and their related data will cascade)
      await tx.initiative.deleteMany({ where: { societyId: id } });

      // Delete ideas
      await tx.idea.deleteMany({ where: { societyId: id } });

      // Delete issues
      await tx.issue.deleteMany({ where: { societyId: id } });

      // Finally delete the society itself
      await tx.society.delete({ where: { id } });
    });

    return NextResponse.json({ success: true, message: 'Society deleted successfully' });
  } catch (error) {
    console.error('Error deleting society:', error);
    return NextResponse.json({ error: 'Failed to delete society', details: error }, { status: 500 });
  }
}