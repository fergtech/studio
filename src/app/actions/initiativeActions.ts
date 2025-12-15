"use server";

import { InitiativeStatus, UpdateType, MediaType, InitiativeRoleType, ResourceType } from "@prisma/client"; // Added InitiativeRoleType and ResourceType
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';
import { Initiative as FrontendInitiativeType } from '@/lib/types'; // Removed RoleType as FrontendRoleType
import { GoogleGenerativeAI } from "@google/generative-ai";
import { generateAIGuidance } from '@/lib/aiHelper'; // Import AI helper with Cloudflare fallback
import { lookupByPostalCode } from "@/services/location";

// Initialize the Google Generative AI model (keep for backward compatibility)
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY || 'dummy'); // Fallback to prevent crashes
const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" });

interface CreateInitiativeArgs {
  title: string;
  description: string;
  imageUrl?: string;
  roles: string[]; // These are tags/skills, not user roles
  status: InitiativeStatus;
  location?: string; // Optional location for MVP
  latitude?: number; // Coordinates from frontend
  longitude?: number; // Coordinates from frontend
  societyId?: string; // Optional: link initiative to a society
  originatingIssueId?: string; // Optional: issue that this initiative addresses
  originatingIdeaId?: string; // Optional: idea that this initiative implements
}

export async function createInitiative(args: CreateInitiativeArgs) {
  const session = await getServerSession(authOptions);

  console.log("createInitiative: After getServerSession");

  if (!session?.user?.id) {
    return { error: "User not authenticated." };
  }

  const userId = session.user.id;

  try {
    // Debugging: Log the creatorId
    console.log("Creating initiative with creatorId:", userId);

    // Verify creatorId exists in the User table
    const userExists = await prisma.user.findUnique({
      where: { id: userId },
    });

    console.log("createInitiative: After userExists check, userExists:", !!userExists);

    if (!userExists) {
      return { error: "Creator ID does not exist in the database." };
    }

    if (!Object.values(InitiativeStatus).includes(args.status)) {
      console.log("createInitiative: Invalid initiative status:", args.status);
      return { error: "Invalid initiative status provided." };
    }

    console.log("createInitiative: After status validation");

    // Validate society membership if societyId is provided
    if (args.societyId) {
      console.log("createInitiative: Validating society membership for societyId:", args.societyId);
      console.log("createInitiative: Checking membership for userId:", userId);
      
      // First, let's check if the society exists
      const society = await prisma.society.findUnique({
        where: { id: args.societyId },
      });
      
      if (!society) {
        console.log("createInitiative: Society not found");
        return { error: "Society not found." };
      }
      
      console.log("createInitiative: Society found:", society.name);
      console.log("createInitiative: Society creator:", society.creatorId);
      
      // Check if user is the society creator (creators are automatically considered members)
      if (society.creatorId === userId) {
        console.log("createInitiative: User is society creator - access granted");
      } else {
        // Check membership using the correct unique constraint
        const societyMembership = await prisma.societyMembership.findUnique({
          where: {
            userId_societyId: {
              userId: userId,
              societyId: args.societyId,
            },
          },
        });

        console.log("createInitiative: Membership query result:", societyMembership);
        
        if (!societyMembership) {
          return { error: "You must be a member of the society to create initiatives for it." };
        }
        console.log("createInitiative: Society membership validated successfully");
      }
    }

    // Use provided coordinates or geocode if needed
    let coordinates: { lat: number; lng: number } | null = null;

    if (args.latitude && args.longitude) {
      // Frontend already provided coordinates
      coordinates = { lat: args.latitude, lng: args.longitude };
    } else if (args.location) {
      // Fallback: try to geocode the location string
      try {
        // Check if it's a zip code (5 digits)
        if (/^\d{5}$/.test(args.location.trim())) {
          const resolved = await lookupByPostalCode(args.location.trim());
          coordinates = resolved.coordinates;
        }
      } catch (error) {
        console.log('Geocoding failed for location:', args.location, error);
        // Continue without coordinates if geocoding fails
      }
    }

    const newInitiative = await prisma.initiative.create({
      data: {
        creatorId: userId,
        title: args.title,
        description: args.description,
        imageUrl: args.imageUrl || null,
        roles: args.roles, // These are the skill/tag roles for the initiative itself
        originatingIssueId: args.originatingIssueId,
        originatingIdeaId: args.originatingIdeaId,
        status: args.status,
        location: args.location || null, // Add the missing location field
        latitude: coordinates?.lat,
        longitude: coordinates?.lng,
        societyId: args.societyId || null, // Link initiative to society if provided
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
              select: { id: true, name: true, image: true },
            },
          },
        },
      },
    });

    console.log("createInitiative: Immediately after prisma.initiative.create call.");
    console.log("createInitiative: After prisma.initiative.create, newInitiative.id:", newInitiative.id);

    console.log("Attempting to generate AI guidance..."); // Existing log
    let aiGuidanceText = null;

    try { // Inner try for AI generation
      console.log("createInitiative: Inside AI generation try block");
      // Generate AI guidance based on the initiative's title and description using AI helper
      const prompt = `Generate helpful getting started guidance for a new initiative titled "${newInitiative.title}" with the description: "${newInitiative.description}". Provide actionable steps or key considerations for someone looking to contribute or get involved. Format the response as a concise, easy-to-read text block.`;

      const aiResult = await generateAIGuidance(prompt, 2); // 2 retries for speed

      if (aiResult.success && aiResult.text) {
        aiGuidanceText = aiResult.text;
        console.log(`✅ Received guidance from ${aiResult.provider}:`, aiGuidanceText.substring(0, 100) + '...');

        // Update the initiative with the generated AI guidance
        console.log("createInitiative: Attempting to update initiative with AI guidance...");
        await prisma.initiative.update({
          where: { id: newInitiative.id },
          data: {
            aiGuidance: aiGuidanceText,
          },
        });
        console.log(`Updated initiative ${newInitiative.id} with AI guidance.`);
      } else {
        console.warn("AI guidance generation failed, continuing without guidance");
      }
    } catch (aiError) { // Inner catch for AI generation errors
      console.error("Caught error in AI generation try block:", aiError);
      // The main catch block will also be triggered, so no need to re-throw
    }

    revalidatePath("/");
    revalidatePath("/initiatives");
    revalidatePath(`/profile/${userId}`);
    revalidatePath(`/initiatives/${newInitiative.id}`);

    console.log("createInitiative: After revalidatePath calls");

    // Fetch the initiative again to include the AI guidance before returning
    console.log("createInitiative: Attempting to fetch updated initiative...");
    const updatedInitiative = await prisma.initiative.findUnique({
      where: { id: newInitiative.id },
      include: { // Include necessary relations as in getInitiativeById
        creator: { select: { id: true, name: true, image: true } },
        society: { select: { id: true, name: true, image: true } },
        memberships: { include: { user: { select: { id: true, name: true, image: true } } } },
        updates: { orderBy: { createdAt: 'desc' }, include: { user: true, media: true } },
        chatMessages: { orderBy: { timestamp: 'asc' }, include: { sender: true } },
        milestones: { orderBy: { order: 'asc' }, include: { creator: true, steps: true } },
        goals: { orderBy: { createdAt: 'asc' }, include: { owner: true, actions: true } },
      },
    });

    console.log("createInitiative: After fetching updated initiative, updatedInitiative.aiGuidance:", updatedInitiative?.aiGuidance);

    return { success: true, initiative: updatedInitiative };

  } catch (error) { // Main catch block
    console.error("Caught error in createInitiative main catch block:", error);
    console.error("Error creating initiative:", error);

    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      return { error: `Database error: ${error.message}` };
    }

    const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
    return { error: `Failed to create initiative: ${errorMessage}` };
  }
}

