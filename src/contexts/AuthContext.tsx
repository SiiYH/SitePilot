
'use client';

import { createContext, useState, useEffect, ReactNode, Dispatch, SetStateAction } from 'react';
import { useRouter } from 'next/navigation';
import type { User as AuthUser } from 'firebase/auth';
import { doc, getDoc, FirestoreError, collection, query, getDocs, where, setDoc } from 'firebase/firestore';
import type { Company, User, UserRole, CreateUserData } from '@/types';
import { login, UserCredentials, SignUpData, signUp } from '@/lib/auth';
import { useAuth as useFirebaseAuth, useFirestore, initializeFirebase, errorEmitter, FirestorePermissionError } from '@/firebase';
import { createUserWithEmailAndPassword, getAuth, signInWithCredential } from 'firebase/auth';
import { License } from '@/app/dashboard/system-admin/_components/LicenseGenerator';
import { initializeApp, deleteApp } from 'firebase/app';
import { firebaseConfig } from '@/firebase/config';


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
  'system super admin': Infinity,
  'admin': 1,
  'director': 1,
  'engineer': 2,
  '': Infinity
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [company, setCompany] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [licenseLimits, setLicenseLimits] = useState<Record<UserRole, number>>(defaultLimits);
  const router = useRouter();
  const auth = useFirebaseAuth();
  const firestore = useFirestore();
  const [allUsers, setAllUsers] = useState<User[]>([]);


  useEffect(() => {
    const fetchCompanyUsers = async (companyId: string) => {
        if (!firestore) return;
        const usersCol = collection(firestore, 'users');
        // Only fetch users belonging to the specified company
        const q = query(usersCol, where('companyId', '==', companyId));
        
        getDocs(q)
          .then(usersSnapshot => {
            const usersList = usersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as User));
            setAllUsers(usersList);
          })
          .catch(serverError => {
              const permissionError = new FirestorePermissionError({
                path: usersCol.path,
                operation: 'list',
              });
              errorEmitter.emit('permission-error', permissionError);
          });
      };
    
    const unsubscribe = auth.onAuthStateChanged(async (firebaseUser: AuthUser | null) => {
      if (firebaseUser) {
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
                  const companyData = { id: companyDoc.id, ...companyDoc.data() }as Company;
                  setCompany(companyData);
                  
                  await fetchCompanyUsers(userData.companyId);

                  // Load license limits
                  if (companyData.activated && companyData.licenseKey) {
                    try {
                      const licenseDocRef = doc(firestore, 'licenses', companyData.licenseKey);
                      const licenseDoc = await getDoc(licenseDocRef);
                  
                      if (licenseDoc.exists()) {
                        const activeLicense = licenseDoc.data() as License;
                  
                        setLicenseLimits({
                          'system super admin': Infinity, // System admin is not governed by license
                          admin: activeLicense.maxAdmins,
                          director: activeLicense.maxDirectors,
                          engineer: activeLicense.maxEngineers,
                          '' : Infinity,
                        });
                      } else {
                        console.warn('License not found, using default limits');
                        setLicenseLimits(defaultLimits);
                      }
                    } catch (e) {
                      console.error('Error fetching license:', e);
                      setLicenseLimits(defaultLimits);
                    }
                  } else {
                    setLicenseLimits(defaultLimits);
                  }
                  

                } else {
                  setCompany(null);
                }
              } else if (userData.role === 'system super admin') {
                  // System admin doesn't need a company context, but might need to see all users
                  // For now, we clear company context for them.
                  setCompany(null);
                  setLicenseLimits(defaultLimits);
              } else {
                setCompany(null);
                setLicenseLimits(defaultLimits);
              }
            } else {
              await auth.signOut();
              setUser(null);
              setCompany(null);
            }
        } catch (e: any) {
             if (e instanceof FirestoreError && e.code === 'permission-denied') {
                const permissionError = new FirestorePermissionError({
                  path: userDocRef.path,
                  operation: 'get',
                });
                errorEmitter.emit('permission-error', permissionError);
            } else {
                console.error("Error fetching user document:", e);
            }
            await auth.signOut();
            setUser(null);
            setCompany(null);
        }
      } else {
        setUser(null);
        setCompany(null);
        setLicenseLimits(defaultLimits);
      }
      setLoading(false);
    });
    
    return () => unsubscribe();
  }, [auth, firestore]);
  
  const licenseUsage = {
    'system super admin': allUsers.filter(u => u.role === 'system super admin' && u.status === 'Active').length,
    'admin': allUsers.filter(u => u.role === 'admin' && u.status === 'Active').length,
    'director': allUsers.filter(u => u.role === 'director' && u.status === 'Active').length,
    'engineer': allUsers.filter(u => u.role === 'engineer' && u.status === 'Active').length,
    '': allUsers.filter(u => u.role === 'system super admin' && u.status === 'Active').length,
  };

  const handleLogin = async (credentials: UserCredentials): Promise<User | null> => {
    setLoading(true);
    const loggedInUser = await login(credentials);
    if (loggedInUser) {
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
    const companyId = company?.id;
    const newUser = await signUp({ ...data, companyId });
    if (newUser) {
      router.push('/welcome');
    }
    setLoading(false);
    return newUser;
  }
  
  const handleCreateUser = async (data: CreateUserData): Promise<User | null> => {
    const creatingUser = auth.currentUser;
    if (!creatingUser || !data.password || !data.email) {
      return null;
    }

    setLoading(true);
    if (licenseUsage[data.role] >= licenseLimits[data.role]) {
        setLoading(false);
        return null;
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
        
        setAllUsers(prevUsers => [...prevUsers, { id: firebaseUser.uid, ...newUser }]);
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
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
