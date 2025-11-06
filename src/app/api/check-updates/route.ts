import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    // Count existing Update records
    const updateCount = await prisma.update.count();

    // Get sample updates if any exist
    const sampleUpdates = await prisma.update.findMany({
      take: 5,
      include: {
        initiative: {
          select: {
            id: true,
            title: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    return NextResponse.json({
      count: updateCount,
      samples: sampleUpdates
    });
  } catch (error) {
    console.error('Error checking updates:', error);
    return NextResponse.json({ error: 'Failed to check updates' }, { status: 500 });
  }
}
