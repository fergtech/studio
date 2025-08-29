'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { getServerSession } from 'next-auth';
import { authOptions } from "@/lib/auth"; // Corrected path
import { emitNotification } from '@/lib/socket';

// Define a schema for profile update validation
const UpdateProfileSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100).optional(),
  bio: z.string().max(500).optional(),
  imageUrl: z.string().url().optional(),
  bannerImageUrl: z.string().url().optional(),
  username: z.string().min(3, 'Username must be at least 3 characters').max(30).optional(),
  gender: z.enum(['male', 'female', 'other', 'prefer_not_to_say']).optional(),
  websites: z.array(z.string().url()).max(2, 'Maximum 2 websites allowed').optional(),
  city: z.string().max(100).nullable().optional(),
  showLocation: z.boolean().optional(),
});

export interface UpdateUserProfileActionState {
  message: string;
  success: boolean;
  updatedUsername?: string; // Add this field for the redirect
  errors?: {
    name?: string[];
    bio?: string[];
    imageUrl?: string[];
    bannerImageUrl?: string[];
    username?: string[];
    gender?: string[];
    websites?: string[];
    general?: string[];
  };
}

export async function updateUserProfileAction(
  prevState: UpdateUserProfileActionState,
  formData: FormData
): Promise<UpdateUserProfileActionState> {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return {
      message: 'User not authenticated.',
      success: false,
      errors: { general: ['Authentication required.'] },
    };
  }

  const userId = session.user.id;

  // Transform FormData and handle empty strings for optional fields
  let name = formData.get('name') as string | undefined;
  if (name === '') name = undefined;

  let bio = formData.get('bio') as string | undefined;
  if (bio === '') bio = undefined;

  let username = formData.get('username') as string | undefined;
  if (username === '') username = undefined;

  let gender = formData.get('gender') as string | undefined;
  // Ensure empty string for gender becomes undefined, so Zod validation for enum passes if not selected
  if (gender === '') gender = undefined; 

  let websites = formData.getAll('websites') as string[];
  websites = websites.filter(site => site.trim() !== '');
  // Zod's .optional() for an array means the array can be undefined, but if provided, it must match the type.
  // So, an empty array is valid for an optional array schema.
  // We will pass it as is, or undefined if it was never provided/all items were empty.
  const finalWebsites = websites.length > 0 ? websites : undefined;

  let imageUrl = formData.get('imageUrl') as string | null | undefined;
  if (imageUrl === '' || imageUrl === null) imageUrl = undefined;
  
  let bannerImageUrl = formData.get('bannerImageUrl') as string | null | undefined;
  if (bannerImageUrl === '' || bannerImageUrl === null) bannerImageUrl = undefined;

  // Extract new fields from formData
  let city = formData.get('city') as string | null | undefined;
  if (city === undefined || city === '') city = null;
  let showLocationRaw = formData.get('showLocation');
  let showLocation: boolean | undefined = undefined;
  if (showLocationRaw !== undefined && showLocationRaw !== null) {
    showLocation = showLocationRaw === 'true' || showLocationRaw === 'on';
  }

  const rawData: {
    name?: string;
    bio?: string;
    imageUrl?: string;
    bannerImageUrl?: string;
    username?: string;
    gender?: string;
    websites?: string[];
    city?: string | null;
    showLocation?: boolean;
  } = {
    // Only include fields in rawData if they have a value (or are explicitly meant to be processed by Zod)
    // This helps Zod correctly interpret optional fields.
  };

  if (name !== undefined) rawData.name = name;
  if (bio !== undefined) rawData.bio = bio;
  if (username !== undefined) rawData.username = username;
  if (gender !== undefined) rawData.gender = gender; // Let Zod validate enum or undefined
  if (finalWebsites !== undefined) rawData.websites = finalWebsites;
  if (imageUrl !== undefined) rawData.imageUrl = imageUrl;
  if (bannerImageUrl !== undefined) rawData.bannerImageUrl = bannerImageUrl;
  if (city !== undefined) rawData.city = city;
  if (showLocation !== undefined) rawData.showLocation = showLocation;

  const validatedFields = UpdateProfileSchema.safeParse(rawData);

  if (!validatedFields.success) {
    return {
      message: 'Validation failed.',
      success: false,
      errors: validatedFields.error.flatten().fieldErrors,
    };
  }

  const { name: validatedName, bio: validatedBio, imageUrl: validatedImageUrl, bannerImageUrl: validatedBannerImageUrl, username: validatedUsername, gender: validatedGender, websites: validatedWebsites, city: validatedCity, showLocation: validatedShowLocation } = validatedFields.data;

  try {
    // Prepare data for Prisma update. 
    // For optional fields, if validatedFields.data contains them (even as undefined for non-string types like arrays if Zod processed them as such),
    // we decide how to pass to Prisma. Generally, pass the value or null if it should be cleared.
    // Prisma treats `undefined` as "do not update this field".
    // Prisma treats `null` as "set this field to null in the DB".
    const dataToUpdate: {
      name?: string | null;
      bio?: string | null;
      image?: string | null;
      bannerImageUrl?: string | null;
      username?: string | null;
      gender?: string | null; // Gender can be string or null in DB
      websites?: string[]; // Websites is an array, Prisma expects string[] or to unset it.
                         // If validatedWebsites is undefined, it means it wasn't in formData or was empty.
                         // If it was empty and we want to clear it, Prisma needs { set: [] } for array fields.
                         // However, our schema has websites as optional string[], not String[]? so it cannot be null.
                         // If `validatedWebsites` is undefined, we don't add it to dataToUpdate, so Prisma won't touch it.
                         // If `validatedWebsites` is an empty array, we should pass it as such to clear existing websites.
      city?: string | null;
      showLocation?: boolean;
    } = {};

    // Explicitly check if the key exists in validatedFields.data before assigning.
    // This handles cases where a field is truly optional and not present in the form data at all.
    if (validatedFields.data.hasOwnProperty('name')) {
      dataToUpdate.name = validatedName === undefined ? null : validatedName;
    }
    if (validatedFields.data.hasOwnProperty('bio')) {
      dataToUpdate.bio = validatedBio === undefined ? null : validatedBio;
    }
    if (validatedFields.data.hasOwnProperty('imageUrl')) {
      dataToUpdate.image = validatedImageUrl === undefined ? null : validatedImageUrl;
    }
    if (validatedFields.data.hasOwnProperty('bannerImageUrl')) {
      dataToUpdate.bannerImageUrl = validatedBannerImageUrl === undefined ? null : validatedBannerImageUrl;
    }
    if (validatedFields.data.hasOwnProperty('username')) {
      dataToUpdate.username = validatedUsername === undefined ? null : validatedUsername;
    }
    if (validatedFields.data.hasOwnProperty('gender')) {
      // If gender is undefined after validation (e.g. not selected), set to null in DB
      dataToUpdate.gender = validatedGender === undefined ? null : validatedGender;
    }
    if (validatedFields.data.hasOwnProperty('websites')) {
      // If `validatedWebsites` is undefined, it means it wasn't in `rawData` (e.g. no <input name="websites"> or all were empty).
      // If it *is* in `validatedFields.data` (even as an empty array if Zod processed it), we pass it.
      // Prisma will update the field to an empty array if `validatedWebsites` is `[]`.
      // If `validatedWebsites` is `undefined` here, it means it wasn't in `rawData` to begin with, so we don't update.
      if (validatedWebsites !== undefined) {
        dataToUpdate.websites = validatedWebsites;
      }
    }
    if (validatedFields.data.hasOwnProperty('city')) {
      dataToUpdate.city = validatedCity === undefined ? null : validatedCity;
    }
    if (validatedFields.data.hasOwnProperty('showLocation')) {
      dataToUpdate.showLocation = validatedShowLocation;
    }

    if (Object.keys(dataToUpdate).length === 0) {
        return {
            message: 'No changes provided.',
            success: false,
        };
    }

    await prisma.user.update({
      where: { id: userId },
      data: dataToUpdate,
    });

    // Get the updated user to return the new username for redirect
    const updatedUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { username: true, id: true }
    });

    revalidatePath(`/profile/${userId}`);
    if (updatedUser?.username) {
      revalidatePath(`/profile/${updatedUser.username}`);
    }
    revalidatePath('/'); // Revalidate home page if user name/image appears there

    return {
      message: 'Profile updated successfully!',
      success: true,
      updatedUsername: updatedUser?.username || undefined, // Include the new username
    };
  } catch (error) {
    console.error('Error updating profile:', error);
    return {
      message: 'Failed to update profile. Please try again.',
      success: false,
      errors: { general: ['An unexpected error occurred.'] },
    };
  }
}

