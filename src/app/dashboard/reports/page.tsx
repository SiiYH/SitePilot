

'use client';

import Link from 'next/link';
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, ArrowRight, LineChart, FileText, FolderKanban, GanttChartSquare } from 'lucide-react';
import ReportsPageLayout from './ReportsPageLayout';
import EngineerSummaryReport from '@/components/dashboard/views/admin/EngineerSummaryReport';
import EngineerPerformanceReport from '@/components/dashboard/views/admin/EngineerPerformanceReport';
import DetailedClaimsReport from '@/components/dashboard/views/admin/DetailedClaimsReport';
import ProjectStatusReport from '@/components/dashboard/views/admin/ProjectStatusReport';
import TaskMilestoneReport from '@/components/dashboard/views/admin/TaskMilestoneReport';

const reports = [
  {
    title: 'Engineer Summary Report',
    description: 'A summary of performance and financial metrics for each engineer.',
    href: '/dashboard/reports/engineer-summary',
    icon: BarChart,
  },
  {
    title: "Engineer's Performance Report",
    description: 'An overview of task completions, overdue tasks, and on-time rates.',
    href: '/dashboard/reports/engineer-performance',
    icon: LineChart,
  },
  {
    title: 'Detailed Claims Report',
    description: 'A detailed breakdown of all claims, filterable by engineer and date.',
    href: '/dashboard/reports/detailed-claims',
    icon: FileText,
  },
  {
    title: 'Project Status Report',
    description: 'An overview of all projects, their progress, and key metrics.',
    href: '/dashboard/reports/project-status',
    icon: FolderKanban,
  },
  {
    title: 'Task & Milestone Report',
    description: 'A detailed list of all tasks and milestones across projects.',
    href: '/dashboard/reports/task-milestone-report',
    icon: GanttChartSquare,
  },
];

export default function ReportsPage() {

  return (
    <ReportsPageLayout>
      <div className="space-y-6">
        <div className="print-hidden flex flex-col items-stretch justify-between gap-4 sm:flex-row sm:items-center">
            <div>
              <h2 className="text-2xl font-bold tracking-tight">Reports Hub</h2>
              <p className="text-muted-foreground">
                Select a report to view, or use the export options.
              </p>
            </div>
        </div>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 print-hidden">
          {reports.map((report) => (
            <Link href={report.href} key={report.href}>
              <Card className="flex h-full flex-col justify-between transition-all hover:shadow-lg">
                <CardHeader>
                  <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                    <report.icon className="h-6 w-6 text-primary" />
                  </div>
                  <CardTitle>{report.title}</CardTitle>
                  <CardDescription>{report.description}</CardDescription>
                </CardHeader>
                <div className="flex items-center justify-end p-6 pt-0 text-sm font-medium text-primary">
                  View Report <ArrowRight className="ml-2 h-4 w-4" />
                </div>
              </Card>
            </Link>
          ))}
        </div>

        {/* Hidden content for printing all reports */}
        <div className="print-only-container hidden space-y-8">
            <div className="printable-content print-break-after">
                <h2 className="text-xl font-bold mb-4">Project Status Report</h2>
                <ProjectStatusReport />
            </div>
            <div className="printable-content print-break-after">
                <h2 className="text-xl font-bold mb-4">Task &amp; Milestone Report</h2>
                <TaskMilestoneReport />
            </div>
            <div className="printable-content print-break-after">
                <h2 className="text-xl font-bold mb-4">Engineer Summary Report</h2>
                <EngineerSummaryReport />
            </div>
             <div className="printable-content print-break-after">
                <h2 className="text-xl font-bold mb-4">Engineer Performance Report</h2>
                <EngineerPerformanceReport />
            </div>
             <div className="printable-content">
                <h2 className="text-xl font-bold mb-4">Detailed Claims Report</h2>
                <DetailedClaimsReport />
            </div>
        </div>
      </div>
    </ReportsPageLayout>
  );
}
