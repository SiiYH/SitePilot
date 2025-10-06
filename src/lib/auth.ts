
'use client';

import {
  getAuth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
} from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp, FirestoreError } from 'firebase/firestore';
import { initializeFirebase, errorEmitter, FirestorePermissionError } from '@/firebase';
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
    if (!data.email) {
        console.error("Sign up error: Email is required.");
        return null;
    }
    
    try {
        const userCredential = await createUserWithEmailAndPassword(auth, data.email, data.password);
        const { user: firebaseUser } = userCredential;

        const newUser: Omit<User, 'id'> = {
            name: data.name,
            email: data.email,
            phone: data.phone,
            role: data.role,
            avatarUrl: `https://picsum.photos/seed/user${Date.now()}/200/200`,
            status: 'Active',
            createdAt: new Date().toISOString(), // Use ISO string for consistency
            history: [{ status: 'Active', date: new Date().toISOString() }],
        };
        
        const userDocRef = doc(firestore, 'users', firebaseUser.uid);

        setDoc(userDocRef, newUser).catch(error => {
            const permissionError = new FirestorePermissionError({
                path: userDocRef.path,
                operation: 'create',
                requestResourceData: newUser,
            });
            errorEmitter.emit('permission-error', permissionError);
        });
        
        return { id: firebaseUser.uid, ...newUser } as User;

    } catch (error: any) {
        // This will catch auth errors like 'email-already-in-use' but we won't log it to avoid console errors for expected behavior.
        return null;
    }
}

export async function createNewUser(data: CreateUserData): Promise<User | null> {
    if (!data.email || !data.password) {
        console.error("Create user error: Email and password are required.");
        return null;
    }

    try {
        const userCredential = await createUserWithEmailAndPassword(auth, data.email, data.password);
        const { user: firebaseUser } = userCredential;

        const newUser: Omit<User, 'id'> = {
            name: data.name,
            email: data.email,
            phone: data.phone,
            role: data.role,
            avatarUrl: `https://picsum.photos/seed/user${Date.now()}/200/200`,
            status: 'Active',
            createdAt: new Date().toISOString(),
            history: [{ status: 'Active', date: new Date().toISOString() }],
        };

        const userDocRef = doc(firestore, 'users', firebaseUser.uid);

        setDoc(userDocRef, newUser).catch(error => {
            const permissionError = new FirestorePermissionError({
                path: userDocRef.path,
                operation: 'create',
                requestResourceData: newUser,
            });
            errorEmitter.emit('permission-error', permissionError);
        });

        return { id: firebaseUser.uid, ...newUser } as User;

    } catch (error: any) {
        // This will catch auth errors like 'email-already-in-use' but we won't log it to avoid console errors for expected behavior.
        return null;
    }
}
