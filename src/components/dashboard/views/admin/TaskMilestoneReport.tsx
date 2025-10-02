
'use client';

import { useReportContext } from '@/contexts/ReportContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { format, parseISO } from 'date-fns';
import { GanttChartSquare, Milestone } from 'lucide-react';
import { cn } from '@/lib/utils';

const statusVariant: { [key: string]: 'default' | 'secondary' | 'destructive' | 'outline' } = {
  'Completed': 'default',
  'In Progress': 'secondary',
  'Overdue': 'destructive',
  'Not Started': 'outline',
};

const typeIcon: { [key: string]: React.ElementType } = {
    'Task': GanttChartSquare,
    'Milestone': Milestone
};

export default function TaskMilestoneReport() {
  const { taskMilestoneData } = useReportContext();

  return (
    <Card className="print-card">
      <CardHeader className="print-hidden">
        <CardTitle>Task &amp; Milestone Details</CardTitle>
        <CardDescription>Detailed list of work items based on the selected filters.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Work Item</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Project</TableHead>
                <TableHead>Owner</TableHead>
                <TableHead>Due Date</TableHead>
                <TableHead className="text-right">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {taskMilestoneData.length > 0 ? (
                taskMilestoneData.map((data, index) => {
                  const Icon = typeIcon[data.Type];
                  return (
                    <TableRow key={index}>
                      <TableCell className="font-medium">{data['Work Item Title']}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className='h-8'>
                          {Icon && <Icon className="h-4 w-4 mr-1 text-muted-foreground" />}
                          {data.Type}
                        </Badge>
                      </TableCell>
                      <TableCell>{data['Project Name']}</TableCell>
                      <TableCell>{data.Owner}</TableCell>
                      <TableCell>{format(parseISO(data['Due Date']), 'MMM dd, yyyy')}</TableCell>
                      <TableCell className="text-right">
                          <Badge variant={statusVariant[data.Status as keyof typeof statusVariant] || 'outline'}>
                              {data.Status}
                          </Badge>
                      </TableCell>
                    </TableRow>
                  )
                })
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="h-24 text-center">
                    No work items found for the selected filters.
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
