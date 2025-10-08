
'use client';

import { useState, useEffect } from 'react';
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
import { Search, Activity } from 'lucide-react';

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
  const { company } = useAuth();
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

  const engineers = users.filter(u => u.role === 'Engineer');

  const handleProjectCreated = (newProject: Project) => {
    setProjects(prevProjects => [newProject, ...prevProjects]);
  };

  const unassignedTasks = projects.flatMap(p => (p.tasks || []).filter(t => !t.owner));

  return (
    <div className="space-y-6">
      <AdminAlerts claims={claims} unassignedTasksCount={unassignedTasks.length} />
      <ProgressOverview projects={projects} />
      
      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        <div className="md:col-span-2">
            <ClaimsOverview claims={claims} projects={projects} users={users} />
        </div>
        <div className="md:col-span-1">
            <AttendanceSummary attendance={attendance} users={users} />
        </div>
      </div>

      <div>
        <div className="mb-4 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <h3 className="text-xl font-semibold">Projects Overview</h3>
            <p className="text-sm text-muted-foreground">Search, filter, and manage all projects.</p>
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
            {company && <CreateProjectDialog engineers={engineers} onProjectCreated={handleProjectCreated} companyId={company.id} />}
          </div>
        </div>
        {projects.length > 0 ? (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
            {projects.map(project => (
              <ProjectCard key={project.id} project={project} />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-muted-foreground/30 bg-muted/20 p-12 text-center">
            <h3 className="text-lg font-semibold text-muted-foreground">No Projects Found</h3>
             <p className="mt-1 text-sm text-muted-foreground">
              {searchQuery || statusFilter !== 'all' ? "No projects match your current filters." : "Get started by creating a new project."}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
