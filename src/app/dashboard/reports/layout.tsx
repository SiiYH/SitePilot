'use client';

import { ReportProvider } from '@/contexts/ReportContext';
import { useAuth } from '@/hooks/use-auth';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, where, QueryConstraint } from 'firebase/firestore';
import { Claim, Project, User } from '@/types';
import { Loader2 } from 'lucide-react';

export default function ReportsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { company, loading: authLoading, user } = useAuth();
  const firestore = useFirestore();

  const projectsQuery = useMemoFirebase(() => {
    if (!firestore || !company?.id) return null;
    return query(collection(firestore, 'projects'), where('companyId', '==', company.id));
  }, [firestore, company?.id]);

  const claimsQuery = useMemoFirebase(() => {
    if (!firestore || !company?.id || !user?.id) return null;

    const constraints: QueryConstraint[] = [
      where('companyId', '==', company.id),
    ];

    if (user.role === 'engineer') {
      constraints.push(where('submittedBy', '==', user.id));
    }

    return query(collection(firestore, 'claims'), ...constraints);
  }, [firestore, company?.id, user?.id, user?.role]);
  
  const usersQuery = useMemoFirebase(() => {
    if (!firestore || !company?.id) return null;
    return query(collection(firestore, 'users'), where('companyId', '==', company.id));
  }, [firestore, company?.id]);
  
  const { data: projects, isLoading: projectsLoading } = useCollection<Project>(projectsQuery);
  const { data: claims, isLoading: claimsLoading } = useCollection<Claim>(claimsQuery);
  const { data: users, isLoading: usersLoading } = useCollection<User>(usersQuery);

  const loading = authLoading || projectsLoading || claimsLoading || usersLoading;
  
  const reportData = {
    users: users || [],
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

  if (user?.role === 'engineer') {
      return (
          <div className="space-y-6">
              <h2 className="text-2xl font-bold tracking-tight">Access Denied</h2>
              <p className="text-muted-foreground">This page is only available for admin or director roles.</p>
          </div>
      )
  }

  return (
    <ReportProvider reportData={reportData}>
        {children}
    </ReportProvider>
  );
}
