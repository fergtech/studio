"use server";

import { InitiativeStatus, UpdateType, MediaType, InitiativeRoleType } from "@prisma/client"; // Added InitiativeRoleType
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { revalidatePath } from "next/cache";
import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';
import { Initiative as FrontendInitiativeType } from '@/lib/types'; // Removed RoleType as FrontendRoleType

interface CreateInitiativeArgs {
  title: string;
  description: string;
  imageUrl?: string;
  roles: string[]; // These are tags/skills, not user roles
  status: InitiativeStatus;
}

export async function createInitiative(args: CreateInitiativeArgs) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return { error: "User not authenticated." };
  }

  const userId = session.user.id;

  try {
    if (!Object.values(InitiativeStatus).includes(args.status)) {
        return { error: "Invalid initiative status provided." };
    }

    const newInitiative = await prisma.initiative.create({
      data: {
        creatorId: userId,
        title: args.title,
        description: args.description,
        imageUrl: args.imageUrl || null,
        roles: args.roles, // These are the skill/tag roles for the initiative itself
        status: args.status,
        memberships: {
          create: [
            {
              userId: userId,
              role: InitiativeRoleType.ADMIN, // Assign ADMIN role to the creator
            },
          ],
        },
      },
      include: {
        creator: true,
        memberships: { 
          include: {
            user: { 
              select: { id: true, name: true, image: true }
            }
            // role: true // REMOVED: role is a scalar and fetched by default
          }
        }
      }
    });

    revalidatePath("/");
    revalidatePath("/initiatives");
    revalidatePath(`/profile/${userId}`);
    revalidatePath(`/initiatives/${newInitiative.id}`);

    return { success: true, initiative: newInitiative };
  } catch (error) {
    console.error("Error creating initiative:", error);
    return { error: "Failed to create initiative. Please try again." };
  }
}

export async function getInitiativeById(id: string) {
  try {
    const initiative = await prisma.initiative.findUnique({
      where: { id },
      include: {
        creator: true,
        memberships: { 
          include: {
            user: { 
              select: {
                id: true,
                name: true,
                image: true,
              }
            }
            // role: true // REMOVED: role is a scalar and fetched by default
          }
        },
        updates: {
          orderBy: { timestamp: 'desc' },
          include: { user: true, media: true }, 
        },
        chatMessages: {
          orderBy: { timestamp: 'asc' },
          include: { sender: true },
        },
        milestones: {
          orderBy: { order: 'asc' }, 
          include: { creator: true, steps: true },
        },
        goals: {
          orderBy: { createdAt: 'asc' }, 
          include: { owner: true }, 
        },
      },
    });

    if (!initiative) {
      return { error: "Initiative not found." };
    }
    return { initiative: initiative as any }; 
  } catch (error) {
    console.error(`Error fetching initiative ${id}:`, error);
    return { error: "Failed to fetch initiative." };
  }
}

interface CreateUpdateArgs {
  initiativeId: string;
  type: UpdateType;
  userId: string;
  content: string;
  media?: Array<{ 
    url: string; 
    type: string; 
    name?: string; 
    size?: number; 
    mimeType?: string; 
  }>; 
  details?: any; 
}

export async function createUpdate(args: CreateUpdateArgs): Promise<{ success: boolean; update?: any; error?: string }> {
  try {
    const update = await prisma.update.create({
      data: {
        initiativeId: args.initiativeId,
        type: args.type,
        userId: args.userId,
        content: args.content,
        details: args.details,
        media: args.media ? { 
          create: args.media.map(item => ({
            url: item.url,
            type: item.type as MediaType,
            // name: item.name || 'Untitled Media', // Prisma schema for MediaItem does not have name, size, mimeType
            // size: item.size || 0,
            // mimeType: item.mimeType || 'application/octet-stream',
          })) 
        } : undefined,
      },
      include: {
        user: true, 
        media: true,
      },
    });
    revalidatePath(`/initiatives/${args.initiativeId}`);
    return { success: true, update };
  } catch (error) {
    console.error("Error creating update:", error);
    return { success: false, error: "Failed to create update." };
  }
}

interface JoinInitiativeArgs {
  initiativeId: string;
  roleType: InitiativeRoleType; // Expecting a valid Prisma InitiativeRoleType string
}

import type { Initiative as PrismaDatabaseInitiative } from '@prisma/client';

