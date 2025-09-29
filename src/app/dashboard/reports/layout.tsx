
'use client';

import { ReportProvider } from '@/contexts/ReportContext';
import { mockUsers, mockProjects, mockClaims } from '@/lib/data';

export default function ReportsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Provide a default empty context at the layout level.
  // Specific report pages will provide their own data.
  const defaultReportData = {
    users: mockUsers,
    projects: mockProjects,
    claims: mockClaims,
  };

  return (
    <ReportProvider reportData={defaultReportData}>
        {children}
    </ReportProvider>
  );
}
