import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(req: NextRequest) {
  try {
    const { issueId, userId, text } = await req.json();
    if (!issueId || !userId || !text) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }
    const comment = await prisma.issueComment.create({
      data: { issueId, userId, text },
      include: { user: true },
    });
    return NextResponse.json(comment, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to add comment' }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const issueId = searchParams.get('issueId');
    if (!issueId) {
      return NextResponse.json({ error: 'Missing issueId' }, { status: 400 });
    }
    const comments = await prisma.issueComment.findMany({
      where: { issueId },
      include: { user: true },
      orderBy: { timestamp: 'desc' },
    });
    return NextResponse.json(comments, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch comments' }, { status: 500 });
  }
} 