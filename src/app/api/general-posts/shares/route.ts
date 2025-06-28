import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(req: NextRequest) {
  try {
    const { postId, userId } = await req.json();
    if (!postId || !userId) {
      return NextResponse.json({ error: 'Missing postId or userId' }, { status: 400 });
    }
    const share = await prisma.generalPostShare.create({
      data: { postId, userId },
    });
    return NextResponse.json(share, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to share post' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { postId, userId } = await req.json();
    if (!postId || !userId) {
      return NextResponse.json({ error: 'Missing postId or userId' }, { status: 400 });
    }
    await prisma.generalPostShare.deleteMany({
      where: { postId, userId },
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to unshare post' }, { status: 500 });
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
    const count = await prisma.generalPostShare.count({ where: { postId } });
    let shared = false;
    if (userId) {
      shared = !!(await prisma.generalPostShare.findFirst({ where: { postId, userId } }));
    }
    return NextResponse.json({ count, shared });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch shares' }, { status: 500 });
  }
} 