export async function getInitiativeById(id: string) {
  try {
    const initiative = await prisma.initiative.findUnique({
      where: { id },
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
        memberships: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                image: true,
              },
            },
          },
        },
        updates: {
          orderBy: { createdAt: 'desc' },
          include: {
            user: {
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
              },
            },
          },
        },
        chatMessages: {
          orderBy: { timestamp: 'asc' },
          include: {
            sender: {
              select: {
                id: true,
                name: true,
                image: true,
              },
            },
          },
        },
        milestones: {
          orderBy: { order: 'asc' },
          include: {
            creator: {
              select: {
                id: true,
                name: true,
                image: true,
              },
            },
            steps: {
              select: {
                id: true,
                title: true,
                status: true,
              },
            },
          },
        },
        goals: {
          orderBy: { createdAt: 'asc' },
          include: {
            owner: {
              select: {
                id: true,
                name: true,
                image: true,
              },
            },
            actions: true,
          },
        },
      },
    });

    if (!initiative) {
      console.log(`getInitiativeById: Initiative with ID ${id} not found.`);
      return { error: "Initiative not found." };
    }

    return { initiative: initiative };
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

/**
 * Syncs ResourceMetadata entries from an Update's details and media
 */
async function syncResourceMetadata(update: any) {
  try {
    const details = update.details as any;
    const resources = [];

    // Extract links from details
    if (details?.links?.length > 0) {
      details.links.forEach((link: any, index: number) => {
        resources.push({
          initiativeId: update.initiativeId,
          updateId: update.id,
          resourceType: ResourceType.LINK,
          title: link.title || link.url || 'Untitled Link',
          description: link.description || null,
          url: link.url,
          category: link.category || null,
          order: index,
          createdBy: update.userId,
        });
      });
    }

    // Extract documents from details
    if (details?.documents?.length > 0) {
      details.documents.forEach((doc: any, index: number) => {
        resources.push({
          initiativeId: update.initiativeId,
          updateId: update.id,
          resourceType: ResourceType.DOCUMENT,
          title: doc.title || doc.filename || 'Untitled Document',
          description: doc.description || null,
          url: doc.url,
          category: doc.category || null,
          order: index,
          createdBy: update.userId,
        });
      });
    }

    // Extract media (images, videos, audio)
    if (update.media?.length > 0) {
      update.media.forEach((media: any, index: number) => {
        resources.push({
          initiativeId: update.initiativeId,
          updateId: update.id,
          resourceType: ResourceType.MEDIA,
          title: 'Media from update',
          description: null,
          url: media.url,
          category: null,
          order: index,
          createdBy: update.userId,
        });
      });
    }

    // Create ResourceMetadata entries if any resources were found
    if (resources.length > 0) {
      await prisma.resourceMetadata.createMany({
        data: resources,
        skipDuplicates: true,
      });
      console.log(`✅ Created ${resources.length} resource metadata entries for update ${update.id}`);
    }
  } catch (error) {
    console.error(`Error syncing resource metadata for update ${update.id}:`, error);
    // Don't throw - we don't want to fail the update creation if resource metadata sync fails
  }
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

    // Sync ResourceMetadata entries
    await syncResourceMetadata(update);

    // Send notification if this is a response to another update
    if (args.details?.parentUpdateId) {
      try {
        // Get the original update and its author
        const parentUpdate = await prisma.update.findUnique({
          where: { id: args.details.parentUpdateId },
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                emailNotifications: true,
                username: true,
              }
            },
            initiative: {
              select: {
                id: true,
                title: true,
              }
            }
          },
        });

        // Only notify if the responder is not the original poster
        if (parentUpdate && parentUpdate.userId !== args.userId) {
          const responder = await prisma.user.findUnique({
            where: { id: args.userId },
            select: { name: true }
          });

          // Create in-app notification
          await prisma.notification.create({
            data: {
              userId: parentUpdate.userId,
              type: 'INITIATIVE_INVITE', // Reusing existing type, could add UPDATE_RESPONSE type
              title: 'New Response to Your Update',
              message: `${responder?.name || 'Someone'} responded to your update in ${parentUpdate.initiative?.title || 'an initiative'}`,
              data: {
                initiativeId: args.initiativeId,
                updateId: update.id,
                parentUpdateId: args.details.parentUpdateId,
                responderId: args.userId,
              },
            },
          });

          // Send email notification if enabled
          if (parentUpdate.user.emailNotifications) {
            const { sendNotificationEmail } = await import('@/lib/email');
            const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
            const updateUrl = `${baseUrl}/initiatives/${args.initiativeId}`;
            
            await sendNotificationEmail(
              parentUpdate.user.email,
              'INITIATIVE_INVITE',
              'New Response to Your Update',
              `${responder?.name || 'Someone'} responded to your update in ${parentUpdate.initiative?.title || 'an initiative'}: "${args.content.substring(0, 100)}${args.content.length > 100 ? '...' : ''}"`,
              updateUrl,
              'View Response',
              parentUpdate.user.username || parentUpdate.userId
            );
          }
        }
      } catch (notifError) {
        console.error('Error sending update response notification:', notifError);
        // Don't fail the update creation if notification fails
      }
    }

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
  customRole?: string;
}

