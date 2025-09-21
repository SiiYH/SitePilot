import { notFound } from 'next/navigation';
import Image from 'next/image';
import { mockProjects } from '@/lib/data';
import { Project, User, Task, Document, Milestone } from '@/types';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import TasksTable from '@/components/dashboard/TasksTable';
import DocumentsList from '@/components/dashboard/DocumentsList';
import GenerateReportButton from '@/components/dashboard/GenerateReportButton';
import { Progress } from '@/components/ui/progress';
import { Calendar, CheckCircle, Clock, GanttChartSquare } from 'lucide-react';
import { format } from 'date-fns';

async function getProject(id: string): Promise<Project | undefined> {
  // In a real app, this would be a database query.
  return mockProjects.find(p => p.id === id);
}

// This function would typically get the current user from context/session
async function getCurrentUser(): Promise<User> {
    return { id: 'user-2', name: 'Jane Smith', email: 'admin@siteflow.com', role: 'Admin', avatarUrl: '' };
}

function OverviewTab({ project }: { project: Project }) {
    const achievedMilestones = project.milestones.filter(m => m.status === 'Achieved');
    const upcomingMilestones = project.milestones.filter(m => m.status === 'Upcoming');

    return (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            <Card className="lg:col-span-2">
                <CardHeader>
                    <CardTitle>Project Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <p className="text-muted-foreground">{project.description}</p>
                     <div>
                        <div className="mb-1 flex justify-between text-sm font-medium">
                            <span>Overall Progress</span>
                            <span className="text-muted-foreground">{project.progress}%</span>
                        </div>
                        <Progress value={project.progress} />
                    </div>
                    <div className="flex items-center text-sm text-muted-foreground">
                        <Calendar className="mr-2 h-4 w-4"/>
                        Project Deadline: {format(new Date(project.deadline), 'PPP')}
                    </div>
                </CardContent>
            </Card>
            <div className="space-y-6">
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <CheckCircle className="h-5 w-5 text-green-500" />
                            <span>Achieved Milestones</span>
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ul className="space-y-2 text-sm text-muted-foreground">
                            {achievedMilestones.map(m => (
                                <li key={m.id} className="flex justify-between">
                                    <span>{m.name}</span>
                                    <span>{format(new Date(m.date), 'MMM, yyyy')}</span>
                                </li>
                            ))}
                        </ul>
                    </CardContent>
                </Card>
                 <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Clock className="h-5 w-5 text-blue-500" />
                            <span>Upcoming Milestones</span>
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ul className="space-y-2 text-sm text-muted-foreground">
                           {upcomingMilestones.map(m => (
                                <li key={m.id} className="flex justify-between">
                                    <span>{m.name}</span>
                                    <span>{format(new Date(m.date), 'MMM, yyyy')}</span>
                                </li>
                            ))}
                        </ul>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}

export default async function ProjectDetailsPage({ params }: { params: { id: string } }) {
  const project = await getProject(params.id);
  const user = await getCurrentUser();

  if (!project) {
    notFound();
  }

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
             <GenerateReportButton project={project} />
          </div>
      </div>
      
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="tasks">Tasks</TabsTrigger>
          <TabsTrigger value="documents">Documents</TabsTrigger>
        </TabsList>
        <TabsContent value="overview" className="mt-6">
          <OverviewTab project={project} />
        </TabsContent>
        <TabsContent value="tasks" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Task Management</CardTitle>
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
