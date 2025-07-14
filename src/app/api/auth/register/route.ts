import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { z } from 'zod';

const saltRounds = 10;

// Updated schema: only email and password required
const registerSchema = z.object({
  email: z.string().email({ message: "Invalid email address" }),
  password: z.string().min(6, { message: "Password must be at least 6 characters long" }),
  name: z.string().min(2, { message: "Name must be at least 2 characters" }).optional(),
  username: z.string().min(3, { message: "Username must be at least 3 characters" }).optional(),
  bio: z.string().max(500, { message: "Bio must be less than 500 characters" }).optional(),
  skills: z.array(z.string()).optional(),
  interests: z.array(z.string()).optional(),
  primaryIntent: z.enum(['spot_issues', 'share_ideas', 'join_initiatives', 'learn_skills', 'organize_communities']).optional(),
});

async function generateUniqueUsername(base: string): Promise<string> {
  let username = base.toLowerCase().replace(/[^a-z0-9]/g, '');
  if (username.length < 3) username = `user${Math.floor(Math.random() * 10000)}`;
  let unique = false;
  let attempt = 0;
  let candidate = username;
  while (!unique) {
    const existing = await prisma.user.findUnique({ where: { username: candidate } });
    if (!existing) {
      unique = true;
    } else {
      attempt++;
      candidate = `${username}${attempt}`;
    }
  }
  return candidate;
}

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

    let { email, password, name, username, bio, skills, interests, primaryIntent } = validationResult.data;

    // Check if user already exists by email
    const existingUserByEmail = await prisma.user.findUnique({ where: { email } });
    if (existingUserByEmail) {
      console.log('Register API: User already exists with email:', email);
      return NextResponse.json(
        { message: "User with this email already exists" },
        { status: 409 }
      );
    }

    // Auto-generate username if not provided
    if (!username) {
      if (name) {
        username = await generateUniqueUsername(name);
      } else {
        // Use email prefix if no name
        username = await generateUniqueUsername(email.split('@')[0]);
      }
    } else {
      // Ensure username is unique
      const existingUserByUsername = await prisma.user.findUnique({ where: { username } });
      if (existingUserByUsername) {
        console.log('Register API: Username already taken:', username);
        return NextResponse.json(
          { message: "Username is already taken" },
          { status: 409 }
        );
      }
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // Create new user with all the onboarding data
    const newUser = await prisma.user.create({
      data: {
        email,
        passwordHash,
        name: name || null,
        username,
        bio: bio || null,
        skills: skills || [],
        interests: interests || [],
        primaryIntent: primaryIntent || null,
      },
    });

    console.log('Register API: User registered successfully:', email);
    const { passwordHash: _, ...userWithoutPassword } = newUser;
    return NextResponse.json(userWithoutPassword, { status: 201 });

  } catch (error) {
    console.error('Register API: Internal server error:', error);
    return NextResponse.json(
      { message: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}
