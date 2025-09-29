
'use client';

import { useReportContext } from '@/contexts/ReportContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { format, parseISO } from 'date-fns';
import { useAuth } from '@/hooks/use-auth';
import { Progress } from '@/components/ui/progress';

export default function ProjectStatusReport() {
  const { projectStatusData } = useReportContext();
  const { user } = useAuth();
  const canViewFinancials = user?.role === 'Admin' || user?.role === 'Director';

  const statusVariant: { [key: string]: 'default' | 'secondary' | 'destructive' } = {
      'Completed': 'default',
      'In Progress': 'secondary',
      'Overdue': 'destructive',
  };

  return (
    <Card className="print-card">
      <CardHeader className="print-hidden">
        <CardTitle>Project Details</CardTitle>
        <CardDescription>Detailed list of projects based on the selected filters.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Project Name</TableHead>
                <TableHead>Progress</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Start Date</TableHead>
                <TableHead>End Date</TableHead>
                <TableHead>Assigned Engineers</TableHead>
                {canViewFinancials && <TableHead className="text-right">Gross Profit</TableHead>}
                {canViewFinancials && <TableHead className="text-right">Margin (%)</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {projectStatusData.length > 0 ? (
                projectStatusData.map((data, index) => (
                  <TableRow key={index}>
                    <TableCell className="font-medium">{data['Project Name']}</TableCell>
                    <TableCell>
                        <div className='flex flex-col items-start gap-1 w-24'>
                             <span className='text-xs font-medium text-muted-foreground'>{data.Progress}%</span>
                             <Progress value={data.Progress} className="h-2 w-full" />
                        </div>
                    </TableCell>
                    <TableCell>
                        <Badge variant={statusVariant[data.Status as keyof typeof statusVariant] || 'outline'}>
                            {data.Status}
                        </Badge>
                    </TableCell>
                    <TableCell>{format(parseISO(data['Start Date']), 'MMM dd, yyyy')}</TableCell>
                    <TableCell>{format(parseISO(data['End Date']), 'MMM dd, yyyy')}</TableCell>
                    <TableCell>{data['Assigned Engineers']}</TableCell>
                    {canViewFinancials && (
                        <TableCell className="text-right">
                           <span className='text-xs text-muted-foreground'>{data.Currency} </span>
                           {data['Gross Profit'].toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </TableCell>
                    )}
                    {canViewFinancials && <TableCell className="text-right">{data['Margin Profit (%)']}%</TableCell>}
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={canViewFinancials ? 8 : 6} className="h-24 text-center">
                    No projects found for the selected filters.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
