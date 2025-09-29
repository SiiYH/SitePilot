
import Link from 'next/link';
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, ArrowRight, LineChart } from 'lucide-react';
import ReportsPageLayout from './ReportsPageLayout';

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
];

export default function ReportsPage() {
  return (
    <ReportsPageLayout>
      <div className="space-y-6">
        <div className="print-hidden">
          <h2 className="text-2xl font-bold tracking-tight">Reports Hub</h2>
          <p className="text-muted-foreground">
            Select a report to view and print.
          </p>
        </div>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {reports.map((report) => (
            <Link href={report.href} key={report.href} className="print-hidden">
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
      </div>
    </ReportsPageLayout>
  );
}
