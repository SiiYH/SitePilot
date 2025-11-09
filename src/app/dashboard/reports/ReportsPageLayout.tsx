
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
  const [pdfFileName, setPdfFileName] = useState('report.pdf');

  // Generate PDF and show preview
  const handlePDFPreview = async (isAllReports = false) => {
    try {
      toast({
        title: "Generating PDF...",
        description: "Please wait while we prepare your document.",
      });

      let blob: Blob;

      if (isAllReports) {
        blob = context.exportAllToPDF();
        setPdfFileName('SitePilot_All_Reports.pdf');
      } else if (pathname.includes('/engineer-performance')) {
        blob = exportEngineerPerformanceToPDF(context.performanceData, {
          companyName: company?.name,
          userName: user?.name,
          dateRange: context.dateRange,
        });
        setPdfFileName('engineer_performance_report.pdf');
      } else if (pathname.includes('/engineer-summary')) {
        blob = exportEngineerSummaryToPDF(context.summaryData, {
          companyName: company?.name,
          userName: user?.name,
          dateRange: context.dateRange,
        });
        setPdfFileName('engineer_summary_report.pdf');
      } else if (pathname.includes('/detailed-claims')) {
        blob = exportDetailedClaimsToPDF(context.detailedClaimsData, {
          companyName: company?.name,
          userName: user?.name,
          dateRange: context.dateRange,
        });
        setPdfFileName('detailed_claims_report.pdf');
      } else if (pathname.includes('/project-status')) {
        blob = exportProjectStatusToPDF(context.projectStatusData, {
          companyName: company?.name,
          userName: user?.name,
          dateRange: context.dateRange,
        });
        setPdfFileName('project_status_report.pdf');
      } else if (pathname.includes('/task-milestone-report')) {
        blob = exportTaskMilestoneToPDF(context.taskMilestoneData, {
          companyName: company?.name,
          userName: user?.name,
          dateRange: context.dateRange,
        });
        setPdfFileName('task_milestone_report.pdf');
      } else {
        // Fallback for individual pages that might not have a specific exporter
        const { default: jsPDF } = await import('jspdf');
        const { default: html2canvas } = await import('html2canvas');
        const element = document.getElementById('report-content');
        if (!element) throw new Error("Report content not found");
        const canvas = await html2canvas(element, { scale: 2 });
        const imgData = canvas.toDataURL('image/png');
        const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
        const imgWidth = 210;
        const pageHeight = 297;
        const imgHeight = (canvas.height * imgWidth) / canvas.width;
        pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
        blob = pdf.output('blob');
        setPdfFileName('report.pdf');
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
      const fileNameWithDate = `${pdfFileName.replace('.pdf', '')}_${new Date().toISOString().split('T')[0]}.pdf`;
      const url = URL.createObjectURL(pdfBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = fileNameWithDate;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      handleClosePreview();
      
      toast({
        title: "Success",
        description: "PDF downloaded successfully",
      });
    }
  };

  // Close preview and cleanup
  const handleClosePreview = () => {
    setIsPreviewOpen(false);
    if (pdfPreviewUrl) {
        setTimeout(() => {
            URL.revokeObjectURL(pdfPreviewUrl);
            setPdfPreviewUrl(null);
            setPdfBlob(null);
        }, 500);
    }
  };

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

  const handleExportAllToExcel = async () => {
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

  const getReportFileName = () => {
    if (pathname.includes('/engineer-summary')) return "engineer_summary_report";
    if (pathname.includes('/engineer-performance')) return "engineer_performance_report";
    if (pathname.includes('/detailed-claims')) return "detailed_claims_report";
    if (pathname.includes('/project-status')) return "project_status_report";
    if (pathname.includes('/task-milestone-report')) return "task_milestone_report";
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
            {isReportDetailsPage && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button className="w-full sm:w-auto">
                    <FileDown className="mr-2 h-4 w-4" />
                    Export
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem onClick={() => handlePDFPreview(false)}>
                    <Eye className="mr-2 h-4 w-4" />
                    <span>Preview & Export PDF</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleExcelExport}>
                    <FileSpreadsheet className="mr-2 h-4 w-4" />
                    <span>Export to Excel</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </div>
        
        <div id="report-content">
          {children}
        </div>
      </div>

      {pdfPreviewUrl && (
        <PDFPreviewModal
          isOpen={isPreviewOpen}
          onClose={handleClosePreview}
          pdfUrl={pdfPreviewUrl}
          fileName={pdfFileName}
          onDownload={handleDownloadPDF}
        />
      )}
    </>
  );
}
