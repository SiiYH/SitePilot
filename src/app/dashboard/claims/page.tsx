
'use client';

import { useState, useEffect } from 'react';
import { mockProjects, mockClaims, mockUsers } from '@/lib/data';
import { Project, Claim, User } from '@/types';
import ClaimsOverview from '@/components/dashboard/views/admin/ClaimsOverview';
import { useAuth } from '@/hooks/use-auth';
import { Loader2 } from 'lucide-react';

export default function ClaimsPage() {
  const { user } = useAuth();
  const [claims, setClaims] = useState<Claim[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      const allClaims = mockClaims;
      const allProjects = mockProjects;
      const allUsers = mockUsers;

      if (user.role === 'Engineer') {
        const engineerClaims = allClaims.filter(c => c.submittedBy === user.id);
        setClaims(engineerClaims);
      } else {
        setClaims(allClaims);
      }
      
      setProjects(allProjects);
      setUsers(allUsers);
      setLoading(false);
    }
  }, [user]);

  if (loading) {
    return (
      <div className="flex h-[calc(100vh-10rem)] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const isEngineer = user?.role === 'Engineer';

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">
          {isEngineer ? 'My Claims' : 'Claims Management'}
        </h2>
        <p className="text-muted-foreground">
          {isEngineer ? 'View the status of all your submitted payment claims.' : 'View and manage all payment claims.'}
        </p>
      </div>
      <ClaimsOverview claims={claims} projects={projects} users={users} />
    </div>
  );
}
