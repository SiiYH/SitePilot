
'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Printer, FileDown, FileSpreadsheet } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useReportContext } from '@/contexts/ReportContext';

export default function ReportsPageLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isReportDetailsPage = pathname.includes('/engineer-summary');
  const context = useReportContext();

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
           <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button>
                <FileDown className="mr-2 h-4 w-4" />
                Export
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={handlePrint}>
                <Printer className="mr-2 h-4 w-4" />
                <span>Print to PDF</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={context.exportToExcel}>
                 <FileSpreadsheet className="mr-2 h-4 w-4" />
                <span>Export to Excel</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
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
