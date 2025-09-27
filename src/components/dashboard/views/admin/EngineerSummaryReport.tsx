
'use client';

import { useMemo } from 'react';
import { User, Project, Claim } from '@/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

interface EngineerSummaryReportProps {
  users: User[];
  projects: Project[];
  claims: Claim[];
}

interface SummaryData {
  engineerName: string;
  completedSites: number;
  totalAmount: number;
  claimAmount: number;
  ongoingSites: number;
  dueSites: number;
}

export default function EngineerSummaryReport({ users, projects, claims }: EngineerSummaryReportProps) {
  const summaryData: SummaryData[] = useMemo(() => {
    const engineers = users.filter(u => u.role === 'Engineer');

    return engineers.map(engineer => {
      const assignedProjects = projects.filter(p => p.assignedEngineers.includes(engineer.id));
      const engineerClaims = claims.filter(c => c.submittedBy === engineer.id);

      const completedSites = assignedProjects.filter(p => p.progress === 100).length;
      const ongoingSites = assignedProjects.filter(p => p.progress < 100).length;
      
      const totalAmount = assignedProjects.reduce((acc, p) => acc + (p.grossProfit || 0), 0);
      const claimAmount = engineerClaims.reduce((acc, c) => acc + c.amount, 0);

      const dueSites = assignedProjects.filter(p => {
        const isOverdue = new Date(p.endDate) < new Date() && p.progress < 100;
        const hasOverdueTasks = p.tasks.some(t => t.assignedTo === engineer.id && t.status === 'Overdue');
        return isOverdue || hasOverdueTasks;
      }).length;

      return {
        engineerName: engineer.name,
        completedSites,
        totalAmount,
        claimAmount,
        ongoingSites,
        dueSites,
      };
    });
  }, [users, projects, claims]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  return (
    <Card className="print-card">
      <CardHeader className="print-hidden">
        <CardTitle>Summary Details</CardTitle>
        <CardDescription>Metrics are calculated based on all projects and claims in the system.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
            <Table>
                <TableHeader>
                    <TableRow>
                    <TableHead>Engineer Name</TableHead>
                    <TableHead className="text-right">Completed Sites</TableHead>
                    <TableHead className="text-right">Total Amount (RM)</TableHead>
                    <TableHead className="text-right">Claim (RM)</TableHead>
                    <TableHead className="text-right">Ongoing Sites</TableHead>
                    <TableHead className="text-right">Due Sites</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {summaryData.map(data => (
                    <TableRow key={data.engineerName}>
                        <TableCell className="font-medium">{data.engineerName}</TableCell>
                        <TableCell className="text-right">{data.completedSites}</TableCell>
                        <TableCell className="text-right">{formatCurrency(data.totalAmount)}</TableCell>
                        <TableCell className="text-right">{formatCurrency(data.claimAmount)}</TableCell>
                        <TableCell className="text-right">{data.ongoingSites}</TableCell>
                        <TableCell className="text-right">{data.dueSites}</TableCell>
                    </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
      </CardContent>
    </Card>
  );
}
