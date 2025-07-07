import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma'; // Changed from PrismaClient
import bcrypt from 'bcryptjs';
import { z } from 'zod';

// const prisma = new PrismaClient(); // Removed local instantiation
const saltRounds = 10; // For bcrypt

// Define validation schema for registration
const registerSchema = z.object({
  email: z.string().email({ message: "Invalid email address" }),
  password: z.string().min(6, { message: "Password must be at least 6 characters long" }),
  name: z.string().min(2, { message: "Name must be at least 2 characters" }).optional(),
  // Remove username, bio, skills, interests, primaryIntent as required fields
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

    const { email, password, name } = validationResult.data;

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

    // Hash password
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // Create new user with only the required fields
    const newUser = await prisma.user.create({
      data: {
        email,
        passwordHash,
        name: name || null, // Optional name
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
