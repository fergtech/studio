"use server";

import { PrismaClient, InitiativeStatus, UpdateType, MediaType } from "@prisma/client"; // Added MediaType
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route"; // Adjust path as needed
import { revalidatePath } from "next/cache";

const prisma = new PrismaClient();

interface CreateInitiativeArgs {
  title: string;
  description: string;
  imageUrl?: string;
  roles: string[];
  status: InitiativeStatus; // This should match the enum from Prisma
}

export async function createInitiative(args: CreateInitiativeArgs) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return { error: "User not authenticated." };
  }

  const userId = session.user.id;

  try {
    // Validate status against Prisma enum values
    // The form already uses InitiativeStatus type, but good to be cautious
    if (!Object.values(InitiativeStatus).includes(args.status)) {
        return { error: "Invalid initiative status provided." };
    }

    const newInitiative = await prisma.initiative.create({
      data: {
        creatorId: userId,
        title: args.title,
        description: args.description,
        imageUrl: args.imageUrl || null, // Ensure null if empty string for optional URL
        roles: args.roles,
        status: args.status,
      },
      include: {
        creator: true, // Include creator for potential immediate use
      }
    });

    // Revalidate paths
    revalidatePath("/"); // Main feed
    revalidatePath("/initiatives"); // If you have an initiatives list page
    // Potentially revalidate user's profile page if they list created initiatives
    revalidatePath(`/profile/${userId}`);

    return { success: true, initiative: newInitiative };
  } catch (error) {
    console.error("Error creating initiative:", error);
    // Check for specific Prisma errors if needed
    // e.g., if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002')
    return { error: "Failed to create initiative. Please try again." };
  } finally {
    await prisma.$disconnect();
  }
}

export async function getInitiativeById(id: string) {
  try {
    const initiative = await prisma.initiative.findUnique({
      where: { id },
      include: {
        creator: true,
        members: { // Corrected include for direct many-to-many relation
          select: {
            id: true,
            name: true,
            image: true,
          }
        },
        updates: {
          orderBy: { timestamp: 'desc' },
          include: { user: true, media: true }, // Added media to updates
        },
        chatMessages: {
          orderBy: { timestamp: 'asc' },
          include: { sender: true },
        },
        milestones: {
          orderBy: { order: 'asc' }, 
          include: { creator: true }, 
        },
        goals: {
          orderBy: { createdAt: 'asc' }, 
          include: { owner: true }, 
        },
        // roles: { include: { user: true } }, // This was incorrect as 'roles' is String[]
        // If you have a UserInitiativeRole model linking users to roles within an initiative:
        // userRoles: { include: { user: true, role: true } } // Add this if you have such a relation
      },
    });

    if (!initiative) {
      return { error: "Initiative not found." };
    }

    // Transform to frontend types. Prisma Date objects are fine.
    // The main adjustment is for members if it comes from a join table like UserInitiativeRole
    // For now, assuming `participants` directly gives User[] or needs minimal transformation.
    const transformedInitiative = {
      ...initiative,
      // If `participants` is a list of User objects directly, no specific mapping is needed here
      // If it's from a join table (e.g., UserInitiativeRole), you might map it to UserForDisplay[]
      // Example if participants were UserInitiativeRole[]:
      // members: initiative.participants.map(p => ({ 
      //   id: p.user.id, 
      //   name: p.user.name, 
      //   image: p.user.image 
      //   // role: p.role.name // if role details are included
      // })),
      // Ensure Milestones and Goals with their populated creator/owner are correctly shaped
      // for your frontend types (Milestone[] and Goal[] in Initiative type)
    };

    return { initiative: transformedInitiative };
  } catch (error) {
    console.error(`Error fetching initiative ${id}:`, error);
    return { error: "Failed to fetch initiative." };
  }
}

export async function createUpdate(data: {
  initiativeId: string;
  type: UpdateType; // Now correctly referencing the imported Prisma enum
  userId: string;
  content: string;
  media?: Array<{ url: string; type: string; initiativeId?: string; name?: string; size?: number; mimeType?: string; }>; 
  details?: any; 
}) {
  try {
    const update = await prisma.update.create({
      data: {
        initiativeId: data.initiativeId,
        type: data.type,
        userId: data.userId,
        content: data.content,
        details: data.details,
        media: data.media ? { 
          create: data.media.map(item => ({
            url: item.url,
            type: item.type as MediaType, // Cast to MediaType enum
            name: item.name || 'Untitled Media',
            size: item.size || 0,
            mimeType: item.mimeType || 'application/octet-stream',
            // initiativeId is not a field on MediaItem in your schema, it's linked via updateId or postId
          })) 
        } : undefined,
      },
      include: {
        user: true, // To return the user details with the update
      },
    });
    revalidatePath(`/initiatives/${data.initiativeId}`);
    return { success: true, update };
  } catch (error) {
    console.error("Error creating update:", error);
    return { success: false, error: "Failed to create update." };
  }
}