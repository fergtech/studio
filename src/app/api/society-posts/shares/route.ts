import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET: /api/society-posts/shares?postId=...&userId=...
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const postId = searchParams.get('postId');
  const userId = searchParams.get('userId');
  if (!postId) {
    return NextResponse.json({ error: 'postId is required' }, { status: 400 });
  }
  const count = await prisma.societyPostShare.count({ where: { postId } });
  let shared = false;
  if (userId) {
    shared = !!(await prisma.societyPostShare.findUnique({ where: { postId_userId: { postId, userId } } }));
  }
  return NextResponse.json({ count, shared });
}

// POST: /api/society-posts/shares { postId, userId }
export async function POST(req: NextRequest) {
  const { postId, userId } = await req.json();
  if (!postId || !userId) {
    return NextResponse.json({ error: 'postId and userId are required' }, { status: 400 });
  }
  const share = await prisma.societyPostShare.create({
    data: { postId, userId },
  });
  return NextResponse.json(share, { status: 201 });
}

// DELETE: /api/society-posts/shares { postId, userId }
export async function DELETE(req: NextRequest) {
  const { postId, userId } = await req.json();
  if (!postId || !userId) {
    return NextResponse.json({ error: 'postId and userId are required' }, { status: 400 });
  }
  await prisma.societyPostShare.delete({
    where: { postId_userId: { postId, userId } },
  });
  return NextResponse.json({ success: true });
} 