import { connectToDatabase } from './db';
import { UserModel } from '@/models/User';

interface StoredUser {
  id: string;
  email: string;
  name: string;
  password: string;
  createdAt: string;
}

// In-memory fallback store when MongoDB is unavailable
const inMemoryUsers: StoredUser[] = [];

export async function getUser(email: string): Promise<StoredUser | null> {
  const normalizedEmail = email.toLowerCase().trim();
  const { connected } = await connectToDatabase();

  if (!connected) {
    // Fallback to in-memory store
    const user = inMemoryUsers.find((u) => u.email === normalizedEmail);
    return user || null;
  }

  const user = await UserModel.findOne({ email: normalizedEmail }).lean();
  if (!user) return null;

  return {
    id: (user as any)._id.toString(),
    email: (user as any).email,
    name: (user as any).name,
    password: (user as any).password,
    createdAt: (user as any).createdAt?.toISOString?.() || new Date().toISOString(),
  };
}

export async function addUser(email: string, name: string, password: string): Promise<StoredUser> {
  const normalizedEmail = email.toLowerCase().trim();
  const { connected } = await connectToDatabase();

  if (!connected) {
    // Fallback to in-memory store
    const existing = inMemoryUsers.find((u) => u.email === normalizedEmail);
    if (existing) {
      throw new Error('User already exists');
    }

    const newUser: StoredUser = {
      id: `mem_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
      email: normalizedEmail,
      name,
      password,
      createdAt: new Date().toISOString(),
    };

    inMemoryUsers.push(newUser);
    console.warn('⚠️ [AUTH-STORAGE] User stored in-memory (MongoDB unavailable):', normalizedEmail);
    return newUser;
  }

  // Check if user already exists
  const existing = await UserModel.findOne({ email: normalizedEmail });
  if (existing) {
    throw new Error('User already exists');
  }

  const newUser = await UserModel.create({
    email: normalizedEmail,
    name,
    password,
  });

  return {
    id: newUser._id.toString(),
    email: newUser.email,
    name: newUser.name,
    password: newUser.password,
    createdAt: newUser.createdAt?.toISOString?.() || new Date().toISOString(),
  };
}

export async function getAllUsers(): Promise<StoredUser[]> {
  const { connected } = await connectToDatabase();

  if (!connected) {
    // Fallback to in-memory store
    return [...inMemoryUsers];
  }

  const users = await UserModel.find({}).lean();
  return (users as any[]).map((u: any) => ({
    id: u._id.toString(),
    email: u.email,
    name: u.name,
    password: u.password,
    createdAt: u.createdAt?.toISOString?.() || new Date().toISOString(),
  }));
}

export async function clearAllUsers() {
  const { connected } = await connectToDatabase();

  if (!connected) {
    // Clear in-memory store and add default test user
    inMemoryUsers.length = 0;
    inMemoryUsers.push({
      id: `mem_default`,
      email: 'test@example.com',
      name: 'Test User',
      password: 'password123',
      createdAt: new Date().toISOString(),
    });
    return;
  }

  // Delete all users except the test user
  await UserModel.deleteMany({});

  // Re-create the default test user
  await UserModel.create({
    email: 'test@example.com',
    name: 'Test User',
    password: 'password123',
  });
}
