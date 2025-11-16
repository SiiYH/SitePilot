
'use client';

import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { Project, User, ProjectStatus } from '@/types';
import ProjectCard from '@/components/dashboard/ProjectCard';
import CreateProjectDialog from '@/components/dashboard/views/admin/CreateProjectDialog';
import { Loader2, Settings, List, LayoutGrid, FolderKanban, Activity, Search, Lock, Calendar as CalendarIcon, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, where, orderBy } from 'firebase/firestore';
import ProjectList from '@/components/dashboard/ProjectList';
import { cn } from '@/lib/utils';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import ActivateLicenseDialog from '@/components/dashboard/views/admin/ActivateLicenseDialog';
import { useIsMobile } from '@/hooks/use-mobile';
import LockedOverlay from '@/components/dashboard/LockedOverlay';
import { DateRange } from 'react-day-picker';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format, isWithinInterval, parseISO } from 'date-fns';


type ViewMode = 'grid' | 'list';

export default function ProjectsPage() {
  const { user, company, isLicenseExpired, isLicenseValid } = useAuth();
  const firestore = useFirestore();
  const [localProjects, setLocalProjects] = useState<Project[]>([]);
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [date, setDate] = useState<DateRange | undefined>();
  const isMobile = useIsMobile();
  
  const projectStatuses = useMemo(() => company?.projectStatuses || [], [company]);
  
  // Check if license is active
  const isLicenseActive = isLicenseValid;

  // Locked Feature Overlay Component
  const LockedOverlay = ({ message = "Activate your license to access this feature" }: { message?: string }) => {
    const canManageLicense = user?.role === 'admin' || user?.role === 'director';
    const isExpired = isLicenseExpired;
    
    return (
      <div className="absolute inset-0 z-10 flex items-center justify-center rounded-lg bg-gradient-to-br from-background/98 via-background/95 to-background/98 backdrop-blur-md p-4 border border-destructive/20 shadow-xl overflow-hidden">
        <div className="text-center animate-in fade-in-50 slide-in-from-bottom-4 duration-500 max-w-md">
          <div className="relative mx-auto mb-6 w-20 h-20 flex items-center justify-center">
            <div className="absolute inset-[-10px] animate-pulse rounded-full bg-destructive/20 blur-xl" />
            <div className="relative flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-destructive/20 via-destructive/10 to-destructive/5 shadow-lg ring-2 ring-destructive/30 ring-offset-2 ring-offset-background">
              <Lock className="h-10 w-10 text-destructive drop-shadow-sm" />
            </div>
          </div>
          
          <p className="font-bold text-xl mb-2 bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
            {isExpired ? 'License Expired' : 'Feature Locked'}
          </p>
          
          {canManageLicense ? (
            <>
              <p className="text-sm text-muted-foreground/80 mb-6 leading-relaxed px-4">
                {isExpired 
                  ? "Your company's license has expired. Renew to restore access to all features."
                  : message
                }
              </p>
              <Button asChild size="sm" className="shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
                <Link href="/dashboard/company">
                  {isExpired ? 'Renew License' : 'Activate License'}
                </Link>
              </Button>
            </>
          ) : (
            <>
              <p className="text-sm text-muted-foreground/80 mb-4 leading-relaxed px-4">
                {isExpired 
                  ? "Your company's license has expired. This feature is unavailable until the license is renewed."
                  : "This feature is locked. Your company's license needs to be activated to access this feature."
                }
              </p>
              <div className="bg-muted/50 rounded-lg p-4 mb-4 border border-muted-foreground/20">
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Please contact your <span className="font-semibold text-foreground">Admin</span> or <span className="font-semibold text-foreground">Director</span> to {isExpired ? 'renew' : 'activate'} the company license.
                </p>
              </div>
              <Button variant="outline" size="sm" disabled className="cursor-not-allowed">
                License Management Restricted
              </Button>
            </>
          )}
        </div>
      </div>
    );
  };

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

  // const projects = firestoreProjects || localProjects;
  // Then modify the projects assignment to sort after fetching
  // Then modify the projects assignment to sort after fetching
  const projects = useMemo(() => {
    if (!firestoreProjects) return localProjects;
    // Sort by createdAt descending on the client side
    return [...firestoreProjects].sort((a, b) => {
      // Handle ISO string dates
      const aTime = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const bTime = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return bTime - aTime; // Descending order (newest first)
    });
  }, [firestoreProjects, localProjects]);

  const loading = loadingProjects || loadingUsers;

  const canManageSettings = user?.role === 'admin' || user?.role === 'director';

  const handleProjectCreated = (newProject: Project) => {
    // Optimistically add the new project to the local state
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
            // Check if project interval overlaps with the selected range
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
                  <ProjectCard key={project.id} project={project} />
                ))}
              </div>
            ) : (
              <ProjectList projects={filteredProjects} users={companyUsers || []} />
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