import type { Initiative as PrismaDatabaseInitiative } from '@prisma/client';

export async function joinInitiativeAction(
  args: JoinInitiativeArgs
): Promise<{ success: boolean; error?: string; initiative?: FrontendInitiativeType | PrismaDatabaseInitiative | any }> {
  const { initiativeId, roleType, customRole } = args;
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
          updates: { include: { user: true, media: true }, orderBy: { createdAt: 'desc' } },
          chatMessages: { include: { sender: true }, orderBy: { timestamp: 'asc' } },
          milestones: { include: { creator: true, steps: true }, orderBy: { order: 'asc' } },
          goals: { include: { owner: true }, orderBy: { createdAt: 'asc' } },
        },
      });

      console.log('joinInitiativeAction: Returning existing initiative data:', currentInitiativeData);

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

    // Validate if the userId exists in the User table
    const userExists = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!userExists) {
      console.error(`User ${userId} does not exist. Cannot join initiative ${initiativeId}.`);
      return { success: false, error: "User does not exist." };
    }

    await prisma.initiativeMembership.create({
      data: {
        userId: userId,
        initiativeId: initiativeId,
        role: prismaRole, // Use the validated prismaRole
        customRole: customRole || null,
      },
    });
    
    console.log(`User ${userId} joined initiative ${initiativeId} with role ${prismaRole}.`);

    const updatedInitiativeData = await prisma.initiative.findUnique({
      where: { id: initiativeId },
      include: { 
        creator: true,
        memberships: { include: { user: {select: {id: true, name: true, image: true}} } },
        updates: { include: { user: true, media: true }, orderBy: { createdAt: 'desc' } },
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
    const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
    return { success: false, error: `An unexpected error occurred while joining the initiative: ${errorMessage}` };
  }
}

interface UpdateInitiativeArgs {
  initiativeId: string;
  title?: string;
  description?: string;
  imageUrl?: string;
  roles?: string[];
  status?: "DRAFT" | "PUBLISHED" | "ARCHIVED";
}

// Renamed from updateInitiative to updateInitiativeAction to avoid conflict with the type
export async function updateInitiativeAction({
  initiativeId,
  title,
  description,
  imageUrl,
  roles,
  status,
}: UpdateInitiativeArgs) {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return { error: "You must be logged in to update an initiative." };
  }

  try {
    const initiative = await prisma.initiative.findUnique({
      where: { id: initiativeId },
      select: { creatorId: true },
    });

    if (!initiative) {
      return { error: "Initiative not found." };
    }

    if (initiative.creatorId !== session.user.id) {
      return { error: "You are not authorized to update this initiative." };
    }

    const updateData: any = {};
    if (title) updateData.title = title;
    if (description) updateData.description = description;
    if (roles) updateData.roles = roles;
    if (status) updateData.status = status;

    // Handle imageUrl updates
    if (imageUrl !== undefined) { // Check if imageUrl was provided in the update, even if null
      // No direct media items table for initiatives, just update the URL.
      // If imageUrl is null, it means the user wants to remove the image.
      updateData.imageUrl = imageUrl;
    }

    const updatedInitiative = await prisma.initiative.update({
      where: { id: initiativeId },
      data: updateData,
    });

    revalidatePath("/");
    revalidatePath("/initiatives");
    revalidatePath(`/initiatives/${initiativeId}`);
    revalidatePath(`/profile/${session.user.id}`);

    return { success: true, initiative: updatedInitiative };
  } catch (error) {
    console.error("Error updating initiative:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
    return { error: `Failed to update initiative: ${errorMessage}` };
  }
}

export async function updateUpdateContent(updateId: string, newContent: string): Promise<{ success: boolean; error?: string }> {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return { success: false, error: "User not authenticated." };
  }
  const userId = session.user.id;

  try {
    const updateToEdit = await prisma.update.findUnique({
      where: { id: updateId },
      select: { userId: true, initiativeId: true },
    });

    if (!updateToEdit) {
      return { success: false, error: "Update not found." };
    }

    if (updateToEdit.userId !== userId) {
      return { success: false, error: "User not authorized to edit this update." };
    }

    await prisma.update.update({
      where: { id: updateId },
      data: { content: newContent },
    });

    revalidatePath(`/initiatives/${updateToEdit.initiativeId}`);

    return { success: true };
  } catch (error) {
    console.error(`Error updating update ${updateId}:`, error);
    return { success: false, error: "Failed to update content." };
  }
}

