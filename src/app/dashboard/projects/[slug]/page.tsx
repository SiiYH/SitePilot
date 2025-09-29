
import { notFound } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { mockProjects, mockClaims, mockUsers } from '@/lib/data';
import { Project, User, Claim } from '@/types';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import TasksTable from '@/components/dashboard/TasksTable';
import DocumentsList from '@/components/dashboard/DocumentsList';
import GenerateReportButton from '@/components/dashboard/GenerateReportButton';
import ClaimsTab from './_components/ClaimsTab';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Calendar, CheckCircle, Clock, Edit, Users } from 'lucide-react';
import { format } from 'date-fns';
import { Separator } from '@/components/ui/separator';
import OverviewTab from './_components/OverviewTab';

async function getProject(slug: string): Promise<Project | undefined> {
  // In a real app, this would be a database query.
  return mockProjects.find(p => p.slug === slug);
}

// This function would typically get the current user from context/session
async function getCurrentUser(): Promise<User> {
    // Forcing a user for this server component. In a real app, you'd get this from your auth system (e.g. cookies).
    // Let's pretend the logged in user is the Admin for this page, but it could be any user.
    // In a real app, you would fetch the user from your authentication system, e.g. from cookies or a session.
    // The logic inside the components will then correctly show/hide elements based on the user's role.
    return mockUsers.find(u => u.role === 'Admin')!; 
}

async function getClaimsForProject(projectId: string): Promise<Claim[]> {
  return mockClaims.filter(claim => claim.projectId === projectId);
}

async function getAssignedEngineers(engineerIds: string[]): Promise<User[]> {
    return mockUsers.filter(user => engineerIds.includes(user.id));
}

const getInitials = (name: string) => {
  if (!name) return '';
  const names = name.split(' ');
  if (names.length > 1) {
    return `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase();
  }
  return name.substring(0, 2).toUpperCase();
};


function AssignedTeam({ engineers }: { engineers: User[] }) {
    if (engineers.length === 0) return null;

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5 text-primary" />
                    <span>Assigned Team</span>
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    {engineers.map(engineer => (
                        <div key={engineer.id} className="flex items-center gap-3">
                            <Avatar>
                                <AvatarImage src={engineer.avatarUrl} alt={engineer.name} />
                                <AvatarFallback>{getInitials(engineer.name)}</AvatarFallback>
                            </Avatar>
                            <div>
                                <p className="font-medium">{engineer.name}</p>
                                <p className="text-sm text-muted-foreground">{engineer.role}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    );
}

export default async function ProjectDetailsPage({ params }: { params: { slug: string } }) {
  const project = await getProject(params.slug);
  const user = await getCurrentUser();

  if (!project) {
    notFound();
  }
  
  const claims = await getClaimsForProject(project.id);
  const assignedEngineers = await getAssignedEngineers(project.assignedEngineers);
  const canEditProject = user.role === 'Admin' || user.role === 'Director';


  return (
    <div className="space-y-6">
      <div className="relative -mx-4 -mt-4 h-60 w-[calc(100%+2rem)] sm:-mx-6 sm:-mt-6 sm:w-[calc(100%+3rem)] md:h-80">
        <Image
          src={project.imageUrl}
          alt={project.name}
          fill
          className="object-cover"
          data-ai-hint={project.imageHint}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/50 to-transparent" />
      </div>
      
      <div className="space-y-2">
          <Badge>In Progress</Badge>
          <div className="flex flex-col justify-between gap-4 md:flex-row md:items-start">
             <h1 className="text-3xl font-bold tracking-tight">{project.name}</h1>
             <div className="flex flex-col gap-2 sm:flex-row">
                {canEditProject && (
                  <Button variant="outline" asChild>
                      <Link href={`/dashboard/projects/${project.slug}/edit`}>
                          <Edit className="mr-2 h-4 w-4" />
                          Edit Project
                      </Link>
                  </Button>
                )}
                <GenerateReportButton project={project} />
             </div>
          </div>
      </div>
      
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-1 h-auto sm:grid-cols-4 sm:h-10">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="claims">Claims</TabsTrigger>
          <TabsTrigger value="tasks">Tasks</TabsTrigger>
          <TabsTrigger value="documents">Documents</TabsTrigger>
        </TabsList>
        <TabsContent value="overview" className="mt-6">
          <OverviewTab project={project} engineers={assignedEngineers} user={user} />
        </TabsContent>
        <TabsContent value="claims" className="mt-6">
          <ClaimsTab claims={claims} />
        </TabsContent>
        <TabsContent value="tasks" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Task Management</CardTitle>
              <CardDescription>All tasks associated with this project.</CardDescription>
            </CardHeader>
            <CardContent>
              <TasksTable tasks={project.tasks} user={user} />
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="documents" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Document Repository</CardTitle>
              <CardDescription>All documents related to this project.</CardDescription>
            </CardHeader>
            <CardContent>
              <DocumentsList documents={project.documents} user={user} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