export async function followUserAction(userId: string): Promise<{ success: boolean; error?: string }> {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return { success: false, error: "User not authenticated." };
  }

  const followerId = session.user.id;

  // Prevent users from following themselves
  if (followerId === userId) {
    return { success: false, error: "Users cannot follow themselves." };
  }

  try {
    // Check if the user to follow exists
    const userToFollow = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!userToFollow) {
      return { success: false, error: "User not found." };
    }

    // Check if already following
    const existingFollow = await prisma.userFollow.findUnique({
      where: {
        followerId_followingId: {
          followerId,
          followingId: userId,
        },
      },
    });

    if (existingFollow) {
      return { success: false, error: "Already following this user." };
    }

    // Create the follow relationship
    await prisma.userFollow.create({
      data: {
        followerId,
        followingId: userId,
      },
    });

    // Create notification for the followed user
    const follower = await prisma.user.findUnique({
      where: { id: followerId },
      select: { name: true },
    });

    await prisma.notification.create({
      data: {
        userId: userId,
        type: 'FOLLOW',
        title: 'New Follower',
        message: `${follower?.name || 'Someone'} started following you`,
        data: {
          followerId: followerId,
          followerName: follower?.name,
        },
      },
    });

    // Emit real-time notification
    const notification = {
      id: 'temp-id',
      type: 'FOLLOW',
      title: 'New Follower',
      message: `${follower?.name || 'Someone'} started following you`,
      data: {
        followerId: followerId,
        followerName: follower?.name,
      },
      read: false,
      createdAt: new Date().toISOString(),
    };
    
    emitNotification(userId, notification);

    revalidatePath(`/profile/${userId}`);
    revalidatePath('/');

    return { success: true };
  } catch (error) {
    console.error('Error following user:', error);
    return { success: false, error: "Failed to follow user." };
  }
}

