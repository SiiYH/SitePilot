'use client';

import { createContext, useState, useEffect, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import type { User } from '@/types';
import { loginWithEmail, loginWithPhone, signup, UserCredentials, SignUpData } from '@/lib/auth';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (credentials: UserCredentials) => Promise<User | null>;
  signUp: (data: SignUpData) => Promise<User | null>;
  logout: () => void;
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

  const handleLogin = async (credentials: UserCredentials): Promise<User | null> => {
    setLoading(true);
    const loggedInUser = 'email' in credentials ? await loginWithEmail(credentials) : await loginWithPhone(credentials);
    if (loggedInUser) {
      setUser(loggedInUser);
      localStorage.setItem('sitepilot-user', JSON.stringify(loggedInUser));
      router.push('/dashboard');
    }
    setLoading(false);
    return loggedInUser;
  };

  const handleSignUp = async (data: SignUpData): Promise<User | null> => {
    setLoading(true);
    const newUser = await signup(data);
    if (newUser) {
      setUser(newUser);
      localStorage.setItem('sitepilot-user', JSON.stringify(newUser));
      router.push('/welcome');
    }
    setLoading(false);
    return newUser;
  }

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('sitepilot-user');
    router.push('/welcome');
  };

  const value = {
    user,
    loading,
    login: handleLogin,
    signUp: handleSignUp,
    logout: handleLogout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
