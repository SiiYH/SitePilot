
'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Printer, FileDown } from 'lucide-react';
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
  const { exportToExcel } = useReportContext();

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
              <DropdownMenuItem onClick={exportToExcel}>
                 <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="w-4 h-4 mr-2">
                    <path fill-rule="evenodd" d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12ZM12 8.25a.75.75 0 0 1 .75.75v3.75a.75.75 0 0 1-1.5 0V9a.75. ৭৫ 0 0 1 .75-.75Zm0 8.25a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5Z" clip-rule="evenodd" />
                    <path d="M12.98 4.72a.75.75 0 1 0-1.5.06v.97a.75.75 0 0 0 1.5-.06v-.97Z" />
                    <path d="M14.48 5.47a.75.75 0 1 1-1.06-1.06l.68-.69a.75.75 0 0 1 1.06 1.06l-.68.69Z" />
                    <path d="m15.97.05-3.38 3.38a.75.75 0 0 0 1.06 1.06l3.38-3.38a.75.75 0 0 0-1.06-1.06Z" />
                    <path d="m19.28 4.97-3.97 3.97a.75.75 0 0 0 1.06 1.06l3.97-3.97a.75.75 0 0 0-1.06-1.06Z" />
                    <path d="m19.97 9.53-4.47 4.47a.75.75 0 1 0 1.06 1.06l4.47-4.47a.75.75 0 1 0-1.06-1.06Z" />
                    <path d="m15.72 15.28.06.06a.75.75 0 0 0 1.06-1.06l-.06-.06a.75.75 0 0 0-1.06 1.06Z" />
                    <path d="m16.47 14.22-.69.68a.75.75 0 1 0 1.06 1.06l.69-.68a.75.75 0 1 0-1.06-1.06Z" />
                </svg>
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
