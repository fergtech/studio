import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';
import { Initiative, Update, ChatMessage, ContributionItem } from "@/lib/types";
import ProfileClient from './ProfileClient';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { notFound } from 'next/navigation';

interface ProfilePageProps {
  params: {
    id: string;
  };
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

export default async function ProfilePage({ params: incomingParams }: ProfilePageProps) {
  const session = await getServerSession(authOptions);
  const loggedInUserId = session?.user?.id;

  console.log('Session:', session);
  console.log('Logged in user ID:', loggedInUserId);

  const profileUserId = incomingParams.id === 'me' && loggedInUserId ? loggedInUserId : incomingParams.id;

  console.log('Profile user ID (after resolving "me"):', profileUserId);

  if (!profileUserId) {
    notFound();
  }

  // Define the user query with all necessary includes, excluding direct updates and chatMessages for now
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

  // Define a type for the user object based on the Prisma query result
  type UserWithInitiativesAndPosts = Prisma.UserGetPayload<typeof userQuery>;

  // Fetch the user data
  const user = await prisma.user.findUnique(userQuery);

  if (!user) {
    notFound();
  }

  // Flatten followers/following arrays
  const followers = user.userFollowers.map((f: { follower: any }) => f.follower);
  const following = user.userFollowing.map((f: { following: any }) => f.following);

  // Assert the type of the user object
  const typedUser = user as UserWithInitiativesAndPosts;

  // Fetch updates and chat messages separately
  const userUpdates = await prisma.update.findMany({
    where: { userId: profileUserId },
    include: {
      user: true,
      media: true,
      initiative: true, // Include initiative for context
    },
    orderBy: {
      createdAt: 'desc'
    },
  });

  const userChatMessages = await prisma.chatMessage.findMany({
    where: { senderId: profileUserId },
    include: {
      sender: true,
      initiative: true, // Include initiative for context
    },
    orderBy: {
      timestamp: 'desc'
    },
  });

  // Transform the data
  const transformedUser = {
    ...typedUser,
    createdInitiatives: typedUser.createdInitiatives.map(transformInitiative),
    initiativeMemberships: typedUser.initiativeMemberships.map((membership: any) => ({
      ...membership,
      initiative: transformInitiative(membership.initiative)
    })),
  };

  // Aggregate all activities into a single feed
  const activityFeed: ContributionItem[] = [];

  // Add general posts
  transformedUser.createdGeneralPosts.forEach((post: any) => {
    activityFeed.push({
      id: post.id,
      type: 'post_creation',
      title: 'New Post',
      date: post.timestamp,
      details: post.content,
    });
  });

  // Add created initiatives
  transformedUser.createdInitiatives.forEach((initiative: any) => {
    activityFeed.push({
      id: initiative.id,
      type: 'initiative_creation',
      title: initiative.title,
      date: initiative.createdAt,
      details: initiative.description,
      relatedInitiativeId: initiative.id,
    });
  });

  // Add initiative memberships (user joining an initiative)
  transformedUser.initiativeMemberships.forEach((membership: any) => {
    activityFeed.push({
      id: membership.initiative.id + '-join', // Unique ID for join activity
      type: 'initiative_join',
      title: `Joined ${membership.initiative.title}`,
      date: membership.createdAt, // Use createdAt directly now
      details: `Role: ${membership.role}`,
      relatedInitiativeId: membership.initiative.id,
    });
  });

  // Add initiative updates (fetched separately)
  userUpdates.forEach((update: any) => {
    activityFeed.push({
      id: update.id,
      type: 'post', // Using 'post' type for general updates within an initiative
      title: `Update in ${update.initiative?.title || update.initiativeId}`,
      date: update.createdAt,
      details: update.content,
      relatedInitiativeId: update.initiativeId || undefined,
    });
  });

  // Add chat messages (fetched separately)
  userChatMessages.forEach((chatMessage: any) => {
    activityFeed.push({
      id: chatMessage.id,
      type: 'comment', // Using 'comment' type for chat messages as they are textual contributions
      title: `Chat message in ${chatMessage.initiative?.title || chatMessage.initiativeId}`,
      date: chatMessage.timestamp,
      details: chatMessage.text,
      relatedInitiativeId: chatMessage.initiativeId || undefined,
    });
  });

  // Sort activity feed by date in descending order
  activityFeed.sort((a, b) => b.date.getTime() - a.date.getTime());

  const isOwnProfile = loggedInUserId === profileUserId;

  // Get follow status and counts if not own profile
  let followData = {
    isFollowing: false,
    followersCount: 0,
    followingCount: 0,
  };

  if (!isOwnProfile && loggedInUserId) {
    // Get follow status
    const isFollowing = await prisma.userFollow.findUnique({
      where: {
        followerId_followingId: {
          followerId: loggedInUserId,
          followingId: profileUserId,
        },
      },
    });

    // Get follower and following counts
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

  // Add follow data to transformed user
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