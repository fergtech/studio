import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const society = await prisma.society.findUnique({
      where: { id: params.id },
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

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = await req.json();
    const { name, description, image } = body;
    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (image !== undefined) updateData.image = image;
    const updated = await prisma.society.update({
      where: { id: params.id },
      data: updateData,
      include: { creator: true },
    });
    return NextResponse.json(updated);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update society', details: error }, { status: 500 });
  }
} 