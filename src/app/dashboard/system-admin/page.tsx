'use client';

import { useState, useEffect } from 'react';
import LicenseGenerator, { License } from './_components/LicenseGenerator';
import LicenseList from './_components/LicenseList';
import { Separator } from '@/components/ui/separator';
import { useAuth } from '@/hooks/use-auth';
import { Loader2 } from 'lucide-react';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, orderBy, query } from 'firebase/firestore';
import { Company } from '@/types';


export default function SystemAdminPage() {
  const { user, loading } = useAuth();
  const firestore = useFirestore();
  
  const licensesQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'licenses'), orderBy('createdAt', 'desc'));
  }, [firestore]);
  
  const companiesQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'companies'));
  }, [firestore]);

  const { data: licenses, isLoading: licensesLoading } = useCollection<License>(licensesQuery);
  const { data: companies, isLoading: companiesLoading } = useCollection<Company>(companiesQuery);

  const handleLicenseGenerated = (newLicense: License) => {
    // The useCollection hook will automatically update the list
  };

  const pageLoading = loading || licensesLoading || companiesLoading;

  if (pageLoading) {
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
        <h2 className="text-2xl font-bold tracking-tight">System Administration</h2>
        <p className="text-muted-foreground">
          Manage system-level settings and generate licenses.
        </p>
      </div>
      <LicenseGenerator onLicenseGenerated={handleLicenseGenerated} companies={companies || []} />
      <Separator />
      <LicenseList licenses={licenses || []} />
    </div>
  );
}
