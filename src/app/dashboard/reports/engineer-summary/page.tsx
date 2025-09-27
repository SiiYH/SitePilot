
'use client';

import { useEffect } from 'react';
import { mockUsers, mockProjects, mockClaims } from '@/lib/data';
import { User, Project, Claim } from '@/types';
import EngineerSummaryReport from '@/components/dashboard/views/admin/EngineerSummaryReport';
import ReportsPageLayout from '../ReportsPageLayout';
import { useReportContext } from '@/contexts/ReportContext';


// This is now a client component to allow updating the context
export default function EngineerSummaryPage() {
  const { setReportData } = useReportContext();

  useEffect(() => {
    // In a real app, you'd fetch this data. For now, we use mocks.
    const reportData = {
      users: mockUsers,
      projects: mockProjects,
      claims: mockClaims,
    };
    setReportData(reportData);
  }, [setReportData]);

  return (
      <ReportsPageLayout>
        <div className="space-y-6">
          <div className="print-hidden">
            <h2 className="text-2xl font-bold tracking-tight">Engineer Summary Report</h2>
            <p className="text-muted-foreground">
              A summary of performance and financial metrics for each engineer.
            </p>
          </div>
          <EngineerSummaryReport />
        </div>
      </ReportsPageLayout>
  );
}
