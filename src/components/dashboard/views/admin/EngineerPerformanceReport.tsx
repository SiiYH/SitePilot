
'use client';

import { useReportContext } from '@/contexts/ReportContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

export default function EngineerPerformanceReport() {
  const { performanceData } = useReportContext();

  return (
    <Card className="print-card">
      <CardHeader className="print-hidden">
        <CardTitle>Performance Details</CardTitle>
        <CardDescription>Task-related performance metrics for each engineer within the selected date range.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>engineer Name</TableHead>
                <TableHead className="text-right">Total Tasks</TableHead>
                <TableHead className="text-right">Completed Tasks</TableHead>
                <TableHead className="text-right">Overdue Tasks</TableHead>
                <TableHead className="text-right">On-Time Rate</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {performanceData.map(data => (
                <TableRow key={data['engineer Name']}>
                  <TableCell className="font-medium">{data['engineer Name']}</TableCell>
                  <TableCell className="text-right">{data['Total Tasks']}</TableCell>
                  <TableCell className="text-right">{data['Completed Tasks']}</TableCell>
                  <TableCell className="text-right">{data['Overdue Tasks']}</TableCell>
                  <TableCell className="text-right">{data['On-Time Rate']}%</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
