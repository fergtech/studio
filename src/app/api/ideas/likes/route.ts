import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(req: NextRequest) {
  try {
    const { ideaId, userId } = await req.json();
    if (!ideaId || !userId) {
      return NextResponse.json({ error: 'Missing ideaId or userId' }, { status: 400 });
    }
    const like = await prisma.ideaLike.create({
      data: { ideaId, userId },
    });
    return NextResponse.json(like, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to like idea' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { ideaId, userId } = await req.json();
    if (!ideaId || !userId) {
      return NextResponse.json({ error: 'Missing ideaId or userId' }, { status: 400 });
    }
    await prisma.ideaLike.deleteMany({
      where: { ideaId, userId },
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to unlike idea' }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const ideaId = searchParams.get('ideaId');
    const userId = searchParams.get('userId');
    if (!ideaId) {
      return NextResponse.json({ error: 'Missing ideaId' }, { status: 400 });
    }
    const count = await prisma.ideaLike.count({ where: { ideaId } });
    let liked = false;
    if (userId) {
      liked = !!(await prisma.ideaLike.findFirst({ where: { ideaId, userId } }));
    }
    return NextResponse.json({ count, liked });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch likes' }, { status: 500 });
  }
} 