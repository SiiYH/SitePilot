
'use client';

import { createContext, useState, useEffect, ReactNode, Dispatch, SetStateAction } from 'react';
import { useRouter } from 'next/navigation';
import type { User as AuthUser } from 'firebase/auth';
import { doc, getDoc, FirestoreError, collection, query, getDocs, where } from 'firebase/firestore';
import type { User, UserRole } from '@/types';
import { login, createNewUser, CreateUserData, UserCredentials, SignUpData, signUp } from '@/lib/auth';
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
  'system super admin': Infinity,
  'admin': 1,
  'director': 1,
  'engineer': 2,
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
    const fetchCompanyUsers = async (companyId: string, isSystemAdmin: boolean) => {
      if (!firestore) return;
      const usersCol = collection(firestore, 'users');
      
      // System admin gets all users, others get users for their company
      const q = isSystemAdmin ? query(usersCol) : query(usersCol, where('companyId', '==', companyId));
      
      try {
        const usersSnapshot = await getDocs(q);
        const usersList = usersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as User));
        setAllUsers(usersList);
      } catch (serverError) {
        const permissionError = new FirestorePermissionError({
          path: usersCol.path,
          operation: 'list',
        });
        errorEmitter.emit('permission-error', permissionError);
      }
    };
    
    const unsubscribe = auth.onAuthStateChanged(async (firebaseUser: AuthUser | null) => {
      if (firebaseUser) {
        const userDocRef = doc(firestore, 'users', firebaseUser.uid);
        try {
          const userDoc = await getDoc(userDocRef);
          if (userDoc.exists()) {
            const userData = { id: userDoc.id, ...userDoc.data() } as User;
            setUser(userData);
            const isSystemAdmin = userData.role === 'system super admin';

            // Now that we have the authenticated user's data, we can fetch other data.
            await fetchCompanyUsers(userData.companyId || '', isSystemAdmin);

            if (userData.companyId) {
              const companyDocRef = doc(firestore, 'companies', userData.companyId);
              const companyDoc = await getDoc(companyDocRef);
              if (companyDoc.exists()) {
                const companyData = { id: companyDoc.id, ...companyDoc.data() };
                setCompany(companyData);

                // Load license limits
                if (companyData.activated && companyData.licenseKey) {
                  const licenseDocRef = doc(firestore, 'licenses', companyData.licenseKey);
                  const licenseDoc = await getDoc(licenseDocRef);
                  if (licenseDoc.exists()) {
                    const activeLicense = licenseDoc.data() as License;
                    setLicenseLimits({
                      'system super admin': Infinity,
                      admin: activeLicense.maxAdmins,
                      director: activeLicense.maxDirectors,
                      engineer: activeLicense.maxEngineers,
                    });
                  } else {
                    setLicenseLimits(defaultLimits); // Fallback if key is invalid
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
    'admin': allUsers.filter(u => u.role === 'admin' && u.status === 'Active' && u.companyId === company?.id).length,
    'director': allUsers.filter(u => u.role === 'director' && u.status === 'Active' && u.companyId === company?.id).length,
    'engineer': allUsers.filter(u => u.role === 'engineer' && u.status === 'Active' && u.companyId === company?.id).length,
    '': 0, // for blank roles
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
    const newUser = await signUp(data);
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
    
    await auth.updateCurrentUser(creatingUser);
    
    if (newUser) {
        setAllUsers(prevUsers => [...prevUsers, newUser]);
    }
    
    setLoading(false);
    return newUser;
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
