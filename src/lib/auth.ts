import { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import GoogleProvider from 'next-auth/providers/google';
import AppleProvider from 'next-auth/providers/apple';
import FacebookProvider from 'next-auth/providers/facebook';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';

export const authOptions: NextAuthOptions = {
  providers: [
    // Google OAuth
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
      authorization: {
        params: {
          prompt: "consent",
          access_type: "offline",
          response_type: "code"
        }
      }
    }),
    // Apple OAuth
    AppleProvider({
      clientId: process.env.APPLE_CLIENT_ID || '',
      clientSecret: process.env.APPLE_CLIENT_SECRET || '',
    }),
    // Facebook OAuth (supports both Facebook and Instagram login)
    FacebookProvider({
      clientId: process.env.FACEBOOK_CLIENT_ID || '',
      clientSecret: process.env.FACEBOOK_CLIENT_SECRET || '',
    }),
    // Email/Password Credentials
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: "Email", type: "email", placeholder: "test@example.com" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials, req) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error('Please enter an email and password');
        }

        try {
          const user = await prisma.user.findUnique({
            where: { email: credentials.email },
          });

          if (!user || !user.passwordHash) {
            throw new Error('Invalid email or password');
          }

          const isValid = await bcrypt.compare(
            credentials.password,
            user.passwordHash as string // passwordHash is nullable, but checked above
          );

          if (!isValid) {
            throw new Error('Invalid email or password');
          }

          return {
            id: user.id,
            name: user.name,
            email: user.email,
            image: user.image,
          };
        } catch (error) {
          console.error('Auth Error:', error);
          throw error;
        }
      }
    })
  ],
  callbacks: {
    async signIn({ user, account, profile }) {
      // For OAuth providers, create user in database if they don't exist
      if (account?.provider !== 'credentials' && user.email) {
        try {
          // Generate unique username from email or name
          const baseUsername = user.name
            ? user.name.toLowerCase().replace(/[^a-z0-9]/g, '')
            : user.email.split('@')[0].toLowerCase().replace(/[^a-z0-9]/g, '');

          let username = baseUsername || `user${Math.floor(Math.random() * 10000)}`;
          if (username.length < 3) username = `user${Math.floor(Math.random() * 10000)}`;

          // Check if user exists
          let existingUser = await prisma.user.findUnique({
            where: { email: user.email },
          });

          if (!existingUser) {
            // Find unique username
            let attempt = 0;
            let candidateUsername = username;
            while (true) {
              const usernameExists = await prisma.user.findUnique({
                where: { username: candidateUsername },
              });
              if (!usernameExists) break;
              attempt++;
              candidateUsername = `${username}${attempt}`;
            }

            // Create new OAuth user
            existingUser = await prisma.user.create({
              data: {
                email: user.email,
                name: user.name || null,
                image: user.image || null,
                username: candidateUsername,
                passwordHash: null, // OAuth users don't have passwords
              },
            });

            if (account) {
              console.log(`Created new OAuth user: ${existingUser.email} (${account.provider})`);
            } else {
              console.log(`Created new OAuth user: ${existingUser.email}`);
            }
          }

          // Update user ID for JWT
          user.id = existingUser.id;

          return true;
        } catch (error) {
          console.error('OAuth sign-in error:', error);
          return false;
        }
      }

      return true;
    },
    async jwt({ token, user, account }) {
      if (user) {
        token.id = user.id;
        token.image = user.image;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id = token.id;
        (session.user as any).image = token.image;
        if (process.env.NODE_ENV === 'development') {
          console.log('Session user:', session.user);
        }
      } else {
        if (process.env.NODE_ENV === 'development') {
          console.warn('Session user is undefined');
        }
      }
      return session;
    },
  },
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  pages: {
    signIn: '/login',
    error: '/auth/error',
  },
  debug: process.env.NODE_ENV === 'development' && process.env.NEXTAUTH_DEBUG === 'true',
};
