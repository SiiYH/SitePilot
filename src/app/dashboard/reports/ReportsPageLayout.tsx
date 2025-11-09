
'use client';

import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Printer, FileDown, FileSpreadsheet, Eye } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useReportContext } from '@/contexts/ReportContext';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { PDFPreviewModal } from '@/components/dashboard/reports/PDFPreviewModal';
import { exportEngineerPerformanceToPDF, createPDFPreviewUrl, exportEngineerSummaryToPDF, exportDetailedClaimsToPDF, exportProjectStatusToPDF, exportTaskMilestoneToPDF } from '@/lib/pdfExporter';

export default function ReportsPageLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { toast } = useToast();
  const isReportDetailsPage = pathname.includes('/engineer-summary') || 
    pathname.includes('/engineer-performance') || 
    pathname.includes('/detailed-claims') || 
    pathname.includes('/project-status') || 
    pathname.includes('/task-milestone-report');
  
  const context = useReportContext();
  const { user, company } = useAuth();

  // PDF Preview State
  const [pdfPreviewUrl, setPdfPreviewUrl] = useState<string | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [pdfBlob, setPdfBlob] = useState<Blob | null>(null);

  // Generate PDF and show preview
  const handlePDFPreview = async () => {
    try {
      toast({
        title: "Generating PDF...",
        description: "Please wait while we prepare your document.",
      });

      let blob: Blob;

      // Use proper PDF generation for engineer performance
      if (pathname.includes('/engineer-performance')) {
        blob = exportEngineerPerformanceToPDF(context.performanceData, {
          companyName: company?.name,
          userName: user?.name,
          dateRange: context.dateRange,
        });
      }else if (pathname.includes('/engineer-summary')) {
        blob = exportEngineerSummaryToPDF(context.summaryData, {
          companyName: company?.name,
          userName: user?.name,
          dateRange: context.dateRange,
        });
      }else if (pathname.includes('/detailed-claims')) {
        blob = exportDetailedClaimsToPDF(context.detailedClaimsData, {
          companyName: company?.name,
          userName: user?.name,
          dateRange: context.dateRange,
        });
      } else if (pathname.includes('/project-status')) {
        blob = exportProjectStatusToPDF(context.projectStatusData, {
          companyName: company?.name,
          userName: user?.name,
          dateRange: context.dateRange,
        });
      }
      else if (pathname.includes('/task-milestone-report')) {
        blob = exportTaskMilestoneToPDF(context.taskMilestoneData, {
          companyName: company?.name,
          userName: user?.name,
          dateRange: context.dateRange,
        });
      }
      
      else {
        // For other reports, use html2canvas approach
        const { default: jsPDF } = await import('jspdf');
        const { default: html2canvas } = await import('html2canvas');

        const element = document.getElementById('report-content');
        if (!element) {
          toast({
            title: "Error",
            description: "Report content not found",
            variant: "destructive",
          });
          return;
        }

        // Brief delay to allow content to render
        await new Promise(resolve => setTimeout(resolve, 300));

        // Generate canvas from HTML
        const canvas = await html2canvas(element, {
          scale: 2,
          useCORS: true,
          logging: false,
          backgroundColor: '#ffffff',
        });

        const imgData = canvas.toDataURL('image/png');
        const pdf = new jsPDF({
          orientation: 'portrait',
          unit: 'mm',
          format: 'a4',
        });

        const imgWidth = 210; // A4 width in mm
        const pageHeight = 297; // A4 height in mm
        const imgHeight = (canvas.height * imgWidth) / canvas.width;
        let heightLeft = imgHeight;
        let position = 0;

        // Add pages
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;

        while (heightLeft > 0) {
          position = heightLeft - imgHeight;
          pdf.addPage();
          pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
          heightLeft -= pageHeight;
        }

        blob = pdf.output('blob');
      }

      // Create preview URL
      const url = createPDFPreviewUrl(blob);
      
      setPdfBlob(blob);
      setPdfPreviewUrl(url);
      setIsPreviewOpen(true);

      toast({
        title: "Preview Ready",
        description: "Your PDF is ready to preview",
        duration: 3000,
      });
    } catch (error) {
      console.error('PDF generation failed:', error);
      toast({
        title: "Error",
        description: "Failed to generate PDF preview",
        variant: "destructive",
      });
    }
  };

  // Download PDF from preview
  const handleDownloadPDF = () => {
    if (pdfBlob) {
      const fileName = `${getReportFileName()}_${new Date().toISOString().split('T')[0]}.pdf`;
      const url = URL.createObjectURL(pdfBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      handleClosePreview(); // Use the close handler
      
      toast({
        title: "Success",
        description: "PDF downloaded successfully",
      });
    }
  };

  // Close preview and cleanup
  const handleClosePreview = () => {
    setIsPreviewOpen(false);
    // Add a delay before revoking the URL to prevent "Transport destroyed" error
    if (pdfPreviewUrl) {
        setTimeout(() => {
            URL.revokeObjectURL(pdfPreviewUrl);
            setPdfPreviewUrl(null);
            setPdfBlob(null);
        }, 500); // 500ms delay
    }
  };

  // Browser print (alternative option)
  const handlePrint = () => {
    // For performance report, we need to open accordions first
    if (pathname.includes('/engineer-performance')) {
      const element = document.getElementById('report-content');
      if (element) {
        const accordionTriggers = element.querySelectorAll<HTMLElement>('[data-state="closed"][data-radix-collection-item]');
        accordionTriggers.forEach(trigger => trigger.click());
        
        // Print after accordions are opened
        setTimeout(() => {
          window.print();
          // Close accordions after print
          setTimeout(() => {
            accordionTriggers.forEach(trigger => trigger.click());
          }, 500);
        }, 500);
      }
    } else {
      window.print();
    }
  };

  // Enhanced Excel export with formatting
  const handleExcelExport = async () => {
    try {
      const XLSX = await import('xlsx');
      let workbook;

      toast({
        title: "Exporting to Excel...",
        description: "Please wait while we prepare your spreadsheet.",
      });

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
        
        toast({
          title: "Success",
          description: "Excel file downloaded successfully",
        });
      }
    } catch (error) {
      console.error('Excel export failed:', error);
      toast({
        title: "Error",
        description: "Failed to export to Excel",
        variant: "destructive",
      });
    }
  };

  const handleExportAll = async () => {
    try {
      toast({
        title: "Exporting All Reports...",
        description: "This may take a moment.",
      });

      await context.exportAllToExcel();
      
      toast({
        title: "Success",
        description: "All reports exported successfully",
      });
    } catch (error) {
      console.error('Export all failed:', error);
      toast({
        title: "Error",
        description: "Failed to export all reports",
        variant: "destructive",
      });
    }
  };

  const getReportTitle = () => {
    if (pathname.includes('/engineer-summary')) {
      return "Engineer Summary Report";
    }
    if (pathname.includes('/engineer-performance')) {
      return "Engineer Performance Report";
    }
    if (pathname.includes('/detailed-claims')) {
      return "Detailed Claims Report";
    }
    if (pathname.includes('/project-status')) {
      return "Project Status Report";
    }
    if (pathname.includes('/task-milestone-report')) {
      return "Task & Milestone Report";
    }
    return "All Reports";
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
    <>
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
                    <DropdownMenuItem onClick={handlePDFPreview}>
                      <Eye className="mr-2 h-4 w-4" />
                      <span>Preview & Export PDF</span>
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
              <p className="font-bold text-lg">{company?.name || 'SitePilot'}</p>
              <h1 className="text-2xl font-bold">{getReportTitle()}</h1>
            </div>
            <div className='text-right text-sm text-muted-foreground'>
              <p>Generated on: {new Date().toLocaleDateString()}</p>
              <p>Generated by: {user?.name || 'N/A'}</p>
            </div>
          </div>
          <div className="border-t mt-2 mb-6"></div>
        </div>

        <div id="report-content">
          {children}
        </div>

        <div id="print-footer" className="print-only hidden">
          <div className="border-t mt-6 pt-2 text-sm text-muted-foreground">
            <div className="flex justify-between">
              <span>Report generated by SitePilot</span>
              <div className="page-number"></div>
            </div>
          </div>
        </div>
      </div>

      {pdfPreviewUrl && (
        <PDFPreviewModal
          isOpen={isPreviewOpen}
          onClose={handleClosePreview}
          pdfUrl={pdfPreviewUrl}
          fileName={`${getReportFileName()}.pdf`}
          onDownload={handleDownloadPDF}
        />
      )}
    </>
  );
}
