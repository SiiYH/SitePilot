
'use client';

import { createContext, useState, useEffect, ReactNode, Dispatch, SetStateAction } from 'react';
import { useRouter } from 'next/navigation';
import type { User, UserRole } from '@/types';
import { loginWithEmail, loginWithPhone, signup, UserCredentials, SignUpData, createNewUser, CreateUserData } from '@/lib/auth';
import { licenseLimits } from '@/lib/license';
import { mockUsers } from '@/lib/data';

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

  useEffect(() => {
    try {
      const storedUser = localStorage.getItem('sitepilot-user');
      if (storedUser) {
        setUser(JSON.parse(storedUser));
      }
    } catch (error) {
      console.error("Failed to parse user from localStorage", error);
      localStorage.removeItem('sitepilot-user');
    } finally {
      setLoading(false);
    }
  }, []);
  
  const licenseUsage = {
    'System Super Admin': mockUsers.filter(u => u.role === 'System Super Admin' && u.status === 'Active').length,
    'Admin': mockUsers.filter(u => u.role === 'Admin' && u.status === 'Active').length,
    'Director': mockUsers.filter(u => u.role === 'Director' && u.status === 'Active').length,
    'Engineer': mockUsers.filter(u => u.role === 'Engineer' && u.status === 'Active').length,
  };

  const handleLogin = async (credentials: UserCredentials): Promise<User | null> => {
    setLoading(true);
    const loggedInUser = 'email' in credentials ? await loginWithEmail(credentials) : await loginWithPhone(credentials);
    if (loggedInUser) {
      setUser(loggedInUser);
      localStorage.setItem('sitepilot-user', JSON.stringify(loggedInUser));
      
      const defaultUsers = ['engineer@sitepilot.com', 'admin@sitepilot.com', 'director@sitepilot.com'];
      if (loggedInUser.email && defaultUsers.includes(loggedInUser.email)) {
          const storedCompany = localStorage.getItem('sitepilot-company');
          if (!storedCompany) {
              const sampleCompany = {
                  name: "SitePilot Demo Construction",
                  industry: "(F) CONSTRUCTION",
                  description: "A sample company for the default users to demonstrate SitePilot's features.",
                  activated: true, // Sample company is activated by default
                  eInvoicing: {} // Empty e-invoicing details
              };
              localStorage.setItem('sitepilot-company', JSON.stringify(sampleCompany));
          }
      }
      
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
    const newUser = await signup(data);
    if (newUser) {
      setUser(newUser);
      localStorage.setItem('sitepilot-user', JSON.stringify(newUser));
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

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('sitepilot-user');
    localStorage.removeItem('sitepilot-company');
    router.push('/login');
  };

  const handleUpdateUser = (data: User) => {
    setUser(data);
    localStorage.setItem('sitepilot-user', JSON.stringify(data));
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
