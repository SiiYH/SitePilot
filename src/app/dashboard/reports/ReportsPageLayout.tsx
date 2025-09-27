
'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Printer } from 'lucide-react';

export default function ReportsPageLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isReportDetailsPage = pathname.includes('/engineer-summary');

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="print-container space-y-6">
      <div className="print-hidden flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        {isReportDetailsPage ? (
          <Button variant="outline" asChild>
            <Link href="/dashboard/reports">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Reports Hub
            </Link>
          </Button>
        ) : (
          <div /> // Placeholder to keep layout consistent
        )}
        
        {isReportDetailsPage && (
          <Button onClick={handlePrint}>
            <Printer className="mr-2 h-4 w-4" />
            Print Report
          </Button>
        )}
      </div>
      
      <div className="print-only mb-6">
        <h1 className="text-2xl font-bold">SitePilot - Engineer Summary Report</h1>
        <p className="text-muted-foreground">Generated on: {new Date().toLocaleDateString()}</p>
      </div>

      {children}
    </div>
  );
}
