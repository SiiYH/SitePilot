
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import ProjectCard from '@/components/dashboard/ProjectCard';
import { Project, User, Claim, AttendanceRecord, ProjectStatus } from '@/types';
import { useAuth } from '@/hooks/use-auth';
import { defaultProjectStatuses } from '@/lib/data';
import { ShieldAlert, Lock } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import ActivateLicenseDialog from './admin/ActivateLicenseDialog';
import AdminAlerts from './admin/AdminAlerts';
import AttendanceSummary from './admin/AttendanceSummary';
import ClaimsOverview from './admin/ClaimsOverview';
import CreateProjectDialog from './admin/CreateProjectDialog';
import ProgressOverview from './admin/ProgressOverview';
import LockedOverlay from '@/components/ui/lockedOverlay';

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
  const { user, company, isLicenseValid, isLicenseExpired } = useAuth();
  const [projectStatuses, setProjectStatuses] = useState<ProjectStatus[]>([]);

  // Use the combined check from useAuth
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

  const unassignedTasks = isLicenseActive
    ? projects.flatMap(p => (p.tasks || []).filter(t => !t.owner))
    : [];

  const latestProjects = isLicenseActive && projects.length > 0
    ? [...projects].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 3)
    : [];

  return (
    <div className="space-y-6">
      {/* License Alert */}
      {!isLicenseActive && (
        <Alert variant="destructive" className="border-2">
          <ShieldAlert className="h-5 w-5" />
          <AlertTitle className="text-lg">
            {isLicenseExpired ? 'License Expired' : 'License Not Active'}
          </AlertTitle>
          <AlertDescription className='flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3'>
            <span>
              {isLicenseExpired
                ? "Your company's license has expired. Renew to restore access to all features."
                : "Your company's license is inactive. Features are disabled until activation."
              }
            </span>
            <Button asChild variant="outline" size="sm" className="bg-destructive-foreground/10 hover:bg-destructive-foreground/20 shrink-0">
              <Link href="/dashboard/company">
                {isLicenseExpired ? 'Renew License' : 'Activate License'}
              </Link>
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* Admin Alerts - Only show if active */}
      {isLicenseActive && (
        <AdminAlerts claims={claims} unassignedTasksCount={unassignedTasks.length} />
      )}

      {/* Progress Overview - Locked if inactive */}
      <div className="relative">
        <div className="relative">
          {!isLicenseActive && (
            <LockedOverlay
              user={user}
              isLicenseExpired={isLicenseExpired}
              message="Activate your license to access Progress Overview."
            />
          )}
          <div className={!isLicenseActive ? 'pointer-events-none select-none' : ''}>
            <ProgressOverview projects={isLicenseActive ? projects : []} />
          </div>
        </div>
      </div>

      {/* Claims & Attendance Grid */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        {/* Claims Overview */}
        <div className="md:col-span-2 relative">
          <div className="relative">
            {!isLicenseActive && (
              <LockedOverlay
                user={user}
                isLicenseExpired={isLicenseExpired}
                message="Activate your license to access Claims Overview."
              />
            )}
            <div className={!isLicenseActive ? 'pointer-events-none select-none' : ''}>
              <ClaimsOverview
                claims={isLicenseActive ? claims : []}
                projects={isLicenseActive ? projects : []}
              />
            </div>
          </div>
        </div>

        {/* Attendance Summary */}
        <div className="md:col-span-1 relative">
          <div className="relative">
            {!isLicenseActive && (
              <LockedOverlay
                user={user}
                isLicenseExpired={isLicenseExpired}
                message="Activate your license to access Attendance Summary."
              />
            )}
            <div className={!isLicenseActive ? 'pointer-events-none select-none' : ''}>
              <AttendanceSummary
              />
            </div>
          </div>
        </div>
      </div>

      {/* Latest Projects Section */}
      <div>
        <div className="mb-4 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <h3 className="text-xl font-semibold">Latest Projects</h3>
            <p className="text-sm text-muted-foreground">
              The most recently created projects in your workspace.
            </p>
          </div>
          <div className='flex items-center gap-2 flex-wrap'>
            {company && (
              isLicenseActive ? (
                <CreateProjectDialog
                  users={users}
                  onProjectCreated={handleProjectCreated}
                  companyId={company.id}
                />
              ) : (
                <ActivateLicenseDialog featureName="create projects" />
              )
            )}
          </div>
        </div>

        {/* Projects Display */}
        <div className="relative">
          {!isLicenseActive && (
            <LockedOverlay
              user={user}
              isLicenseExpired={isLicenseExpired}
              message="Activate your license to access Latest Projects."
            />
          )}
          <div className={!isLicenseActive ? 'pointer-events-none select-none' : ''}>
            {latestProjects.length > 0 ? (
              // Show projects if active
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                {latestProjects.map(project => (
                  <ProjectCard key={project.id} project={project} />
                ))}
              </div>
            ) : (
              // Empty state if active but no projects
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
    </div>
  );
}
