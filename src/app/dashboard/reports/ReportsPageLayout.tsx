
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
import { useAuth } from '@/hooks/use-auth';

export default function ReportsPageLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isReportDetailsPage = pathname.includes('/engineer-summary') || 
    pathname.includes('/engineer-performance') || 
    pathname.includes('/detailed-claims') || 
    pathname.includes('/project-status') || 
    pathname.includes('/task-milestone-report');
  
  const context = useReportContext();
  const { user } = useAuth();

  // Enhanced PDF export using jsPDF (recommended approach)
  const handlePDFExport = async () => {
    try {
      // Use require for libraries that cause chunking issues with dynamic import
      const { jsPDF } = require('jspdf');
      const html2canvas = require('html2canvas');

      const element = document.getElementById('report-content');
      if (!element) {
        console.error('Report content not found');
        return;
      }

      // Show loading state if needed
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        logging: false,
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });

      const imgWidth = 210; // A4 width in mm
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;
      let position = 0;

      // Add first page
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= 297; // A4 height in mm

      // Add additional pages if needed
      while (heightLeft > 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= 297;
      }

      const fileName = `${getReportFileName()}_${new Date().toISOString().split('T')[0]}.pdf`;
      pdf.save(fileName);
    } catch (error) {
      console.error('PDF export failed:', error);
      // Fallback to print
      window.print();
    }
  };

  // Browser print (alternative option)
  const handlePrint = () => {
    window.print();
  };

  // Enhanced Excel export with formatting
  const handleExcelExport = async () => {
    try {
      const XLSX = await import('xlsx');
      let workbook;

      if (pathname.includes('/engineer-summary')) {
        workbook = await context.exportSummaryToExcel();
      } else if (pathname.includes('/engineer-performance')) {
        workbook = await context.exportPerformanceToExcel();
      } else if (pathname.includes('/detailed-claims')) {
        workbook = await context.exportDetailedClaimsToExcel();
      } else if (pathname.includes('/project-status')) {
        workbook = await context.exportProjectStatusToExcel();
      } else if (pathname.includes('/task-milestone-report')) {
        workbook = await context.exportTaskMilestoneToExcel();
      }

      if (workbook) {
        const fileName = `${getReportFileName()}_${new Date().toISOString().split('T')[0]}.xlsx`;
        XLSX.writeFile(workbook, fileName);
      }
    } catch (error) {
      console.error('Excel export failed:', error);
    }
  };

  const handleExportAll = async () => {
    try {
      await context.exportAllToExcel();
    } catch (error) {
      console.error('Export all failed:', error);
    }
  };

  const getReportTitle = () => {
    if (pathname.includes('/engineer-summary')) {
      return "SitePilot - Engineer Summary Report";
    }
    if (pathname.includes('/engineer-performance')) {
      return "SitePilot - Engineer Performance Report";
    }
    if (pathname.includes('/detailed-claims')) {
      return "SitePilot - Detailed Claims Report";
    }
    if (pathname.includes('/project-status')) {
      return "SitePilot - Project Status Report";
    }
    if (pathname.includes('/task-milestone-report')) {
      return "SitePilot - Task & Milestone Report";
    }
    return "SitePilot - All Reports";
  };

  const getReportFileName = () => {
    if (pathname.includes('/engineer-summary')) {
      return "engineer_summary_report";
    }
    if (pathname.includes('/engineer-performance')) {
      return "engineer_performance_report";
    }
    if (pathname.includes('/detailed-claims')) {
      return "detailed_claims_report";
    }
    if (pathname.includes('/project-status')) {
      return "project_status_report";
    }
    if (pathname.includes('/task-milestone-report')) {
      return "task_milestone_report";
    }
    return "sitepilot_reports";
  };

  return (
    <div className="print-container space-y-6">
      <div className="print-hidden flex flex-col items-stretch justify-between gap-4 sm:flex-row sm:items-center">
        {isReportDetailsPage ? (
          <Button variant="outline" asChild>
            <Link href="/dashboard/reports">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Reports Hub
            </Link>
          </Button>
        ) : (
          <div /> 
        )}
        
        <div className='flex gap-2'>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button className="w-full sm:w-auto">
                <FileDown className="mr-2 h-4 w-4" />
                Export
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              {isReportDetailsPage ? (
                <>
                  <DropdownMenuItem onClick={handlePDFExport}>
                    <Printer className="mr-2 h-4 w-4" />
                    <span>Export to PDF</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handlePrint}>
                    <Printer className="mr-2 h-4 w-4" />
                    <span>Print</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleExcelExport}>
                    <FileSpreadsheet className="mr-2 h-4 w-4" />
                    <span>Export to Excel</span>
                  </DropdownMenuItem>
                </>
              ) : (
                <>
                  <DropdownMenuItem onClick={handlePrint}>
                    <Printer className="mr-2 h-4 w-4" />
                    <span>Print All</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleExportAll}>
                    <FileSpreadsheet className="mr-2 h-4 w-4" />
                    <span>Export All to Excel</span>
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
      
      <div id="print-header" className="print-only hidden">
        <div className="flex justify-between items-end">
          <div>
            <h1 className="text-2xl font-bold">{getReportTitle()}</h1>
            <p className="text-muted-foreground">Generated on: {new Date().toLocaleDateString()}</p>
          </div>
          <p className="text-sm text-muted-foreground">
            Generated by: {user?.name || 'N/A'}
          </p>
        </div>
        <div className="border-t mt-2 mb-6"></div>
      </div>

      <div id="report-content">
        {children}
      </div>

      <div id="print-footer" className="print-only hidden">
        <div className="border-t mt-6 pt-2 text-sm text-muted-foreground">
          <div className="flex justify-between">
            <span>Page <span className="page-number"></span> of <span className="total-pages"></span></span>
            <span>Report generated by SitePilot</span>
          </div>
        </div>
      </div>
    </div>
  );
}
