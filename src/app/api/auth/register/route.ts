import { NextRequest, NextResponse } from 'next/server';
import { mockUserStore } from '@/lib/mockUserStore';
import { z } from 'zod';

// Define validation schema for registration
const registerSchema = z.object({
  email: z.string().email({ message: "Invalid email address" }),
  password: z.string().min(6, { message: "Password must be at least 6 characters long" }),
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

    const { email, password } = validationResult.data;

    // Attempt to add user using the mock store
    const newUser = await mockUserStore.addUser(email, password);

    if (!newUser) {
      console.log('Register API: User already exists:', email);
      return NextResponse.json(
        { message: "User with this email already exists" },
        { status: 409 } // Conflict
      );
    }

    console.log('Register API: User registered successfully:', email);
    // Exclude password hash from the response
    const { passwordHash, ...userWithoutPassword } = newUser;
    return NextResponse.json(userWithoutPassword, { status: 201 }); // Created

  } catch (error) {
    console.error('Register API: Internal server error:', error);
    return NextResponse.json(
      { message: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}
