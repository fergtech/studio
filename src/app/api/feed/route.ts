import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';

// Define extended types that include the relations we'll fetch
// These are similar to what was in src/app/page.tsx
// Consider moving these to a shared types file (e.g., src/lib/types.ts) if used elsewhere

interface InitiativeWithCreator extends Prisma.InitiativeGetPayload<{
  include: {
    creator: {
      select: { id: true, name: true, image: true };
    };
    society: {
      select: { id: true, name: true, image: true };
    };
  };
}> {}

interface GeneralPostWithCreatorAndMedia extends Prisma.GeneralPostGetPayload<{
  include: {
    creator: {
      select: { id: true, name: true, image: true };
    };
    media: {
      select: { id: true, url: true, type: true, postId: true };
    };
    linkPreview: {
      select: { url: true, title: true, description: true, image: true, siteName: true, favicon: true, type: true };
    };
    links: {
      include: {
        linkPreview: {
          select: { url: true, title: true, description: true, image: true, siteName: true, favicon: true, type: true };
        };
      };
    };
  };
}> {}

interface IssueWithCreator extends Prisma.IssueGetPayload<{
  include: {
    creator: {
      select: { id: true, name: true, image: true };
    };
    media: {
      select: { id: true, url: true, type: true, issueId: true };
    };
    championedBy: {
      select: { id: true, name: true, image: true };
    };
  };
}> {}

interface IdeaWithCreator extends Prisma.IdeaGetPayload<{
  include: {
    creator: {
      select: { id: true, name: true, image: true };
    };
    media: {
      select: { id: true, url: true, type: true, ideaId: true };
    };
    championedBy: {
      select: { id: true, name: true, image: true };
    };
  };
}> {}

interface DebateTopicWithCreatorAndStats extends Prisma.DebateTopicGetPayload<{
  include: {
    creator: {
      select: { id: true, name: true, image: true };
    };
    votes: {
      select: { id: true, side: true };
    };
    arguments: {
      select: { id: true };
    };
  };
}> {}

interface UpdateWithUserAndInitiative extends Prisma.UpdateGetPayload<{
  include: {
    user: {
      select: { id: true, name: true, image: true };
    };
    initiative: {
      select: { id: true, title: true };
    };
  };
}> {}

interface UserFollowWithUsers extends Prisma.UserFollowGetPayload<{
  include: {
    follower: {
      select: { id: true, name: true, image: true };
    };
    following: {
      select: { id: true, name: true, image: true };
    };
  };
}> {}

interface InitiativeMembershipWithUserAndInitiative extends Prisma.InitiativeMembershipGetPayload<{
  include: {
    user: {
      select: { id: true, name: true, image: true };
    };
    initiative: {
      select: { id: true, title: true };
    };
  };
}> {}

// Unified feed item types
type FeedItemType = 'initiative' | 'generalPost' | 'societyPost' | 'issue' | 'idea' | 'update' | 'follow' | 'initiativeJoin' | 'debate';

interface SocietyPostWithUserAndSociety {
  id: string;
  type: string;
  content: string;
  createdAt: Date;
  imageUrl?: string;
  linkPreview?: {
    url: string;
    title?: string;
    description?: string;
    image?: string;
    siteName?: string;
    favicon?: string;
    type?: string;
  } | null;
  links?: {
    id: string;
    order: number;
    linkPreview: {
      url: string;
      title?: string;
      description?: string;
      image?: string;
      siteName?: string;
      favicon?: string;
      type?: string;
    };
  }[];
  user: {
    id: string;
    name: string;
    image?: string;
  };
  society: {
    id: string;
    name: string;
    image?: string;
  };
}

interface UnifiedFeedItem {
  type: FeedItemType;
  id: string;
  timestamp: Date;
  data: InitiativeWithCreator | GeneralPostWithCreatorAndMedia | SocietyPostWithUserAndSociety | IssueWithCreator | IdeaWithCreator | DebateTopicWithCreatorAndStats | UpdateWithUserAndInitiative | UserFollowWithUsers | InitiativeMembershipWithUserAndInitiative;
}

// Legacy type for backward compatibility
export type ApiFeedItem = InitiativeWithCreator | GeneralPostWithCreatorAndMedia | IssueWithCreator | IdeaWithCreator;

