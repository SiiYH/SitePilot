
import { notFound } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { mockProjects, mockClaims } from '@/lib/data';
import { Project, User, Claim } from '@/types';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import TasksTable from '@/components/dashboard/TasksTable';
import DocumentsList from '@/components/dashboard/DocumentsList';
import GenerateReportButton from '@/components/dashboard/GenerateReportButton';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Calendar, CheckCircle, Clock, Edit } from 'lucide-react';
import { format } from 'date-fns';
import { Separator } from '@/components/ui/separator';

async function getProject(slug: string): Promise<Project | undefined> {
  // In a real app, this would be a database query.
  return mockProjects.find(p => p.slug === slug);
}

// This function would typically get the current user from context/session
async function getCurrentUser(): Promise<User> {
    return { id: 'user-2', name: 'Jane Smith', email: 'admin@sitepilot.com', role: 'Admin', avatarUrl: '' };
}

async function getClaimsForProject(projectId: string): Promise<Claim[]> {
  return mockClaims.filter(claim => claim.projectId === projectId);
}


const InfoField = ({ label, value, unit }: { label: string; value?: string | number | null; unit?: string }) => {
    if (!value && value !== 0) return null;
    return (
        <div className="space-y-1">
            <p className="text-sm font-medium text-muted-foreground">{label}</p>
            <p className="text-sm break-words">{value}{unit}</p>
        </div>
    );
};


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
                    <div className="flex items-center text-sm text-muted-foreground">
                        <Calendar className="mr-2 h-4 w-4"/>
                        Project Deadline: {format(new Date(project.deadline), 'PPP')}
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
                        <InfoField label="Performance Bond Amt." value={project.performanceBondAmount?.toLocaleString('en-US', { style: 'currency', currency: 'USD' })} />
                        <InfoField label="Gross Profit" value={project.grossProfit?.toLocaleString('en-US', { style: 'currency', currency: 'USD' })} />
                        <InfoField label="Margin Profit" value={project.marginProfit} unit="%" />
                        <InfoField label="Insurance Amt." value={project.insuranceAmount?.toLocaleString('en-US', { style: 'currency', currency: 'USD' })} />
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

function ClaimsTab({ claims }: { claims: Claim[] }) {
    const router = useRouter();

    const handleRowClick = (claimId: string) => {
        router.push(`/dashboard/claims/${claimId}`);
    }
    
    const statusVariant: { [key: string]: 'default' | 'secondary' | 'destructive' | 'outline' } = {
      'Paid': 'default',
      'Pending': 'secondary',
      'Overdue': 'destructive',
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle>Claims</CardTitle>
                <CardDescription>All payment claims associated with this project. Click a claim to view details.</CardDescription>
            </CardHeader>
            <CardContent>
                {claims.length > 0 ? (
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Claim ID</TableHead>
                            <TableHead>Amount</TableHead>
                            <TableHead>Date</TableHead>
                            <TableHead className="text-right">Status</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {claims.map(claim => (
                            <TableRow 
                                key={claim.id} 
                                onClick={() => handleRowClick(claim.id)}
                                className="cursor-pointer"
                            >
                                <TableCell className="font-medium">#{claim.id.split('-')[1]}</TableCell>
                                <TableCell>${claim.amount.toLocaleString()}</TableCell>
                                <TableCell>{format(new Date(claim.date), 'MMM dd, yyyy')}</TableCell>
                                <TableCell className="text-right">
                                    <Badge variant={statusVariant[claim.status] || 'outline'}>
                                        {claim.status}
                                    </Badge>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
                ) : (
                     <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-muted-foreground/30 bg-muted/20 p-12 text-center">
                        <h3 className="text-lg font-semibold text-muted-foreground">No Claims Found</h3>
                        <p className="mt-1 text-sm text-muted-foreground">There are no payment claims associated with this project yet.</p>
                    </div>
                )}
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
          <TabsTrigger value="tasks">Tasks</TabsTrigger>
          <TabsTrigger value="documents">Documents</TabsTrigger>
          <TabsTrigger value="claims">Claims</TabsTrigger>
        </TabsList>
        <TabsContent value="overview" className="mt-6">
          <OverviewTab project={project} />
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
        <TabsContent value="claims" className="mt-6">
          <ClaimsTab claims={claims} />
        </TabsContent>
      </Tabs>
    </div>
  );
}


    