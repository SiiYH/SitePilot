
'use client';

import { createContext, useContext, ReactNode, useMemo, useState } from 'react';
import { User, Project, Claim, Task, ProjectStatus } from '@/types';
import * as XLSX from 'xlsx';
import { DateRange } from 'react-day-picker';
import { isWithinInterval, parseISO } from 'date-fns';
import { getProjectProgress } from '@/lib/projects';

interface ReportDataContext {
  users: User[];
  projects: Project[];
  claims: Claim[];
  tasks: Task[];
}

interface SummaryData {
  "engineer Name": string;
  "Completed Sites": number;
  "Total Amount (RM)": number;
  "Claim (RM)": number;
  "Ongoing Sites": number;
  "Due Sites": number;
}

interface PerformanceData {
  id: string; // ✅ Add this
  "engineer Name": string;
  "avatarUrl"?: string;
  "projects": any[];
  "tasks": (Task & {projectName?: string})[]; // ✅ Add projectName to task type
  "claims": (Claim & {projectName?: string})[];
}

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

interface TaskMilestoneData {
  "Work Item Title": string;
  "Type": 'Task' | 'Milestone';
  "Project Name": string;
  "Owner": string;
  "Due Date": string;
  "Status": string;
}

interface ReportContextType {
  reportData: ReportDataContext;
  setReportData: (data: ReportDataContext) => void;
  summaryData: SummaryData[];
  performanceData: PerformanceData[];
  detailedClaimsData: DetailedClaimData[];
  projectStatusData: ProjectStatusData[];
  taskMilestoneData: TaskMilestoneData[];
  exportAllToExcel: () => void;
  exportSummaryToExcel: () => XLSX.WorkBook;
  exportPerformanceToExcel: () => XLSX.WorkBook;
  exportDetailedClaimsToExcel: () => XLSX.WorkBook;
  exportProjectStatusToExcel: () => XLSX.WorkBook;
  exportTaskMilestoneToExcel: () => XLSX.WorkBook;
  dateRange: DateRange | undefined;
  setDateRange: (dateRange: DateRange | undefined) => void;
  selectedEngineerId: string | undefined;
  setSelectedEngineerId: (id: string | undefined) => void;
  selectedProjectId: string | undefined;
  setSelectedProjectId: (id: string | undefined) => void;
  selectedProjectStatus: string | undefined;
  setSelectedProjectStatus: (status: string | undefined) => void;
}

const ReportContext = createContext<ReportContextType | undefined>(undefined);

