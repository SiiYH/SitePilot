'use client';

import { useEffect, useState, useMemo } from 'react';
import { Loader2, FolderKanban, LayoutGrid, List, UserIcon } from 'lucide-react';
import { Project, Task, User } from '@/types';
import TasksTable from '@/components/dashboard/TasksTable';
import { useAuth } from '@/hooks/use-auth';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';

type ViewMode = 'grid' | 'list';

export default function MyTasksPage() {
  const { user, company, loading: authLoading } = useAuth();
  const firestore = useFirestore();
  const [selectedProjectId, setSelectedProjectId] = useState<string>('all');
  const [selectedUserId, setSelectedUserId] = useState<string>('all');
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [allTasksData, setAllTasksData] = useState<Task[]>([]);
  const [tasksLoading, setTasksLoading] = useState(false);
  const isMobile = useIsMobile();
  
  // Load saved view mode preference
  useEffect(() => {
    const savedViewMode = localStorage.getItem('sitepilot-tasks-view') as ViewMode;
    if (savedViewMode) {
      setViewMode(savedViewMode);
    }
  }, []);

  // Fetch company users
  const companyUsersQuery = useMemoFirebase(() => {
    if (!firestore || !company?.id) return null;
    return query(collection(firestore, 'users'), where('companyId', '==', company.id));
  }, [firestore, company?.id]);
  const { data: companyUsers, isLoading: usersLoading } = useCollection<User>(companyUsersQuery);
  
  // Fetch all projects
  const projectsQuery = useMemoFirebase(() => {
    if (!firestore || !company?.id) return null;
    return query(collection(firestore, 'projects'), where('companyId', '==', company.id));
  }, [firestore, company?.id]);
  const { data: allProjects, isLoading: projectsLoading } = useCollection<Project>(projectsQuery);

  // Get accessible projects for current user
  const accessibleProjects = useMemo(() => {
    if (!allProjects || !user) return [];
    
    // Admin/Director can access all projects
    if (user.role === 'admin' || user.role === 'director') {
      return allProjects;
    }
    
    // Engineers can only access assigned projects
    return allProjects.filter(project => 
      project.assignedEngineers?.includes(user.id)
    );
  }, [allProjects, user]);

  // Fetch tasks from all accessible projects
  useEffect(() => {
    const fetchAllTasks = async () => {
      if (!firestore || !accessibleProjects.length) {
        setAllTasksData([]);
        return;
      }

      setTasksLoading(true);
      try {
        const tasksPromises = accessibleProjects.map(async (project) => {
          const tasksQuery = query(collection(firestore, 'projects', project.id, 'tasks'));
          const snapshot = await getDocs(tasksQuery);
          
          return snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            projectId: project.id,
            projectName: project.name,
            projectSlug: project.slug,
          } as Task));
        });

        const tasksArrays = await Promise.all(tasksPromises);
        const allTasks = tasksArrays.flat();
        
        // Sort by creation date (newest first)
        allTasks.sort((a, b) => {
          const dateA = new Date(a.createdAt).getTime();
          const dateB = new Date(b.createdAt).getTime();
          return dateB - dateA;
        });

        setAllTasksData(allTasks);
      } catch (error) {
        console.error('Error fetching tasks:', error);
        setAllTasksData([]);
      } finally {
        setTasksLoading(false);
      }
    };

    fetchAllTasks();
  }, [firestore, accessibleProjects]);

  // Filter tasks based on user role and selections
  const filteredTasks = useMemo(() => {
    if (!user) return [];
    
    let tasksToDisplay = allTasksData;

    // SECURITY: Engineers can only see their own tasks
    if (user.role === 'engineer') {
      tasksToDisplay = tasksToDisplay.filter(task => 
        task.owner === user.id || task.contributors?.includes(user.id)
      );
    } 
    // Admin/Director can filter by user
    else if (selectedUserId !== 'all') {
      tasksToDisplay = tasksToDisplay.filter(task => 
        task.owner === selectedUserId || task.contributors?.includes(selectedUserId)
      );
    }

    // Filter by project (all roles)
    if (selectedProjectId !== 'all') {
      tasksToDisplay = tasksToDisplay.filter(task => task.projectId === selectedProjectId);
    }
    
    return tasksToDisplay;
  }, [allTasksData, selectedProjectId, selectedUserId, user]);

  // Projects for dropdown (only show accessible projects)
  const projectsForFilter = useMemo(() => {
    return accessibleProjects.map(p => ({ id: p.id, name: p.name }));
  }, [accessibleProjects]);
  
  // Engineers only for user filter
  const usersForFilter = useMemo(() => {
    return companyUsers?.filter(u => u.role === 'engineer') || [];
  }, [companyUsers]);

  const handleViewModeChange = (mode: ViewMode) => {
    setViewMode(mode);
    localStorage.setItem('sitepilot-tasks-view', mode);
  };

  const isLoading = authLoading || usersLoading || projectsLoading || tasksLoading;

  if (isLoading || !user) {
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

  const currentViewMode = isMobile ? 'grid' : viewMode;

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
        <div className="flex items-center gap-2 flex-wrap">
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
              className={cn('h-8 w-8', currentViewMode === 'grid' && 'bg-background shadow-sm')}
            >
              <LayoutGrid className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => handleViewModeChange('list')}
              aria-label="List view"
              className={cn('h-8 w-8', currentViewMode === 'list' && 'bg-background shadow-sm')}
            >
              <List className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>
            Work Items List
            <span className="ml-2 text-sm font-normal text-muted-foreground">
              ({filteredTasks.length} {filteredTasks.length === 1 ? 'item' : 'items'})
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <TasksTable 
            tasks={filteredTasks} 
            user={user} 
            users={companyUsers || []} 
            viewMode={currentViewMode} 
          />
        </CardContent>
      </Card>
    </div>
  );
}