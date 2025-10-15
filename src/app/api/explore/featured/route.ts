import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  try {
    // Get featured/trending content for initial explore page load
    
    // Get recent initiatives
    const featuredInitiatives = await prisma.initiative.findMany({
      select: {
        id: true,
        title: true,
        description: true,
        createdAt: true,
        imageUrl: true,
      },
      orderBy: { createdAt: 'desc' },
      take: 8,
    });

    // Get active societies
    const featuredSocieties = await prisma.society.findMany({
      select: {
        id: true,
        name: true,
        description: true,
        image: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
      take: 8,
    });

    // Transform societies to match expected format
    const transformedSocieties = featuredSocieties.map((society: any) => ({
      id: society.id,
      name: society.name,
      description: society.description,
      imageUrl: society.image, // Map image to imageUrl
      memberCount: 0, // TODO: Add member count if needed
    }));

    // Get recent posts
    const featuredPosts = await prisma.generalPost.findMany({
      select: {
        id: true,
        content: true,
        timestamp: true,
        creatorName: true,
        creatorAvatar: true,
        creatorId: true,
        media: true,
      },
      orderBy: { timestamp: 'desc' },
      take: 8,
    });

    // Transform posts to match expected format
    const transformedPosts = featuredPosts.map((post: any) => {
      // Extract first media item for display
      const firstMedia = post.media && post.media.length > 0 ? post.media[0] : null;
      
      return {
        id: post.id,
        content: post.content,
        type: 'general' as const,
        userId: post.creatorId,
        user: {
          name: post.creatorName || 'Anonymous',
          username: '', // Not available in this schema
          image: post.creatorAvatar,
        },
        mediaUrl: firstMedia?.url,
        mediaType: firstMedia?.type,
        createdAt: post.timestamp,
      };
    });

    // Get featured users (simplified)
    const featuredUsers = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        username: true,
        image: true,
        bio: true,
        location: true,
        skills: true,
        interests: true,
      },
      take: 6,
    });

    // Transform users to match expected format
    const transformedUsers = featuredUsers.map((user: any) => ({
      id: user.id,
      name: user.name || 'Anonymous',
      username: user.username || '',
      image: user.image,
      bio: user.bio || user.skills?.slice(0, 2).join(', ') || user.interests?.slice(0, 2).join(', ') || '',
      location: user.location,
      dateCreated: new Date().toISOString(), // Fallback since no timestamp available
    }));

    return NextResponse.json({
      initiatives: featuredInitiatives,
      societies: transformedSocieties,
      posts: transformedPosts,
      users: transformedUsers,
    });

  } catch (error) {
    console.error('Featured content API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch featured content' },
      { status: 500 }
    );
  }
}
