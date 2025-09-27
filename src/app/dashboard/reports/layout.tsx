
'use client';

import { ReportProvider } from '@/contexts/ReportContext';

export default function ReportsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Provide a default empty context at the layout level.
  // Specific report pages will provide their own data.
  const defaultReportData = {
    users: [],
    projects: [],
    claims: [],
  };

  return (
    <ReportProvider reportData={defaultReportData}>
        {children}
    </ReportProvider>
  );
}
