'use client';

import { Project, Claim, User } from '@/types';
import ClaimsOverview from '@/components/dashboard/views/admin/ClaimsOverview';
import { useAuth } from '@/hooks/use-auth';
import { Loader2 } from 'lucide-react';
import CreateClaimDialog from '@/components/dashboard/CreateClaimDialog';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, where, orderBy, QueryConstraint } from 'firebase/firestore';

export default function ClaimsPage() {
  const { user, company, loading: authLoading } = useAuth();
  const firestore = useFirestore();

  // Query for projects in the user's company
  const projectsQuery = useMemoFirebase(() => {
    if (!firestore || !company?.id) return null;

    return query(
      collection(firestore, 'projects'),
      where('companyId', '==', company.id)
    );
  }, [firestore, company?.id]);


  const { data: allProjects, isLoading: projectsLoading } = useCollection<Project>(projectsQuery);

  console.log(allProjects);

  // Query for users in the user's company
  const usersQuery = useMemoFirebase(() => {
    if (!firestore || !company?.id) return null;

    return query(
      collection(firestore, 'users'),
      where('companyId', '==', company.id)
    );
  }, [firestore, company?.id]);

  const { data: users, isLoading: usersLoading } = useCollection<User>(usersQuery);

  // Build claims query based on user role and company
  const claimsQuery = useMemoFirebase(() => {
    if (!firestore || !company?.id || !user?.id) return null;

    const constraints: QueryConstraint[] = [
      where('companyId', '==', company.id),
    ];

    // Engineers only see their own claims
    if (user.role === 'engineer') {
      constraints.push(where('submittedBy', '==', user.id));
    }

    // Sort by latest submission
    constraints.push(orderBy('submittedAt', 'desc'));

    return query(collection(firestore, 'claims'), ...constraints);
  }, [firestore, company?.id, user?.id, user?.role]);

  const { data: claims, isLoading: claimsLoading, error: claimsError } = useCollection<Claim>(claimsQuery);

  const handleClaimCreated = (newClaim: Claim) => {
    // useCollection handles automatic updates via real-time listener
    console.log('Claim created:', newClaim);
  };

  // Show loading spinner while auth is loading
  if (authLoading) {
    return (
      <div className="flex h-[calc(100vh-10rem)] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Show error if no user or company
  if (!user || !company) {
    return (
      <div className="flex h-[calc(100vh-10rem)] items-center justify-center">
        <div className="text-center">
          <p className="text-destructive">Access Denied</p>
          <p className="text-sm text-muted-foreground">
            {!user ? 'No user found. Please sign in.' : 'No company associated with your account.'}
          </p>
        </div>
      </div>
    );
  }

  // Show loading while data is being fetched
  if (projectsLoading || usersLoading || claimsLoading) {
    return (
      <div className="flex h-[calc(100vh-10rem)] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Show claims error
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

  const isEngineer = user.role === 'engineer';

  // Filter projects based on user role
  // Engineers only see projects they're assigned to
  // Admins/Directors see all company projects
  const availableProjects = isEngineer
    ? (allProjects || []).filter((p) => p.assignedEngineers?.includes(user.id))
    : (allProjects || []);

  return (
    <div className="space-y-6">
      <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">
            {isEngineer ? 'My Submitted Claims' : 'Claims Management'}
          </h2>
          <p className="text-muted-foreground">
            {isEngineer
              ? 'View the status of all your submitted payment claims.'
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
        projects={allProjects || []} 
      />
    </div>
  );
}
