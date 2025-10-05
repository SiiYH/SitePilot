
import {
  getAuth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithCustomToken,
} from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { initializeFirebase } from '@/firebase';
import type { User, UserRole, UserStatus } from '@/types';
import { mockUsers } from '@/lib/data'; // Keep for user profile creation logic

export type EmailCredentials = {
  email: string;
  password: string;
};

export type PhoneCredentials = {
  phone: string;
  password: string; // Password is used for phone for now, can be adapted for OTP
};

export type UserCredentials = EmailCredentials | PhoneCredentials;

export type SignUpData = {
    name: string;
    email?: string;
    phone?: string;
    password: string;
    role: UserRole;
};

export type CreateUserData = {
    name: string;
    email?: string;
    phone?: string;
    password?: string;
    role: UserRole;
};

const { firestore } = initializeFirebase();
const auth = getAuth();

export async function login(credentials: UserCredentials): Promise<User | null> {
  try {
    if ('email' in credentials) {
      const userCredential = await signInWithEmailAndPassword(auth, credentials.email, credentials.password);
      const userDoc = await getDoc(doc(firestore, 'users', userCredential.user.uid));
      if (userDoc.exists() && userDoc.data().status === 'Active') {
        return { id: userDoc.id, ...userDoc.data() } as User;
      }
    }
    // Phone login logic can be added here if using Firebase phone auth
    return null;
  } catch (error) {
    console.error("Login error:", error);
    return null;
  }
}

export async function signUp(data: SignUpData): Promise<User | null> {
  try {
    if (!data.email) throw new Error("Email is required for sign up.");
    
    const userCredential = await createUserWithEmailAndPassword(auth, data.email, data.password);
    const { user: firebaseUser } = userCredential;

    const newUser: Omit<User, 'id'> = {
      name: data.name,
      email: data.email,
      phone: data.phone,
      role: data.role,
      avatarUrl: `https://picsum.photos/seed/user${Date.now()}/200/200`,
      status: 'Active',
      createdAt: serverTimestamp(),
      history: [{ status: 'Active', date: new Date().toISOString() }],
    };

    await setDoc(doc(firestore, "users", firebaseUser.uid), newUser);
    
    return { id: firebaseUser.uid, ...newUser } as User;

  } catch (error) {
    console.error("Sign up error:", error);
    return null;
  }
}

export async function createNewUser(data: CreateUserData): Promise<User | null> {
    try {
        if (!data.email || !data.password) throw new Error("Email and password are required to create a user.");
        
        // This is a temporary admin-like action and is not secure for production.
        // In a real app, this would be a Cloud Function.
        const userCredential = await createUserWithEmailAndPassword(auth, data.email, data.password);
        const { user: firebaseUser } = userCredential;

        const newUser: Omit<User, 'id'> = {
            name: data.name,
            email: data.email,
            phone: data.phone,
            role: data.role,
            avatarUrl: `https://picsum.photos/seed/user${Date.now()}/200/200`,
            status: 'Active',
            createdAt: serverTimestamp(),
            history: [{ status: 'Active', date: new Date().toISOString() }],
        };

        await setDoc(doc(firestore, "users", firebaseUser.uid), newUser);

        return { id: firebaseUser.uid, ...newUser } as User;
    } catch (error) {
        console.error("Create user error:", error);
        return null;
    }
}
