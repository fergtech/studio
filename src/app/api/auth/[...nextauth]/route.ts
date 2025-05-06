import NextAuth, { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { mockUserStore } from '@/lib/mockUserStore';
import { User } from '@/lib/types'; // Ensure this path is correct

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: "Email", type: "email", placeholder: "test@example.com" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials, req) {
        console.log('Auth: Authorize function started.'); // Added log
        try { // Added top-level try block
          if (!credentials?.email || !credentials?.password) {
            console.error('Auth Error: Missing credentials');
            return null;
          }

          console.log('Auth: Attempting authorization for:', credentials.email);
          const user = await mockUserStore.findByEmail(credentials.email);

          if (user) {
            console.log('Auth: User found:', user.email);
            // Verify password
            const isValid = await mockUserStore.verifyPassword(
              credentials.password,
              user.passwordHash
            );

            if (isValid) {
              console.log('Auth: Password valid for:', user.email);
              // Return user object that NextAuth understands for session/JWT
              // Exclude passwordHash from the object returned to the client/session
              return {
                id: user.id,
                name: user.name,
                email: user.email,
                image: user.image,
              };
            } else {
              console.log('Auth Error: Invalid password for:', user.email);
              // Password invalid, return null
              return null;
            }
          } else {
            console.log('Auth Error: User not found:', credentials.email);
            // User not found, return null
            return null;
          }
        } catch (error) { // Added catch block
          console.error('Auth Error: Uncaught exception in authorize function:', error);
          // Return null on any unexpected error
          return null;
        }
      }
    })
  ],
  session: {
    strategy: 'jwt', // Use JWT for session management
  },
  callbacks: {
    async jwt({ token, user }) {
      // Persist the user id and other details from 'authorize' to the token
      if (user) {
        token.id = user.id;
        // Add any other user properties you want in the token
        // token.customProperty = user.customProperty;
      }
      return token;
    },
    async session({ session, token }) {
      // Send properties to the client, like user id from the token
      if (session.user && token.id) {
        // Ensure session.user is defined before assigning properties
        // The default User type in next-auth might not have id, so we cast or extend
        (session.user as any).id = token.id;
        // Add any other properties from the token to the session user object
        // (session.user as any).customProperty = token.customProperty;
      }
      return session;
    },
  },
  pages: {
    signIn: '/login', // Redirect users to /login page for signing in
    // error: '/auth/error', // Optional: Custom error page
    // signOut: '/auth/signout', // Optional: Custom signout page
  },
  // Add secret for production environments
  secret: process.env.NEXTAUTH_SECRET || 'fallback-secret-for-dev', // Use environment variable
};

// Remove the default export:
// export default NextAuth(authOptions);

// Add named exports for GET and POST:
const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
