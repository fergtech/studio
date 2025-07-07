import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';
import PostDetailClient from './PostDetailClient';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export default async function PostPage({ params }: { params: { id: string } }) {
  const post = await prisma.generalPost.findUnique({
    where: { id: params.id },
    select: {
      id: true,
      content: true,
      creatorId: true,
      creatorName: true,
      creatorAvatar: true,
      media: true,
      timestamp: true,
    },
  });

  if (!post) {
    notFound();
  }

  const session = await getServerSession(authOptions);
  const currentUserId = session?.user?.id || null;

  return (
    <PostDetailClient
      id={post.id}
      content={post.content}
      creatorId={post.creatorId}
      creatorName={post.creatorName}
      creatorAvatar={post.creatorAvatar}
      media={post.media}
      timestamp={post.timestamp}
      currentUserId={currentUserId}
    />
  );
} 