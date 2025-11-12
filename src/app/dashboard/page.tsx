
'use client';

import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { Project, User, Claim, AttendanceRecord, Task } from '@/types';
import AdminDashboard from '@/components/dashboard/views/admin/AdminDashboard';
import DirectorDashboard from '@/components/dashboard/views/DirectorDashboard';
import EngineerDashboard from '@/components/dashboard/views/EngineerDashboard';
import { useAuth } from '@/hooks/use-auth';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { mockAttendance } from '@/lib/data';

export default function DashboardPage() {
  const { user, company, loading: authLoading } = useAuth();
  const router = useRouter();
  const firestore = useFirestore();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [allTasks, setAllTasks] = useState<Task[]>([]);
  const [tasksLoading, setTasksLoading] = useState(true);

  const projectsQuery = useMemoFirebase(() => {
    if (!firestore || !company?.id) return null;
    return query(collection(firestore, 'projects'), where('companyId', '==', company.id));
  }, [firestore, company?.id]);

  const { data: projects, isLoading: projectsLoading } = useCollection<Project>(projectsQuery);

  const claimsQuery = useMemoFirebase(() => {
    if (!firestore || !company?.id) return null;
    return query(collection(firestore, 'claims'), where('companyId', '==', company.id));
  }, [firestore, company?.id]);
  const { data: claims, isLoading: claimsLoading } = useCollection<Claim>(claimsQuery);

  const usersQuery = useMemoFirebase(() => {
    if (!firestore || !company?.id) return null;
    return query(collection(firestore, 'users'), where('companyId', '==', company.id));
  }, [firestore, company?.id]);
  const { data: users, isLoading: usersLoading } = useCollection<User>(usersQuery);
  
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  
  useEffect(() => {
    setAttendance(mockAttendance);
  }, []);

  useEffect(() => {
    if (!firestore || !projects || projects.length === 0) {
      setTasksLoading(false);
      setAllTasks([]);
      return;
    }
  
    setTasksLoading(true);
    const tasksMap = new Map<string, Task>();
    const unsubscribers = projects.map((project) => {
      const tasksQuery = query(collection(firestore, 'projects', project.id, 'tasks'));
      return onSnapshot(
        tasksQuery,
        (snapshot) => {
          snapshot.docChanges().forEach((change) => {
            const taskId = `${project.id}_${change.doc.id}`;
            if (change.type === 'removed') {
              tasksMap.delete(taskId);
            } else {
              tasksMap.set(taskId, {
                id: change.doc.id,
                ...change.doc.data(),
                projectId: project.id,
                projectName: project.name,
              } as Task);
            }
          });
          const updatedTasks = Array.from(tasksMap.values()).sort(
            (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          );
          setAllTasks(updatedTasks);
          setTasksLoading(false);
        },
        (error) => {
          console.error(`Error fetching tasks for project ${project.id}:`, error);
          setTasksLoading(false);
        }
      );
    });
  
    return () => unsubscribers.forEach((unsub) => unsub());
  }, [projects, firestore]);
  

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
            (p.description && p.description.toLowerCase().includes(lowercasedQuery)) ||
            (p.jobNo && p.jobNo.toLowerCase().includes(lowercasedQuery))
        );
    }

    return userProjects;
  }, [projects, user?.role, user?.id, statusFilter, searchQuery]);

  const loading = projectsLoading || authLoading || claimsLoading || usersLoading || tasksLoading;
  
  useEffect(() => {
    if (!loading && user) {
      const shouldRedirect =
        user.role !== 'system super admin' && (user.role === '' || !user.companyId);
  
      if (shouldRedirect) {
        router.replace('/welcome');
      }
    }
  }, [user, loading, router]);
  
  if (loading || !user) {
    return (
      <div className="flex h-[calc(100vh-10rem)] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }
  
  if (user.role !== 'system super admin' && (user.role === '' || !user.companyId)) {
     return (
      <div className="flex h-[calc(100vh-10rem)] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const engineerTasks = user.role === 'engineer' 
    ? allTasks.filter(t => t.owner === user.id || t.contributors?.includes(user.id))
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
                  claims={claims || []} 
                  attendance={attendance} 
                  users={users || []} 
                  searchQuery={searchQuery}
                  setSearchQuery={setSearchQuery}
                  statusFilter={statusFilter}
                  setStatusFilter={setStatusFilter}
                />;
      case 'director':
        return <DirectorDashboard 
                  projects={filteredProjects || []} 
                  claims={claims || []} 
                  attendance={attendance} 
                  users={users || []} 
                  searchQuery={searchQuery}
                  setSearchQuery={setSearchQuery}
                  statusFilter={statusFilter}
                  setStatusFilter={setStatusFilter}
                />;
      case 'engineer':
        return <EngineerDashboard projects={engineerProjects} tasks={engineerTasks} user={user} users={users || []} />;
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
