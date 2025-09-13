import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get('limit') || '10');
    const cursor = searchParams.get('cursor');
    const type = searchParams.get('type'); // Filter by post type (GENERAL, IDEA, ISSUE)
    
    // Build where condition
    const where: any = { societyId: id };
    if (type && ['GENERAL', 'IDEA', 'ISSUE'].includes(type)) {
      where.type = type;
    }
    if (cursor) {
      where.createdAt = { lt: new Date(cursor) };
    }
    
    const posts = await prisma.societyPost.findMany({
      where,
      include: { 
        user: {
          select: {
            id: true,
            name: true,
            username: true,
            image: true,
          }
        },
        linkPreview: true,
        links: {
          include: {
            linkPreview: true
          },
          orderBy: {
            order: 'asc'
          }
        },
        documents: {
          include: {
            document: true
          },
          orderBy: {
            order: 'asc'
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: limit + 1, // Take one extra to check if there are more
    });

    // Helper function to detect media type from URL
    const getMediaType = (url: string): 'image' | 'video' | 'audio' => {
      const lowerUrl = url.toLowerCase();
      
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
    };

    // Check if there are more posts
    const hasMore = posts.length > limit;
    const postsToReturn = hasMore ? posts.slice(0, limit) : posts;
    
    // Transform posts to include media array for consistency with display components
    const transformedPosts = postsToReturn.map(post => ({
      ...post,
      media: post.imageUrl ? [{
        type: getMediaType(post.imageUrl),
        url: post.imageUrl
      }] : []
    }));

    // Get cursor for next page (createdAt of last post)
    const nextCursor = hasMore && postsToReturn.length > 0 
      ? postsToReturn[postsToReturn.length - 1].createdAt.toISOString()
      : null;

    return NextResponse.json({
      posts: transformedPosts,
      pagination: {
        hasMore,
        nextCursor,
        limit,
      }
    });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch posts', details: error }, { status: 500 });
  }
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { type, content, title, description, userId, imageUrl, linkUrl, linkMetadata, links, documents } = body;
    
    // Validate required fields based on post type
    if (!type || !userId) {
      return NextResponse.json({ error: 'type and userId are required' }, { status: 400 });
    }
    
    // For issues and ideas, require title and description
    if ((type === 'ISSUE' || type === 'IDEA')) {
      if (!title || !description) {
        return NextResponse.json({ error: 'title and description are required for issues and ideas' }, { status: 400 });
      }
    } else {
      // For general posts, require content
      if (!content) {
        return NextResponse.json({ error: 'content is required for general posts' }, { status: 400 });
      }
    }

    // Check if user is a member of the society
    const membership = await prisma.societyMembership.findUnique({
      where: {
        userId_societyId: {
          userId,
          societyId: id
        }
      }
    });

    if (!membership) {
      return NextResponse.json({ error: 'You must be a member of this society to create posts' }, { status: 403 });
    }

    let linkPreviewId = undefined;

    // Handle backward compatibility - single link
    if (linkUrl && linkMetadata) {
      try {
        let linkPreview = await prisma.linkPreview.findUnique({
          where: { url: linkMetadata.url }
        });

        if (!linkPreview) {
          linkPreview = await prisma.linkPreview.create({
            data: {
              url: linkMetadata.url,
              title: linkMetadata.title,
              description: linkMetadata.description,
              image: linkMetadata.image,
              siteName: linkMetadata.siteName,
              favicon: linkMetadata.favicon,
              type: linkMetadata.type,
            }
          });
        }

        linkPreviewId = linkPreview.id;
      } catch (linkError) {
        console.error('Failed to create/find link preview:', linkError);
      }
    }

    // Prepare data based on post type
    const postData: any = {
      type,
      societyId: id,
      userId,
      imageUrl: imageUrl || undefined,
      linkUrl: linkUrl || undefined,
      linkPreviewId,
    };

    // Set content based on post type
    if (type === 'ISSUE' || type === 'IDEA') {
      // For issues and ideas, combine title and description into content
      // Format: "Title\n\nDescription" so it can be parsed back if needed
      postData.content = `${title}\n\n${description}`;
    } else {
      // For general posts, use the content field
      postData.content = content;
    }

    const post = await prisma.societyPost.create({
      data: postData,
      include: { 
        user: true,
        linkPreview: true,
      },
    });

    // Handle multiple links
    if (links && Array.isArray(links) && links.length > 0) {
      for (const linkData of links) {
        try {
          // Try to find existing link preview or create new one
          let linkPreview = await prisma.linkPreview.findUnique({
            where: { url: linkData.metadata.url }
          });

          if (!linkPreview) {
            linkPreview = await prisma.linkPreview.create({
              data: {
                url: linkData.metadata.url,
                title: linkData.metadata.title,
                description: linkData.metadata.description,
                image: linkData.metadata.image,
                siteName: linkData.metadata.siteName,
                favicon: linkData.metadata.favicon,
                type: linkData.metadata.type,
              }
            });
          }

          // Create the post-link relationship
          await prisma.societyPostLink.create({
            data: {
              postId: post.id,
              linkPreviewId: linkPreview.id,
              order: linkData.order || 0,
            }
          });
        } catch (linkError) {
          console.error('Failed to create link for post:', linkError);
        }
      }
    }

    // Handle multiple documents
    if (documents && Array.isArray(documents) && documents.length > 0) {
      for (const documentData of documents) {
        try {
          // Try to find existing document or create new one
          let document = await prisma.document.findUnique({
            where: { url: documentData.metadata.url }
          });

          if (!document) {
            document = await prisma.document.create({
              data: {
                url: documentData.metadata.url,
                filename: documentData.metadata.filename,
                fileType: documentData.metadata.fileType,
                fileSize: documentData.metadata.fileSize,
                extension: documentData.metadata.extension,
                title: documentData.metadata.title,
                description: documentData.metadata.description,
              }
            });
          }

          // Create the post-document relationship
          await prisma.societyPostDocument.create({
            data: {
              postId: post.id,
              documentId: document.id,
              order: documentData.order || 0,
            }
          });
        } catch (documentError) {
          console.error('Failed to create document for post:', documentError);
        }
      }
    }

    // Fetch the post with all links and documents
    const postWithLinksAndDocuments = await prisma.societyPost.findUnique({
      where: { id: post.id },
      include: { 
        user: true,
        linkPreview: true,
        links: {
          include: {
            linkPreview: true
          },
          orderBy: {
            order: 'asc'
          }
        },
        documents: {
          include: {
            document: true
          },
          orderBy: {
            order: 'asc'
          }
        }
      },
    });

    return NextResponse.json(postWithLinksAndDocuments, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create post', details: error }, { status: 500 });
  }
} 