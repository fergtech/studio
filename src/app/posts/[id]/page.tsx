import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';
import PostDetailClient from './PostDetailClient';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

// Force dynamic rendering to prevent static generation issues
export const dynamic = 'force-dynamic';

export default async function PostPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  
  // Try to fetch a general post first
  const post = await prisma.generalPost.findUnique({
    where: { id },
    select: {
      id: true,
      content: true,
      creatorId: true,
      creatorName: true,
      creatorAvatar: true,
      media: true,
      timestamp: true,
      linkPreview: {
        select: {
          url: true,
          title: true,
          description: true,
          image: true,
          siteName: true,
          favicon: true,
          type: true,
        },
      },
      links: {
        include: {
          linkPreview: {
            select: {
              url: true,
              title: true,
              description: true,
              image: true,
              siteName: true,
              favicon: true,
              type: true,
            },
          },
        },
        orderBy: {
          order: 'asc'
        }
      },
      documents: {
        include: {
          document: {
            select: {
              url: true,
              filename: true,
              fileType: true,
              fileSize: true,
              extension: true,
              title: true,
              description: true,
            },
          },
        },
        orderBy: {
          order: 'asc'
        }
      },
    },
  });

  let postType = 'general';
  let society = null;
  let user = null;
  let postData: any = post;

  // If not found, try to fetch a society post
  if (!post) {
    const societyPost = await prisma.societyPost.findUnique({
      where: { id },
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
        linkPreview: {
          select: {
            url: true,
            title: true,
            description: true,
            image: true,
            siteName: true,
            favicon: true,
            type: true,
          },
        },
        links: {
          include: {
            linkPreview: {
              select: {
                url: true,
                title: true,
                description: true,
                image: true,
                siteName: true,
                favicon: true,
                type: true,
              },
            },
          },
          orderBy: {
            order: 'asc'
          }
        },
        documents: {
          include: {
            document: {
              select: {
                url: true,
                filename: true,
                fileType: true,
                fileSize: true,
                extension: true,
                title: true,
                description: true,
              },
            },
          },
          orderBy: {
            order: 'asc'
          }
        },
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

  // Early null check
  if (!postData) {
    notFound();
  }

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
        linkPreview={postData.linkPreview ? {
          ...postData.linkPreview,
          title: postData.linkPreview.title || undefined,
          description: postData.linkPreview.description || undefined,
          image: postData.linkPreview.image || undefined,
          siteName: postData.linkPreview.siteName || undefined,
          favicon: postData.linkPreview.favicon || undefined,
          type: postData.linkPreview.type || undefined,
        } : null}
        links={postData.links?.map((link: any) => ({
          ...link,
          linkPreview: {
            ...link.linkPreview,
            title: link.linkPreview.title || undefined,
            description: link.linkPreview.description || undefined,
            image: link.linkPreview.image || undefined,
            siteName: link.linkPreview.siteName || undefined,
            favicon: link.linkPreview.favicon || undefined,
            type: link.linkPreview.type || undefined,
          }
        }))}
        documents={postData.documents?.map((doc: any) => ({
          ...doc,
          document: {
            ...doc.document,
            title: doc.document.title || undefined,
            description: doc.document.description || undefined,
          }
        }))}
      />
    );
  } else {
    // Ensure user is available for society posts
    if (!user) {
      notFound();
    }
    
    return (
      <PostDetailClient
        id={postData.id}
        content={postData.content}
        creatorId={user.id}
        creatorName={user.name || ''}
        creatorAvatar={user.image}
        media={postData.imageUrl ? [{
          type: (() => {
            const lowerUrl = postData.imageUrl!.toLowerCase();
            
            // Check for audio extensions
            if (lowerUrl.includes('.mp3') || 
                lowerUrl.includes('.wav') || 
                lowerUrl.includes('.m4a') || 
                lowerUrl.includes('.aac') || 
                lowerUrl.includes('.ogg') || 
                lowerUrl.includes('.flac')) {
              return 'audio';
            }
            
            // Check for video extensions
            if (lowerUrl.includes('.mp4') || 
                lowerUrl.includes('.webm') || 
                lowerUrl.includes('.mov') || 
                lowerUrl.includes('.avi') || 
                lowerUrl.includes('.mkv') || 
                lowerUrl.includes('.wmv') || 
                lowerUrl.includes('.flv') || 
                lowerUrl.includes('.m4v')) {
              return 'video';
            }
            
            // Default to image
            return 'image';
          })(),
          url: postData.imageUrl
        }] : []}
        timestamp={postData.createdAt}
        currentUserId={currentUserId}
        postType="society"
        society={society || undefined}
        societyPostType={postData.type}
        linkPreview={postData.linkPreview ? {
          ...postData.linkPreview,
          title: postData.linkPreview.title || undefined,
          description: postData.linkPreview.description || undefined,
          image: postData.linkPreview.image || undefined,
          siteName: postData.linkPreview.siteName || undefined,
          favicon: postData.linkPreview.favicon || undefined,
          type: postData.linkPreview.type || undefined,
        } : null}
        links={postData.links?.map((link: any) => ({
          ...link,
          linkPreview: {
            ...link.linkPreview,
            title: link.linkPreview.title || undefined,
            description: link.linkPreview.description || undefined,
            image: link.linkPreview.image || undefined,
            siteName: link.linkPreview.siteName || undefined,
            favicon: link.linkPreview.favicon || undefined,
            type: link.linkPreview.type || undefined,
          }
        }))}
        documents={postData.documents?.map((doc: any) => ({
          ...doc,
          document: {
            ...doc.document,
            title: doc.document.title || undefined,
            description: doc.document.description || undefined,
          }
        }))}
      />
    );
  }
} 