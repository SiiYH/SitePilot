import { mockProjects, mockUsers } from '@/lib/data';
import { Project, User } from '@/types';
import ProjectCard from '@/components/dashboard/ProjectCard';

// This function would typically fetch user data from a session or context
async function getCurrentUser(): Promise<User | undefined> {
  // For demo purposes, we'll hardcode the admin user.
  // In a real app, you would get this from your auth provider.
  return mockUsers.find(u => u.role === 'Admin');
}

async function getProjectsForUser(user: User): Promise<Project[]> {
  // In a real app, this would be a database query.
  if (user.role === 'Admin' || user.role === 'Director') {
    return mockProjects;
  }
  if (user.role === 'Engineer') {
    return mockProjects.filter(p => p.assignedEngineers.includes(user.id));
  }
  return [];
}

export default async function DashboardPage() {
  const user = await getCurrentUser();
  
  if (!user) {
    return <div>Could not load user data.</div>;
  }
  
  const projects = await getProjectsForUser(user);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Active Projects</h2>
        <p className="text-muted-foreground">
          An overview of all projects you have access to.
        </p>
      </div>
      
      {projects.length > 0 ? (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
          {projects.map(project => (
            <ProjectCard key={project.id} project={project} />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-muted-foreground/30 bg-muted/20 p-12 text-center">
            <h3 className="text-lg font-semibold text-muted-foreground">No Projects Assigned</h3>
            <p className="mt-1 text-sm text-muted-foreground">You are not currently assigned to any active projects.</p>
        </div>
      )}
    </div>
  );
}
