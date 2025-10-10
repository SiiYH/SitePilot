
'use client';

import { createContext, useState, useEffect, ReactNode, Dispatch, SetStateAction } from 'react';
import { useRouter } from 'next/navigation';
import type { User as AuthUser } from 'firebase/auth';
import { doc, getDoc, FirestoreError } from 'firebase/firestore';
import type { User, UserRole } from '@/types';
import { login, createNewUser, CreateUserData, UserCredentials, SignUpData } from '@/lib/auth';
import { mockUsers } from '@/lib/data';
import { useAuth as useFirebaseAuth, useFirestore, initializeFirebase, errorEmitter, FirestorePermissionError } from '@/firebase';
import { createUserWithEmailAndPassword, getAuth, signInWithCredential } from 'firebase/auth';
import { License } from '@/app/dashboard/system-admin/_components/LicenseGenerator';


interface AuthContextType {
  user: User | null;
  setUser: Dispatch<SetStateAction<User | null>>;
  loading: boolean;
  login: (credentials: UserCredentials) => Promise<User | null>;
  signUp: (data: SignUpData) => Promise<User | null>;
  logout: () => void;
  createUser: (data: CreateUserData) => Promise<User | null>;
  licenseUsage: Record<UserRole, number>;
  licenseLimits: Record<UserRole, number>;
  company: any; // Consider creating a Company type
  setCompany: Dispatch<SetStateAction<any>>;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

const defaultLimits: Record<UserRole, number> = {
  'System Super Admin': 1,
  Admin: 1,
  Director: 1,
  Engineer: 2,
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [company, setCompany] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [licenseLimits, setLicenseLimits] = useState<Record<UserRole, number>>(defaultLimits);
  const router = useRouter();
  const auth = useFirebaseAuth();
  const firestore = useFirestore();

  useEffect(() => {
    const seedUsers = async () => {
        // Use the auth instance from the provider context
        for (const mockUser of mockUsers) {
            if (mockUser.email) {
                try {
                    // This is a temporary solution to seed users.
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
    if (localStorage.getItem('sitepilot-users-seeded') !== 'true' && auth) {
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
              const userData = { id: userDoc.id, ...userDoc.data() } as User;
              setUser(userData);
              if (userData.companyId) {
                const companyDocRef = doc(firestore, 'companies', userData.companyId);
                const companyDoc = await getDoc(companyDocRef);
                if (companyDoc.exists()) {
                  const companyData = { id: companyDoc.id, ...companyDoc.data() };
                  setCompany(companyData);
                  
                  // Load license limits
                  if (companyData.activated && companyData.licenseKey) {
                    const storedLicenses = localStorage.getItem('sitepilot-licenses');
                    if (storedLicenses) {
                        const licenses: License[] = JSON.parse(storedLicenses);
                        const activeLicense = licenses.find(lic => lic.key === companyData.licenseKey);
                        if (activeLicense) {
                            setLicenseLimits({
                                'System Super Admin': 1, // System admin is not governed by license
                                Admin: activeLicense.maxAdmins,
                                Director: activeLicense.maxDirectors,
                                Engineer: activeLicense.maxEngineers,
                            });
                        } else {
                           setLicenseLimits(defaultLimits); // Fallback if key is invalid
                        }
                    } else {
                       setLicenseLimits(defaultLimits); // Fallback if no licenses stored
                    }
                  } else {
                    setLicenseLimits(defaultLimits); // Fallback if not activated
                  }

                } else {
                  setCompany(null);
                }
              } else {
                setCompany(null);
                setLicenseLimits(defaultLimits);
              }
            } else {
              // This case might happen if a user is in Auth but not in Firestore.
              // For this app's logic, we sign them out.
              await auth.signOut();
              setUser(null);
              setCompany(null);
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
            setCompany(null);
        }
      } else {
        // User is signed out.
        setUser(null);
        setCompany(null);
        setLicenseLimits(defaultLimits);
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
          industryCode: "F",
          industryDescription: "CONSTRUCTION",
          description: "A sample company for the default users to demonstrate SitePilot's features.",
          activated: true,
          licenseKey: 'U1AtVkFMSUQtU0lURVBILURFTE8tQ09OU1RSVUNUSU9OLUQyLUEyLUU1LUVYUDIwMjUwNzI4LTE3MjIxNjEyMjkxMjM=',
        },
        {
          id: 'company-456',
          name: "Innovate Builders",
          industryCode: "F",
          industryDescription: "CONSTRUCTION",
          description: "Pioneering the future of modular construction.",
          activated: false,
          licenseKey: null,
        },
        {
          id: 'company-789',
          name: "Heritage Restorations",
          industryCode: "M",
          industryDescription: "PROFESSIONAL, SCIENTIFIC AND TECHNICAL ACTIVITIES",
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
    'Admin': mockUsers.filter(u => u.role === 'Admin' && u.status === 'Active' && u.companyId === company?.id).length,
    'Director': mockUsers.filter(u => u.role === 'Director' && u.status === 'Active' && u.companyId === company?.id).length,
    'Engineer': mockUsers.filter(u => u.role === 'Engineer' && u.status === 'Active' && u.companyId === company?.id).length,
  };

  const handleLogin = async (credentials: UserCredentials): Promise<User | null> => {
    setLoading(true);
    const loggedInUser = await login(credentials);
    if (loggedInUser) {
      // setUser is handled by onAuthStateChanged
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
    // We pass the currently active company's ID to the signup function
    const companyId = company?.id;
    const newUser = await createNewUser({ ...data, companyId });
    if (newUser) {
      router.push('/welcome');
    }
    setLoading(false);
    return newUser;
  }
  
  const handleCreateUser = async (data: CreateUserData): Promise<User | null> => {
    const creatingUser = auth.currentUser;
    if (!creatingUser) {
        return null;
    }

    setLoading(true);
    if (licenseUsage[data.role] >= licenseLimits[data.role]) {
       setLoading(false);
       return null;
    }
    const newUser = await createNewUser(data);
    
    // After creating the user, Firebase automatically signs in the new user.
    // We must now sign the original admin/director back in.
    await auth.updateCurrentUser(creatingUser);
    
    if (newUser) {
        mockUsers.push(newUser); // Keep mock data in sync
    }
    
    setLoading(false);
    return newUser;
  };

  const handleLogout = async () => {
    await auth.signOut();
    // setUser and setCompany are handled by onAuthStateChanged
    router.push('/login');
  };

  const value = {
    user,
    setUser,
    company,
    setCompany,
    loading,
    login: handleLogin,
    signUp: handleSignUp,
    logout: handleLogout,
    createUser: handleCreateUser,
    licenseUsage,
    licenseLimits,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
