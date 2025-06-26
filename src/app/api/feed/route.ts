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

export type ApiFeedItem = InitiativeWithCreator | GeneralPostWithCreatorAndMedia | IssueWithCreator | IdeaWithCreator;

async function getFeedItemsFromDb(page: number = 1, pageSize: number = 10): Promise<ApiFeedItem[]> {
  const initiatives = await prisma.initiative.findMany({
    include: {
      creator: {
        select: {
          id: true,
          name: true,
          image: true,
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
    skip: (page - 1) * pageSize,
    take: pageSize,
  });

  const generalPosts = await prisma.generalPost.findMany({
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
    },
    orderBy: {
      timestamp: 'desc',
    },
    skip: (page - 1) * pageSize,
    take: pageSize,
  });

  const issues = await prisma.issue.findMany({
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
    orderBy: {
      createdAt: 'desc',
    },
    skip: (page - 1) * pageSize,
    take: pageSize,
  });

  const ideas = await prisma.idea.findMany({
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
    orderBy: {
      createdAt: 'desc',
    },
    skip: (page - 1) * pageSize,
    take: pageSize,
  });

  const feedItems: ApiFeedItem[] = [...initiatives, ...generalPosts, ...issues, ...ideas].sort((a, b) => {
    const timeA = 'createdAt' in a && a.createdAt ? new Date(a.createdAt).getTime() : ('timestamp' in a && a.timestamp ? new Date(a.timestamp).getTime() : 0);
    const timeB = 'createdAt' in b && b.createdAt ? new Date(b.createdAt).getTime() : ('timestamp' in b && b.timestamp ? new Date(b.timestamp).getTime() : 0);
    return timeB - timeA;
  });

  return feedItems;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get('page') || '1', 10);
  const pageSize = parseInt(searchParams.get('pageSize') || '10', 10);

  try {
    const feedItems = await getFeedItemsFromDb(page, pageSize);
    return NextResponse.json(feedItems);
  } catch (error) {
    console.error('Error fetching feed items:', error);
    return NextResponse.json({ error: 'Failed to fetch feed items' }, { status: 500 });
  }
}
