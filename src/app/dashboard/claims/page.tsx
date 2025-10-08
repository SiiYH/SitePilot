
'use client';

import { useState, useEffect } from 'react';
import { mockProjects, mockUsers } from '@/lib/data';
import { Project, Claim, User } from '@/types';
import ClaimsOverview from '@/components/dashboard/views/admin/ClaimsOverview';
import { useAuth } from '@/hooks/use-auth';
import { Loader2 } from 'lucide-react';
import CreateClaimDialog from '@/components/dashboard/CreateClaimDialog';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, where } from 'firebase/firestore';

export default function ClaimsPage() {
  const { user, company, loading: authLoading } = useAuth();
  const firestore = useFirestore();

  const claimsQuery = useMemoFirebase(() => {
    if (!firestore || !company?.id || !user) return null;
    let q = query(collection(firestore, 'claims'), where('companyId', '==', company.id));
    if (user.role === 'Engineer') {
      q = query(q, where('submittedBy', '==', user.id));
    }
    return q;
  }, [firestore, company?.id, user?.id, user?.role]);

  const { data: claims, isLoading: claimsLoading } = useCollection<Claim>(claimsQuery);
  
  // For now, projects and users are still from mock data as we focus on claims.
  // This can be updated later to fetch from Firestore as well.
  const [projects, setProjects] = useState<Project[]>([]);
  const [users, setUsers] = useState<User[]>([]);

  useEffect(() => {
    if (company) {
      setProjects(mockProjects.filter(p => p.companyId === company.id));
      setUsers(mockUsers.filter(u => u.companyId === company.id));
    }
  }, [company]);

  const handleClaimCreated = (newClaim: Claim) => {
    // With useCollection, the list will update automatically.
    // This function can be kept for optimistic updates if desired, but is not strictly necessary.
  };
  
  const loading = claimsLoading || authLoading || !company;

  if (loading) {
    return (
      <div className="flex h-[calc(100vh-10rem)] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const isEngineer = user?.role === 'Engineer';
  const engineerProjects = isEngineer && projects ? projects.filter(p => p.assignedEngineers.includes(user.id)) : projects;

  return (
    <div className="space-y-6">
      <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <div>
            <h2 className="text-2xl font-bold tracking-tight">
            {isEngineer ? 'My Claims' : 'Claims Management'}
            </h2>
            <p className="text-muted-foreground">
            {isEngineer ? 'View the status of all your submitted payment claims.' : 'View and manage all payment claims.'}
            </p>
        </div>
        {isEngineer && user && (
            <CreateClaimDialog
                projects={engineerProjects}
                onClaimCreated={handleClaimCreated}
                userId={user.id}
            />
        )}
      </div>
      <ClaimsOverview claims={claims || []} projects={projects} users={users} />
    </div>
  );
}
