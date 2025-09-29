

import { mockUsers } from '@/lib/data';
import type { User, UserRole } from '@/types';

// This is a simplified mock authentication system.
// In a real application, you would replace this with a secure authentication provider.

export type EmailCredentials = {
  email: string;
  password?: string;
};

export type PhoneCredentials = {
  phone: string;
  password?: string;
};

export type UserCredentials = EmailCredentials | PhoneCredentials;

export type SignUpData = {
    name: string;
    email?: string;
    phone?: string;
    password?: string;
    role: UserRole;
};

export type CreateUserData = {
    name: string;
    email?: string;
    phone?: string;
    password?: string;
    role: UserRole;
};


// --- Mock Database Operations ---

// In a real app, these would be database calls. For now, we'll just use the mockUsers array.

async function findUser(credentials: UserCredentials): Promise<User | undefined> {
  if ('email' in credentials) {
    return mockUsers.find(user => user.email === credentials.email);
  }
  if ('phone' in credentials) {
    return mockUsers.find(user => user.phone === credentials.phone);
  }
  return undefined;
}

async function createUser(data: SignUpData | CreateUserData): Promise<User | null> {
    const existingUser = data.email 
        ? mockUsers.find(u => u.email === data.email) 
        : (data.phone ? mockUsers.find(u => u.phone === data.phone) : undefined);
    
    if (existingUser) {
        return null; // User already exists
    }

    const newUser: User = {
        id: `user-${mockUsers.length + 1}`,
        name: data.name,
        email: data.email,
        phone: data.phone,
        role: data.role,
        avatarUrl: `https://picsum.photos/seed/user${mockUsers.length + 1}/200/200`,
        status: 'Active',
    };
    
    mockUsers.push(newUser);
    return newUser;
}


// --- Exported Authentication Functions ---

export async function loginWithEmail(credentials: EmailCredentials): Promise<User | null> {
  console.log('Attempting login with email:', credentials.email);
  // In a real app, you would also verify the password.
  const user = await findUser(credentials);
  if (user && user.status === 'Inactive') return null; // Prevent inactive user login
  return user || null;
}

export async function loginWithPhone(credentials: PhoneCredentials): Promise<User | null> {
  console.log('Attempting login with phone:', credentials.phone);
  // In a real app, you would also verify the password.
  const user = await findUser(credentials);
  if (user && user.status === 'Inactive') return null; // Prevent inactive user login
  return user || null;
}

export async function signup(data: SignUpData): Promise<User | null> {
    console.log('Attempting signup for:', data.name);
    return await createUser(data);
}

export async function createNewUser(data: CreateUserData): Promise<User | null> {
    console.log('Admin/Director creating user:', data.name);
    return await createUser(data);
}
