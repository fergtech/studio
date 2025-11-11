import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import crypto from 'crypto';

/**
 * Alternative password reset endpoint that returns the reset link directly
 * without sending email - useful when email service has restrictions
 */
export async function POST(req: NextRequest) {
  try {
    const { identifier } = await req.json(); // Can be email or username

    if (!identifier) {
      return NextResponse.json(
        { error: 'Email or username is required' },
        { status: 400 }
      );
    }

    // Find user by email or username
    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { email: identifier.toLowerCase() },
          { username: identifier.toLowerCase() },
        ],
      },
    });

    // For security, don't reveal if user exists
    if (!user) {
      return NextResponse.json({
        message: 'If an account exists, a reset link has been generated.',
        hasLink: false,
      });
    }

    // Check if user has a password (OAuth users don't)
    if (!user.passwordHash) {
      return NextResponse.json({
        message: 'This account uses social login (Google/Facebook). Please sign in with your social account.',
        hasLink: false,
      });
    }

    // Generate a secure random token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    // Delete any existing reset tokens for this email
    await prisma.passwordResetToken.deleteMany({
      where: { email: user.email },
    });

    // Create new reset token
    await prisma.passwordResetToken.create({
      data: {
        email: user.email,
        token: resetToken,
        expiresAt,
      },
    });

    // Return the reset link
    const resetUrl = `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/reset-password/${resetToken}`;

    return NextResponse.json({
      message: 'Reset link generated successfully',
      hasLink: true,
      resetUrl,
      expiresAt: expiresAt.toISOString(),
    });
  } catch (error) {
    console.error('Request password reset error:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}