export async function unfollowUserAction(userId: string): Promise<{ success: boolean; error?: string }> {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return { success: false, error: "User not authenticated." };
  }

  const followerId = session.user.id;

  try {
    // Check if the follow relationship exists
    const existingFollow = await prisma.userFollow.findUnique({
      where: {
        followerId_followingId: {
          followerId,
          followingId: userId,
        },
      },
    });

    if (!existingFollow) {
      return { success: false, error: "Not following this user." };
    }

    // Delete the follow relationship
    await prisma.userFollow.delete({
      where: {
        followerId_followingId: {
          followerId,
          followingId: userId,
        },
      },
    });

    revalidatePath(`/profile/${userId}`);
    revalidatePath('/');

    return { success: true };
  } catch (error) {
    console.error('Error unfollowing user:', error);
    return { success: false, error: "Failed to unfollow user." };
  }
}

export async function getFollowStatusAction(userId: string): Promise<{ 
  success: boolean; 
  error?: string; 
  isFollowing?: boolean; 
  followersCount?: number; 
  followingCount?: number; 
}> {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return { success: false, error: "User not authenticated." };
  }

  const currentUserId = session.user.id;

  try {
    // Get follow status
    const isFollowing = await prisma.userFollow.findUnique({
      where: {
        followerId_followingId: {
          followerId: currentUserId,
          followingId: userId,
        },
      },
    });

    // Get follower and following counts
    const [followersCount, followingCount] = await Promise.all([
      prisma.userFollow.count({
        where: { followingId: userId },
      }),
      prisma.userFollow.count({
        where: { followerId: userId },
      }),
    ]);

    return {
      success: true,
      isFollowing: !!isFollowing,
      followersCount,
      followingCount,
    };
  } catch (error) {
    console.error('Error getting follow status:', error);
    return { success: false, error: "Failed to get follow status." };
  }
}
