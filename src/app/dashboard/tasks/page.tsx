
'use client';

import { useEffect, useState, useMemo } from 'react';
import { Loader2, FolderKanban } from 'lucide-react';
import { Project, Task, User } from '@/types';
import TasksTable from '@/components/dashboard/TasksTable';
import { useAuth } from '@/hooks/use-auth';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, where, orderBy } from 'firebase/firestore';


export default function MyTasksPage() {
  const { user, company, loading: authLoading } = useAuth();
  const firestore = useFirestore();
  const [selectedProjectId, setSelectedProjectId] = useState<string>('all');

  const projectsQuery = useMemoFirebase(() => {
    if (!user || !firestore || !company?.id) return null;

    if (user.role === 'engineer') {
      return query(
        collection(firestore, 'projects'),
        where('companyId', '==', company.id),
        where('assignedEngineers', 'array-contains', user.id)
      );
    }
    
    // For admin/director, fetch all projects in the company
    return query(
      collection(firestore, 'projects'),
      where('companyId', '==', company.id)
    );
  }, [user, firestore, company?.id]);
  
  const { data: projects, isLoading: projectsLoading } = useCollection<Project>(projectsQuery);

  const companyUsersQuery = useMemoFirebase(() => {
    if (!firestore || !company?.id) return null;
    return query(collection(firestore, 'users'), where('companyId', '==', company.id));
  }, [firestore, company?.id]);
  const { data: companyUsers, isLoading: usersLoading } = useCollection<User>(companyUsersQuery);

  const allTasks = useMemo(() => {
    if (!projects) return [];

    return projects.flatMap(p => 
      (p.tasks || []).map(t => ({ ...t, projectName: p.name, projectSlug: p.slug, projectId: p.id }))
    ).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [projects]);


  const engineerTasks = useMemo(() => {
    if (user?.role !== 'engineer' || !allTasks) return [];
    return allTasks.filter(t => t.owner === user.id || t.contributors?.includes(user.id));
  }, [allTasks, user]);


  const tasksToDisplay = user?.role === 'engineer' ? engineerTasks : allTasks;


  const projectsForFilter = useMemo(() => {
    if (!tasksToDisplay) return [];
    
    const projectMap = new Map<string, { id: string; name: string }>();
    tasksToDisplay.forEach(task => {
        if (task.projectId && task.projectName && !projectMap.has(task.projectId)) {
            projectMap.set(task.projectId, { id: task.projectId, name: task.projectName });
        }
    });

    return Array.from(projectMap.values());
  }, [tasksToDisplay]);

  const filteredTasks = useMemo(() => {
    if (selectedProjectId === 'all') {
      return tasksToDisplay;
    }
    return tasksToDisplay.filter(task => task.projectId === selectedProjectId);
  }, [tasksToDisplay, selectedProjectId]);


  if (authLoading || projectsLoading || usersLoading || !user) {
    return (
      <div className="flex h-[calc(100vh-10rem)] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const pageTitle = user.role === 'engineer' ? 'My Tasks' : 'All Work Items';
  const pageDescription = user.role === 'engineer' 
    ? 'All tasks and work items assigned to you. Click a work item to view details.'
    : 'A comprehensive list of all work items across all projects in the company.';

  return (
    <div className="space-y-6">
       <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">
            {pageTitle}
          </h2>
          <p className="text-muted-foreground">
            {pageDescription}
          </p>
        </div>
        {projectsForFilter.length > 0 && (
            <div className="w-full sm:w-64">
                <Select value={selectedProjectId} onValueChange={setSelectedProjectId}>
                    <SelectTrigger>
                        <FolderKanban className="mr-2 h-4 w-4 text-muted-foreground" />
                        <SelectValue placeholder="Filter by project..." />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Projects</SelectItem>
                        {projectsForFilter.map(project => (
                            <SelectItem key={project.id} value={project.id}>
                                {project.name}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>
        )}
      </div>
        <Card>
            <CardHeader>
                <CardTitle>Work Items List</CardTitle>
            </CardHeader>
            <CardContent>
                <TasksTable tasks={filteredTasks} user={user} users={companyUsers || []} />
            </CardContent>
        </Card>
    </div>
  );
}
