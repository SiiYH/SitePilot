
'use client';

import { useEffect, useState, useMemo } from 'react';
import { Loader2 } from 'lucide-react';
import { Project, User, Claim, AttendanceRecord, Task } from '@/types';
import AdminDashboard from '@/components/dashboard/views/AdminDashboard';
import DirectorDashboard from '@/components/dashboard/views/DirectorDashboard';
import EngineerDashboard from '@/components/dashboard/views/EngineerDashboard';
import { useAuth } from '@/hooks/use-auth';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, where } from 'firebase/firestore';

export default function DashboardPage() {
  const { user, company } = useAuth();
  const firestore = useFirestore();

  const projectsQuery = useMemoFirebase(() => {
    if (!firestore || !company?.id) return null;
    return query(collection(firestore, 'projects'), where('companyId', '==', company.id));
  }, [firestore, company?.id]);

  const usersQuery = useMemoFirebase(() => {
    if (!firestore || !company?.id) return null;
    return query(collection(firestore, 'users'), where('companyId', '==', company.id));
  }, [firestore, company?.id]);

  const { data: projects, isLoading: projectsLoading } = useCollection<Project>(projectsQuery);
  const { data: users, isLoading: usersLoading } = useCollection<User>(usersQuery);
  
  // For now, we will continue to use mock claims and attendance as they are not in firestore yet
  const [claims, setClaims] = useState<Claim[]>([]);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);

  useEffect(() => {
    // This is where you would fetch claims and attendance from Firestore if they were stored there.
    // For now, we'll use the mock data as a placeholder.
    // setClaims(mockClaims);
    // setAttendance(mockAttendance);
  }, []);

  const tasks = useMemo(() => {
    if (!projects) return [];
    return projects.flatMap(p => 
      (p.tasks || []).map(t => ({ ...t, projectName: p.name, projectSlug: p.slug, projectId: p.id }))
    );
  }, [projects]);


  const loading = projectsLoading || usersLoading;

  if (loading || !user) {
    return (
      <div className="flex h-[calc(100vh-10rem)] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }
  
  const engineerTasks = user.role === 'Engineer' 
    ? tasks.filter(t => t.owner === user.id || t.contributors?.includes(user.id))
    : [];

  const engineerProjects = user.role === 'Engineer' && projects
    ? projects.filter(p => p.assignedEngineers.includes(user.id))
    : projects || [];

  const renderDashboard = () => {
    switch (user.role) {
      case 'Admin':
        return <AdminDashboard projects={projects || []} claims={claims} attendance={attendance} users={users || []} />;
      case 'Director':
        return <DirectorDashboard projects={projects || []} claims={claims} attendance={attendance} users={users || []} />;
      case 'Engineer':
        return <EngineerDashboard projects={engineerProjects} tasks={engineerTasks} user={user} />;
      default:
        return <div>Welcome! Your dashboard is being set up.</div>;
    }
  }

  return (
    <div className="space-y-6">
       <div>
        <h2 className="text-2xl font-bold tracking-tight">
          {user.role} Dashboard
        </h2>
        <p className="text-muted-foreground">
          Welcome, {user.name}. Here's your overview.
        </p>
      </div>
      {renderDashboard()}
    </div>
  );
}
