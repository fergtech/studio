import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { title, content, imageUrl } = body;

    if (!title?.trim() || !content?.trim()) {
      return NextResponse.json(
        { error: 'Title and content are required' },
        { status: 400 }
      );
    }

    // Detect topics from content using AI
    let detectedTopics: string[] = [];
    let confidence = 0;

    try {
      const topicDetectionResponse = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/topic-detection`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: `${title} ${content}` })
      });

      if (topicDetectionResponse.ok) {
        const topicData = await topicDetectionResponse.json();
        detectedTopics = topicData.semanticTopics || [];
        confidence = topicData.confidence || 0;
      }
    } catch (error) {
      console.error('Topic detection failed, continuing without topics:', error);
    }

    // Create debate topic
    const debateTopic = await prisma.debateTopic.create({
      data: {
        title: title.trim(),
        content: content.trim(),
        imageUrl: imageUrl || null,
        creatorId: session.user.id,
        topics: detectedTopics,
      },
      include: {
        creator: {
          select: {
            id: true,
            name: true,
            image: true,
            username: true,
          },
        },
        _count: {
          select: {
            votes: true,
            arguments: true,
          },
        },
      },
    });

    // Create topic relations and update counts
    if (detectedTopics.length > 0) {
      for (const topicName of detectedTopics) {
        // Get or create topic
        let topic = await prisma.topic.findUnique({
          where: { name: topicName }
        });

        if (!topic) {
          topic = await prisma.topic.create({
            data: {
              name: topicName,
              isSystem: true,
              confidence,
              debateCount: 1,
              weeklyDebates: 1
            }
          });
        } else {
          // Update debate count
          await prisma.topic.update({
            where: { id: topic.id },
            data: {
              debateCount: { increment: 1 },
              weeklyDebates: { increment: 1 }
            }
          });
        }

        // Create DebateTopicTopic relation
        await prisma.debateTopicTopic.create({
          data: {
            debateId: debateTopic.id,
            topicId: topic.id,
            confidence
          }
        });
      }
    }

    return NextResponse.json(debateTopic, { status: 201 });
  } catch (error) {
    console.error('Error creating debate topic:', error);
    return NextResponse.json(
      { error: 'Failed to create debate topic' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1', 10);
    const pageSize = parseInt(searchParams.get('pageSize') || '10', 10);

    const debates = await prisma.debateTopic.findMany({
      include: {
        creator: {
          select: {
            id: true,
            name: true,
            image: true,
            username: true,
          },
        },
        votes: {
          select: {
            side: true,
          },
        },
        _count: {
          select: {
            arguments: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      skip: (page - 1) * pageSize,
      take: pageSize,
    });

    // Calculate vote statistics for each debate
    const debatesWithStats = debates.map(debate => {
      const proVotes = debate.votes.filter(vote => vote.side === 'PRO').length;
      const conVotes = debate.votes.filter(vote => vote.side === 'CON').length;
      const totalVotes = proVotes + conVotes;
      
      return {
        ...debate,
        stats: {
          proVotes,
          conVotes,
          totalVotes,
          proPercentage: totalVotes > 0 ? Math.round((proVotes / totalVotes) * 100) : 0,
          conPercentage: totalVotes > 0 ? Math.round((conVotes / totalVotes) * 100) : 0,
          argumentCount: debate._count.arguments,
        },
      };
    });

    return NextResponse.json(debatesWithStats);
  } catch (error) {
    console.error('Error fetching debates:', error);
    return NextResponse.json(
      { error: 'Failed to fetch debates' },
      { status: 500 }
    );
  }
}