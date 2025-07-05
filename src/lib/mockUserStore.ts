import bcrypt from 'bcryptjs';
import { User } from './types'; // Assuming User type might be defined here or elsewhere

// Define a basic User type for the mock store if not already defined
interface MockUser extends User {
  passwordHash: string;
  dateCreated: Date;
}

// In-memory store
const users: MockUser[] = [];
const saltRounds = 10; // Cost factor for bcrypt hashing

export const mockUserStore = {
  async findByEmail(email: string): Promise<MockUser | undefined> {
    console.log('Mock Store: Searching for email:', email);
    const user = users.find((user) => user.email === email);
    console.log('Mock Store: Found user:', user ? user.email : 'None');
    return user;
  },

  async addUser(email: string, password: string): Promise<MockUser | null> {
    console.log('Mock Store: Attempting to add email:', email);
    const existingUser = await this.findByEmail(email);
    if (existingUser) {
      console.log('Mock Store: Email already exists:', email);
      return null; // User already exists
    }

    const passwordHash = await bcrypt.hash(password, saltRounds);
    const newUser: MockUser = {
      id: crypto.randomUUID(), // Generate a simple unique ID
      email,
      passwordHash,
      dateCreated: new Date(),
      // Add other default fields from your User type if necessary
      name: email.split('@')[0], // Example default name
      image: '', // Example default image
    };
    users.push(newUser);
    console.log('Mock Store: User added:', newUser.email, 'Total users:', users.length);
    console.log('Mock Store Current Users:', users.map(u => u.email)); // Log current users for debugging
    return newUser;
  },

  async verifyPassword(password: string, hash: string): Promise<boolean> {
    console.log('Mock Store: Verifying password');
    const isMatch = await bcrypt.compare(password, hash);
    console.log('Mock Store: Password match result:', isMatch);
    return isMatch;
  },

  // Helper to see current users (for debugging)
  getAllUsers(): MockUser[] {
    return [...users];
  }
};
