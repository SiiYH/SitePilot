
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { mockClaims, mockProjects } from '@/lib/data';
import { Claim, Project } from '@/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ArrowLeft, DollarSign, Calendar, GanttChartSquare } from 'lucide-react';
import { format } from 'date-fns';

async function getClaim(id: string): Promise<{ claim: Claim; project?: Project } | undefined> {
  const claim = mockClaims.find(c => c.id === id);
  if (!claim) {
    return undefined;
  }
  const project = mockProjects.find(p => p.id === claim.projectId);
  return { claim, project };
}

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

export default async function ClaimDetailsPage({ params }: { params: { id: string } }) {
  const data = await getClaim(params.id);

  if (!data) {
    notFound();
  }

  const { claim, project } = data;

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
            <div className="flex items-center justify-between">
                 <CardTitle>Claim from {project ? project.name : 'N/A'}</CardTitle>
                 <Badge variant={statusVariant[claim.status] || 'outline'} className="text-base px-3 py-1">
                    {claim.status}
                </Badge>
            </div>
             <CardDescription>
                Submitted on {format(new Date(claim.date), 'PPP')}
            </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
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
            </div>
        </CardContent>
      </Card>
    </div>
  );
}
