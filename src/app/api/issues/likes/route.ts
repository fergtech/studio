import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(req: NextRequest) {
  try {
    const { issueId, userId } = await req.json();
    if (!issueId || !userId) {
      return NextResponse.json({ error: 'Missing issueId or userId' }, { status: 400 });
    }
    const like = await prisma.issueLike.create({
      data: { issueId, userId },
    });
    return NextResponse.json(like, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to like issue' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { issueId, userId } = await req.json();
    if (!issueId || !userId) {
      return NextResponse.json({ error: 'Missing issueId or userId' }, { status: 400 });
    }
    await prisma.issueLike.deleteMany({
      where: { issueId, userId },
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to unlike issue' }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const issueId = searchParams.get('issueId');
    const userId = searchParams.get('userId');
    if (!issueId) {
      return NextResponse.json({ error: 'Missing issueId' }, { status: 400 });
    }
    const count = await prisma.issueLike.count({ where: { issueId } });
    let liked = false;
    if (userId) {
      liked = !!(await prisma.issueLike.findFirst({ where: { issueId, userId } }));
    }
    return NextResponse.json({ count, liked });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch likes' }, { status: 500 });
  }
} 