import 'next-auth';
import 'next-auth/jwt';

declare module 'next-auth' {
  /**
   * Returned by `useSession`, `getSession` and received as a prop on the `SessionProvider` React Context
   */
  interface Session {
    user: {
      /** The user's database id. */
      id: string;
    } & DefaultSession['user']; // Keep the default properties like name, email, image
  }

  /**
   * The shape of the user object returned in the OAuth providers' `profile` callback,
   * or the second parameter of the `session` callback, when using a database.
   * It is also the type of the `user` object returned from the `authorize` callback.
   */
  interface User {
    /** The user's database id. */
    id: string;
  }
}

declare module 'next-auth/jwt' {
  /** Returned by the `jwt` callback and sent to the `session` callback */
  interface JWT {
    /** User ID */
    id?: string;
    // You can add other properties to the JWT token here if needed
  }
}
