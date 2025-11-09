// File: lib/pdf-export-helper.ts
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { format, parseISO } from 'date-fns';

interface PerformanceData {
  id: string;
  "engineer Name": string;
  "avatarUrl"?: string;
  "projects": any[];
  "tasks": any[];
  "claims": any[];
}

interface ExportOptions {
  companyName?: string;
  userName?: string;
  dateRange?: { from?: Date; to?: Date };
}

// Utility function to add consistent header across all reports
const addReportHeader = (
  doc: jsPDF,
  options: {
    companyName: string;
    userName: string;
    reportTitle: string;
    dateRange?: { from?: Date; to?: Date };
    isFirstPage?: boolean;
    currentPage?: number;
    totalPages?: number;
  }
) => {
  const { companyName, userName, reportTitle, dateRange, isFirstPage = false, currentPage, totalPages } = options;
  const pageWidth = doc.internal.pageSize.width;
  const margin = 14;
  let yPosition = 10;

  // Top section: Company name (left) and Page number (right)
  doc.setFontSize(10);
  doc.setTextColor(100);
  doc.text(companyName, margin, yPosition);
  
  if (currentPage && totalPages) {
    doc.text(`Page ${currentPage} of ${totalPages}`, pageWidth - margin, yPosition, { align: 'right' });
  }

  yPosition += 6;

  if (isFirstPage) {
    // Report title
    yPosition = 20;
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0);
    doc.text(reportTitle, margin, yPosition);
    yPosition += 10;
    
    // Metadata section (Generated date and by)
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100);
    
    const generatedText = `Generated: ${format(new Date(), 'MMM dd, yyyy')} by ${userName}`;
    doc.text(generatedText, margin, yPosition);
    yPosition += 5;
    
    // Date range if provided
    if (dateRange?.from || dateRange?.to) {
      const dateRangeStr = `Date Range: ${dateRange?.from ? format(dateRange.from, 'MMM dd, yyyy') : 'N/A'} - ${dateRange?.to ? format(dateRange.to, 'MMM dd, yyyy') : 'N/A'}`;
      doc.text(dateRangeStr, margin, yPosition);
      yPosition += 5;
    }
    
    yPosition += 5;
    // Draw separator line
    doc.setDrawColor(200);
    doc.line(margin, yPosition, pageWidth - margin, yPosition);
    yPosition += 8;
  } else {
    yPosition = 20;
  }

  return yPosition;
};

// Utility function to add page numbers to all pages
const addPageNumbers = (doc: jsPDF, companyName: string) => {
  const pageCount = doc.getNumberOfPages();
  const pageWidth = doc.internal.pageSize.width;
  const margin = 14;

  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    
    // Add page number at top right
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`Page ${i} of ${pageCount}`, pageWidth - margin, 10, { align: 'right' });
  }
};

