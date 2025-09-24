
import { mockProjects, mockClaims, mockUsers } from '@/lib/data';
import { Project, Claim, User } from '@/types';
import ClaimsOverview from '@/components/dashboard/views/admin/ClaimsOverview';

async function getClaims(): Promise<Claim[]> {
  return mockClaims;
}

async function getProjects(): Promise<Project[]> {
  return mockProjects;
}

async function getUsers(): Promise<User[]> {
  return mockUsers;
}

export default async function ClaimsPage() {
  const claims = await getClaims();
  const projects = await getProjects();
  const users = await getUsers();
  
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Claims Management</h2>
        <p className="text-muted-foreground">
          View and manage all payment claims.
        </p>
      </div>
      <ClaimsOverview claims={claims} projects={projects} users={users} />
    </div>
  );
}
