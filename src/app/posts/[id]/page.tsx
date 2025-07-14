import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';
import PostDetailClient from './PostDetailClient';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export default async function PostPage({ params }: { params: { id: string } }) {
  // Try to fetch a general post first
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

  let postType = 'general';
  let society = null;
  let user = null;
  let postData = post;

  // If not found, try to fetch a society post
  if (!post) {
    const societyPost = await prisma.societyPost.findUnique({
      where: { id: params.id },
      select: {
        id: true,
        content: true,
        user: {
          select: {
            id: true,
            name: true,
            image: true,
          },
        },
        society: {
          select: {
            id: true,
            name: true,
            image: true,
          },
        },
        type: true,
        createdAt: true,
        imageUrl: true,
      },
    });
    if (!societyPost) {
      notFound();
    }
    postType = 'society';
    postData = societyPost;
    society = societyPost.society;
    user = societyPost.user;
  }

  const session = await getServerSession(authOptions);
  const currentUserId = session?.user?.id || null;

  // Pass the correct props depending on post type
  if (postType === 'general') {
    return (
      <PostDetailClient
        id={postData.id}
        content={postData.content}
        creatorId={postData.creatorId}
        creatorName={postData.creatorName}
        creatorAvatar={postData.creatorAvatar}
        media={postData.media}
        timestamp={postData.timestamp}
        currentUserId={currentUserId}
        postType="general"
      />
    );
  } else {
    return (
      <PostDetailClient
        id={postData.id}
        content={postData.content}
        creatorId={user.id}
        creatorName={user.name}
        creatorAvatar={user.image}
        media={postData.imageUrl ? [{ type: 'image', url: postData.imageUrl }] : []}
        timestamp={postData.createdAt}
        currentUserId={currentUserId}
        postType="society"
        society={society}
        societyPostType={postData.type}
      />
    );
  }
} 