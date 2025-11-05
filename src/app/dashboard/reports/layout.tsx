'use client';

import { ReportProvider } from '@/contexts/ReportContext';
import { useAuth } from '@/hooks/use-auth';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, where, QueryConstraint, getDocs } from 'firebase/firestore';
import { Claim, Project, User, Task } from '@/types';
import { Loader2 } from 'lucide-react';
import { useState, useEffect } from 'react';

export default function ReportsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { company, loading: authLoading, user } = useAuth();
  const firestore = useFirestore();
  const [allTasks, setAllTasks] = useState<Task[]>([]);
  const [tasksLoading, setTasksLoading] = useState(true);

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

  useEffect(() => {
    const fetchAllTasks = async () => {
      if (!projects || projects.length === 0 || !firestore) {
        setTasksLoading(false);
        return;
      }
      setTasksLoading(true);
      try {
        const tasksPromises = projects.map(async (project) => {
          const tasksRef = collection(firestore, 'projects', project.id, 'tasks');
          const tasksSnap = await getDocs(tasksRef);
          return tasksSnap.docs.map(doc => ({
            ...(doc.data() as Task),
            id: doc.id,
            projectId: project.id,
            projectName: project.name
          }));
        });
  
        const allTasksArrays = await Promise.all(tasksPromises);
        setAllTasks(allTasksArrays.flat());
      } catch (error) {
        console.error("Error fetching tasks for reports:", error);
        setAllTasks([]);
      } finally {
        setTasksLoading(false);
      }
    };
  
    fetchAllTasks();
  }, [projects, firestore]);

  const loading = authLoading || projectsLoading || claimsLoading || usersLoading || tasksLoading;
  
  const reportData = {
    users: users || [],
    projects: projects || [],
    claims: claims || [],
    tasks: allTasks || [],
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
