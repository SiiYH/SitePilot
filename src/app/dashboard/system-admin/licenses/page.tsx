
'use client';

import { useAuth } from '@/hooks/use-auth';
import { Loader2 } from 'lucide-react';
import LicenseList from '../_components/LicenseList';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, orderBy, query } from 'firebase/firestore';
import { License } from '../_components/LicenseGenerator';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function LicenseListPage() {
  const { user, loading } = useAuth();
  const firestore = useFirestore();
  const router = useRouter();

  const licensesQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'licenses'), orderBy('createdAt', 'desc'));
  }, [firestore]);
  
  const { data: licenses, isLoading: licensesLoading } = useCollection<License>(licensesQuery);

  const pageLoading = loading || licensesLoading;

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
        <Button variant="outline" onClick={() => router.back()}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to System Admin
        </Button>
        <LicenseList licenses={licenses || []} />
    </div>
  );
}
