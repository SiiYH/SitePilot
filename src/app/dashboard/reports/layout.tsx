
'use client';

import { ReportProvider } from '@/contexts/ReportContext';
import { useAuth } from '@/hooks/use-auth';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, where } from 'firebase/firestore';
import { Claim, Project, User } from '@/types';
import { Loader2 } from 'lucide-react';
import { mockUsers } from '@/lib/data';

export default function ReportsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { company, loading: authLoading } = useAuth();
  const firestore = useFirestore();

  const projectsQuery = useMemoFirebase(() => {
    if (!firestore || !company?.id) return null;
    return query(collection(firestore, 'projects'), where('companyId', '==', company.id));
  }, [firestore, company?.id]);

  const claimsQuery = useMemoFirebase(() => {
    if (!firestore || !company?.id) return null;
    return query(collection(firestore, 'claims'), where('companyId', '==', company.id));
  }, [firestore, company?.id]);
  
  // Note: users are still from mock data as there's no /companies/{id}/users collection yet.
  // This can be updated when user management is fully on Firestore.
  const { data: projects, isLoading: projectsLoading } = useCollection<Project>(projectsQuery);
  const { data: claims, isLoading: claimsLoading } = useCollection<Claim>(claimsQuery);

  const loading = authLoading || projectsLoading || claimsLoading;
  
  const reportData = {
    users: mockUsers.filter(u => u.companyId === company?.id),
    projects: projects || [],
    claims: claims || [],
  };

  if (loading) {
    return (
      <div className="flex h-[calc(100vh-10rem)] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <ReportProvider reportData={reportData}>
        {children}
    </ReportProvider>
  );
}
