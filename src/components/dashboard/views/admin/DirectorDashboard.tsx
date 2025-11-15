
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import ProjectCard from '@/components/dashboard/ProjectCard';
import CreateProjectDialog from './admin/CreateProjectDialog';
import { Project, User, Claim, AttendanceRecord, ProjectStatus } from '@/types';
import ProgressOverview from './admin/ProgressOverview';
import ClaimsOverview from './admin/ClaimsOverview';
import AttendanceSummary from './admin/AttendanceSummary';
import AdminAlerts from './admin/AdminAlerts';
import { useAuth } from '@/hooks/use-auth';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { defaultProjectStatuses } from '@/lib/data';
import { Search, Activity, ShieldAlert } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import ActivateLicenseDialog from './admin/ActivateLicenseDialog';

interface DirectorDashboardProps {
  projects: Project[];
  claims: Claim[];
  attendance: AttendanceRecord[];
  users: User[];
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  statusFilter: string;
  setStatusFilter: (status: string) => void;
}

export default function DirectorDashboard({ 
  projects: initialProjects, 
  claims, 
  attendance, 
  users,
  searchQuery,
  setSearchQuery,
  statusFilter,
  setStatusFilter
}: DirectorDashboardProps) {
  const [projects, setProjects] = useState<Project[]>(initialProjects);
  const { company, isLicenseExpired } = useAuth();
  const [projectStatuses, setProjectStatuses] = useState<ProjectStatus[]>([]);
  
  useEffect(() => {
    setProjects(initialProjects);
  }, [initialProjects]);
  
  useEffect(() => {
    const storedStatuses = localStorage.getItem('sitepilot-project-statuses');
    if (storedStatuses) {
      setProjectStatuses(JSON.parse(storedStatuses));
    } else {
      setProjectStatuses(defaultProjectStatuses);
    }
  }, []);

  const handleProjectCreated = (newProject: Project) => {
    setProjects(prevProjects => [newProject, ...prevProjects]);
  };

  const unassignedTasks = projects.flatMap(p => (p.tasks || []).filter(t => !t.owner));

  const latestProjects = projects.length > 0
    ? [...projects].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 3)
    : [];

  return (
    <div className="space-y-6">
      {!company?.activated || isLicenseExpired ? (
         <Alert variant="destructive">
          <ShieldAlert className="h-4 w-4" />
          <AlertTitle>
            {isLicenseExpired ? "License Expired" : "License Not Active"}
          </AlertTitle>
          <AlertDescription className='flex flex-col sm:flex-row sm:items-center sm:justify-between'>
            <span>
              {isLicenseExpired
                ? "Your company's license has expired. Some features are disabled."
                : "Your company's license is inactive. Some features may be disabled."
              }
            </span>
             <Button asChild variant="link" className="p-0 h-auto text-destructive-foreground">
              <Link href="/dashboard/company">Activate License</Link>
            </Button>
          </AlertDescription>
        </Alert>
      ) : null}
      <AdminAlerts claims={claims} unassignedTasksCount={unassignedTasks.length} />
      <ProgressOverview projects={projects} />
      
      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        <div className="md:col-span-2">
            <ClaimsOverview claims={claims} projects={projects} />
        </div>
        <div className="md:col-span-1">
            <AttendanceSummary />
        </div>
      </div>

      <div>
        <div className="mb-4 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <h3 className="text-xl font-semibold">Latest Projects</h3>
            <p className="text-sm text-muted-foreground">The most recently created projects in your workspace.</p>
          </div>
          <div className='flex items-center gap-2 flex-wrap'>
            {company && (
              !company.activated || isLicenseExpired ? (
                <ActivateLicenseDialog featureName="create projects" />
              ) : (
                <CreateProjectDialog users={users} onProjectCreated={handleProjectCreated} companyId={company.id} />
              )
            )}
          </div>
        </div>
        {latestProjects.length > 0 ? (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
             {latestProjects.map(project => (
              <ProjectCard key={project.id} project={project} />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-muted-foreground/30 bg-muted/20 p-12 text-center">
            <h3 className="text-lg font-semibold text-muted-foreground">No Projects Found</h3>
             <p className="mt-1 text-sm text-muted-foreground">
              Get started by creating a new project.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}