export const exportEngineerPerformanceToPDF = (
  performanceData: PerformanceData[],
  options: ExportOptions = {}
): Blob => {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const { companyName = 'SitePilot', userName = 'N/A', dateRange } = options;
  
  const pageWidth = doc.internal.pageSize.width;
  const margin = 14;

  // Add header for first page
  let yPosition = addReportHeader(doc, {
    companyName,
    userName,
    reportTitle: 'Engineer Performance Report',
    dateRange,
    isFirstPage: true,
  });

  // Process each engineer
  performanceData.forEach((engineer, engineerIndex) => {
    const engineerName = engineer["engineer Name"];
    
    // Check if we need a new page for this engineer
    if (engineerIndex > 0) {
      doc.addPage();
      yPosition = addReportHeader(doc, {
        companyName,
        userName,
        reportTitle: 'Engineer Performance Report',
        dateRange,
        isFirstPage: false,
      });
    }

    // Engineer Name Header
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0);
    doc.text(engineerName, margin, yPosition);
    yPosition += 6;
    
    // Summary badges
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100);
    doc.text(`Projects: ${engineer.projects.length} | Tasks: ${engineer.tasks.length} | Claims: ${engineer.claims.length}`, margin, yPosition);
    yPosition += 10;

    // Projects Table with Financial Summary
    if (engineer.projects.length > 0) {
      // Calculate totals
      const totalPerformanceBond = engineer.projects.reduce((sum, p) => 
        sum + (p.performanceBondAmount || 0), 0
      );
      const totalGrossProfit = engineer.projects.reduce((sum, p) => 
        sum + (p.grossProfit || 0), 0
      );
      const currency = engineer.projects[0]?.currency || 'USD';

      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(0);
      doc.text('Assigned Projects', margin, yPosition);
      yPosition += 2;

      autoTable(doc, {
        startY: yPosition,
        head: [['Project Name', 'Status', 'End Date', 'Perf. Bond', 'Gross Profit']],
        body: engineer.projects.map(p => [
          p.name,
          p.status,
          format(parseISO(p.endDate), 'MMM dd, yyyy'),
          p.performanceBondAmount ? `${p.currency || currency} ${p.performanceBondAmount.toLocaleString()}` : '-',
          p.grossProfit ? `${p.currency || currency} ${p.grossProfit.toLocaleString()}` : '-'
        ]),
        foot: [[
          { content: 'Total', colSpan: 3, styles: { halign: 'left' } },
          { content: `${currency} ${totalPerformanceBond.toLocaleString()}`, styles: { halign: 'right' } },
          { content: `${currency} ${totalGrossProfit.toLocaleString()}`, styles: { halign: 'right' } }
        ]],
        theme: 'striped',
        headStyles: {
          fillColor: [71, 85, 105],
          fontSize: 9,
          fontStyle: 'bold',
        },
        bodyStyles: {
          fontSize: 8,
        },
        footStyles: {
          fillColor: [241, 245, 249],
          textColor: [0, 0, 0],
          fontSize: 9,
          fontStyle: 'bold',
        },
        columnStyles: {
          0: { cellWidth: 'auto' },
          1: { cellWidth: 'auto' },
          2: { cellWidth: 'auto' },
          3: { cellWidth: 'auto', halign: 'right' },
          4: { cellWidth: 'auto', halign: 'right' },
        },
        margin: { left: margin, right: margin },
      });

      yPosition = (doc as any).lastAutoTable.finalY + 10;
    } else {
      doc.setFontSize(9);
      doc.setTextColor(150);
      doc.text('No projects assigned', margin + 5, yPosition);
      yPosition += 10;
    }

    // Check if we need a new page
    if (yPosition > 240) {
      doc.addPage();
      yPosition = addReportHeader(doc, {
        companyName,
        userName,
        reportTitle: 'Engineer Performance Report',
        dateRange,
        isFirstPage: false,
      });
    }

    // Tasks Table
    if (engineer.tasks.length > 0) {
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(0);
      doc.text('Assigned Tasks', margin, yPosition);
      yPosition += 2;

      autoTable(doc, {
        startY: yPosition,
        head: [['Task Title', 'Project', 'Role', 'Due Date', 'Status']],
        body: engineer.tasks.map(t => [
          t.title,
          t.projectName || 'N/A',
          t.owner === engineer.id ? 'Owner' : 'Contributor',
          format(parseISO(t.dueDate), 'MMM dd, yyyy'),
          t.status
        ]),
        theme: 'striped',
        headStyles: {
          fillColor: [71, 85, 105],
          fontSize: 9,
          fontStyle: 'bold',
        },
        bodyStyles: {
          fontSize: 8,
        },
        columnStyles: {
          0: { cellWidth: 'auto' },
          1: { cellWidth: 'auto' },
          2: { cellWidth: 'auto' },
          3: { cellWidth: 'auto' },
          4: { cellWidth: 'auto' },
        },
        margin: { left: margin, right: margin },
      });

      yPosition = (doc as any).lastAutoTable.finalY + 10;
    } else {
      doc.setFontSize(9);
      doc.setTextColor(150);
      doc.text('No tasks assigned', margin + 5, yPosition);
      yPosition += 10;
    }

    // Check if we need a new page
    if (yPosition > 240) {
      doc.addPage();
      yPosition = addReportHeader(doc, {
        companyName,
        userName,
        reportTitle: 'Engineer Performance Report',
        dateRange,
        isFirstPage: false,
      });
    }

    // Claims Table
    if (engineer.claims.length > 0) {
      // Separate claims into approved/pending and rejected
      const activeClaims = engineer.claims.filter(c => c.status !== 'Rejected');
      const rejectedClaims = engineer.claims.filter(c => c.status === 'Rejected');

      // Active Claims Table (Approved/Pending)
      if (activeClaims.length > 0) {
        // Calculate total claims amount for active claims
        const totalClaimsAmount = activeClaims.reduce((sum, c) => 
          sum + (c.amount || 0), 0
        );
        const claimsCurrency = activeClaims[0]?.currency || 'USD';

        doc.setFontSize(11);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(0);
        doc.text('Submitted Claims', margin, yPosition);
        yPosition += 2;

        autoTable(doc, {
          startY: yPosition,
          head: [['Claim Title', 'Project', 'Amount', 'Status']],
          body: activeClaims.map(c => [
            c.title,
            c.projectName || 'N/A',
            `${c.currency} ${c.amount.toLocaleString()}`,
            c.status
          ]),
          foot: [[
            { content: 'Total', colSpan: 2, styles: { halign: 'left' } },
            { content: `${claimsCurrency} ${totalClaimsAmount.toLocaleString()}`, styles: { halign: 'right' } },
            ''
          ]],
          theme: 'striped',
          headStyles: {
            fillColor: [71, 85, 105],
            fontSize: 9,
            fontStyle: 'bold',
          },
          bodyStyles: {
            fontSize: 8,
          },
          footStyles: {
            fillColor: [241, 245, 249],
            textColor: [0, 0, 0],
            fontSize: 9,
            fontStyle: 'bold',
          },
          columnStyles: {
            0: { cellWidth: 'auto' },
            1: { cellWidth: 'auto' },
            2: { cellWidth: 'auto', halign: 'right' },
            3: { cellWidth: 'auto' },
          },
          margin: { left: margin, right: margin },
        });

        yPosition = (doc as any).lastAutoTable.finalY + 10;
      } else {
        doc.setFontSize(9);
        doc.setTextColor(150);
        doc.text('No active claims', margin + 5, yPosition);
        yPosition += 10;
      }

      // Check if we need a new page before rejected claims
      if (rejectedClaims.length > 0 && yPosition > 220) {
        doc.addPage();
        yPosition = addReportHeader(doc, {
          companyName,
          userName,
          reportTitle: 'Engineer Performance Report',
          dateRange,
          isFirstPage: false,
        });
      }

      // Rejected Claims Table
      if (rejectedClaims.length > 0) {
        doc.setFontSize(11);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(0);
        doc.text('Rejected Claims', margin, yPosition);
        yPosition += 2;

        autoTable(doc, {
          startY: yPosition,
          head: [['Claim Title', 'Project', 'Amount', 'Status']],
          body: rejectedClaims.map(c => [
            c.title,
            c.projectName || 'N/A',
            `${c.currency} ${c.amount.toLocaleString()}`,
            c.status
          ]),
          theme: 'striped',
          headStyles: {
            fillColor: [185, 28, 28],
            fontSize: 9,
            fontStyle: 'bold',
          },
          bodyStyles: {
            fontSize: 8,
          },
          columnStyles: {
            0: { cellWidth: 'auto' },
            1: { cellWidth: 'auto' },
            2: { cellWidth: 'auto', halign: 'right' },
            3: { cellWidth: 'auto' },
          },
          margin: { left: margin, right: margin },
        });

        yPosition = (doc as any).lastAutoTable.finalY + 10;
      }
    } else {
      doc.setFontSize(9);
      doc.setTextColor(150);
      doc.text('No claims submitted', margin + 5, yPosition);
      yPosition += 10;
    }
  });

  // Add page numbers to all pages
  addPageNumbers(doc, companyName);

  return doc.output('blob');
};