export function ReportProvider({ children, reportData: initialReportData }: { children: ReactNode; reportData: ReportDataContext }) {
  const [reportData, setReportData] = useState<ReportDataContext>(initialReportData);
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const [selectedEngineerId, setSelectedEngineerId] = useState<string | undefined>();
  const [selectedProjectId, setSelectedProjectId] = useState<string | undefined>();
  const [selectedProjectStatus, setSelectedProjectStatus] = useState<string | undefined>();
  
  const allEngineers = useMemo(() => {
    return reportData.users.filter(u => u.role === 'engineer');
  }, [reportData.users]);

  const engineers = useMemo(() => {
    if (!selectedEngineerId) return allEngineers;
    return allEngineers.filter(e => e.id === selectedEngineerId);
  }, [allEngineers, selectedEngineerId]);
  
  const interval = useMemo(() => {
    return dateRange?.from && dateRange?.to ? { start: dateRange.from, end: dateRange.to } : null;
  }, [dateRange]);

  const filteredProjects = useMemo(() => {
    let projectsToFilter = reportData.projects;

    if (selectedProjectId) {
      projectsToFilter = projectsToFilter.filter(p => p.id === selectedProjectId);
    }
    if (selectedEngineerId) {
      projectsToFilter = projectsToFilter.filter(p => p.assignedEngineers.includes(selectedEngineerId));
    }
    if (interval) {
      projectsToFilter = projectsToFilter.filter(p => {
        try {
          return isWithinInterval(parseISO(p.startDate), interval) || isWithinInterval(parseISO(p.endDate), interval)
        } catch {
          return false;
        }
      });
    }
    if (selectedProjectStatus && selectedProjectStatus !== 'all') {
      projectsToFilter = projectsToFilter.filter(p => p.status === selectedProjectStatus);
    }

    return projectsToFilter;
  }, [reportData.projects, interval, selectedEngineerId, selectedProjectId, selectedProjectStatus]);
  
  const filteredClaims = useMemo(() => {
    let claimsToFilter = reportData.claims;

    if (selectedEngineerId) {
      claimsToFilter = claimsToFilter.filter(c => c.submittedBy === selectedEngineerId);
    }
    if (selectedProjectId) {
      claimsToFilter = claimsToFilter.filter(c => c.projectId === selectedProjectId);
    }
    if (interval) {
      claimsToFilter = claimsToFilter.filter(c => {
        try {
          return isWithinInterval(parseISO(c.date), interval)
        } catch {
          return false;
        }
      });
    }
    return claimsToFilter;
  }, [reportData.claims, interval, selectedEngineerId, selectedProjectId]);
  
  const filteredTasks = useMemo(() => {
    let tasksToFilter = reportData.tasks;

    if (selectedEngineerId) {
      tasksToFilter = tasksToFilter.filter(t => t.owner === selectedEngineerId || t.contributors?.includes(selectedEngineerId));
    }
    if (selectedProjectId) {
      tasksToFilter = tasksToFilter.filter(t => t.projectId === selectedProjectId);
    }
    if (interval) {
      tasksToFilter = tasksToFilter.filter(t => {
        try {
          return isWithinInterval(parseISO(t.dueDate), interval);
        } catch (e) {
          return false;
        }
      });
    }
    return tasksToFilter;
  }, [reportData.tasks, interval, selectedEngineerId, selectedProjectId]);

  const summaryData: SummaryData[] = useMemo(() => {
    if (!engineers.length) return [];

    return engineers.map(engineer => {
      // Filter projects and claims specifically for this engineer
      const assignedProjects = reportData.projects.filter(p => p.assignedEngineers.includes(engineer.id));
      const engineerClaims = reportData.claims.filter(c => c.submittedBy === engineer.id);
      
      // Now apply the global filters on top of the engineer-specific data
      const finalProjects = assignedProjects.filter(p => filteredProjects.some(fp => fp.id === p.id));
      const finalClaims = engineerClaims.filter(c => filteredClaims.some(fc => fc.id === c.id));
      const engineerTasks = reportData.tasks.filter(t => (t.owner === engineer.id || t.contributors?.includes(engineer.id)) && finalProjects.some(p => p.id === t.projectId));

      const completedSites = finalProjects.filter(p => getProjectProgress(p) === 100).length;
      const ongoingSites = finalProjects.filter(p => getProjectProgress(p) < 100).length;
      
      const totalAmount = finalProjects.reduce((acc, p) => acc + (p.grossProfit || 0), 0);
      const claimAmount = finalClaims.reduce((acc, c) => acc + c.amount, 0);

      const dueSites = finalProjects.filter(p => {
        try {
          const projectProgress = getProjectProgress(p);
          const isProjectOverdue = new Date(p.endDate) < new Date() && projectProgress < 100;
          const hasOverdueTasks = engineerTasks.some(t => t.projectId === p.id && t.status === 'Overdue');
          return isProjectOverdue || hasOverdueTasks;
        } catch {
          return false;
        }
      }).length;

      return {
        "engineer Name": engineer.name,
        "Completed Sites": completedSites,
        "Total Amount (RM)": totalAmount,
        "Claim (RM)": claimAmount,
        "Ongoing Sites": ongoingSites,
        "Due Sites": dueSites,
      };
    });
  }, [engineers, filteredProjects, filteredClaims, reportData.projects, reportData.claims, reportData.tasks]);

  const performanceData: PerformanceData[] = useMemo(() => {
    if (!engineers.length) return [];
    
    return engineers.map(engineer => {
      const assignedProjects = filteredProjects.filter(p => p.assignedEngineers.includes(engineer.id));
      const assignedTasks = filteredTasks
        .filter(t => t.owner === engineer.id || t.contributors?.includes(engineer.id))
        .map(task => {
          // ✅ Add project name to each task
          const project = reportData.projects.find(p => p.id === task.projectId);
          return { ...task, projectName: project?.name || 'N/A' };
        });
      const submittedClaims = filteredClaims
        .filter(c => c.submittedBy === engineer.id)
        .map(claim => {
          const project = reportData.projects.find(p => p.id === claim.projectId);
          return {...claim, projectName: project?.name || 'N/A'};
        });
  
      return {
        id: engineer.id, // ✅ Add engineer ID
        "engineer Name": engineer.name,
        "avatarUrl": engineer.avatarUrl,
        "projects": assignedProjects,
        "tasks": assignedTasks,
        "claims": submittedClaims,
      };
    });
  }, [engineers, filteredTasks, filteredProjects, filteredClaims, reportData.projects]);

  const detailedClaimsData: DetailedClaimData[] = useMemo(() => {
    return filteredClaims.map(claim => {
      const engineer = reportData.users.find(u => u.id === claim.submittedBy);
      const project = reportData.projects.find(p => p.id === claim.projectId);
      return {
        "engineer Name": engineer?.name || 'N/A',
        "Site Name": project?.name || 'N/A',
        "e-Invoice No.": claim.eInvoiceNo || 'N/A',
        "Claim Title": claim.title,
        "Amount": claim.amount,
        "Currency": claim.currency,
        "Date": claim.date,
        "Status": claim.status,
      };
    });
  }, [filteredClaims, reportData.users, reportData.projects]);

  const projectStatusData: ProjectStatusData[] = useMemo(() => {
    return filteredProjects.map(project => {
      const assignedEngineers = project.assignedEngineers.map(id => reportData.users.find(u => u.id === id)?.name || 'N/A').join(', ');
      
      // Use the correctly fetched tasks from the context
      const projectTasks = reportData.tasks.filter(t => t.projectId === project.id);
      const totalWorkItems = projectTasks.length;
      const completedWorkItems = projectTasks.filter(t => t.status === 'Completed').length;

      return {
        "Project Name": project.name,
        "Progress": getProjectProgress({...project, tasks: projectTasks}),
        "Status": project.status,
        "Work Items": `${completedWorkItems}/${totalWorkItems}`,
        "Start Date": project.startDate,
        "End Date": project.endDate,
        "Assigned Engineers": assignedEngineers,
        "Gross Profit": project.grossProfit || 0,
        "Margin Profit (%)": project.marginProfit || 0,
        "Currency": project.currency || 'N/A',
      }
    });
  }, [filteredProjects, reportData.users, reportData.tasks]);

  const taskMilestoneData: TaskMilestoneData[] = useMemo(() => {
    return filteredTasks.map(task => {
      const owner = reportData.users.find(u => u.id === task.owner);
      return {
        "Work Item Title": task.title,
        "Type": task.type,
        "Project Name": task.projectName || 'N/A',
        "Owner": owner?.name || 'N/A',
        "Due Date": task.dueDate,
        "Status": task.status,
      };
    });
  }, [filteredTasks, reportData.users]);

  // Helper function to create formatted Excel workbook
  const createFormattedWorkbook = (
    data: any[],
    sheetName: string,
    title: string,
    columnWidths?: { [key: string]: number }
  ): XLSX.WorkBook => {
    const workbook = XLSX.utils.book_new();
    
    // Create worksheet data with title and metadata
    const worksheetData: any[][] = [];
    
    // Add title row
    worksheetData.push([title]);
    worksheetData.push([]); // Empty row
    
    // Add metadata
    worksheetData.push(['Generated Date:', new Date().toLocaleDateString()]);
    if (dateRange?.from || dateRange?.to) {
      const dateRangeStr = `${dateRange?.from?.toLocaleDateString() || 'N/A'} - ${dateRange?.to?.toLocaleDateString() || 'N/A'}`;
      worksheetData.push(['Date Range:', dateRangeStr]);
    }
    worksheetData.push([]); // Empty row
    
    // Convert data to worksheet
    const dataWorksheet = XLSX.utils.json_to_sheet(data);
    const dataRows = XLSX.utils.sheet_to_json(dataWorksheet, { header: 1 });
    
    // Add data rows to worksheet data
    worksheetData.push(...dataRows);
    
    // Create final worksheet
    const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);
    
    // Apply column widths
    if (columnWidths) {
      const cols = Object.keys(data[0] || {}).map((key, index) => ({
        wch: columnWidths[key] || 15
      }));
      worksheet['!cols'] = cols;
    } else {
      // Auto-calculate column widths
      const cols = Object.keys(data[0] || {}).map(key => {
        const maxLength = Math.max(
          key.length,
          ...data.map(row => String(row[key] || '').length)
        );
        return { wch: Math.min(maxLength + 2, 50) };
      });
      worksheet['!cols'] = cols;
    }
    
    // Style header row (row 5 after title and metadata)
    const headerRow = 5;
    const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1');
    
    // Apply bold to title
    const titleCell = worksheet['A1'];
    if (titleCell) {
      titleCell.s = {
        font: { bold: true, sz: 14 },
        alignment: { horizontal: 'left' }
      };
    }
    
    // Apply formatting to header row
    for (let col = range.s.c; col <= range.e.c; col++) {
      const cellAddress = XLSX.utils.encode_cell({ r: headerRow, c: col });
      if (worksheet[cellAddress]) {
        worksheet[cellAddress].s = {
          font: { bold: true },
          fill: { fgColor: { rgb: 'D3D3D3' } },
          alignment: { horizontal: 'center', vertical: 'center' }
        };
      }
    }
    
    XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
    return workbook;
  };

  // Enhanced export functions that return workbooks
  const exportSummaryToExcel = (): XLSX.WorkBook => {
    return createFormattedWorkbook(
      summaryData,
      'Engineer Summary',
      'SitePilot - Engineer Summary Report',
      {
        'engineer Name': 20,
        'Completed Sites': 15,
        'Total Amount (RM)': 18,
        'Claim (RM)': 15,
        'Ongoing Sites': 15,
        'Due Sites': 12,
      }
    );
  };
  
  const exportPerformanceToExcel = (): XLSX.WorkBook => {
    const wb = XLSX.utils.book_new();
  
    performanceData.forEach(engineerData => {
      const engineerName = engineerData["engineer Name"];
      const sheetName = engineerName.substring(0, 31);
      const ws_data: any[][] = [];
  
      ws_data.push([`Engineer Performance: ${engineerName}`]);
      ws_data.push([]);
  
      // Projects
      ws_data.push(["Assigned Projects"]);
      ws_data.push(["Project Name", "Status", "End Date"]);
      engineerData.projects.forEach(p => {
        ws_data.push([p.name, p.status, p.endDate]);
      });
      ws_data.push([]);
  
      // Tasks - ✅ Now includes projectName
      ws_data.push(["Assigned Tasks"]);
      ws_data.push(["Task Title", "Project", "Role", "Due Date", "Status"]);
      engineerData.tasks.forEach(t => {
        const role = t.owner === engineerData.id ? 'Owner' : 'Contributor';
        ws_data.push([t.title, t.projectName || 'N/A', role, t.dueDate, t.status]);
      });
      ws_data.push([]);
  
      // Claims
      ws_data.push(["Submitted Claims"]);
      ws_data.push(["Claim Title", "Project", "Amount", "Currency", "Status"]);
      engineerData.claims.forEach(c => {
        ws_data.push([c.title, c.projectName || 'N/A', c.amount, c.currency, c.status]);
      });
  
      const ws = XLSX.utils.aoa_to_sheet(ws_data);
      ws['!cols'] = [{wch:30}, {wch:25}, {wch:15}, {wch:12}, {wch:12}];
      XLSX.utils.book_append_sheet(wb, ws, sheetName);
    });
  
    return wb;
  };
  
  const exportDetailedClaimsToExcel = (): XLSX.WorkBook => {
    return createFormattedWorkbook(
      detailedClaimsData,
      'Detailed Claims',
      'SitePilot - Detailed Claims Report',
      {
        'engineer Name': 20,
        'Site Name': 25,
        'e-Invoice No.': 15,
        'Claim Title': 30,
        'Amount': 12,
        'Currency': 10,
        'Date': 12,
        'Status': 12,
      }
    );
  };

  const exportProjectStatusToExcel = (): XLSX.WorkBook => {
    return createFormattedWorkbook(
      projectStatusData,
      'Project Status',
      'SitePilot - Project Status Report',
      {
        'Project Name': 25,
        'Progress': 12,
        'Status': 12,
        'Work Items': 12,
        'Start Date': 12,
        'End Date': 12,
        'Assigned Engineers': 25,
        'Gross Profit': 15,
        'Margin Profit (%)': 15,
        'Currency': 10,
      }
    );
  };

  const exportTaskMilestoneToExcel = (): XLSX.WorkBook => {
    return createFormattedWorkbook(
      taskMilestoneData,
      'Task & Milestone Details',
      'SitePilot - Task & Milestone Report',
      {
        'Work Item Title': 30,
        'Type': 12,
        'Project Name': 25,
        'Owner': 20,
        'Due Date': 12,
        'Status': 12,
      }
    );
  };
  
  const exportAllToExcel = () => {
    const workbook = XLSX.utils.book_new();
    
    // Helper to add formatted sheet
    const addFormattedSheet = (data: any[], sheetName: string, title: string) => {
      const worksheetData: any[][] = [];
      
      // Title
      worksheetData.push([title]);
      worksheetData.push([]);
      
      // Metadata
      worksheetData.push(['Generated Date:', new Date().toLocaleDateString()]);
      if (dateRange?.from || dateRange?.to) {
        const dateRangeStr = `${dateRange?.from?.toLocaleDateString() || 'N/A'} - ${dateRange?.to?.toLocaleDateString() || 'N/A'}`;
        worksheetData.push(['Date Range:', dateRangeStr]);
      }
      worksheetData.push([]);
      
      // Data
      const dataWorksheet = XLSX.utils.json_to_sheet(data);
      const dataRows = XLSX.utils.sheet_to_json(dataWorksheet, { header: 1 });
      worksheetData.push(...dataRows);
      
      const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);
      
      // Auto width
      const cols = Object.keys(data[0] || {}).map(key => {
        const maxLength = Math.max(
          key.length,
          ...data.map(row => String(row[key] || '').length)
        );
        return { wch: Math.min(maxLength + 2, 50) };
      });
      worksheet['!cols'] = cols;
      
      XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
    };
    
    // Add all sheets
    addFormattedSheet(projectStatusData, 'Project Status', 'Project Status Report');
    addFormattedSheet(summaryData, 'Engineer Summary', 'Engineer Summary Report');
    addFormattedSheet(detailedClaimsData, 'Detailed Claims', 'Detailed Claims Report');
    addFormattedSheet(taskMilestoneData, 'Tasks & Milestones', 'Task & Milestone Report');
    
    XLSX.writeFile(workbook, `SitePilot_All_Reports_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const value = {
    reportData,
    setReportData,
    summaryData,
    performanceData,
    detailedClaimsData,
    projectStatusData,
    taskMilestoneData,
    exportAllToExcel,
    exportSummaryToExcel,
    exportPerformanceToExcel,
    exportDetailedClaimsToExcel,
    exportProjectStatusToExcel,
    exportTaskMilestoneToExcel,
    dateRange,
    setDateRange,
    selectedEngineerId,
    setSelectedEngineerId,
    selectedProjectId,
    setSelectedProjectId,
    selectedProjectStatus,
    setSelectedProjectStatus,
  };

  return <ReportContext.Provider value={value}>{children}</ReportContext.Provider>;
}

export function useReportContext() {
  const context = useContext(ReportContext);
  if (context === undefined) {
    throw new Error('useReportContext must be used within a ReportProvider');
  }
  return context;
}
