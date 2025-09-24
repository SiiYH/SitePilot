
'use client';

import { useState } from 'react';
import ProjectCard from '@/components/dashboard/ProjectCard';
import CreateProjectDialog from './admin/CreateProjectDialog';
import { Project, User, Claim, AttendanceRecord } from '@/types';
import { mockUsers } from '@/lib/data';
import ProgressOverview from './admin/ProgressOverview';
import ClaimsOverview from './admin/ClaimsOverview';
import AttendanceSummary from './admin/AttendanceSummary';

interface AdminDashboardProps {
  projects: Project[];
  claims: Claim[];
  attendance: AttendanceRecord[];
  users: User[];
}

export default function AdminDashboard({ projects: initialProjects, claims, attendance, users }: AdminDashboardProps) {
  const [projects, setProjects] = useState<Project[]>(initialProjects);
  const engineers = mockUsers.filter(u => u.role === 'Engineer');

  const handleProjectCreated = (newProject: Project) => {
    setProjects(prevProjects => [newProject, ...prevProjects]);
  };

  return (
    <div className="space-y-6">
      <ProgressOverview projects={projects} />
      
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
            <ClaimsOverview claims={claims} projects={projects} />
        </div>
        <div className="lg:col-span-1">
            <AttendanceSummary attendance={attendance} users={users} />
        </div>
      </div>

      <div>
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-xl font-semibold">Active Projects</h3>
          <CreateProjectDialog engineers={engineers} onProjectCreated={handleProjectCreated} />
        </div>
        {projects.length > 0 ? (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
            {projects.map(project => (
              <ProjectCard key={project.id} project={project} />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-muted-foreground/30 bg-muted/20 p-12 text-center">
            <h3 className="text-lg font-semibold text-muted-foreground">No Projects Found</h3>
            <p className="mt-1 text-sm text-muted-foreground">Get started by creating a new project.</p>
          </div>
        )}
      </div>
    </div>
  );
}
