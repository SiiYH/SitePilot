
'use client';

import { useEffect, useState, useMemo } from 'react';
import { Loader2, FolderKanban, User as UserIcon, LayoutGrid, List } from 'lucide-react';
import { Project, Task, User } from '@/types';
import TasksTable from '@/components/dashboard/TasksTable';
import { useAuth } from '@/hooks/use-auth';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

type ViewMode = 'grid' | 'list';

async function getAllTasks(firestore: any, companyId: string): Promise<Task[]> {
  if (!firestore || !companyId) return [];
  const projectsQuery = query(collection(firestore, 'projects'), where('companyId', '==', companyId));
  const projectsSnapshot = await getDocs(projectsQuery);
  
  let allTasks: Task[] = [];
  for (const projectDoc of projectsSnapshot.docs) {
    const project = { id: projectDoc.id, ...projectDoc.data() } as Project;
    const tasksQuery = query(collection(firestore, 'projects', project.id, 'tasks'));
    const tasksSnapshot = await getDocs(tasksQuery);
    const projectTasks = tasksSnapshot.docs.map(doc => ({ ...doc.data(), id: doc.id, projectId: project.id, projectName: project.name, projectSlug: project.slug } as Task));
    allTasks = [...allTasks, ...projectTasks];
  }
  return allTasks.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export default function MyTasksPage() {
  const { user, company, loading: authLoading } = useAuth();
  const firestore = useFirestore();
  const [selectedProjectId, setSelectedProjectId] = useState<string>('all');
  const [selectedUserId, setSelectedUserId] = useState<string>('all');
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [allTasks, setAllTasks] = useState<Task[]>([]);
  const [tasksLoading, setTasksLoading] = useState(true);
  
  useEffect(() => {
    const savedViewMode = localStorage.getItem('sitepilot-tasks-view') as ViewMode;
    if (savedViewMode) {
      setViewMode(savedViewMode);
    }
  }, []);

  const companyUsersQuery = useMemoFirebase(() => {
    if (!firestore || !company?.id) return null;
    return query(collection(firestore, 'users'), where('companyId', '==', company.id));
  }, [firestore, company?.id]);
  const { data: companyUsers, isLoading: usersLoading } = useCollection<User>(companyUsersQuery);
  
  useEffect(() => {
    if (firestore && company?.id) {
      setTasksLoading(true);
      getAllTasks(firestore, company.id).then(tasks => {
        setAllTasks(tasks);
        setTasksLoading(false);
      });
    }
  }, [firestore, company?.id]);


  const filteredTasks = useMemo(() => {
    let tasksToDisplay = allTasks;

    // Default filter for engineers
    if (user?.role === 'engineer') {
      tasksToDisplay = tasksToDisplay.filter(t => t.owner === user.id || t.contributors?.includes(user.id));
    } 
    // Filter by selected user for admins/directors
    else if (selectedUserId !== 'all') {
      tasksToDisplay = tasksToDisplay.filter(task => task.owner === selectedUserId || task.contributors?.includes(selectedUserId));
    }

    // Filter by selected project for all roles
    if (selectedProjectId !== 'all') {
      tasksToDisplay = tasksToDisplay.filter(task => task.projectId === selectedProjectId);
    }
    
    return tasksToDisplay;
  }, [allTasks, selectedProjectId, selectedUserId, user]);


  const projectsForFilter = useMemo(() => {
    if (!allTasks) return [];
    
    const projectMap = new Map<string, { id: string; name: string }>();
    allTasks.forEach(task => {
        if (task.projectId && task.projectName && !projectMap.has(task.projectId)) {
            projectMap.set(task.projectId, { id: task.projectId, name: task.projectName });
        }
    });

    return Array.from(projectMap.values());
  }, [allTasks]);
  
  const usersForFilter = companyUsers?.filter(u => u.role === 'engineer') || [];

  const handleViewModeChange = (mode: ViewMode) => {
    setViewMode(mode);
    localStorage.setItem('sitepilot-tasks-view', mode);
  }

  if (authLoading || usersLoading || tasksLoading || !user) {
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
        <div className='flex items-center gap-2 flex-wrap'>
          <div className="w-full sm:w-48">
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
          {user.role !== 'engineer' && (
            <div className="w-full sm:w-48">
              <Select value={selectedUserId} onValueChange={setSelectedUserId}>
                  <SelectTrigger>
                      <UserIcon className="mr-2 h-4 w-4 text-muted-foreground" />
                      <SelectValue placeholder="Filter by user..." />
                  </SelectTrigger>
                  <SelectContent>
                      <SelectItem value="all">All Users</SelectItem>
                      {usersForFilter.map(u => (
                          <SelectItem key={u.id} value={u.id}>
                              {u.name}
                          </SelectItem>
                      ))}
                  </SelectContent>
              </Select>
            </div>
          )}
           <div className="hidden items-center gap-1 rounded-lg bg-muted p-1 sm:flex">
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleViewModeChange('grid')}
                    aria-label="Grid view"
                    className={cn('h-8 w-8', viewMode === 'grid' && 'bg-background shadow-sm')}
                >
                    <LayoutGrid className="h-4 w-4" />
                </Button>
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleViewModeChange('list')}
                    aria-label="List view"
                    className={cn('h-8 w-8', viewMode === 'list' && 'bg-background shadow-sm')}
                >
                    <List className="h-4 w-4" />
                </Button>
            </div>
        </div>
      </div>
        <Card>
            <CardHeader>
                <CardTitle>Work Items List</CardTitle>
            </CardHeader>
            <CardContent>
                <TasksTable tasks={filteredTasks} user={user} users={companyUsers || []} viewMode={viewMode} />
            </CardContent>
        </Card>
    </div>
  );
}
