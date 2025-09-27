
import { mockUsers, mockProjects, mockClaims } from '@/lib/data';
import { User, Project, Claim } from '@/types';
import EngineerSummaryReport from '@/components/dashboard/views/admin/EngineerSummaryReport';

async function getData(): Promise<{ users: User[], projects: Project[], claims: Claim[] }> {
  const users = mockUsers;
  const projects = mockProjects;
  const claims = mockClaims;
  return { users, projects, claims };
}

export default async function EngineerSummaryPage() {
  const { users, projects, claims } = await getData();

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Engineer Summary Report</h2>
        <p className="text-muted-foreground">
          A summary of performance and financial metrics for each engineer.
        </p>
      </div>
      <EngineerSummaryReport users={users} projects={projects} claims={claims} />
    </div>
  );
}
