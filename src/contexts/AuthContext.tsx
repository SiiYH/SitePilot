
'use client';

import { createContext, useState, useEffect, ReactNode, Dispatch, SetStateAction } from 'react';
import { useRouter } from 'next/navigation';
import type { User as AuthUser } from 'firebase/auth';
import { doc, getDoc, FirestoreError } from 'firebase/firestore';
import type { User, UserRole } from '@/types';
import { login, signUp, createNewUser, CreateUserData, UserCredentials, SignUpData } from '@/lib/auth';
import { licenseLimits } from '@/lib/license';
import { mockUsers } from '@/lib/data';
import { useAuth as useFirebaseAuth, useFirestore, initializeFirebase, errorEmitter, FirestorePermissionError } from '@/firebase';
import { createUserWithEmailAndPassword, getAuth } from 'firebase/auth';


interface AuthContextType {
  user: User | null;
  setUser: Dispatch<SetStateAction<User | null>>;
  loading: boolean;
  login: (credentials: UserCredentials) => Promise<User | null>;
  signUp: (data: SignUpData) => Promise<User | null>;
  logout: () => void;
  updateUser: (data: User) => void;
  createUser: (data: CreateUserData) => Promise<User | null>;
  licenseUsage: Record<UserRole, number>;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const auth = useFirebaseAuth();
  const firestore = useFirestore();

  useEffect(() => {
    const seedUsers = async () => {
        const auth = getAuth();
        for (const mockUser of mockUsers) {
            if (mockUser.email) {
                try {
                    // This is a temporary solution to seed users.
                    // In a real app, you wouldn't use this logic.
                    // It attempts to create users, and fails silently if they exist.
                    await createUserWithEmailAndPassword(auth, mockUser.email, 'password');
                    console.log(`Created user: ${mockUser.email}`);
                } catch (error: any) {
                    if (error.code !== 'auth/email-already-in-use') {
                        console.error(`Error creating user ${mockUser.email}:`, error);
                    }
                }
            }
        }
    };
    
    // This is a one-off seeding process.
    if (localStorage.getItem('sitepilot-users-seeded') !== 'true') {
        seedUsers().then(() => {
            localStorage.setItem('sitepilot-users-seeded', 'true');
        });
    }

    const unsubscribe = auth.onAuthStateChanged(async (firebaseUser: AuthUser | null) => {
      if (firebaseUser) {
        // User is signed in, fetch profile.
        const userDocRef = doc(firestore, 'users', firebaseUser.uid);
        try {
            const userDoc = await getDoc(userDocRef);
            if (userDoc.exists()) {
              setUser({ id: userDoc.id, ...userDoc.data() } as User);
            } else {
              // This case might happen if a user is in Auth but not in Firestore.
              // For this app's logic, we sign them out.
              await auth.signOut();
              setUser(null);
            }
        } catch (e: any) {
            // Check if it is a Firestore permission error
             if (e instanceof FirestoreError && e.code === 'permission-denied') {
                const permissionError = new FirestorePermissionError({
                  path: userDocRef.path,
                  operation: 'get',
                });
                errorEmitter.emit('permission-error', permissionError);
            } else {
                // For other errors, you might want to handle them differently
                console.error("Error fetching user document:", e);
            }
            // Sign out the user if their document can't be fetched
            await auth.signOut();
            setUser(null);
        }
      } else {
        // User is signed out.
        setUser(null);
      }
      setLoading(false);
    });

    // Seed sample companies for Company Management
    const allCompaniesString = localStorage.getItem('sitepilot-all-companies');
    if (!allCompaniesString) {
      const sampleCompanies = [
        {
          id: 'company-demo-123',
          name: "SitePilot Demo Construction",
          industry: "(F) CONSTRUCTION",
          description: "A sample company for the default users to demonstrate SitePilot's features.",
          activated: true,
          licenseKey: 'U1AtVkFMSUQtU0lURVBILURFTE8tQ09OU1RSVUNUSU9OLUQyLUEyLUU1LUVYUDIwMjUwNzI4LTE3MjIxNjEyMjkxMjM=',
        },
        {
          id: 'company-456',
          name: "Innovate Builders",
          industry: "(F) CONSTRUCTION",
          description: "Pioneering the future of modular construction.",
          activated: false,
          licenseKey: null,
        },
        {
          id: 'company-789',
          name: "Heritage Restorations",
          industry: "(M) PROFESSIONAL, SCIENTIFIC AND TECHNICAL ACTIVITIES",
          description: "Specializing in the restoration of historical buildings.",
          activated: true,
          licenseKey: 'U1AtVkFMSUQtSEVSSVRBR0UtUkVTVE9SQVRJT05TLUQxLUEyLUUxMC1FWFBVTkxJTUlURUQtMTcyMjE2MTQyODg4MA==',
        }
      ];

       const sampleLicenses = [
        {
          key: 'U1AtVkFMSUQtU0lURVBILURFTE8tQ09OU1RSVUNUSU9OLUQyLUEyLUU1LUVYUDIwMjUwNzI4LTE3MjIxNjEyMjkxMjM=',
          purchaser: 'SitePilot Demo Construction',
          maxDirectors: 2,
          maxAdmins: 2,
          maxEngineers: 5,
          expiresAt: '2025-07-28T00:00:00.000Z',
          createdAt: '2024-07-28T16:07:09.123Z',
          activatedAt: '2024-07-28T16:07:09.123Z',
          companyId: 'company-demo-123',
        },
        {
          key: 'U1AtVkFMSUQtSEVSSVRBR0UtUkVTVE9SQVRJT05TLUQxLUEyLUUxMC1FWFBVTkxJTUlURUQtMTcyMjE2MTQyODg4MA==',
          purchaser: 'Heritage Restorations',
          maxDirectors: 1,
          maxAdmins: 2,
          maxEngineers: 10,
          expiresAt: 'Unlimited',
          createdAt: '2024-07-28T16:10:28.880Z',
          activatedAt: '2024-07-28T16:10:28.880Z',
          companyId: 'company-789'
        }
      ];

      localStorage.setItem('sitepilot-all-companies', JSON.stringify(sampleCompanies));
      localStorage.setItem('sitepilot-licenses', JSON.stringify(sampleLicenses));
    }
    
    return () => unsubscribe();
  }, [auth, firestore]);
  
