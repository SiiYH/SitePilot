
'use client';

import {
  getAuth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
} from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp, FirestoreError, updateDoc } from 'firebase/firestore';
import { initializeFirebase, errorEmitter, FirestorePermissionError } from '@/firebase';
import type { User, UserRole, UserStatus } from '@/types';

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
    role: UserRole;
    name: string;
    email?: string;
    phone?: string;
    password: string;
    companyId?: string;
};

export type CreateUserData = {
    name: string;
    email?: string;
    phone?: string;
    password?: string;
    role: UserRole;
    companyId?: string;
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
  } catch (error: any) {
    if (error.code === 'auth/invalid-credential') {
      // This specific error is for wrong email/password. We can re-throw it.
      throw new Error('Invalid email or password.');
    }
    console.error("Login error:", error);
    // For other errors, return null to indicate a generic failure.
    return null;
  }
}

export async function signUp(data: SignUpData): Promise<User | null> {
    if (!data.email) {
        return null;
    }
    
    try {
        const userCredential = await createUserWithEmailAndPassword(auth, data.email, data.password);
        const { user: firebaseUser } = userCredential;

        const newUser: Omit<User, 'id'> = {
            name: data.name,
            email: data.email,
            phone: data.phone,
            role: '', // Role is blank on sign up
            avatarUrl: `https://picsum.photos/seed/user${Date.now()}/200/200`,
            status: 'Active',
            createdAt: new Date().toISOString(), // Use ISO string for consistency
            history: [{ status: 'Active', date: new Date().toISOString() }],
        };

        if (data.companyId) {
            newUser.companyId = data.companyId;
        }
        
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
        // This will catch auth errors like 'email-already-in-use'
        if (error.code === 'auth/email-already-in-use') {
          return null;
        }
        // For other errors, re-throw them to be caught by a higher-level error handler
        // or to be visible in the console for debugging, which is better than failing silently.
        throw error;
    }
}


export async function updateUserCompany(userId: string, companyId: string): Promise<void> {
    const userDocRef = doc(firestore, 'users', userId);
    await updateDoc(userDocRef, { companyId });
}