export async function joinInitiativeAction(
  args: JoinInitiativeArgs
): Promise<{ success: boolean; error?: string; initiative?: FrontendInitiativeType | PrismaDatabaseInitiative | any }> {
  const { initiativeId, roleType } = args;
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return { success: false, error: "User not authenticated." };
  }
  const userId = session.user.id;

  try {
    const existingMembership = await prisma.initiativeMembership.findUnique({
      where: {
        userId_initiativeId: {
          userId: userId,
          initiativeId: initiativeId,
        },
      },
    });

    if (existingMembership) {
      console.log(`User ${userId} is already a member of initiative ${initiativeId} with role ${existingMembership.role}.`);
      const currentInitiativeData = await prisma.initiative.findUnique({
        where: { id: initiativeId },
        include: { 
          creator: true,
          memberships: { include: { user: {select: {id: true, name: true, image: true}}/*, role: true*/ } }, // REMOVED: role is a scalar
          updates: { include: { user: true, media: true }, orderBy: { timestamp: 'desc' } },
          chatMessages: { include: { sender: true }, orderBy: { timestamp: 'asc' } },
          milestones: { include: { creator: true, steps: true }, orderBy: { order: 'asc' } },
          goals: { include: { owner: true }, orderBy: { createdAt: 'asc' } },
        },
      });
      return { success: true, initiative: currentInitiativeData as any }; 
    }

    // Validate if the provided roleType is a valid InitiativeRoleType value
    // and not ADMIN, as ADMIN role is assigned programmatically or via privileged action.
    if (roleType === InitiativeRoleType.ADMIN) {
        console.warn(`Attempt to join with ADMIN role directly for initiative ${initiativeId} by user ${userId}. This is not allowed.`);
        return { success: false, error: "Joining with ADMIN role is not permitted through this action." };
    }

    // Check if the roleType is one of the valid enum values from Prisma
    const isValidRole = Object.values(InitiativeRoleType).includes(roleType);
    if (!isValidRole) {
        console.warn(`Unrecognized roleType: ${roleType} for initiative ${initiativeId} by user ${userId}.`);
        return { success: false, error: `Invalid role type provided: ${roleType}` };
    }

    // The roleType is already a PrismaInitiativeRoleType string, so direct assignment is fine.
    const prismaRole: InitiativeRoleType = roleType;

    await prisma.initiativeMembership.create({
      data: {
        userId: userId,
        initiativeId: initiativeId,
        role: prismaRole, // Use the validated prismaRole
      },
    });
    
    console.log(`User ${userId} joined initiative ${initiativeId} with role ${prismaRole}.`);

    const updatedInitiativeData = await prisma.initiative.findUnique({
      where: { id: initiativeId },
      include: { 
        creator: true,
        memberships: { include: { user: {select: {id: true, name: true, image: true}}/*, role: true*/ } }, // REMOVED: role is a scalar
        updates: { include: { user: true, media: true }, orderBy: { timestamp: 'desc' } },
        chatMessages: { include: { sender: true }, orderBy: { timestamp: 'asc' } },
        milestones: { include: { creator: true, steps: true }, orderBy: { order: 'asc' } },
        goals: { include: { owner: true }, orderBy: { createdAt: 'asc' } },
      },
    });

    revalidatePath(`/initiatives/${initiativeId}`);
    revalidatePath('/'); 

    return { success: true, initiative: updatedInitiativeData as any };

  } catch (error) {
    console.error(`Error joining initiative ${initiativeId} for user ${userId}:`, error);
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      return { success: false, error: `Database error: ${error.code}` };
    }
    return { success: false, error: "An unexpected error occurred while joining the initiative." };
  }
}

interface UpdateInitiativeArgs {
  initiativeId: string;
  title?: string;
  description?: string;
  imageUrl?: string | null; 
}

export async function updateInitiativeAction(args: UpdateInitiativeArgs): Promise<{ success: boolean; error?: string; initiative?: FrontendInitiativeType | Prisma.InitiativeGetPayload<{ include: { creator: true, memberships: { include: { user: { select: { id: true, name: true, image: true } } } }, updates: { orderBy: { timestamp: 'desc' }, include: { user: true, media: true } }, chatMessages: { orderBy: { timestamp: 'asc' }, include: { sender: true } }, milestones: { orderBy: { order: 'asc' }, include: { creator: true, steps: true } }, goals: { orderBy: { createdAt: 'asc' }, include: { owner: true } } } }> | any }> {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return { success: false, error: "User not authenticated." };
  }
  const userId = session.user.id;

  try {
    const membership = await prisma.initiativeMembership.findUnique({
      where: {
        userId_initiativeId: {
          userId: userId,
          initiativeId: args.initiativeId,
        },
      },
    });

    if (!membership || membership.role !== InitiativeRoleType.ADMIN) {
      return { success: false, error: "User is not authorized to edit this initiative or is not a member." };
    }

    const updateData: Prisma.InitiativeUpdateInput = {};
    let hasChanges = false;
    if (args.title !== undefined) {
      updateData.title = args.title;
      hasChanges = true;
    }
    if (args.description !== undefined) {
      updateData.description = args.description;
      hasChanges = true;
    }
    if (args.imageUrl !== undefined) { // This handles both string URL and null for clearing the image
      updateData.imageUrl = args.imageUrl;
      hasChanges = true;
    }

    if (!hasChanges) {
      // No actual update fields were provided.
      const currentInitiativeData = await getInitiativeById(args.initiativeId);
      if (currentInitiativeData.initiative) {
        return { success: true, initiative: currentInitiativeData.initiative };
      } else {
        return { success: false, error: currentInitiativeData.error || "No changes provided and failed to fetch current initiative data." };
      }
    }

    const updatedInitiative = await prisma.initiative.update({
      where: { id: args.initiativeId },
      data: updateData,
      include: {
        creator: true,
        memberships: {
          include: {
            user: { select: { id: true, name: true, image: true } }
          }
        },
        updates: { orderBy: { timestamp: 'desc' }, include: { user: true, media: true } },
        chatMessages: { orderBy: { timestamp: 'asc' }, include: { sender: true } },
        milestones: { orderBy: { order: 'asc' }, include: { creator: true, steps: true } },
        goals: { orderBy: { createdAt: 'asc' }, include: { owner: true } },
      },
    });

    revalidatePath(`/initiatives/${args.initiativeId}`);
    revalidatePath('/');

    return { success: true, initiative: updatedInitiative };

  } catch (error: any) {
    console.error(`Error updating initiative ${args.initiativeId}:`, error);
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2025') {
        return { success: false, error: "Initiative not found or could not be updated." };
      }
      return { success: false, error: `Database error: ${error.code}` };
    }
    return { success: false, error: "An unexpected error occurred while updating the initiative." };
  }
}