async function getUnifiedFeedItems(cursor?: string, pageSize: number = 20): Promise<{ items: UnifiedFeedItem[], nextCursor: string | null, hasMore: boolean }> {
  // Parse cursor to get timestamp
  const cursorDate = cursor ? new Date(cursor) : new Date();
  
  // Fetch all content and meta actions in parallel with proper cursor-based pagination
  const [initiatives, generalPosts, societyPosts, issues, ideas, debates, updates, follows, joins] = await Promise.all([
    prisma.initiative.findMany({
      include: {
        creator: {
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
      },
      where: {
        createdAt: {
          lt: cursorDate,
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: Math.ceil(pageSize / 4), // Distribute across content types
    }),
    prisma.generalPost.findMany({
      include: {
        creator: {
          select: {
            id: true,
            name: true,
            image: true,
          },
        },
        media: {
          select: {
            id: true,
            url: true,
            type: true,
            postId: true,
          },
        },
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
      where: {
        timestamp: {
          lt: cursorDate,
        },
      },
      orderBy: {
        timestamp: 'desc',
      },
      take: Math.ceil(pageSize / 4),
    }),
    prisma.societyPost.findMany({
      include: {
        user: {
          select: { id: true, name: true, image: true },
        },
        society: {
          select: { id: true, name: true, image: true },
        },
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
      where: {
        createdAt: {
          lt: cursorDate,
        },
      },
      orderBy: { createdAt: 'desc' },
      take: Math.ceil(pageSize / 4),
    }),
    prisma.issue.findMany({
      include: {
        creator: {
          select: {
            id: true,
            name: true,
            image: true,
          },
        },
        media: {
          select: {
            id: true,
            url: true,
            type: true,
            issueId: true,
          },
        },
        championedBy: {
          select: {
            id: true,
            name: true,
            image: true,
          },
        },
      },
      where: {
        createdAt: {
          lt: cursorDate,
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: Math.ceil(pageSize / 8),
    }),
    prisma.idea.findMany({
      include: {
        creator: {
          select: {
            id: true,
            name: true,
            image: true,
          },
        },
        media: {
          select: {
            id: true,
            url: true,
            type: true,
            ideaId: true,
          },
        },
        championedBy: {
          select: {
            id: true,
            name: true,
            image: true,
          },
        },
      },
      where: {
        createdAt: {
          lt: cursorDate,
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: Math.ceil(pageSize / 8),
    }),
    prisma.debateTopic.findMany({
      include: {
        creator: {
          select: {
            id: true,
            name: true,
            image: true,
          },
        },
        votes: {
          select: {
            id: true,
            side: true,
          },
        },
        arguments: {
          select: {
            id: true,
          },
        },
      },
      where: {
        createdAt: {
          lt: cursorDate,
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: Math.ceil(pageSize / 8),
    }),
    prisma.update.findMany({
      include: {
        user: {
          select: {
            id: true,
            name: true,
            image: true,
          },
        },
        initiative: {
          select: {
            id: true,
            title: true,
          },
        },
      },
      where: {
        createdAt: {
          lt: cursorDate,
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: Math.ceil(pageSize / 8),
    }),
    prisma.userFollow.findMany({
      include: {
        follower: {
          select: {
            id: true,
            name: true,
            image: true,
          },
        },
        following: {
          select: {
            id: true,
            name: true,
            image: true,
          },
        },
      },
      where: {
        createdAt: {
          lt: cursorDate,
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: Math.ceil(pageSize / 8),
    }),
    prisma.initiativeMembership.findMany({
      include: {
        user: {
          select: {
            id: true,
            name: true,
            image: true,
          },
        },
        initiative: {
          select: {
            id: true,
            title: true,
          },
        },
      },
      where: {
        createdAt: {
          lt: cursorDate,
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: Math.ceil(pageSize / 8),
    }),
  ]);

  // Normalize all items to unified format
  const feedItems: UnifiedFeedItem[] = [
    ...initiatives.map(i => ({ 
      type: 'initiative' as const, 
      id: i.id, 
      timestamp: i.createdAt, 
      data: i 
    })),
    ...generalPosts.map(p => ({ 
      type: 'generalPost' as const, 
      id: p.id, 
      timestamp: p.timestamp, 
      data: p 
    })),
    ...societyPosts.map(sp => ({
      type: 'societyPost' as const,
      id: sp.id,
      timestamp: new Date(sp.createdAt),
      data: {
        ...sp,
        createdAt: new Date(sp.createdAt),
        type: sp.type,
        user: {
          ...sp.user,
          name: sp.user?.name ?? '',
        },
        society: {
          ...sp.society,
          name: sp.society?.name ?? '',
        },
        imageUrl: sp.imageUrl ?? undefined,
        linkPreview: sp.linkPreview || undefined,
        links: sp.links || [],
        documents: sp.documents || [],
        // Add media array for display component compatibility
        media: sp.imageUrl ? [{
          type: (() => {
            const lowerUrl = sp.imageUrl!.toLowerCase();
            
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
          url: sp.imageUrl
        }] : []
      }
    })),
    ...issues.map(i => ({ 
      type: 'issue' as const, 
      id: i.id, 
      timestamp: i.createdAt, 
      data: i 
    })),
    ...ideas.map(i => ({ 
      type: 'idea' as const, 
      id: i.id, 
      timestamp: i.createdAt, 
      data: i 
    })),
    ...debates.map(d => ({ 
      type: 'debate' as const, 
      id: d.id, 
      timestamp: d.createdAt, 
      data: d 
    })),
    ...updates.map(u => ({ 
      type: 'update' as const, 
      id: u.id, 
      timestamp: u.createdAt, 
      data: u 
    })),
    ...follows.map(f => ({ 
      type: 'follow' as const, 
      id: f.id, 
      timestamp: f.createdAt, 
      data: f 
    })),
    ...joins.map(j => ({ 
      type: 'initiativeJoin' as const, 
      id: j.id, 
      timestamp: j.createdAt, 
      data: j 
    })),
  ];

  // Sort by timestamp descending
  feedItems.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

  // Deduplicate: Remove meta actions that are immediately followed by their related content
  const deduped: UnifiedFeedItem[] = [];
  const seenContent = new Set<string>();
  
  for (const item of feedItems) {
    let shouldSkip = false;
    
    // Check for redundant meta actions
    if (item.type === 'update') {
      const update = item.data as UpdateWithUserAndInitiative;
      // Skip update if it's about a post and we've already seen that post
      if (update.type === 'post' && update.details && typeof update.details === 'object' && 'postId' in update.details) {
        const postId = (update.details as any).postId;
        if (seenContent.has(postId)) {
          shouldSkip = true;
        }
      }
    } else if (item.type === 'initiativeJoin') {
      const join = item.data as InitiativeMembershipWithUserAndInitiative;
      // Skip join if we've already seen the initiative being created
      if (seenContent.has(join.initiativeId)) {
        shouldSkip = true;
      }
    } else if (item.type === 'follow') {
      const follow = item.data as UserFollowWithUsers;
      // Skip follow if we've already seen the followed user's recent activity
      if (seenContent.has(follow.followingId)) {
        shouldSkip = true;
      }
    }
    
    // Track content items for deduplication
    if (['initiative', 'generalPost', 'issue', 'idea'].includes(item.type)) {
      seenContent.add(item.id);
    }
    
    if (!shouldSkip) {
      deduped.push(item);
    }
  }

  // Get final items limited to pageSize
  const finalItems = deduped.slice(0, pageSize);
  
  // Generate next cursor from the last item's timestamp
  const nextCursor = finalItems.length > 0 
    ? finalItems[finalItems.length - 1].timestamp.toISOString()
    : null;
    
  // Check if there are more items by checking if any content type returned its full limit
  const hasMore = deduped.length > pageSize || 
    (initiatives.length === Math.ceil(pageSize / 4) || 
     generalPosts.length === Math.ceil(pageSize / 4) || 
     societyPosts.length === Math.ceil(pageSize / 4) || 
     issues.length === Math.ceil(pageSize / 8) || 
     ideas.length === Math.ceil(pageSize / 8) || 
     debates.length === Math.ceil(pageSize / 8) || 
     updates.length === Math.ceil(pageSize / 8) || 
     follows.length === Math.ceil(pageSize / 8) || 
     joins.length === Math.ceil(pageSize / 8));

  return {
    items: finalItems,
    nextCursor,
    hasMore,
  };
}

// Legacy function for backward compatibility
async function getFeedItemsFromDb(page: number = 1, pageSize: number = 10): Promise<ApiFeedItem[]> {
  const unifiedItems = await getUnifiedFeedItems(page, pageSize);
  return unifiedItems
    .filter(item => ['initiative', 'generalPost', 'issue', 'idea'].includes(item.type))
    .map(item => item.data as ApiFeedItem);
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const cursor = searchParams.get('cursor') || undefined;
  const limit = parseInt(searchParams.get('limit') || '20', 10);
  const unified = searchParams.get('unified') === 'true';
  
  // Legacy support
  const page = parseInt(searchParams.get('page') || '1', 10);
  const pageSize = parseInt(searchParams.get('pageSize') || '10', 10);

  try {
    if (unified) {
      // Use cursor-based pagination if cursor is provided, otherwise use legacy
      if (cursor !== undefined || !searchParams.has('page')) {
        const result = await getUnifiedFeedItems(cursor, limit);
        return NextResponse.json({
          items: result.items,
          pagination: {
            nextCursor: result.nextCursor,
            hasMore: result.hasMore,
            limit,
          }
        });
      } else {
        // Legacy support - return old format
        const result = await getUnifiedFeedItems(undefined, pageSize);
        return NextResponse.json(result.items);
      }
    } else {
      // Legacy endpoint for backward compatibility
      const feedItems = await getFeedItemsFromDb(page, pageSize);
      return NextResponse.json(feedItems);
    }
  } catch (error) {
    console.error('Error fetching feed items:', error);
    return NextResponse.json({ error: 'Failed to fetch feed items' }, { status: 500 });
  }
}
