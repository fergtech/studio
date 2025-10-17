import { prisma } from '@/lib/prisma';
import IssueClient from './IssueClient';
import { notFound } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { Metadata } from 'next';

// Force dynamic rendering to prevent static generation issues
export const dynamic = 'force-dynamic';

// Generate metadata for social sharing
export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;

  const issue = await prisma.issue.findUnique({
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

  if (!issue) {
    return {
      title: 'Issue Not Found | Society Plus',
    };
  }

  const title = issue.title;
  const description = issue.description.length > 160
    ? issue.description.substring(0, 157) + '...'
    : issue.description;
  const imageUrl = issue.media?.[0]?.url || `${process.env.NEXTAUTH_URL}/api/og?title=${encodeURIComponent(title)}&type=issue`;

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

export default async function IssuePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const issue = await prisma.issue.findUnique({
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

  if (!issue) {
    notFound();
  }

  const session = await getServerSession(authOptions);
  const currentUserId = session?.user?.id || null;

  // Check if current user has championed this issue
  let isChampioned = false;
  if (currentUserId) {
    const userChampion = await prisma.issueLike.findUnique({
      where: {
        issueId_userId: {
          issueId: id,
          userId: currentUserId,
        },
      },
    });
    isChampioned = !!userChampion;
  }

  return (
    <IssueClient 
      issue={issue}
      currentUserId={currentUserId}
      initiallyChampioned={isChampioned}
    />
  );
} 