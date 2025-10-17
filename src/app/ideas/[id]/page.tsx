import { prisma } from '@/lib/prisma';
import IdeaClient from './IdeaClient';
import { notFound } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { Metadata } from 'next';

// Force dynamic rendering to prevent static generation issues
export const dynamic = 'force-dynamic';

// Generate metadata for social sharing
export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;

  const idea = await prisma.idea.findUnique({
    where: { id },
    select: {
      title: true,
      description: true,
      creator: {
        select: {
          name: true,
        },
      },
      media: true,
    },
  });

  if (!idea) {
    return {
      title: 'Idea Not Found | Society Plus',
    };
  }

  const title = idea.title;
  const description = idea.description.length > 160
    ? idea.description.substring(0, 157) + '...'
    : idea.description;
  const imageUrl = idea.media?.[0]?.url || `${process.env.NEXTAUTH_URL}/api/og?title=${encodeURIComponent(title)}&type=idea`;

  return {
    title: `${title} | Society Plus`,
    description,
    openGraph: {
      title,
      description,
      images: [imageUrl],
      type: 'article',
      siteName: 'Society Plus',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [imageUrl],
    },
  };
}

export default async function IdeaPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const idea = await prisma.idea.findUnique({
    where: { id },
    include: {
      creator: {
        select: {
          id: true,
          name: true,
          image: true,
        },
      },
      media: true,
      society: {
        select: {
          id: true,
          name: true,
          image: true,
        },
      },
    },
  });

  if (!idea) {
    notFound();
  }

  const session = await getServerSession(authOptions);
  const currentUserId = session?.user?.id || null;

  // Check if current user has championed this idea
  let isChampioned = false;
  if (currentUserId) {
    const userChampion = await prisma.ideaLike.findUnique({
      where: {
        ideaId_userId: {
          ideaId: id,
          userId: currentUserId,
        },
      },
    });
    isChampioned = !!userChampion;
  }

  return (
    <IdeaClient 
      idea={idea}
      currentUserId={currentUserId}
      initiallyChampioned={isChampioned}
    />
  );
} 