
'use client';

import { notFound, useRouter } from 'next/navigation';
import Link from 'next/link';
import { mockClaims, mockProjects, mockUsers } from '@/lib/data';
import { Claim, Project, User } from '@/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, DollarSign, Calendar, GanttChartSquare, Edit, User as UserIcon } from 'lucide-react';
import { format } from 'date-fns';
import { useState, useEffect } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

async function getClaim(id: string): Promise<{ claim: Claim; project?: Project, submittedBy?: User } | undefined> {
  // In a real app, this would be a database call. We find the index to modify it later.
  const claim = mockClaims.find(c => c.id === id);
  if (!claim) {
    return undefined;
  }
  const project = mockProjects.find(p => p.id === claim.projectId);
  const submittedBy = mockUsers.find(u => u.id === claim.submittedBy);
  return { claim, project, submittedBy };
}

const getInitials = (name: string) => {
    if (!name) return '';
    const names = name.split(' ');
    if (names.length > 1) {
        return `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
};


const statusVariant: { [key: string]: 'default' | 'secondary' | 'destructive' | 'outline' } = {
  'Paid': 'default',
  'Pending': 'secondary',
  'Overdue': 'destructive',
};

const InfoField = ({ icon, label, value, children }: { icon: React.ElementType; label: string; value?: string | null; children?: React.ReactNode }) => {
    const Icon = icon;
    return (
        <div className="flex items-start gap-4">
            <Icon className="h-5 w-5 mt-1 flex-shrink-0 text-muted-foreground" />
            <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">{label}</p>
                {value && <p className="text-sm break-words">{value}</p>}
                {children}
            </div>
        </div>
    );
};

export default function ClaimDetailsPage({ params }: { params: { id: string } }) {
  const [claimData, setClaimData] = useState<{ claim: Claim; project?: Project, submittedBy?: User } | null>(null);

  useEffect(() => {
    getClaim(params.id).then(data => {
      if (data) {
        setClaimData(data);
      }
    });
  }, [params.id]);
  
  if (!claimData) {
    // This can be a loading state or the notFound() for when data is truly not there.
    // For now, we'll return null or a loader.
    return null;
  }

  const { claim, project, submittedBy } = claimData;

  const handleStatusChange = (newStatus: Claim['status']) => {
    // In a real app, you'd call an API to update this.
    // For this mock, we update the state directly.
    const claimIndex = mockClaims.findIndex(c => c.id === claim.id);
    if(claimIndex !== -1) {
        mockClaims[claimIndex].status = newStatus;
    }
    setClaimData(prevData => prevData ? { ...prevData, claim: { ...prevData.claim, status: newStatus } } : null);
  };

  return (
    <div className="space-y-6">
       <Button variant="outline" asChild>
          <Link href="/dashboard/claims">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to All Claims
          </Link>
        </Button>
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Claim Details</h2>
        <p className="text-muted-foreground">Details for claim #{claim.id.split('-')[1]}</p>
      </div>
      
      <Card>
        <CardHeader>
            <div className="flex flex-col-reverse items-start gap-4 sm:flex-row sm:items-center sm:justify-between">
                 <CardTitle>{claim.title}</CardTitle>
                 <Badge variant={statusVariant[claim.status] || 'outline'} className="text-base px-3 py-1">
                    {claim.status}
                </Badge>
            </div>
             <CardDescription>
                Submitted on {format(new Date(claim.date), 'PPP')} for {project ? <Link href={`/dashboard/projects/${project.slug}`} className="text-primary hover:underline font-medium">{project.name}</Link> : 'N/A'}
            </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                <InfoField icon={DollarSign} label="Amount">
                    <p className="text-2xl font-bold">${claim.amount.toLocaleString()}</p>
                </InfoField>

                {project && (
                     <InfoField icon={GanttChartSquare} label="Associated Project">
                        <Link href={`/dashboard/projects/${project.slug}`} className="text-primary hover:underline font-medium">
                            {project.name}
                        </Link>
                    </InfoField>
                )}
                 {submittedBy && (
                     <InfoField icon={UserIcon} label="Submitted By">
                        <div className="flex items-center gap-2">
                             <Avatar className="h-8 w-8">
                                <AvatarImage src={submittedBy.avatarUrl} alt={submittedBy.name} />
                                <AvatarFallback>{getInitials(submittedBy.name)}</AvatarFallback>
                            </Avatar>
                            <p className="font-medium">{submittedBy.name}</p>
                        </div>
                    </InfoField>
                )}
            </div>

            <Card className="bg-muted/40">
                <CardHeader>
                    <CardTitle className="text-xl">Manage Claim</CardTitle>
                    <CardDescription>Update the status of this payment claim.</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="max-w-xs">
                        <Select value={claim.status} onValueChange={handleStatusChange}>
                            <SelectTrigger>
                                <SelectValue placeholder="Set status" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="Pending">Pending</SelectItem>
                                <SelectItem value="Paid">Paid</SelectItem>
                                <SelectItem value="Overdue">Overdue</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </CardContent>
            </Card>
        </CardContent>
      </Card>
    </div>
  );
}
