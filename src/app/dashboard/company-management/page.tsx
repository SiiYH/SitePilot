
'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { Loader2 } from 'lucide-react';
import CompanyList from './_components/CompanyList';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, query } from 'firebase/firestore';
import { Company, User } from '@/types';

export default function CompanyManagementPage() {
  const { user, loading: authLoading } = useAuth();
  const firestore = useFirestore();

  const companiesQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'companies'));
  }, [firestore]);

  const usersQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'users'));
  }, [firestore]);

  const { data: companies, isLoading: companiesLoading } = useCollection<Company>(companiesQuery);
  const { data: users, isLoading: usersLoading } = useCollection<User>(usersQuery);

  const loading = authLoading || companiesLoading || usersLoading;

  if (loading) {
    return (
      <div className="flex h-[calc(100vh-10rem)] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (user?.role !== 'system super admin') {
    return (
      <div className="space-y-6">
        <h2 className="text-2xl font-bold tracking-tight">Access Denied</h2>
        <p className="text-muted-foreground">
          You do not have permission to view this page.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Company Management</h2>
        <p className="text-muted-foreground">
          An overview of all companies created in the system.
        </p>
      </div>
      <CompanyList companies={companies || []} allUsers={users || []} />
    </div>
  );
}
