import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(req: NextRequest) {
  try {
    const { postId, userId } = await req.json();
    if (!postId || !userId) {
      return NextResponse.json({ error: 'Missing postId or userId' }, { status: 400 });
    }
    const like = await prisma.generalPostLike.create({
      data: { postId, userId },
    });
    return NextResponse.json(like, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to like post' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { postId, userId } = await req.json();
    if (!postId || !userId) {
      return NextResponse.json({ error: 'Missing postId or userId' }, { status: 400 });
    }
    await prisma.generalPostLike.deleteMany({
      where: { postId, userId },
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to unlike post' }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const postId = searchParams.get('postId');
    const userId = searchParams.get('userId');
    if (!postId) {
      return NextResponse.json({ error: 'Missing postId' }, { status: 400 });
    }
    const count = await prisma.generalPostLike.count({ where: { postId } });
    let liked = false;
    if (userId) {
      liked = !!(await prisma.generalPostLike.findFirst({ where: { postId, userId } }));
    }
    return NextResponse.json({ count, liked });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch likes' }, { status: 500 });
  }
} 
