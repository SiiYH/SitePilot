
'use client';

import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { Project, User, ProjectStatus, Task, Document as DocType } from '@/types';
import ProjectCard from '@/components/dashboard/ProjectCard';
import CreateProjectDialog from '@/components/dashboard/views/admin/CreateProjectDialog';
import { Loader2, Settings, List, LayoutGrid, FolderKanban, Activity, Search, Lock, Calendar as CalendarIcon, X, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, where, orderBy, doc, deleteDoc, getDocs, writeBatch } from 'firebase/firestore';
import { ref, deleteObject } from 'firebase/storage';
import ProjectList from '@/components/dashboard/ProjectList';
import { cn } from '@/lib/utils';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import ActivateLicenseDialog from '@/components/dashboard/views/admin/ActivateLicenseDialog';
import { useIsMobile } from '@/hooks/use-mobile';
import LockedOverlay from '@/components/ui/lockedOverlay';
import { DateRange } from 'react-day-picker';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format, isWithinInterval, parseISO } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { Calendar } from '@/components/ui/calendar';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';


type ViewMode = 'grid' | 'list';

export default function ProjectsPage() {
  const { user, company, isLicenseExpired, isLicenseValid } = useAuth();
  const firestore = useFirestore();
  const storage = useFirestore();
  const { toast } = useToast();
  const [localProjects, setLocalProjects] = useState<Project[]>([]);
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [date, setDate] = useState<DateRange | undefined>();
  const isMobile = useIsMobile();
  const [selectedProjects, setSelectedProjects] = useState<string[]>([]);
  
  const projectStatuses = useMemo(() => company?.projectStatuses || [], [company]);
  
  // Check if license is active
  const isLicenseActive = isLicenseValid;

  useEffect(() => {
    const savedViewMode = localStorage.getItem('sitepilot-project-view') as ViewMode;
    if (savedViewMode) {
      setViewMode(savedViewMode);
    }
  }, []);

  // Replace your projectsQuery with this version
  const projectsQuery = useMemoFirebase(() => {
    if (!firestore || !company?.id) return null;
    // Remove orderBy temporarily - we'll sort client-side
    return query(
      collection(firestore, 'projects'),
      where('companyId', '==', company.id)
    );
  }, [firestore, company?.id]);

  const usersQuery = useMemoFirebase(() => {
    if (!firestore || !company?.id) return null;
    return query(collection(firestore, 'users'), where('companyId', '==', company.id));
  }, [firestore, company?.id]);

  const { data: firestoreProjects, isLoading: loadingProjects } = useCollection<Project>(projectsQuery);
  const { data: companyUsers, isLoading: loadingUsers } = useCollection<User>(usersQuery);

  const projects = useMemo(() => {
    if (!firestoreProjects) return localProjects;
    return [...firestoreProjects].sort((a, b) => {
      const aTime = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const bTime = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return bTime - aTime;
    });
  }, [firestoreProjects, localProjects]);

  const loading = loadingProjects || loadingUsers;

  const canManageSettings = user?.role === 'admin' || user?.role === 'director';

  const handleProjectCreated = (newProject: Project) => {
    if (newProject.companyId === company?.id) {
      if (user?.role === 'engineer') {
        if (newProject.assignedEngineers.includes(user.id)) {
          setLocalProjects(prevProjects => [newProject, ...prevProjects]);
        }
      } else {
        setLocalProjects(prevProjects => [newProject, ...prevProjects]);
      }
    }
  };
  
    const handleDeleteProjects = async (projectsToDelete: Project[]) => {
        if (!firestore || !storage) {
            toast({ variant: 'destructive', title: 'Error', description: 'Database or storage service is not available.' });
            return;
        }

        try {
            const batch = writeBatch(firestore);

            for (const project of projectsToDelete) {
                // Delete subcollections (tasks, documents)
                const tasksRef = collection(firestore, 'projects', project.id, 'tasks');
                const tasksSnap = await getDocs(tasksRef);
                tasksSnap.docs.forEach(doc => batch.delete(doc.ref));

                const docsRef = collection(firestore, 'projects', project.id, 'documents');
                const docsSnap = await getDocs(docsRef);
                for (const docSnap of docsSnap.docs) {
                    const docData = docSnap.data() as DocType;
                    if (docData.path) {
                        const fileRef = ref(storage, docData.path);
                        await deleteObject(fileRef).catch(err => console.warn(`Could not delete storage file ${docData.path}:`, err));
                    }
                    batch.delete(docSnap.ref);
                }
                
                if (project.imageUrl && project.imageUrl.includes('firebasestorage')) {
                    const imageRef = ref(storage, project.imageUrl);
                    await deleteObject(imageRef).catch(err => console.warn(`Could not delete project image ${project.imageUrl}:`, err));
                }

                batch.delete(doc(firestore, 'projects', project.id));
            }
            
            await batch.commit();

            toast({ title: 'Projects Deleted', description: `${projectsToDelete.length} project(s) have been permanently removed.` });
            setSelectedProjects([]); // Clear selection after deletion
        } catch (error) {
            console.error('Error deleting project(s):', error);
            toast({ variant: 'destructive', title: 'Deletion Failed', description: 'An error occurred while deleting the project(s).' });
        }
    };


  const handleViewModeChange = (mode: ViewMode) => {
    setViewMode(mode);
    localStorage.setItem('sitepilot-project-view', mode);
  }

  const filteredProjects = useMemo(() => {
    let userProjects = user?.role === 'engineer'
      ? projects.filter(p => p.assignedEngineers.includes(user.id))
      : projects;

    if (statusFilter !== 'all') {
      userProjects = userProjects.filter(p => p.status === statusFilter);
    }
    
    if (date?.from && date?.to) {
        userProjects = userProjects.filter(p => {
          try {
            const projectStart = parseISO(p.startDate);
            const projectEnd = parseISO(p.endDate);
            const range = { start: date.from!, end: date.to! };
            return (projectStart <= range.end && projectEnd >= range.start);
          } catch {
            return false;
          }
        });
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
  }, [projects, user?.role, user?.id, statusFilter, searchQuery, date]);
  
  const currentViewMode = isMobile ? 'grid' : viewMode;

  const handleSelectProject = (projectId: string, isSelected: boolean) => {
    setSelectedProjects(prev => isSelected ? [...prev, projectId] : prev.filter(id => id !== projectId));
  };
  
  const handleSelectAll = (isSelected: boolean) => {
    setSelectedProjects(isSelected ? filteredProjects.map(p => p.id) : []);
  };

  if (loading) {
    return (
      <div className="flex h-[calc(100vh-10rem)] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">
            {user?.role === 'engineer' ? 'My Assigned Projects' : 'All Projects'}
          </h2>
          <p className="text-muted-foreground">
            View, manage, and create new projects.
          </p>
        </div>

        <div className="flex w-full items-center justify-end gap-2 flex-wrap">
            {selectedProjects.length > 0 ? (
                <AlertDialog>
                    <AlertDialogTrigger asChild>
                        <Button variant="destructive">
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete ({selectedProjects.length})
                        </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                            <AlertDialogDescription>
                                This will permanently delete {selectedProjects.length} project(s) and all their associated data. This action cannot be undone.
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction 
                                onClick={() => handleDeleteProjects(projects.filter(p => selectedProjects.includes(p.id)))}
                                className="bg-destructive hover:bg-destructive/90"
                            >
                                Yes, delete project(s)
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            ) : (
                <div className="flex items-center gap-2">
                    {user?.role !== 'engineer' && company && (
                        !company.activated || isLicenseExpired ? (
                            <ActivateLicenseDialog featureName="create projects" />
                        ) : (
                            <CreateProjectDialog users={companyUsers || []} onProjectCreated={handleProjectCreated} companyId={company.id} />
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
            )}
        </div>
      </div>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full sm:w-auto flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search projects..."
              className="pl-9 w-full"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              disabled={!isLicenseActive}
            />
        </div>
        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
            <div className="w-full sm:w-48">
            <Select value={statusFilter} onValueChange={setStatusFilter} disabled={!isLicenseActive}>
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
           <div className="w-full sm:w-auto">
              <Popover>
                  <PopoverTrigger asChild>
                  <Button
                      id="date"
                      variant={'outline'}
                      className={cn(
                      'w-full sm:w-[240px] justify-start text-left font-normal',
                      !date && 'text-muted-foreground'
                      )}
                      disabled={!isLicenseActive}
                  >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {date?.from ? (
                      date.to ? (
                          <>
                          {format(date.from, 'LLL dd, y')} - {format(date.to, 'LLL dd, y')}
                          </>
                      ) : (
                          format(date.from, 'LLL dd, y')
                      )
                      ) : (
                      <span>Pick a date range</span>
                      )}
                  </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="end">
                  <Calendar
                      initialFocus
                      mode="range"
                      defaultMonth={date?.from}
                      selected={date}
                      onSelect={setDate}
                      numberOfMonths={2}
                  />
                  </PopoverContent>
              </Popover>
          </div>
          <div className="hidden items-center gap-1 rounded-lg bg-muted p-1 sm:flex">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => handleViewModeChange('grid')}
              aria-label="Grid view"
              className={cn('h-8 w-8', currentViewMode === 'grid' && 'bg-background shadow-sm')}
              disabled={!isLicenseActive}
            >
              <LayoutGrid className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => handleViewModeChange('list')}
              aria-label="List view"
              className={cn('h-8 w-8', currentViewMode === 'list' && 'bg-background shadow-sm')}
              disabled={!isLicenseActive}
            >
              <List className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>


      {/* Projects Display with Lock Overlay */}
      <div className="relative">
        {!isLicenseActive && (
          <LockedOverlay message="Activate your license to view and manage all your projects" />
        )}
        <div className={!isLicenseActive ? 'pointer-events-none select-none' : ''}>
          {filteredProjects.length > 0 ? (
            currentViewMode === 'grid' ? (
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {filteredProjects.map(project => (
                  <ProjectCard 
                    key={project.id} 
                    project={project} 
                    onDelete={handleDeleteProjects}
                    isSelected={selectedProjects.includes(project.id)}
                    onSelect={handleSelectProject}
                  />
                ))}
              </div>
            ) : (
              <ProjectList 
                projects={filteredProjects} 
                users={companyUsers || []} 
                onDelete={handleDeleteProjects}
                selectedProjects={selectedProjects}
                onSelect={handleSelectProject}
                onSelectAll={handleSelectAll}
              />
            )
          ) : (
            <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-muted-foreground/30 bg-muted/20 p-12 text-center">
              <h3 className="text-lg font-semibold text-muted-foreground">No Projects Found</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                {searchQuery ? "No projects match your search." : (user?.role === 'engineer' ? "You have no projects matching the filter." : "Get started by creating your first project.")}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
