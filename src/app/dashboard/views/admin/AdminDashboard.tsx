
'use client';

import { useState, useEffect } from 'react';
import ProjectCard from '@/components/dashboard/ProjectCard';
import CreateProjectDialog from './CreateProjectDialog';
import { Project, User, Claim, AttendanceRecord, ProjectStatus } from '@/types';

import { useAuth } from '@/hooks/use-auth';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { defaultProjectStatuses } from '@/lib/data';
import { Search, Activity } from 'lucide-react';
import LockedOverlay from '@/components/ui/lockedOverlay';
import ActivateLicenseDialog from '@/components/dashboard/views/admin/ActivateLicenseDialog';
import AdminAlerts from '@/components/dashboard/views/admin/AdminAlerts';
import AttendanceSummary from '@/components/dashboard/views/admin/AttendanceSummary';
import ClaimsOverview from '@/components/dashboard/views/admin/ClaimsOverview';
import ProgressOverview from '@/components/dashboard/views/admin/ProgressOverview';

interface AdminDashboardProps {
  projects: Project[];
  claims: Claim[];
  attendance: AttendanceRecord[];
  users: User[];
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  statusFilter: string;
  setStatusFilter: (status: string) => void;
}

export default function AdminDashboard({ 
  projects: initialProjects, 
  claims, 
  attendance, 
  users,
  searchQuery,
  setSearchQuery,
  statusFilter,
  setStatusFilter
}: AdminDashboardProps) {
  const [projects, setProjects] = useState<Project[]>(initialProjects);
  const { company, user, isLicenseValid, isLicenseExpired } = useAuth();
  const [projectStatuses, setProjectStatuses] = useState<ProjectStatus[]>([]);
  const isLicenseActive = isLicenseValid;

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
      <div className="relative">
        {!isLicenseActive && (
          <LockedOverlay
            user={user}
            isLicenseExpired={isLicenseExpired}
            message="Activate your license to access Admin Dashboard."
          />
        )}
        <div className={!isLicenseActive ? 'pointer-events-none select-none' : ''}>
          <div className="mb-6">
            <AdminAlerts claims={claims} unassignedTasksCount={unassignedTasks.length} />
          </div>

          <ProgressOverview projects={projects} />
        </div>
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
          {company && (
            company.activated ? (
                <CreateProjectDialog users={users} onProjectCreated={handleProjectCreated} companyId={company.id} />
            ) : (
                <ActivateLicenseDialog featureName="create projects" />
            )
        )}
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
    </div>

  );
}
