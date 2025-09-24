
'use client';

import { useState } from 'react';
import { mockProjects, mockUsers } from '@/lib/data';
import { Project, User } from '@/types';
import ProjectCard from '@/components/dashboard/ProjectCard';
import CreateProjectDialog from '@/components/dashboard/views/admin/CreateProjectDialog';

export default function ProjectsPage() {
  // Although we get initial projects, we use state to allow for dynamic adding.
  const [projects, setProjects] = useState<Project[]>(mockProjects);
  const engineers = mockUsers.filter(u => u.role === 'Engineer');

  const handleProjectCreated = (newProject: Project) => {
    setProjects(prevProjects => [newProject, ...prevProjects]);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <div>
            <h2 className="text-2xl font-bold tracking-tight">All Projects</h2>
            <p className="text-muted-foreground">
                View, manage, and create new projects.
            </p>
        </div>
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
          <p className="mt-1 text-sm text-muted-foreground">Get started by creating your first project.</p>
        </div>
      )}
    </div>
  );
}
