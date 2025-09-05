import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const societyId = id;
    
    // Single optimized query using raw SQL for better performance
    const result = await prisma.$queryRaw<Array<{
      general_posts: bigint;
      idea_posts: bigint;
      issue_posts: bigint;
      initiatives: bigint;
    }>>`
      SELECT 
        COUNT(CASE WHEN sp.type = 'GENERAL' THEN 1 END) as general_posts,
        COUNT(CASE WHEN sp.type = 'IDEA' THEN 1 END) as idea_posts,
        COUNT(CASE WHEN sp.type = 'ISSUE' THEN 1 END) as issue_posts,
        (SELECT COUNT(*) 
         FROM "Initiative" i 
         WHERE i."societyId" = ${societyId}
        ) as initiatives
      FROM "SocietyPost" sp
      WHERE sp."societyId" = ${societyId}
    `;

    const stats = result[0];
    
    return NextResponse.json({
      generalPosts: Number(stats.general_posts),
      ideaPosts: Number(stats.idea_posts),
      issuePosts: Number(stats.issue_posts),
      initiatives: Number(stats.initiatives),
    });
  } catch (error) {
    console.error('Error fetching society stats:', error);
    return NextResponse.json({ error: 'Failed to fetch society stats' }, { status: 500 });
  }
} 