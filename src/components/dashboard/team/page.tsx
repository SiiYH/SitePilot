

'use client';

import { useState, useEffect } from 'react';
import { mockProjects } from '@/lib/data';
import { Project, User, UserStatus } from '@/types';
import TeamWorkload from '@/components/dashboard/views/admin/TeamWorkload';
import { useAuth } from '@/hooks/use-auth';
import CreateUserDialog from '@/components/dashboard/views/admin/CreateUserDialog';
import { Loader2 } from 'lucide-react';
import ActivateLicenseDialog from '@/components/dashboard/views/admin/ActivateLicenseDialog';
import { useFirestore, useCollection, useMemoFirebase, updateDocumentNonBlocking } from '@/firebase';
import { collection, query, where, doc, arrayUnion } from 'firebase/firestore';

export default function TeamPage() {
  const { user, company, isLicenseExpired, loading: authLoading } = useAuth();
  const firestore = useFirestore();
  // const [projects, setProjects] = useState<Project[]>(mockProjects);
  const projectsQuery = useMemoFirebase(() => {
    if (!firestore || !company?.id) return null;
    return query(collection(firestore, 'projects'), where('companyId', '==', company.id));
  }, [firestore, company?.id]);
  
  const { data: projects = [], isLoading: projectsLoading } = useCollection<Project>(projectsQuery);

  const usersQuery = useMemoFirebase(() => {
    if (!firestore || !company?.id) return null;
    return query(collection(firestore, 'users'), where('companyId', '==', company.id));
  }, [firestore, company?.id]);

  const { data: teamUsers, isLoading: usersLoading } = useCollection<User>(usersQuery);

  const handleUserCreated = (newUser: User) => {
    // With useCollection, this is handled automatically, but can be kept for optimistic updates.
  };
  
  const handleUserUpdated = (userId: string, updates: Partial<User>) => {
    if (!firestore) return;
    const userDocRef = doc(firestore, 'users', userId);

    const updatePayload: { [key: string]: any } = { ...updates };

    // If history is part of the update, use arrayUnion
    if (updates.history && Array.isArray(updates.history)) {
        const newHistoryEntry = updates.history[0];
        updatePayload.history = arrayUnion(newHistoryEntry);
    }
    
    updateDocumentNonBlocking(userDocRef, updatePayload);
  };

  const loading = authLoading || usersLoading || projectsLoading;

  if (loading || !user) {
    return (
      <div className="flex h-[calc(100vh-10rem)] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }
  
  const canManageUsers = user.role === 'admin' || user.role === 'director';

  return (
    <div className="space-y-6">
      <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <div>
            <h2 className="text-2xl font-bold tracking-tight">Team Management</h2>
            <p className="text-muted-foreground">
            Oversee team members, their roles, and assigned workload.
            </p>
        </div>
        {canManageUsers && company && (
            !company.activated || isLicenseExpired ? (
                <ActivateLicenseDialog featureName="add new users" />
              ) : (
                <CreateUserDialog onUserCreated={handleUserCreated} companyId={company.id} />
              )
        )}
      </div>
      {/* <TeamWorkload users={teamUsers || []} projects={projects} onUserUpdated={handleUserUpdated} /> */}
      <TeamWorkload
  users={teamUsers || []}
  projects={projects || []}
  onUserUpdated={handleUserUpdated}
/>
    </div>
  );
}
