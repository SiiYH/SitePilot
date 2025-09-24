
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

async function getProject(slug: string): Promise<Project | undefined> {
  // In a real app, this would be a database query.
  return mockProjects.find(p => p.slug === slug);
}

// This function would typically get the current user from context/session
async function getCurrentUser(): Promise<User> {
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

const InfoField = ({ label, value, unit, currency }: { label: string; value?: string | number | null; unit?: string; currency?: string }) => {
    if (!value && value !== 0) return null;

    let displayValue: string | React.ReactNode = value;

    if (typeof value === 'number') {
        if (currency === 'MYR') {
            displayValue = (
                <>
                    {value.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                    <span className="ml-1 text-xs text-muted-foreground">{currency}</span>
                </>
            );
        } else if (currency) {
            displayValue = value.toLocaleString('en-US', { style: 'currency', currency, minimumFractionDigits: 0, maximumFractionDigits: 0 });
        } else {
            displayValue = value.toLocaleString();
        }
    }
    
    return (
        <div className="space-y-1">
            <p className="text-sm font-medium text-muted-foreground">{label}</p>
            <div className="text-sm break-words">{displayValue}{unit && <span className="text-muted-foreground">{unit}</span>}</div>
        </div>
    );
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


function OverviewTab({ project, engineers }: { project: Project, engineers: User[] }) {
    const achievedMilestones = project.milestones.filter(m => m.status === 'Achieved');
    const upcomingMilestones = project.milestones.filter(m => m.status === 'Upcoming');

    return (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            <Card className="lg:col-span-2">
                <CardHeader>
                    <CardTitle>Project Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div>
                        <h3 className="text-base font-semibold mb-2">Job/Site Description</h3>
                        <p className="text-muted-foreground">{project.description}</p>
                    </div>
                    <Separator/>
                     <div>
                        <div className="mb-1 flex justify-between text-sm font-medium">
                            <span>Overall Progress</span>
                            <span className="text-muted-foreground">{project.progress}%</span>
                        </div>
                        <Progress value={project.progress} />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="flex items-center text-sm text-muted-foreground">
                          <Calendar className="mr-2 h-4 w-4"/>
                          Start Date: {format(new Date(project.startDate), 'PPP')}
                      </div>
                       <div className="flex items-center text-sm text-muted-foreground">
                          <Calendar className="mr-2 h-4 w-4"/>
                          End Date: {format(new Date(project.endDate), 'PPP')}
                      </div>
                    </div>
                     <Separator/>
                    <h3 className="text-base font-semibold">Site Information</h3>
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <InfoField label="Job No." value={project.jobNo} />
                        <InfoField label="Order No." value={project.orderNo} />
                        <InfoField label="Site Name" value={project.siteName} />
                        <InfoField label="Job Location" value={project.jobLocation} />
                        <InfoField label="Distance" value={project.distance} unit=" km" />
                    </div>
                    <Separator/>
                     <h3 className="text-base font-semibold">Financials & Insurance</h3>
                     <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <InfoField label="Performance Bond No." value={project.performanceBondNo} />
                        <InfoField label="Performance Bond Amt." value={project.performanceBondAmount} currency={project.currency}/>
                        <InfoField label="Gross Profit" value={project.grossProfit} currency={project.currency} />
                        <InfoField label="Margin Profit" value={project.marginProfit} unit="%" />
                        <InfoField label="Insurance Amt." value={project.insuranceAmount} currency={project.currency} />
                        <InfoField label="Currency" value={project.currency} />
                    </div>
                </CardContent>
            </Card>
            <div className="space-y-6">
                <AssignedTeam engineers={engineers} />
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <CheckCircle className="h-5 w-5 text-green-500" />
                            <span>Achieved Milestones</span>
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {achievedMilestones.length > 0 ? (
                             <ul className="space-y-2 text-sm text-muted-foreground">
                                {achievedMilestones.map(m => (
                                    <li key={m.id} className="flex justify-between">
                                        <span>{m.name}</span>
                                        <span>{format(new Date(m.date), 'MMM, yyyy')}</span>
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <p className="text-sm text-muted-foreground">No milestones achieved yet.</p>
                        )}
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
                        {upcomingMilestones.length > 0 ? (
                            <ul className="space-y-2 text-sm text-muted-foreground">
                            {upcomingMilestones.map(m => (
                                    <li key={m.id} className="flex justify-between">
                                        <span>{m.name}</span>
                                        <span>{format(new Date(m.date), 'MMM, yyyy')}</span>
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <p className="text-sm text-muted-foreground">No upcoming milestones.</p>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
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
                <Button variant="outline" asChild>
                    <Link href={`/dashboard/projects/${project.slug}/edit`}>
                        <Edit className="mr-2 h-4 w-4" />
                        Edit Project
                    </Link>
                </Button>
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
          <OverviewTab project={project} engineers={assignedEngineers} />
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
