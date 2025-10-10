import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const userId = session.user.id;

    // Get all unique conversations for this user
    // Find all messages where user is either sender or receiver
    const messages = await prisma.chatMessage.findMany({
      where: {
        OR: [
          { senderId: userId, receiverId: { not: null } },
          { receiverId: userId }
        ]
      },
      orderBy: { timestamp: 'desc' },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            username: true,
            image: true
          }
        },
        receiver: {
          select: {
            id: true,
            name: true,
            username: true,
            image: true
          }
        }
      }
    });

    // Helper function to extract readable text from message
    const extractMessageText = (text: string): string => {
      try {
        // Try to parse as JSON (rich media message)
        const parsed = JSON.parse(text);

        if (parsed.type === 'text' && parsed.text) {
          return parsed.text;
        }

        if (parsed.type === 'mixed') {
          // For mixed messages, return the text part or describe the media
          if (parsed.text) {
            return parsed.text;
          }
          if (parsed.media && parsed.media.length > 0) {
            const mediaType = parsed.media[0].type;
            return `Sent ${mediaType === 'image' ? 'a photo' : mediaType === 'video' ? 'a video' : 'a file'}`;
          }
        }

        // If we can't determine the content, return a generic message
        return 'Sent a message';
      } catch {
        // If it's not JSON, return as-is (plain text message)
        return text;
      }
    };

    // Group messages by conversation partner
    const conversationsMap = new Map();

    for (const message of messages) {
      // Determine the other person in the conversation
      const otherUserId = message.senderId === userId ? message.receiverId : message.senderId;
      const otherUser = message.senderId === userId ? message.receiver : message.sender;

      if (!otherUserId || !otherUser) continue;

      // Only keep the most recent message for each conversation
      if (!conversationsMap.has(otherUserId)) {
        conversationsMap.set(otherUserId, {
          userId: otherUser.id,
          name: otherUser.name,
          username: otherUser.username,
          image: otherUser.image,
          lastMessage: {
            text: extractMessageText(message.text),
            timestamp: message.timestamp,
            senderId: message.senderId,
            isFromMe: message.senderId === userId
          }
        });
      }
    }

    // Convert map to array and sort by last message time
    const conversations = Array.from(conversationsMap.values()).sort((a, b) => {
      return new Date(b.lastMessage.timestamp).getTime() - new Date(a.lastMessage.timestamp).getTime();
    });

    return NextResponse.json({ conversations }, { status: 200 });
  } catch (error) {
    console.error('Error fetching conversations:', error);
    return NextResponse.json({ error: 'Failed to fetch conversations' }, { status: 500 });
  }
}
