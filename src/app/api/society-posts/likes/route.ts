import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET: /api/society-posts/likes?postId=...&userId=...
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const postId = searchParams.get('postId');
  const userId = searchParams.get('userId');
  if (!postId) {
    return NextResponse.json({ error: 'postId is required' }, { status: 400 });
  }
  const count = await prisma.societyPostLike.count({ where: { postId } });
  let liked = false;
  if (userId) {
    liked = !!(await prisma.societyPostLike.findUnique({ where: { postId_userId: { postId, userId } } }));
  }
  return NextResponse.json({ count, liked });
}

// POST: /api/society-posts/likes { postId, userId }
export async function POST(req: NextRequest) {
  const { postId, userId } = await req.json();
  if (!postId || !userId) {
    return NextResponse.json({ error: 'postId and userId are required' }, { status: 400 });
  }
  const like = await prisma.societyPostLike.create({
    data: { postId, userId },
  });
  return NextResponse.json(like, { status: 201 });
}

// DELETE: /api/society-posts/likes { postId, userId }
export async function DELETE(req: NextRequest) {
  const { postId, userId } = await req.json();
  if (!postId || !userId) {
    return NextResponse.json({ error: 'postId and userId are required' }, { status: 400 });
  }
  await prisma.societyPostLike.delete({
    where: { postId_userId: { postId, userId } },
  });
  return NextResponse.json({ success: true });
} 