// Preview URL generator
export const createPDFPreviewUrl = (blob: Blob): string => {
  return URL.createObjectURL(blob);
};

// Download PDF
export const downloadPDF = (blob: Blob, fileName: string) => {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

// Engineer Summary Report PDF Export
interface SummaryData {
  "engineer Name": string;
  "Completed Sites": number;
  "Total Amount (RM)": number;
  "Claim (RM)": number;
  "Ongoing Sites": number;
  "Due Sites": number;
}

export const exportEngineerSummaryToPDF = (
  summaryData: SummaryData[],
  options: ExportOptions = {}
): Blob => {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const { companyName = 'SitePilot', userName = 'N/A', dateRange } = options;
  const pageWidth = doc.internal.pageSize.width;
  const margin = 14;

  // Add header for first page
  let yPosition = addReportHeader(doc, {
    companyName,
    userName,
    reportTitle: 'Engineer Summary Report',
    dateRange,
    isFirstPage: true,
  });

  // Summary Table
  if (summaryData.length > 0) {
    autoTable(doc, {
      startY: yPosition,
      head: [[
        'Engineer Name',
        'Completed Sites',
        'Total Amount (RM)',
        'Claim (RM)',
        'Ongoing Sites',
        'Due Sites'
      ]],
      body: summaryData.map(engineer => [
        engineer["engineer Name"],
        engineer["Completed Sites"].toString(),
        `RM ${engineer["Total Amount (RM)"].toLocaleString('en-MY', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
        `RM ${engineer["Claim (RM)"].toLocaleString('en-MY', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
        engineer["Ongoing Sites"].toString(),
        engineer["Due Sites"].toString()
      ]),
      theme: 'striped',
      headStyles: {
        fillColor: [71, 85, 105],
        fontSize: 9,
        fontStyle: 'bold',
        halign: 'center',
      },
      bodyStyles: {
        fontSize: 9,
      },
      columnStyles: {
        0: { cellWidth: 40, halign: 'left' },
        1: { cellWidth: 25, halign: 'center' },
        2: { cellWidth: 35, halign: 'right' },
        3: { cellWidth: 30, halign: 'right' },
        4: { cellWidth: 25, halign: 'center' },
        5: { cellWidth: 20, halign: 'center' },
      },
      margin: { left: margin, right: margin },
      didDrawCell: (data) => {
        // Highlight due sites in red if > 0
        if (data.column.index === 5 && data.section === 'body') {
          const value = summaryData[data.row.index]["Due Sites"];
          if (value > 0) {
            doc.setTextColor(220, 38, 38);
          }
        }
      },
    });

    yPosition = (doc as any).lastAutoTable.finalY + 15;

    // Add summary statistics
    const totalCompleted = summaryData.reduce((sum, e) => sum + e["Completed Sites"], 0);
    const totalOngoing = summaryData.reduce((sum, e) => sum + e["Ongoing Sites"], 0);
    const totalDue = summaryData.reduce((sum, e) => sum + e["Due Sites"], 0);
    const totalAmount = summaryData.reduce((sum, e) => sum + e["Total Amount (RM)"], 0);
    const totalClaims = summaryData.reduce((sum, e) => sum + e["Claim (RM)"], 0);

    // Check if we need a new page for summary
    if (yPosition > 240) {
      doc.addPage();
      yPosition = 20;
    }

    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0);
    doc.text('Overall Summary', margin, yPosition);
    yPosition += 8;

    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(60);

    const summaryStats = [
      `Total Engineers: ${summaryData.length}`,
      `Total Completed Sites: ${totalCompleted}`,
      `Total Ongoing Sites: ${totalOngoing}`,
      `Total Due Sites: ${totalDue}`,
      `Total Project Amount: RM ${totalAmount.toLocaleString('en-MY', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      `Total Claims: RM ${totalClaims.toLocaleString('en-MY', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
    ];

    summaryStats.forEach(stat => {
      doc.text(stat, margin + 5, yPosition);
      yPosition += 6;
    });
  } else {
    doc.setFontSize(10);
    doc.setTextColor(150);
    doc.text('No engineer data available for the selected filters.', margin, yPosition);
  }

  // Add page numbers
  addPageNumbers(doc, companyName);

  return doc.output('blob');
};

// Detailed Claims Report PDF Export
interface DetailedClaimData {
  "engineer Name": string;
  "Site Name": string;
  "e-Invoice No.": string;
  "Claim Title": string;
  "Amount": number;
  "Currency": string;
  "Date": string;
  "Status": string;
}

export const exportDetailedClaimsToPDF = (
  claimsData: DetailedClaimData[],
  options: ExportOptions = {}
): Blob => {
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4',
  });

  const { companyName = 'SitePilot', userName = 'N/A', dateRange } = options;
  const margin = 14;

  // Add header
  let yPosition = addReportHeader(doc, {
    companyName,
    userName,
    reportTitle: 'Detailed Claims Report',
    dateRange,
    isFirstPage: true,
  });

  // Claims Table
  if (claimsData.length > 0) {
    autoTable(doc, {
      startY: yPosition,
      head: [[
        'Engineer',
        'Site Name',
        'e-Invoice No.',
        'Claim Title',
        'Amount',
        'Date',
        'Status'
      ]],
      body: claimsData.map(claim => [
        claim["engineer Name"],
        claim["Site Name"],
        claim["e-Invoice No."],
        claim["Claim Title"],
        `${claim.Currency} ${claim.Amount.toLocaleString('en-MY', { minimumFractionDigits: 2 })}`,
        format(parseISO(claim.Date), 'MMM dd, yyyy'),
        claim.Status
      ]),
      theme: 'striped',
      headStyles: {
        fillColor: [71, 85, 105],
        fontSize: 9,
        fontStyle: 'bold',
        halign: 'center',
      },
      bodyStyles: {
        fontSize: 8,
      },
      columnStyles: {
        0: { cellWidth: 'auto' },
        1: { cellWidth: 'auto' },
        2: { cellWidth: 'auto' },
        3: { cellWidth: 'auto' },
        4: { cellWidth: 'auto', halign: 'right' },
        5: { cellWidth: 'auto' },
        6: { cellWidth: 'auto', halign: 'center' },
      },
      tableWidth: 'auto',
      margin: { left: margin, right: margin },
    });

    // Summary
    const totalAmount = claimsData.reduce((sum, c) => sum + c.Amount, 0);
    const paidClaims = claimsData.filter(c => c.Status === 'Paid').length;
    const pendingClaims = claimsData.filter(c => c.Status === 'Pending').length;

    yPosition = (doc as any).lastAutoTable.finalY + 15;

    if (yPosition > 170) {
      doc.addPage();
      yPosition = 20;
    }

    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Claims Summary', margin, yPosition);
    yPosition += 8;

    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text(`Total Claims: ${claimsData.length}`, margin + 5, yPosition);
    yPosition += 6;
    doc.text(`Paid Claims: ${paidClaims}`, margin + 5, yPosition);
    yPosition += 6;
    doc.text(`Pending Claims: ${pendingClaims}`, margin + 5, yPosition);
    yPosition += 6;
    doc.text(`Total Amount: RM ${totalAmount.toLocaleString('en-MY', { minimumFractionDigits: 2 })}`, margin + 5, yPosition);
  }

  // Add page numbers
  addPageNumbers(doc, companyName);

  return doc.output('blob');
};

// Project Status Report PDF Export
interface ProjectStatusData {
  "Project Name": string;
  "Progress": number;
  "Status": string;
  "Work Items": string;
  "Start Date": string;
  "End Date": string;
  "Assigned Engineers": string;
  "Gross Profit": number;
  "Margin Profit (%)": number;
  "Currency": string;
}

export const exportProjectStatusToPDF = (
  projectsData: ProjectStatusData[],
  options: ExportOptions = {}
): Blob => {
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4',
  });

  const { companyName = 'SitePilot', userName = 'N/A', dateRange } = options;
  const margin = 14;

  // Add header
  let yPosition = addReportHeader(doc, {
    companyName,
    userName,
    reportTitle: 'Project Status Report',
    dateRange,
    isFirstPage: true,
  });

  // Projects Table
  if (projectsData.length > 0) {
    autoTable(doc, {
      startY: yPosition,
      head: [[
        'Project Name',
        'Progress',
        'Status',
        'Work Items',
        'Start Date',
        'End Date',
        'Engineers',
        'Gross Profit',
        'Margin %'
      ]],
      body: projectsData.map(project => [
        project["Project Name"],
        `${project.Progress}%`,
        project.Status,
        project["Work Items"],
        format(parseISO(project["Start Date"]), 'MMM dd, yy'),
        format(parseISO(project["End Date"]), 'MMM dd, yy'),
        project["Assigned Engineers"],
        `${project.Currency} ${project["Gross Profit"].toLocaleString('en-MY')}`,
        `${project["Margin Profit (%)"].toFixed(1)}%`
      ]),
      theme: 'striped',
      headStyles: {
        fillColor: [71, 85, 105],
        fontSize: 8,
        fontStyle: 'bold',
        halign: 'center',
      },
      bodyStyles: {
        fontSize: 7,
      },
      columnStyles: {
        0: { cellWidth: 45 },
        1: { cellWidth: 18, halign: 'center' },
        2: { cellWidth: 25 },
        3: { cellWidth: 20, halign: 'center' },
        4: { cellWidth: 25 },
        5: { cellWidth: 25 },
        6: { cellWidth: 40 },
        7: { cellWidth: 30, halign: 'right' },
        8: { cellWidth: 18, halign: 'right' },
      },
      margin: { left: margin, right: margin },
    });
  }

  // Add page numbers
  addPageNumbers(doc, companyName);

  return doc.output('blob');
};

