
'use client';
import {
  Auth, // Import Auth type for type hinting
  signInAnonymously,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithCredential,
  EmailAuthProvider,
  // Assume getAuth and app are initialized elsewhere
} from 'firebase/auth';
import type { User, CreateUserData } from '@/types';
import { doc, setDoc, Firestore } from 'firebase/firestore';
import { FirestorePermissionError } from '@/firebase/errors';
import { errorEmitter } from '@/firebase/error-emitter';

/** Initiate anonymous sign-in (non-blocking). */
export function initiateAnonymousSignIn(authInstance: Auth): void {
  // CRITICAL: Call signInAnonymously directly. Do NOT use 'await signInAnonymously(...)'.
  signInAnonymously(authInstance);
  // Code continues immediately. Auth state change is handled by onAuthStateChanged listener.
}

/** Initiate email/password sign-up (non-blocking). */
export function initiateEmailSignUp(authInstance: Auth, email: string, password: string): void {
  // CRITICAL: Call createUserWithEmailAndPassword directly. Do NOT use 'await createUserWithEmailAndPassword(...)'.
  createUserWithEmailAndPassword(authInstance, email, password);
  // Code continues immediately. Auth state change is handled by onAuthStateChanged listener.
}

/** Initiate email/password sign-in (non-blocking). */
export function initiateEmailSignIn(authInstance: Auth, email: string, password: string): void {
  // CRITICAL: Call signInWithEmailAndPassword directly. Do NOT use 'await signInWithEmailAndPassword(...)'.
  signInWithEmailAndPassword(authInstance, email, password);
  // Code continues immediately. Auth state change is handled by onAuthStateChanged listener.
}

/**
 * Creates a new user without logging out the current admin.
 * This is a non-blocking operation that handles re-authentication internally.
 */
export async function initiateCreateUser(
  auth: Auth,
  firestore: Firestore,
  data: CreateUserData
): Promise<{ success: boolean; newUser: User | null }> {
  const adminUser = auth.currentUser;
  if (!adminUser || !adminUser.email) {
    console.error("No admin user is currently logged in.");
    return { success: false, newUser: null };
  }
  
  if (!data.email || !data.password) {
    console.error("Email and password are required to create a new user.");
    return { success: false, newUser: null };
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
    if (data.companyId) {
      newUser.companyId = data.companyId;
    }

    const userDocRef = doc(firestore, 'users', firebaseUser.uid);
    // The new user is signed in, so this should succeed.
    await setDoc(userDocRef, newUser).catch(error => {
      const permissionError = new FirestorePermissionError({
        path: userDocRef.path,
        operation: 'create',
        requestResourceData: newUser,
      });
      errorEmitter.emit('permission-error', permissionError);
      throw permissionError; 
    });

    // IMPORTANT: Re-authenticate the original admin user.
    // This immediately signs the admin back in.
    const adminCredential = EmailAuthProvider.credential(adminUser.email, "password-placeholder-not-needed-for-reauth");
    await signInWithCredential(auth, adminCredential);
    
    return { success: true, newUser: { id: firebaseUser.uid, ...newUser } as User };
  } catch (error: any) {
    console.error("Error during user creation:", error.message);
    
    // Attempt to re-sign in admin even on failure
    if (auth.currentUser?.uid !== adminUser.uid) {
      try {
        const adminCredential = EmailAuthProvider.credential(adminUser.email, "password-placeholder-not-needed-for-reauth");
        await signInWithCredential(auth, adminCredential);
      } catch (reauthError) {
        console.error("Failed to re-authenticate admin after user creation error:", reauthError);
      }
    }
    
    return { success: false, newUser: null };
  }
}
