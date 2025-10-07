
'use client';

import { useState, useEffect } from 'react';
import { mockProjects, mockUsers } from '@/lib/data';
import { Project, User } from '@/types';
import TeamWorkload from '@/components/dashboard/views/admin/TeamWorkload';
import { useAuth } from '@/hooks/use-auth';
import CreateUserDialog from '@/components/dashboard/views/admin/CreateUserDialog';
import { Loader2 } from 'lucide-react';

export default function TeamPage() {
  const { user, company } = useAuth();
  const [teamUsers, setTeamUsers] = useState<User[]>([]);
  const [projects, setProjects] = useState<Project[]>(mockProjects);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (company) {
      const companyUsers = mockUsers.filter(u => u.companyId === company.id);
      setTeamUsers(companyUsers);
    }
    setLoading(false);
  }, [company]);

  const handleUserCreated = (newUser: User) => {
    if (newUser.companyId === company?.id) {
        setTeamUsers(prevUsers => [newUser, ...prevUsers]);
    }
     // Also update the global mock data so other components are aware
    const userIndex = mockUsers.findIndex(u => u.id === newUser.id);
    if (userIndex === -1) {
        mockUsers.push(newUser);
    }
  };
  
  const handleUserUpdated = (updatedUser: User) => {
     setTeamUsers(prevUsers => prevUsers.map(u => u.id === updatedUser.id ? updatedUser : u));
     const userIndex = mockUsers.findIndex(u => u.id === updatedUser.id);
    if (userIndex !== -1) {
        mockUsers[userIndex] = updatedUser;
    }
  };


  if (loading || !user) {
    return (
      <div className="flex h-[calc(100vh-10rem)] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }
  
  const canManageUsers = user.role === 'Admin' || user.role === 'Director';

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
            <CreateUserDialog onUserCreated={handleUserCreated} companyId={company.id} />
        )}
      </div>
      <TeamWorkload users={teamUsers} projects={projects} onUserUpdated={handleUserUpdated} />
    </div>
  );
}
