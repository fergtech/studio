import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma'; // Changed from PrismaClient
import bcrypt from 'bcrypt';
import { z } from 'zod';

// const prisma = new PrismaClient(); // Removed local instantiation
const saltRounds = 10; // For bcrypt

// Define validation schema for registration
const registerSchema = z.object({
  email: z.string().email({ message: "Invalid email address" }),
  password: z.string().min(6, { message: "Password must be at least 6 characters long" }),
  name: z.string().min(2, { message: "Name must be at least 2 characters" }),
  username: z.string().min(3, { message: "Username must be at least 3 characters" }),
  bio: z.string().max(500, { message: "Bio must be less than 500 characters" }).optional(),
  skills: z.array(z.string()).optional(),
  interests: z.array(z.string()).min(1, { message: "At least one interest is required" }),
  primaryIntent: z.enum(['spot_issues', 'share_ideas', 'join_initiatives', 'learn_skills', 'organize_communities']),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    console.log('Register API: Received body:', body);

    // Validate input
    const validationResult = registerSchema.safeParse(body);
    if (!validationResult.success) {
      console.error('Register API: Validation failed:', validationResult.error.flatten());
      return NextResponse.json(
        { message: "Invalid input", errors: validationResult.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { email, password, name, username, bio, skills, interests, primaryIntent } = validationResult.data;

    // Check if user already exists by email
    const existingUserByEmail = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUserByEmail) {
      console.log('Register API: User already exists with email:', email);
      return NextResponse.json(
        { message: "User with this email already exists" },
        { status: 409 } // Conflict
      );
    }

    // Check if username is already taken
    const existingUserByUsername = await prisma.user.findUnique({
      where: { username },
    });

    if (existingUserByUsername) {
      console.log('Register API: Username already taken:', username);
      return NextResponse.json(
        { message: "Username is already taken" },
        { status: 409 } // Conflict
      );
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // Create new user with all the onboarding data
    const newUser = await prisma.user.create({
      data: {
        email,
        passwordHash,
        name,
        username,
        bio,
        skills: skills || [],
        interests,
        // Store primaryIntent in a way that can be used for recommendations
        // For now, we'll add it to the bio or create a separate field later
      },
    });

    console.log('Register API: User registered successfully:', email);
    // Exclude password hash from the response
    const { passwordHash: _, ...userWithoutPassword } = newUser;
    return NextResponse.json(userWithoutPassword, { status: 201 }); // Created

  } catch (error) {
    console.error('Register API: Internal server error:', error);
    // Check for Prisma-specific errors if needed, though a generic 500 is often okay
    return NextResponse.json(
      { message: "An unexpected error occurred" },
      { status: 500 }
    );
  } finally {
    // await prisma.$disconnect(); // Removed for shared client
  }
}
