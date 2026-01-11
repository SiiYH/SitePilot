'use client';

import { createContext, useState, useEffect, ReactNode, Dispatch, SetStateAction } from 'react';
import { useRouter } from 'next/navigation';
import type { User as AuthUser } from 'firebase/auth';
import { doc, getDoc, FirestoreError, collection, query, getDocs, where, setDoc, onSnapshot, Unsubscribe, updateDoc } from 'firebase/firestore';
import type { Company, User, UserRole, CreateUserData } from '@/types';
import { login, UserCredentials, SignUpData, signUp } from '@/lib/auth';
import { useAuth as useFirebaseAuth, useFirestore, initializeFirebase, errorEmitter, FirestorePermissionError } from '@/firebase';
import { createUserWithEmailAndPassword, getAuth, signInWithCredential } from 'firebase/auth';
import { License } from '@/app/dashboard/system-admin/_components/LicenseGenerator';
import { initializeApp, deleteApp } from 'firebase/app';
import { firebaseConfig } from '@/firebase/client';

interface AuthContextType {
  user: User | null;
  setUser: Dispatch<SetStateAction<User | null>>;
  loading: boolean;
  login: (credentials: UserCredentials) => Promise<{ user: User | null; error?: string }>;
  signUp: (data: SignUpData) => Promise<User | null>;
  logout: () => void;
  createUser: (data: CreateUserData) => Promise<User | null>;
  licenseUsage: Record<UserRole, number>;
  licenseLimits: Record<UserRole, number>;
  isLicenseExpired: boolean;
  isLicenseValid: boolean;
  company: any;
  setCompany: Dispatch<SetStateAction<any>>;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

const defaultLimits: Record<UserRole, number> = {
  'system super admin': Infinity,
  'admin': 0,
  'director': 1,
  'engineer': 0,
  '': Infinity
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [company, setCompany] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [licenseLimits, setLicenseLimits] = useState<Record<UserRole, number>>(defaultLimits);
  const [isLicenseExpired, setIsLicenseExpired] = useState(false);
  const router = useRouter();
  const auth = useFirebaseAuth();
  const firestore = useFirestore();
  const [allUsers, setAllUsers] = useState<User[]>([]);

  useEffect(() => {
    let unsubscribeCompany: Unsubscribe | null = null;
    let unsubscribeUsers: Unsubscribe | null = null;

    const handleCompanyUpdate = async (companyId: string) => {
      const companyDocRef = doc(firestore, 'companies', companyId);
      
      // Clean up previous company listener
      if (unsubscribeCompany) unsubscribeCompany();

      unsubscribeCompany = onSnapshot(companyDocRef, async (companyDoc) => {
        if (companyDoc.exists()) {
          const companyData = { id: companyDoc.id, ...companyDoc.data() } as Company;
          setCompany(companyData);

          // When company data changes, re-evaluate license limits
          if (companyData.activated && companyData.licenseKey) {
            try {
              const licenseDocRef = doc(firestore, 'licenses', companyData.licenseKey);
              const licenseDoc = await getDoc(licenseDocRef);
              
              if (licenseDoc.exists()) {
                const activeLicense = licenseDoc.data() as License;
                
                setLicenseLimits({
                  'system super admin': Infinity,
                  admin: activeLicense.maxAdmins,
                  director: activeLicense.maxDirectors,
                  engineer: activeLicense.maxEngineers,
                  '': Infinity,
                });
                
                // Check for expiry
                const isExpired = activeLicense.expiresAt !== null && 
                                 new Date(activeLicense.expiresAt) < new Date();
                setIsLicenseExpired(isExpired);
                
                // 🔥 If expired and still activated, deactivate immediately
                if (isExpired && companyData.activated) {
                  try {
                    await updateDoc(companyDocRef, {
                      activated: false,
                      deactivatedReason: 'License expired',
                      deactivatedAt: new Date().toISOString()
                    });
                    console.log('✅ License expired - company deactivated automatically');
                  } catch (error) {
                    console.error('❌ Error deactivating company:', error);
                  }
                }
              } else {
                // License document doesn't exist
                setLicenseLimits(defaultLimits);
                setIsLicenseExpired(false);
              }
            } catch (e) {
              console.error('Error fetching license:', e);
              setLicenseLimits(defaultLimits);
              setIsLicenseExpired(false);
            }
          } else {
            // Company not activated or no license key
            setLicenseLimits(defaultLimits);
            // Treat non-activated as "expired" for UI purposes
            setIsLicenseExpired(!companyData.activated);
          }
        } else {
          // Company document doesn't exist
          setCompany(null);
          setLicenseLimits(defaultLimits);
          setIsLicenseExpired(false);
        }
      });
    };
  
    const unsubscribeAuth = auth.onAuthStateChanged(async (firebaseUser: AuthUser | null) => {
      // Unsubscribe from previous user and company listeners
      if (unsubscribeUsers) unsubscribeUsers();
      if (unsubscribeCompany) unsubscribeCompany();
      
      if (firebaseUser) {
        const userDocRef = doc(firestore, 'users', firebaseUser.uid);
        try {
          const userDoc = await getDoc(userDocRef);
          if (userDoc.exists()) {
            const userData = { id: userDoc.id, ...userDoc.data() } as User;
            setUser(userData);

            if (!userData.companyId && userData.role !== 'system super admin') {
              router.push('/welcome');
            }

            if (userData.companyId) {
              // Set up real-time listener for the company
              handleCompanyUpdate(userData.companyId);
              
              // Set up real-time listener for company users
              const usersQuery = query(
                collection(firestore, 'users'), 
                where('companyId', '==', userData.companyId)
              );
              
              unsubscribeUsers = onSnapshot(usersQuery, (snapshot) => {
                const usersList = snapshot.docs.map(doc => ({ 
                  id: doc.id, 
                  ...doc.data() 
                } as User));
                setAllUsers(usersList);
              }, (error) => {
                console.error("Error fetching company users:", error);
                errorEmitter.emit('permission-error', new FirestorePermissionError({
                  path: collection(firestore, 'users').path,
                  operation: 'list',
                }));
              });
            } else {
              setCompany(null);
              setLicenseLimits(defaultLimits);
            }
          } else {
            // User document doesn't exist
            await auth.signOut();
            setUser(null);
            setCompany(null);
          }
        } catch (e: any) {
          if (e instanceof FirestoreError && e.code === 'permission-denied') {
            errorEmitter.emit('permission-error', new FirestorePermissionError({
              path: userDocRef.path,
              operation: 'get',
            }));
          } else {
            console.error("Error fetching user document:", e);
          }
          await auth.signOut();
          setUser(null);
          setCompany(null);
        }
      } else {
        // No user logged in
        setUser(null);
        setCompany(null);
        setAllUsers([]);
        setLicenseLimits(defaultLimits);
        setIsLicenseExpired(false);
      }
      setLoading(false);
    });
    
    return () => {
      unsubscribeAuth();
      if (unsubscribeUsers) unsubscribeUsers();
      if (unsubscribeCompany) unsubscribeCompany();
    };
  }, [auth, firestore, router]);
  
  // ✅ COMPUTED VALUE - Always in sync with state
  // This is the single source of truth for license validity
  const isLicenseValid = company?.activated === true && !isLicenseExpired;
  
  const licenseUsage = {
    'system super admin': allUsers.filter(u => u.role === 'system super admin' && u.status === 'Active').length,
    'admin': allUsers.filter(u => u.role === 'admin' && u.status === 'Active' && u.companyId === company?.id).length,
    'director': allUsers.filter(u => u.role === 'director' && u.status === 'Active' && u.companyId === company?.id).length,
    'engineer': allUsers.filter(u => u.role === 'engineer' && u.status === 'Active' && u.companyId === company?.id).length,
    '': allUsers.filter(u => u.role === '' && u.status === 'Active').length,
  };

  const handleLogin = async (credentials: UserCredentials): Promise<{ user: User | null; error?: string }> => {
    setLoading(true);
    try {
      const loggedInUser = await login(credentials);
      if (loggedInUser) {
        router.push('/dashboard');
        setLoading(false);
        return { user: loggedInUser };
      }
      setLoading(false);
      return { user: null, error: 'User data not found or inactive.' };
    } catch (error: any) {
      setLoading(false);
      return { user: null, error: error.message };
    }
  };

  const handleSignUp = async (data: SignUpData): Promise<User | null> => {
    setLoading(true);
    
    // Check license limits
    if (licenseUsage[data.role] >= licenseLimits[data.role]) {
      setLoading(false);
      throw new Error(`License limit reached for ${data.role} role`);
    }
    
    const companyId = company?.id;
    const newUser = await signUp({ ...data, companyId });
    setLoading(false);
    return newUser;
  };
  
  const handleCreateUser = async (data: CreateUserData): Promise<User | null> => {
    if (!data.password || !data.email) {
      return null;
    }

    setLoading(true);
    
    // Check license limits
    if (licenseUsage[data.role] >= licenseLimits[data.role]) {
      setLoading(false);
      throw new Error(`License limit reached for ${data.role} role`);
    }

    const tempAppName = `temp-user-creation-${Date.now()}`;
    const tempApp = initializeApp(firebaseConfig, tempAppName);
    const tempAuth = getAuth(tempApp);

    try {
      const userCredential = await createUserWithEmailAndPassword(tempAuth, data.email, data.password);
      const { user: firebaseUser } = userCredential;
      
      const newUser: Omit<User, 'id'> = {
        name: data.name,
        email: data.email,
        phone: data.phone,
        role: data.role,
        companyId: data.companyId,
        avatarUrl: `https://picsum.photos/seed/user${Date.now()}/200/200`,
        status: 'Active',
        createdAt: new Date().toISOString(),
        history: [{ status: 'Active', date: new Date().toISOString() }],
      };

      const userDocRef = doc(firestore, 'users', firebaseUser.uid);
      await setDoc(userDocRef, newUser);

      await deleteApp(tempApp);
      
      setLoading(false);
      return { id: firebaseUser.uid, ...newUser };
    } catch (error) {
      console.error("Error creating user:", error);
      await deleteApp(tempApp);
      setLoading(false);
      return null;
    }
  };

  const handleLogout = async () => {
    await auth.signOut();
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
    isLicenseExpired,
    isLicenseValid, // ✅ Computed value, always accurate
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}