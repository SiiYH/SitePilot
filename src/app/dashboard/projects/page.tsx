
'use client';

import { useState, useEffect } from 'react';
import { mockProjects, mockUsers } from '@/lib/data';
import { Project, User } from '@/types';
import ProjectCard from '@/components/dashboard/ProjectCard';
import CreateProjectDialog from '@/components/dashboard/views/admin/CreateProjectDialog';
import { useAuth } from '@/hooks/use-auth';
import { Loader2, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function ProjectsPage() {
  const { user, company } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  
  const engineers = mockUsers.filter(u => u.role === 'Engineer' && u.companyId === company?.id);
  const canManageSettings = user?.role === 'Admin' || user?.role === 'Director';


  useEffect(() => {
    if (user && company) {
      const companyProjects = mockProjects.filter(p => p.companyId === company.id);

      if (user.role === 'Engineer') {
        const engineerProjects = companyProjects.filter(p => p.assignedEngineers.includes(user.id));
        setProjects(engineerProjects);
      } else {
        setProjects(companyProjects);
      }
      setLoading(false);
    } else if (!company) {
      // If there's a user but no company, they shouldn't see any projects
      setLoading(false);
      setProjects([]);
    }
  }, [user, company]);

  const handleProjectCreated = (newProject: Project) => {
    // Only add project if it belongs to the current company
    if (newProject.companyId === company?.id) {
        if (user?.role === 'Engineer') {
          if (newProject.assignedEngineers.includes(user.id)) {
            setProjects(prevProjects => [newProject, ...prevProjects]);
          }
        } else {
          setProjects(prevProjects => [newProject, ...prevProjects]);
        }
    }
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
      <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <div>
            <h2 className="text-2xl font-bold tracking-tight">
              {user?.role === 'Engineer' ? 'My Assigned Projects' : 'All Projects'}
            </h2>
            <p className="text-muted-foreground">
                View, manage, and create new projects.
            </p>
        </div>
        <div className='flex gap-2'>
            {user?.role !== 'Engineer' && company && (
                <CreateProjectDialog engineers={engineers} onProjectCreated={handleProjectCreated} companyId={company.id} />
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

      {projects.length > 0 ? (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
          {projects.map(project => (
            <ProjectCard key={project.id} project={project} />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-muted-foreground/30 bg-muted/20 p-12 text-center">
          <h3 className="text-lg font-semibold text-muted-foreground">No Projects Found</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            {user?.role === 'Engineer' ? "You are not assigned to any projects yet." : "Get started by creating your first project."}
          </p>
        </div>
      )}
    </div>
  );
}
