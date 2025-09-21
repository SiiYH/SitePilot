import { mockProjects, mockUsers } from '@/lib/data';
import { Project, User } from '@/types';
import AdminDashboard from '@/components/dashboard/views/AdminDashboard';
import DirectorDashboard from '@/components/dashboard/views/DirectorDashboard';
import EngineerDashboard from '@/components/dashboard/views/EngineerDashboard';

async function getCurrentUser(): Promise<User | undefined> {
  // For demo purposes, we'll hardcode the admin user.
  // In a real app, you would get this from your auth provider.
  // To test other roles, change 'Admin' to 'Engineer' or 'Director'
  return mockUsers.find(u => u.role === 'Admin');
}

async function getProjectsForUser(user: User): Promise<Project[]> {
  if (user.role === 'Admin' || user.role === 'Director') {
    return mockProjects;
  }
  if (user.role === 'Engineer') {
    return mockProjects.filter(p => p.assignedEngineers.includes(user.id));
  }
  return [];
}

function getTasksForUser(user: User): Project['tasks'] {
    if (user.role === 'Engineer') {
        return mockProjects.flatMap(p => p.tasks.filter(t => t.assignedTo === user.id));
    }
    return [];
}


export default async function DashboardPage() {
  const user = await getCurrentUser();
  
  if (!user) {
    return <div>Could not load user data.</div>;
  }
  
  const projects = await getProjectsForUser(user);
  const tasks = getTasksForUser(user);

  const renderDashboard = () => {
    switch (user.role) {
      case 'Admin':
        return <AdminDashboard projects={projects} />;
      case 'Director':
        return <DirectorDashboard projects={projects} />;
      case 'Engineer':
        return <EngineerDashboard tasks={tasks} user={user} />;
      default:
        return <div>Welcome! Your dashboard is being set up.</div>;
    }
  }

  return (
    <div className="space-y-6">
       <div>
        <h2 className="text-2xl font-bold tracking-tight">
          {user.role} Dashboard
        </h2>
        <p className="text-muted-foreground">
          Welcome, {user.name}. Here's your overview.
        </p>
      </div>
      {renderDashboard()}
    </div>
  );
}