export async function deleteUpdateAction(updateId: string): Promise<{ success: boolean; error?: string }> {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return { success: false, error: "User not authenticated." };
  }
  const userId = session.user.id;

  try {
    const updateToDelete = await prisma.update.findUnique({
      where: { id: updateId },
      select: { userId: true, initiativeId: true },
    });

    if (!updateToDelete) {
      return { success: false, error: "Update not found." };
    }

    if (updateToDelete.userId !== userId) {
      return { success: false, error: "User not authorized to delete this update." };
    }

    // Optional: Add logic here to delete associated media from Azure Blob Storage if necessary

    await prisma.update.delete({
      where: { id: updateId },
    });

    revalidatePath(`/initiatives/${updateToDelete.initiativeId}`);

    return { success: true };
  } catch (error) {
    console.error(`Error deleting update ${updateId}:`, error);
    return { success: false, error: "Failed to delete update." };
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
  const validRoles: string[] = Object.values(InitiativeRoleType).filter((r: string) => r !== InitiativeRoleType.ADMIN);
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

    console.log('updateInitiativeMembershipAction: Returning initiative data:', updatedInitiativeData.initiative);

    return { success: true, initiative: updatedInitiativeData.initiative };
  } catch (error) {
    console.error(`Error updating membership role for user ${userId} in initiative ${initiativeId}:`, error);
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      return { success: false, error: `Database error: ${error.code}` };
    }
    const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
    return { success: false, error: `An unexpected error occurred while updating membership role: ${errorMessage}` };
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
    const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
    return { success: false, error: `An unexpected error occurred while leaving the initiative: ${errorMessage}` };
  }
}

export async function deleteInitiative(initiativeId: string) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return { error: 'Not authenticated' };
  }
  // Check if the user is the creator
  const initiative = await prisma.initiative.findUnique({ where: { id: initiativeId } });
  if (!initiative) return { error: 'Initiative not found' };
  if (initiative.creatorId !== session.user.id) return { error: 'Not authorized' };
  try {
    // Delete associated media (if any, e.g., banner images, updates, etc.)
    await prisma.mediaItem.deleteMany({ where: { postId: initiativeId } });
    // Delete memberships, updates, chatMessages, milestones, goals, etc. as needed
    await prisma.initiativeMembership.deleteMany({ where: { initiativeId } });
    await prisma.update.deleteMany({ where: { initiativeId } });
    await prisma.chatMessage.deleteMany({ where: { initiativeId } });
    await prisma.milestone.deleteMany({ where: { initiativeId } });
    await prisma.goal.deleteMany({ where: { initiativeId } });
    // Delete the initiative itself
    await prisma.initiative.delete({ where: { id: initiativeId } });
    revalidatePath('/');
    return { success: true };
  } catch (error) {
    console.error('Error deleting initiative:', error);
    return { error: 'Failed to delete initiative.' };
  }
}
