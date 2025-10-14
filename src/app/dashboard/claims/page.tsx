'use client';

import { useState, useEffect } from 'react';
import { mockProjects, mockUsers } from '@/lib/data';
import { Project, Claim, User } from '@/types';
import ClaimsOverview from '@/components/dashboard/views/admin/ClaimsOverview';
import { useAuth } from '@/hooks/use-auth';
import { Loader2 } from 'lucide-react';
import CreateClaimDialog from '@/components/dashboard/CreateClaimDialog';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, where, orderBy } from 'firebase/firestore';
// import { USER_ROLES } from '@/lib/constants/roles';

export default function ClaimsPage() {
  const { user, company, loading: authLoading } = useAuth();
  const firestore = useFirestore();

  // ✅ FIXED: Engineers should see ALL claims in their company, not just their own
  // They can view all claims but only edit their own (enforced by security rules and UI)
  const claimsQuery = useMemoFirebase(() => {
    if (!firestore || !company?.id) return null;
    
    // All users see all claims in their company
    // Security rules enforce this, and UI will show edit permissions appropriately
    return query(
      collection(firestore, 'claims'),
      where('companyId', '==', company.id),
      orderBy('submittedDate', 'desc') // Show newest first
    );
  }, [firestore, company?.id]);

  const { data: claims, isLoading: claimsLoading, error: claimsError } = useCollection<Claim>(claimsQuery);
  
  // TODO: Replace with Firestore queries when ready
  const [projects, setProjects] = useState<Project[]>([]);
  const [users, setUsers] = useState<User[]>([]);

  useEffect(() => {
    if (company) {
      setProjects(mockProjects.filter(p => p.companyId === company.id));
      setUsers(mockUsers.filter(u => u.companyId === company.id));
    }
  }, [company]);

  const handleClaimCreated = (newClaim: Claim) => {
    // useCollection handles automatic updates
    // Can add optimistic update here if needed
  };
  
  const loading = authLoading || !company || (claimsQuery && claimsLoading);

  if (loading || !user) {
    return (
      <div className="flex h-[calc(100vh-10rem)] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Show error state
  if (claimsError) {
    return (
      <div className="flex h-[calc(100vh-10rem)] items-center justify-center">
        <div className="text-center">
          <p className="text-destructive">Error loading claims</p>
          <p className="text-sm text-muted-foreground">{claimsError.message}</p>
        </div>
      </div>
    );
  }

  // ✅ Use role constants instead of string literals
  // const isEngineer = user.role === USER_ROLES.ENGINEER;
  const isEngineer = user?.role === 'engineer';

  
  // Filter projects for engineers (they only see assigned projects)
  const availableProjects = isEngineer 
    ? projects.filter(p => p.assignedEngineers?.includes(user.id))
    : projects;

  return (
    <div className="space-y-6">
      <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">
            {isEngineer ? 'Payment Claims' : 'Claims Management'}
          </h2>
          <p className="text-muted-foreground">
            {isEngineer 
              ? 'View all payment claims and submit new ones for your projects.' 
              : 'View and manage all payment claims across projects.'}
          </p>
        </div>
        {/* All users can create claims, but engineers only for their assigned projects */}
        <CreateClaimDialog
          projects={availableProjects}
          onClaimCreated={handleClaimCreated}
          userId={user.id}
        />
      </div>
      
      <ClaimsOverview 
        claims={claims || []} 
        projects={projects} 
        users={users}
        currentUser={user} // Pass current user for permission checks
      />
    </div>
  );
}