// Task & Milestone Report PDF Export
interface TaskMilestoneData {
  "Work Item Title": string;
  "Type": 'Task' | 'Milestone';
  "Project Name": string;
  "Owner": string;
  "Due Date": string;
  "Status": string;
}

export const exportTaskMilestoneToPDF = (
  tasksData: TaskMilestoneData[],
  options: ExportOptions = {}
): Blob => {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const { companyName = 'SitePilot', userName = 'N/A', dateRange } = options;
  const margin = 14;

  // Add header
  let yPosition = addReportHeader(doc, {
    companyName,
    userName,
    reportTitle: 'Task & Milestone Report',
    dateRange,
    isFirstPage: true,
  });

  // Tasks Table
  if (tasksData.length > 0) {
    autoTable(doc, {
      startY: yPosition,
      head: [[
        'Work Item Title',
        'Type',
        'Project',
        'Owner',
        'Due Date',
        'Status'
      ]],
      body: tasksData.map(task => [
        task["Work Item Title"],
        task.Type,
        task["Project Name"],
        task.Owner,
        format(parseISO(task["Due Date"]), 'MMM dd, yyyy'),
        task.Status
      ]),
      theme: 'striped',
      headStyles: {
        fillColor: [71, 85, 105],
        fontSize: 9,
        fontStyle: 'bold',
        halign: 'center',
      },
      bodyStyles: {
        fontSize: 8,
      },
      columnStyles: {
        0: { cellWidth: 50 },
        1: { cellWidth: 20, halign: 'center' },
        2: { cellWidth: 40 },
        3: { cellWidth: 30 },
        4: { cellWidth: 25 },
        5: { cellWidth: 20, halign: 'center' },
      },
      margin: { left: margin, right: margin },
    });

    // Summary
    const totalTasks = tasksData.filter(t => t.Type === 'Task').length;
    const totalMilestones = tasksData.filter(t => t.Type === 'Milestone').length;
    const completedItems = tasksData.filter(t => t.Status === 'Completed').length;
    const overdueItems = tasksData.filter(t => t.Status === 'Overdue').length;

    yPosition = (doc as any).lastAutoTable.finalY + 15;

    if (yPosition > 240) {
      doc.addPage();
      yPosition = 20;
    }

    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Work Items Summary', margin, yPosition);
    yPosition += 8;

    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text(`Total Tasks: ${totalTasks}`, margin + 5, yPosition);
    yPosition += 6;
    doc.text(`Total Milestones: ${totalMilestones}`, margin + 5, yPosition);
    yPosition += 6;
    doc.text(`Completed: ${completedItems}`, margin + 5, yPosition);
    yPosition += 6;
    doc.text(`Overdue: ${overdueItems}`, margin + 5, yPosition);
  }

  // Add page numbers
  addPageNumbers(doc, companyName);

  return doc.output('blob');
};