  const licenseUsage = {
    'System Super Admin': mockUsers.filter(u => u.role === 'System Super Admin' && u.status === 'Active').length,
    'Admin': mockUsers.filter(u => u.role === 'Admin' && u.status === 'Active').length,
    'Director': mockUsers.filter(u => u.role === 'Director' && u.status === 'Active').length,
    'Engineer': mockUsers.filter(u => u.role === 'Engineer' && u.status === 'Active').length,
  };

  const handleLogin = async (credentials: UserCredentials): Promise<User | null> => {
    setLoading(true);
    const loggedInUser = await login(credentials);
    if (loggedInUser) {
      setUser(loggedInUser);
      router.push('/dashboard');
    }
    setLoading(false);
    return loggedInUser;
  };

  const handleSignUp = async (data: SignUpData): Promise<User | null> => {
    setLoading(true);
    if (licenseUsage[data.role] >= licenseLimits[data.role]) {
      setLoading(false);
      return null;
    }
    const newUser = await signUp(data);
    if (newUser) {
      router.push('/welcome');
    }
    setLoading(false);
    return newUser;
  }
  
  const handleCreateUser = async (data: CreateUserData): Promise<User | null> => {
    setLoading(true);
    if (licenseUsage[data.role] >= licenseLimits[data.role]) {
       setLoading(false);
       return null;
    }
    const newUser = await createNewUser(data);
    setLoading(false);
    return newUser;
  };

  const handleLogout = async () => {
    await auth.signOut();
    setUser(null);
    localStorage.removeItem('sitepilot-company');
    router.push('/login');
  };

  const handleUpdateUser = (data: User) => {
    setUser(data);
  };


  const value = {
    user,
    setUser,
    loading,
    login: handleLogin,
    signUp: handleSignUp,
    logout: handleLogout,
    updateUser: handleUpdateUser,
    createUser: handleCreateUser,
    licenseUsage,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
