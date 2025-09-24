
import { mockProjects, mockUsers } from '@/lib/data';
import { Project, User } from '@/types';
import TeamWorkload from '@/components/dashboard/views/admin/TeamWorkload';

async function getUsers(): Promise<User[]> {
  return mockUsers;
}

async function getProjects(): Promise<Project[]> {
  return mockProjects;
}

export default async function TeamPage() {
  const users = await getUsers();
  const projects = await getProjects();
  
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Team Management</h2>
        <p className="text-muted-foreground">
          Oversee team members and their assigned workload.
        </p>
      </div>
      <TeamWorkload users={users} projects={projects} />
    </div>
  );
}