interface UpdateInitiativeMembershipArgs {
  initiativeId: string;
  newRole: InitiativeRoleType; // Expecting a valid Prisma InitiativeRoleType string
}

export async function updateInitiativeMembershipAction(
  args: UpdateInitiativeMembershipArgs
): Promise<{ success: boolean; error?: string; initiative?: FrontendInitiativeType | PrismaDatabaseInitiative | any }> {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return { success: false, error: "User not authenticated." };
  }
  const userId = session.user.id;
  const { initiativeId, newRole } = args;

  // Validate newRole: Cannot change to ADMIN, must be a valid UserSelectableMembershipRole
  if (newRole === InitiativeRoleType.ADMIN) {
    return { success: false, error: "Cannot change role to ADMIN through this action." };
  }
  // Ensure newRole is a valid enum value (excluding ADMIN which is already checked)
  const validRoles: string[] = Object.values(InitiativeRoleType).filter(r => r !== InitiativeRoleType.ADMIN);
  if (!validRoles.includes(newRole)) {
    return { success: false, error: `Invalid role type provided: ${newRole}.` };
  }

  try {
    const membership = await prisma.initiativeMembership.findUnique({
      where: {
        userId_initiativeId: {
          userId: userId,
          initiativeId: initiativeId,
        },
      },
    });

    if (!membership) {
      return { success: false, error: "User is not a member of this initiative." };
    }

    if (membership.role === newRole) {
      // No change needed, return current data
      const currentInitiativeData = await getInitiativeById(initiativeId);
      return { success: true, initiative: currentInitiativeData.initiative };
    }

    const updatedMembership = await prisma.initiativeMembership.update({
      where: {
        userId_initiativeId: {
          userId: userId,
          initiativeId: initiativeId,
        },
      },
      data: {
        role: newRole,
      },
    });

    console.log(`User ${userId} role in initiative ${initiativeId} changed to ${newRole}.`);

    const updatedInitiativeData = await getInitiativeById(initiativeId); // Fetch full updated initiative data

    revalidatePath(`/initiatives/${initiativeId}`);

    return { success: true, initiative: updatedInitiativeData.initiative };
  } catch (error) {
    console.error(`Error updating membership role for user ${userId} in initiative ${initiativeId}:`, error);
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      return { success: false, error: `Database error: ${error.code}` };
    }
    return { success: false, error: "An unexpected error occurred while updating membership role." };
  }
}

interface LeaveInitiativeArgs {
  initiativeId: string;
}

export async function leaveInitiativeAction(
  args: LeaveInitiativeArgs
): Promise<{ success: boolean; error?: string }> {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return { success: false, error: "User not authenticated." };
  }
  const userId = session.user.id;
  const { initiativeId } = args;

  try {
    const membership = await prisma.initiativeMembership.findUnique({
      where: {
        userId_initiativeId: {
          userId: userId,
          initiativeId: initiativeId,
        },
      },
    });

    if (!membership) {
      return { success: false, error: "User is not a member of this initiative." };
    }

    // Critical check: Prevent last ADMIN from leaving
    if (membership.role === InitiativeRoleType.ADMIN) {
      const adminMemberships = await prisma.initiativeMembership.count({
        where: {
          initiativeId: initiativeId,
          role: InitiativeRoleType.ADMIN,
        },
      });
      if (adminMemberships <= 1) {
        return { success: false, error: "Cannot leave the initiative. You are the only ADMIN. Please assign another ADMIN before leaving." };
      }
    }

    await prisma.initiativeMembership.delete({
      where: {
        userId_initiativeId: {
          userId: userId,
          initiativeId: initiativeId,
        },
      },
    });

    console.log(`User ${userId} left initiative ${initiativeId}.`);

    revalidatePath(`/initiatives/${initiativeId}`);
    revalidatePath('/'); // Revalidate homepage as user's initiatives might change
    revalidatePath(`/profile/${userId}`); // Revalidate user's profile

    return { success: true };
  } catch (error) {
    console.error(`Error leaving initiative ${initiativeId} for user ${userId}:`, error);
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      return { success: false, error: `Database error: ${error.code}` };
    }
    // Ensure this path also returns the correct type
    return { success: false, error: "An unexpected error occurred while leaving the initiative." };
  }
}