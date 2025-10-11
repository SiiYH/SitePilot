
'use client';

import { createContext, useState, useEffect, ReactNode, Dispatch, SetStateAction } from 'react';
import { useRouter } from 'next/navigation';
import type { User as AuthUser } from 'firebase/auth';
import { doc, getDoc, FirestoreError, collection, query, getDocs, where } from 'firebase/firestore';
import type { User, UserRole } from '@/types';
import { login, createNewUser, CreateUserData, UserCredentials, SignUpData } from '@/lib/auth';
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
                  const companyData = { id: companyDoc.id, ...companyDoc.data() };
                  setCompany(companyData);
                  
                  await fetchCompanyUsers(userData.companyId);

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
              } else if (userData.role === 'System Super Admin') {
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
    'System Super Admin': allUsers.filter(u => u.role === 'System Super Admin' && u.status === 'Active').length,
    'Admin': allUsers.filter(u => u.role === 'Admin' && u.status === 'Active' && u.companyId === company?.id).length,
    'Director': allUsers.filter(u => u.role === 'Director' && u.status === 'Active' && u.companyId === company?.id).length,
    'Engineer': allUsers.filter(u => u.role === 'Engineer' && u.status === 'Active' && u.companyId === company?.id).length,
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

    