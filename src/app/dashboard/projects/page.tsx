

'use client';

import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { defaultProjectStatuses } from '@/lib/data';
import { Project, User, ProjectStatus } from '@/types';
import ProjectCard from '@/components/dashboard/ProjectCard';
import CreateProjectDialog from '@/components/dashboard/views/admin/CreateProjectDialog';
import { Loader2, Settings, List, LayoutGrid, FolderKanban, Activity, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, where } from 'firebase/firestore';
import ProjectList from '@/components/dashboard/ProjectList';
import { cn } from '@/lib/utils';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import ActivateLicenseDialog from '@/components/dashboard/views/admin/ActivateLicenseDialog';


type ViewMode = 'grid' | 'list';

export default function ProjectsPage() {
  const { user, company } = useAuth();
  const firestore = useFirestore();
  const [localProjects, setLocalProjects] = useState<Project[]>([]);
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [projectStatuses, setProjectStatuses] = useState<ProjectStatus[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  
  useEffect(() => {
    const storedStatuses = localStorage.getItem('sitepilot-project-statuses');
    if (storedStatuses) {
      setProjectStatuses(JSON.parse(storedStatuses));
    } else {
      setProjectStatuses(defaultProjectStatuses);
    }
    
    const savedViewMode = localStorage.getItem('sitepilot-project-view') as ViewMode;
    if (savedViewMode) {
        setViewMode(savedViewMode);
    }
  }, []);
  
  const projectsQuery = useMemoFirebase(() => {
    if (!firestore || !company?.id) return null;
    return query(collection(firestore, 'projects'), where('companyId', '==', company.id));
  }, [firestore, company?.id]);

  const usersQuery = useMemoFirebase(() => {
    if (!firestore || !company?.id) return null;
    return query(collection(firestore, 'users'), where('companyId', '==', company.id));
  }, [firestore, company?.id]);

  const { data: firestoreProjects, isLoading: loadingProjects } = useCollection<Project>(projectsQuery);
  const { data: companyUsers, isLoading: loadingUsers } = useCollection<User>(usersQuery);

  const projects = firestoreProjects || localProjects;
  
  const loading = loadingProjects || loadingUsers;

  const canManageSettings = user?.role === 'Admin' || user?.role === 'Director';

  const handleProjectCreated = (newProject: Project) => {
    // Optimistically add the new project to the local state
    if (newProject.companyId === company?.id) {
        if (user?.role === 'Engineer') {
          if (newProject.assignedEngineers.includes(user.id)) {
            setLocalProjects(prevProjects => [newProject, ...prevProjects]);
          }
        } else {
          setLocalProjects(prevProjects => [newProject, ...prevProjects]);
        }
    }
  };

  const handleViewModeChange = (mode: ViewMode) => {
    setViewMode(mode);
    localStorage.setItem('sitepilot-project-view', mode);
  }

  const filteredProjects = useMemo(() => {
    let userProjects = user?.role === 'Engineer'
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

  if (loading) {
     return (
      <div className="flex h-[calc(100vh-10rem)] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <div>
            <h2 className="text-2xl font-bold tracking-tight">
              {user?.role === 'Engineer' ? 'My Assigned Projects' : 'All Projects'}
            </h2>
            <p className="text-muted-foreground">
                View, manage, and create new projects.
            </p>
        </div>
        <div className='flex items-center gap-2 flex-wrap'>
             <div className="relative w-full sm:w-auto">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                    type="search"
                    placeholder="Search projects..."
                    className="pl-9 w-full sm:w-64"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                />
            </div>
             <div className="w-full sm:w-48">
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger>
                        <Activity className="mr-2 h-4 w-4 text-muted-foreground" />
                        <SelectValue placeholder="Filter by status..." />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Statuses</SelectItem>
                        {projectStatuses.map(status => (
                            <SelectItem key={status.id} value={status.id}>
                                {status.name}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>
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
            {user?.role !== 'Engineer' && company && (
              company.activated ? (
                <CreateProjectDialog users={companyUsers || []} onProjectCreated={handleProjectCreated} companyId={company.id} />
              ) : (
                <ActivateLicenseDialog featureName="create projects" />
              )
            )}
            {canManageSettings && (
                <Button variant="outline" asChild>
                    <Link href="/dashboard/settings">
                        <Settings className="mr-2 h-4 w-4" />
                        Settings
                    </Link>
                </Button>
            )}
        </div>
      </div>

      {filteredProjects.length > 0 ? (
        viewMode === 'grid' ? (
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filteredProjects.map(project => (
                <ProjectCard key={project.id} project={project} />
            ))}
            </div>
        ) : (
            <ProjectList projects={filteredProjects} />
        )
      ) : (
        <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-muted-foreground/30 bg-muted/20 p-12 text-center">
          <h3 className="text-lg font-semibold text-muted-foreground">No Projects Found</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            {searchQuery ? "No projects match your search." : (user?.role === 'Engineer' ? "You have no projects matching the filter." : "Get started by creating your first project.")}
          </p>
        </div>
      )}
    </div>
  );
}
