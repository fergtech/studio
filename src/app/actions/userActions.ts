'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { getServerSession } from 'next-auth';
import { authOptions } from "@/app/api/auth/[...nextauth]/route"; // Corrected path

// Define a schema for profile update validation
const UpdateProfileSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100).optional(),
  bio: z.string().max(500).optional(),
  imageUrl: z.string().url().optional(),
  bannerImageUrl: z.string().url().optional(), // Add bannerImageUrl to schema
});

export interface UpdateUserProfileActionState {
  message: string;
  success: boolean;
  errors?: {
    name?: string[];
    bio?: string[];
    imageUrl?: string[];
    bannerImageUrl?: string[]; // Add bannerImageUrl to errors
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

  const rawData: {
    name?: string;
    bio?: string;
    imageUrl?: string;
    bannerImageUrl?: string; // Add bannerImageUrl to rawData
  } = {
    name: formData.get('name') as string | undefined,
    bio: formData.get('bio') as string | undefined,
    // imageUrl will be added below if present in formData
    // bannerImageUrl will be added below if present in formData
  };

  // Handle imageUrl if it's directly passed (e.g., after an upload)
  // For this action, we'll assume imageUrl might come from a hidden input
  // or be added to rawData before validation if a new image was uploaded client-side.
  const imageUrl = formData.get('imageUrl') as string | undefined;
  if (imageUrl) {
    rawData.imageUrl = imageUrl;
  }

  const bannerImageUrl = formData.get('bannerImageUrl') as string | undefined;
  if (bannerImageUrl) {
    rawData.bannerImageUrl = bannerImageUrl;
  }


  const validatedFields = UpdateProfileSchema.safeParse(rawData);

  if (!validatedFields.success) {
    return {
      message: 'Validation failed.',
      success: false,
      errors: validatedFields.error.flatten().fieldErrors,
    };
  }

  const { name, bio, imageUrl: validatedImageUrl, bannerImageUrl: validatedBannerImageUrl } = validatedFields.data;

  try {
    const dataToUpdate: { name?: string; bio?: string; image?: string; bannerImageUrl?: string; } = {}; // Add bannerImageUrl to dataToUpdate
    if (name) dataToUpdate.name = name;
    if (bio) dataToUpdate.bio = bio;
    if (validatedImageUrl) dataToUpdate.image = validatedImageUrl;
    if (validatedBannerImageUrl) dataToUpdate.bannerImageUrl = validatedBannerImageUrl;


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

    revalidatePath(`/profile/${userId}`);
    revalidatePath('/'); // Revalidate home page if user name/image appears there

    return {
      message: 'Profile updated successfully!',
      success: true,
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
