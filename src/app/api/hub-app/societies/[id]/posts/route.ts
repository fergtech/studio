import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { findOrCreateUser, toHubPost } from '../../_lib/helpers';

function checkKey(req: NextRequest) {
  return req.headers.get('x-hub-api-key') === process.env.HUB_APP_KEY;
}

type Ctx = { params: Promise<{ id: string }> };

const POST_INCLUDE = {
  user: { select: { id: true, email: true, name: true } },
  _count: { select: { comments: true } },
};

// GET /api/hub-app/societies/:id/posts
export async function GET(req: NextRequest, { params }: Ctx) {
  if (!checkKey(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { id } = await params;

  const posts = await prisma.societyPost.findMany({
    where: { societyId: id },
    include: POST_INCLUDE,
    orderBy: { createdAt: 'desc' },
    take: 100,
  });

  return NextResponse.json(posts.map(toHubPost));
}

// POST /api/hub-app/societies/:id/posts
export async function POST(req: NextRequest, { params }: Ctx) {
  if (!checkKey(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { id } = await params;
  const callerEmail = req.headers.get('x-hub-user-email');
  if (!callerEmail) return NextResponse.json({ error: 'x-hub-user-email required' }, { status: 400 });

  const { title, body, category } = await req.json();
  if (!title?.trim()) return NextResponse.json({ error: 'title is required' }, { status: 400 });

  const categoryToType: Record<string, string> = {
    DISCUSSION: 'GENERAL',
    PROJECT: 'IDEA',
    ANNOUNCEMENT: 'ISSUE',
  };
  const type = categoryToType[category] ?? 'GENERAL';
  const content = body ? `${title}\n\n${body}` : title;

  const user = await findOrCreateUser(callerEmail);
  const post = await prisma.societyPost.create({
    data: { societyId: id, userId: user.id, type: type as any, content },
    include: POST_INCLUDE,
  });

  return NextResponse.json(toHubPost(post), { status: 201 });
}
