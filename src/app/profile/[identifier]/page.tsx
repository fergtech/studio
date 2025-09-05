import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';
import { Initiative, Update, ChatMessage, ContributionItem } from "@/lib/types";
import ProfileClient from './ProfileClient';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { notFound } from 'next/navigation';

// Force dynamic rendering to prevent static generation issues
export const dynamic = 'force-dynamic';

interface ProfilePageProps {
  params: Promise<{
    identifier: string;
  }>;
}

// Add this function before the ProfilePage component
function transformInitiative(initiative: any): Initiative {
  return {
    ...initiative,
    updates: initiative.updates?.map((update: any) => ({
      ...update,
      details: update.details ? JSON.parse(JSON.stringify(update.details)) : undefined
    })) || [],
    createdAt: new Date(initiative.createdAt),
    updatedAt: new Date(initiative.updatedAt)
  };
}

export default async function ProfilePage({ params }: ProfilePageProps) {
  const incomingParams = await params;
  const session = await getServerSession(authOptions);
  const loggedInUserId = session?.user?.id;

  let profileUserId = incomingParams.identifier;
  if (incomingParams.identifier === 'me' && loggedInUserId) {
    profileUserId = loggedInUserId;
  }

  if (!profileUserId) {
    notFound();
  }

  // Try to find user by username first, then by ID
  let user = null;
  if (incomingParams.identifier !== 'me') {
    user = await prisma.user.findUnique({
      where: { username: incomingParams.identifier },
      include: {
        createdInitiatives: {
          include: {
            creator: true,
            memberships: {
              include: {
                user: true
              }
            },
            updates: {
              include: {
                user: true,
                media: true
              }
            },
            goals: {
              include: {
                owner: true
              }
            },
            milestones: {
              include: {
                creator: true
              }
            }
          }
        },
        initiativeMemberships: {
          select: {
            createdAt: true,
            role: true,
            initiative: {
              include: {
                creator: true,
                memberships: {
                  include: {
                    user: true
                  }
                },
                updates: {
                  include: {
                    user: true,
                    media: true
                  }
                },
                goals: {
                  include: {
                    owner: true
                  }
                },
                milestones: {
                  include: {
                    creator: true
                  }
                }
              }
            }
          }
        },
        createdGeneralPosts: {
          include: {
            media: true
          },
          orderBy: {
            timestamp: 'desc'
          }
        },
        userFollowers: {
          select: {
            follower: {
              select: {
                id: true,
                name: true,
                username: true,
                image: true,
              },
            },
          },
        },
        userFollowing: {
          select: {
            following: {
              select: {
                id: true,
                name: true,
                username: true,
                image: true,
              },
            },
          },
        },
      }
    });
  }

  if (!user) {
    const userQuery = {
      where: { id: profileUserId },
      include: {
        createdInitiatives: {
          include: {
            creator: true,
            memberships: {
              include: {
                user: true
              }
            },
            updates: {
              include: {
                user: true,
                media: true
              }
            },
            goals: {
              include: {
                owner: true
              }
            },
            milestones: {
              include: {
                creator: true
              }
            }
          }
        },
        initiativeMemberships: {
          select: {
            createdAt: true,
            role: true,
            initiative: {
              include: {
                creator: true,
                memberships: {
                  include: {
                    user: true
                  }
                },
                updates: {
                  include: {
                    user: true,
                    media: true
                  }
                },
                goals: {
                  include: {
                    owner: true
                  }
                },
                milestones: {
                  include: {
                    creator: true
                  }
                }
              }
            }
          }
        },
        createdGeneralPosts: {
          include: {
            media: true
          },
          orderBy: {
            timestamp: 'desc'
          }
        },
        userFollowers: {
          select: {
            follower: {
              select: {
                id: true,
                name: true,
                username: true,
                image: true,
              },
            },
          },
        },
        userFollowing: {
          select: {
            following: {
              select: {
                id: true,
                name: true,
                username: true,
                image: true,
              },
            },
          },
        },
      }
    } as const;

    user = await prisma.user.findUnique(userQuery);
  }

  if (!user) {
    notFound();
  }

  profileUserId = user.id;

  const followers = user.userFollowers.map((f: any) => f.follower);
  const following = user.userFollowing.map((f: any) => f.following);

  const typedUser = user as any;

  const userUpdates = await prisma.update.findMany({
    where: { userId: profileUserId },
    include: {
      user: true,
      media: true,
      initiative: true,
    },
    orderBy: {
      createdAt: 'desc'
    },
  });

  const userChatMessages = await prisma.chatMessage.findMany({
    where: { senderId: profileUserId },
    include: {
      sender: true,
      initiative: true,
    },
    orderBy: {
      timestamp: 'desc'
    },
  });

  const transformedUser = {
    ...typedUser,
    createdInitiatives: typedUser.createdInitiatives.map((initiative: Initiative) => transformInitiative(initiative)),
    initiativeMemberships: typedUser.initiativeMemberships.map((membership: any) => ({
      ...membership,
      initiative: transformInitiative(membership.initiative)
    })),
  };

  const activityFeed: ContributionItem[] = [];

  transformedUser.createdGeneralPosts.forEach((post: any) => {
    activityFeed.push({
      id: post.id,
      type: 'post_creation',
      title: 'New Post',
      date: post.timestamp,
      details: post.content,
    });
  });

  transformedUser.createdInitiatives.forEach((initiative: Initiative) => {
    activityFeed.push({
      id: initiative.id,
      type: 'initiative_creation',
      title: initiative.title,
      date: initiative.createdAt,
      details: initiative.description,
      relatedInitiativeId: initiative.id,
    });
  });

  transformedUser.initiativeMemberships.forEach((membership: { initiative: Initiative; createdAt: Date; role: string }) => {
    activityFeed.push({
      id: membership.initiative.id + '-join',
      type: 'initiative_join',
      title: `Joined ${membership.initiative.title}`,
      date: membership.createdAt,
      details: `Role: ${membership.role}`,
      relatedInitiativeId: membership.initiative.id,
    });
  });

  userUpdates.forEach((update: any) => {
    activityFeed.push({
      id: update.id,
      type: 'post',
      title: `Update in ${update.initiative?.title || update.initiativeId}`,
      date: update.createdAt,
      details: update.content,
      relatedInitiativeId: update.initiativeId || undefined,
    });
  });

  userChatMessages.forEach((chatMessage: any) => {
    activityFeed.push({
      id: chatMessage.id,
      type: 'comment',
      title: `Chat message in ${chatMessage.initiative?.title || chatMessage.initiativeId}`,
      date: chatMessage.timestamp,
      details: chatMessage.text,
      relatedInitiativeId: chatMessage.initiativeId || undefined,
    });
  });

  activityFeed.sort((a, b) => b.date.getTime() - a.date.getTime());

  const isOwnProfile = loggedInUserId === profileUserId;

  let followData = {
    isFollowing: false,
    followersCount: 0,
    followingCount: 0,
  };

  if (!isOwnProfile && loggedInUserId) {
    const isFollowing = await prisma.userFollow.findUnique({
      where: {
        followerId_followingId: {
          followerId: loggedInUserId,
          followingId: profileUserId,
        },
      },
    });

    const [followersCount, followingCount] = await Promise.all([
      prisma.userFollow.count({
        where: { followingId: profileUserId },
      }),
      prisma.userFollow.count({
        where: { followerId: profileUserId },
      }),
    ]);

    followData = {
      isFollowing: !!isFollowing,
      followersCount,
      followingCount,
    };
  }

  const userWithFollowData = {
    ...transformedUser,
    followers,
    following,
    followersCount: typeof followData.followersCount === 'number' && !isOwnProfile ? followData.followersCount : followers.length,
    followingCount: typeof followData.followingCount === 'number' && !isOwnProfile ? followData.followingCount : following.length,
    isFollowing: followData.isFollowing,
  };

  return <ProfileClient user={userWithFollowData} isOwnProfile={isOwnProfile} activityFeed={activityFeed} />;
} 