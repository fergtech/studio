import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(req: NextRequest) {
  try {
    const { issueId, userId } = await req.json();
    if (!issueId || !userId) {
      return NextResponse.json({ error: 'Missing issueId or userId' }, { status: 400 });
    }
    const share = await prisma.issueShare.create({
      data: { issueId, userId },
    });
    return NextResponse.json(share, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to share issue' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { issueId, userId } = await req.json();
    if (!issueId || !userId) {
      return NextResponse.json({ error: 'Missing issueId or userId' }, { status: 400 });
    }
    await prisma.issueShare.deleteMany({
      where: { issueId, userId },
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to unshare issue' }, { status: 500 });
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
    const count = await prisma.issueShare.count({ where: { issueId } });
    let shared = false;
    if (userId) {
      shared = !!(await prisma.issueShare.findFirst({ where: { issueId, userId } }));
    }
    return NextResponse.json({ count, shared });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch shares' }, { status: 500 });
  }
} 