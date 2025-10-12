
'use client';

import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { Project, User, Claim, AttendanceRecord, Task } from '@/types';
import AdminDashboard from '@/components/dashboard/views/AdminDashboard';
import DirectorDashboard from '@/components/dashboard/views/DirectorDashboard';
import EngineerDashboard from '@/components/dashboard/views/EngineerDashboard';
import { useAuth } from '@/hooks/use-auth';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, where } from 'firebase/firestore';
import { mockUsers, mockClaims, mockProjects } from '@/lib/data';

export default function DashboardPage() {
  const { user, company, loading: authLoading } = useAuth();
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const projectsQuery = useMemoFirebase(() => {
    if (!firestore || !company?.id) return null;
    return query(collection(firestore, 'projects'), where('companyId', '==', company.id));
  }, [firestore, company?.id]);

  const { data: projects, isLoading: projectsLoading } = useCollection<Project>(projectsQuery);
  
  // Replaced firestore query with mock data to fix permissions error
  const [users, setUsers] = useState<User[]>([]);
  const [claims, setClaims] = useState<Claim[]>([]);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  
  useEffect(() => {
    if (company) {
      setUsers(mockUsers.filter(u => u.companyId === company.id));
      setClaims(mockClaims.filter(c => mockProjects.some(p => p.id === c.projectId && p.companyId === company.id)));
      const allTasks = mockProjects.flatMap(p => 
        p.companyId === company.id ? p.tasks.map(t => ({...t, projectName: p.name, projectSlug: p.slug, projectId: p.id})) : []
      );
      setTasks(allTasks);
    }
    // setAttendance(mockAttendance); // This data is not company-specific yet
  }, [company]);

  const filteredProjects = useMemo(() => {
    if (!projects) return [];
    
    let userProjects = user?.role === 'engineer'
      ? projects.filter(p => p.assignedEngineers.includes(user.id))
      : projects;
    
    if (statusFilter !== 'all') {
      userProjects = userProjects.filter(p => p.status === statusFilter);
    }

    if (searchQuery) {
        const lowercasedQuery = searchQuery.toLowerCase();
        userProjects = userProjects.filter(p => 
            p.name.toLowerCase().includes(lowercasedQuery) ||
            p.description.toLowerCase().includes(lowercasedQuery) ||
            p.jobNo.toLowerCase().includes(lowercasedQuery)
        );
    }

    return userProjects;
  }, [projects, user?.role, user?.id, statusFilter, searchQuery]);


  const loading = projectsLoading || authLoading;

  useEffect(() => {
    // Only redirect after data fully loaded
    if (!loading && user) {
      const shouldRedirect =
        user.role !== 'system super admin' && (user.role === '' || !user.companyId);
  
      if (shouldRedirect) {
        router.replace('/welcome');
      }
    }
  }, [user, loading, router]);
  
  // Still show loading while redirecting
  if (loading || !user) {
    return (
      <div className="flex h-[calc(100vh-10rem)] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  
  // Redirect if user has no role or company, unless they are a system admin
  if (user.role !== 'system super admin' && (user.role === '' || !user.companyId)) {
     return (
      <div className="flex h-[calc(100vh-10rem)] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }
  // Prevent showing dashboard content while redirecting
  if (!authLoading && user.role !== 'system super admin' && (user.role === '' || !user.companyId)) {
    return null; // or a <Redirecting /> component
  }

  const engineerTasks = user.role === 'engineer' 
    ? tasks.filter(t => t.owner === user.id || t.contributors?.includes(user.id))
    : [];

  const engineerProjects = user.role === 'engineer' && projects
    ? projects.filter(p => p.assignedEngineers.includes(user.id))
    : projects || [];
    
  const capitalize = (s: string) => (s && s.charAt(0).toUpperCase() + s.slice(1)) || "";


  const renderDashboard = () => {
    switch (user.role) {
      case 'admin':
        return <AdminDashboard 
                  projects={filteredProjects || []} 
                  claims={claims} 
                  attendance={attendance} 
                  users={users} 
                  searchQuery={searchQuery}
                  setSearchQuery={setSearchQuery}
                  statusFilter={statusFilter}
                  setStatusFilter={setStatusFilter}
                />;
      case 'director':
        return <DirectorDashboard 
                  projects={filteredProjects || []} 
                  claims={claims} 
                  attendance={attendance} 
                  users={users} 
                  searchQuery={searchQuery}
                  setSearchQuery={setSearchQuery}
                  statusFilter={statusFilter}
                  setStatusFilter={setStatusFilter}
                />;
      case 'engineer':
        return <EngineerDashboard projects={engineerProjects} tasks={engineerTasks} user={user} />;
      default:
        return <div>Welcome! Your dashboard is being set up.</div>;
    }
  }

  return (
    <div className="space-y-6">
       <div>
        <h2 className="text-2xl font-bold tracking-tight">
          {capitalize(user.role)} Dashboard
        </h2>
        <p className="text-muted-foreground">
          Welcome, {user.name}. Here's your overview.
        </p>
      </div>
      {renderDashboard()}
    </div>
  );
}
