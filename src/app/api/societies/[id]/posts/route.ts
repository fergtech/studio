import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const posts = await prisma.societyPost.findMany({
      where: { societyId: params.id },
      include: { user: true },
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json(posts);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch posts', details: error }, { status: 500 });
  }
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = await req.json();
    const { type, content, userId, imageUrl } = body;
    if (!type || !content || !userId) {
      return NextResponse.json({ error: 'type, content, and userId are required' }, { status: 400 });
    }
    const post = await prisma.societyPost.create({
      data: {
        type,
        content,
        societyId: params.id,
        userId,
        imageUrl: imageUrl || undefined,
      },
      include: { user: true },
    });
    return NextResponse.json(post, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create post', details: error }, { status: 500 });
  }
} 