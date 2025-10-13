
'use client';

import { useState, useEffect } from 'react';
import LicenseGenerator, { License } from './_components/LicenseGenerator';
import { Separator } from '@/components/ui/separator';
import { useAuth } from '@/hooks/use-auth';
import { Loader2, List } from 'lucide-react';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, orderBy, query } from 'firebase/firestore';
import { Company } from '@/types';
import { Button } from '@/components/ui/button';
import Link from 'next/link';


export default function SystemAdminPage() {
  const { user, loading } = useAuth();
  const firestore = useFirestore();
  
  const companiesQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'companies'));
  }, [firestore]);

  const { data: companies, isLoading: companiesLoading } = useCollection<Company>(companiesQuery);

  const handleLicenseGenerated = (newLicense: License) => {
    // The useCollection hook will automatically update the list on the licenses page
  };

  const pageLoading = loading || companiesLoading;

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
       <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">System Administration</h2>
          <p className="text-muted-foreground">
            Generate new software licenses for companies.
          </p>
        </div>
         <Button asChild>
            <Link href="/dashboard/system-admin/licenses">
                <List className="mr-2 h-4 w-4" />
                View All Licenses
            </Link>
        </Button>
      </div>
      <LicenseGenerator onLicenseGenerated={handleLicenseGenerated} companies={companies || []} />
    </div>
  );
}
