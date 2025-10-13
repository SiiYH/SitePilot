

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
  "engineer Name": string;
  "Total Tasks": number;
  "Completed Tasks": number;
  "Overdue Tasks": number;
  "On-Time Rate": number;
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
  exportSummaryToExcel: () => void;
  exportPerformanceToExcel: () => void;
  exportDetailedClaimsToExcel: () => void;
  exportProjectStatusToExcel: () => void;
  exportTaskMilestoneToExcel: () => void;
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
    const allTasks: (Task & {projectId: string, projectName: string})[] = reportData.projects.flatMap(p => p.tasks.map(t => ({...t, projectId: p.id, projectName: p.name})));
    
    let tasksToFilter = allTasks;

    if (selectedEngineerId) {
      tasksToFilter = tasksToFilter.filter(t => t.owner === selectedEngineerId);
    }
    if (selectedProjectId) {
      tasksToFilter = tasksToFilter.filter(t => t.projectId === selectedProjectId);
    }
    if (interval) {
      tasksToFilter = tasksToFilter.filter(t => {
        try {
          return isWithinInterval(parseISO(t.dueDate), interval);
        } catch (e) {
          // Ignore tasks with invalid dates
          return false;
        }
      });
    }
    return tasksToFilter;
  }, [reportData.projects, interval, selectedEngineerId, selectedProjectId]);


  const summaryData: SummaryData[] = useMemo(() => {
    if (!engineers.length) return [];

    return engineers.map(engineer => {
      const assignedProjects = filteredProjects.filter(p => p.assignedEngineers.includes(engineer.id));
      const engineerClaims = filteredClaims.filter(c => c.submittedBy === engineer.id);

      const completedSites = assignedProjects.filter(p => getProjectProgress(p) === 100).length;
      const ongoingSites = assignedProjects.filter(p => getProjectProgress(p) < 100).length;
      
      const totalAmount = assignedProjects.reduce((acc, p) => acc + (p.grossProfit || 0), 0);
      const claimAmount = engineerClaims.reduce((acc, c) => acc + c.amount, 0);

      const dueSites = assignedProjects.filter(p => {
        try {
            const isOverdue = new Date(p.endDate) < new Date() && getProjectProgress(p) < 100;
            const hasOverdueTasks = p.tasks.some(t => t.owner === engineer.id && t.status === 'Overdue');
            return isOverdue || hasOverdueTasks;
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
  }, [engineers, filteredProjects, filteredClaims]);

  const performanceData: PerformanceData[] = useMemo(() => {
    if (!engineers.length) return [];
    
    return engineers.map(engineer => {
      const assignedTasks = filteredTasks.filter(t => t.owner === engineer.id);
      const totalTasks = assignedTasks.length;
      const completedTasks = assignedTasks.filter(t => t.status === 'Completed').length;
      const overdueTasks = assignedTasks.filter(t => t.status === 'Overdue').length;
      
      const onTimeTasks = assignedTasks.filter(t => {
          try {
            return t.status === 'Completed' && new Date(t.dueDate) >= new Date() // Simplified logic
          } catch {
              return false;
          }
        }
      ).length;

      const onTimeRate = completedTasks > 0 ? (onTimeTasks / completedTasks) * 100 : 0;

      return {
        "engineer Name": engineer.name,
        "Total Tasks": totalTasks,
        "Completed Tasks": completedTasks,
        "Overdue Tasks": overdueTasks,
        "On-Time Rate": Math.round(onTimeRate),
      };
    });
  }, [engineers, filteredTasks]);

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
        const totalWorkItems = project.tasks.length;
        const completedWorkItems = project.tasks.filter(t => t.status === 'Completed').length;

        return {
            "Project Name": project.name,
            "Progress": getProjectProgress(project),
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
  }, [filteredProjects, reportData.users]);

  const taskMilestoneData: TaskMilestoneData[] = useMemo(() => {
    return filteredTasks.map(task => {
        const owner = reportData.users.find(u => u.id === task.owner);
        return {
            "Work Item Title": task.title,
            "Type": task.type,
            "Project Name": task.projectName,
            "Owner": owner?.name || 'N/A',
            "Due Date": task.dueDate,
            "Status": task.status,
        };
    });
  }, [filteredTasks, reportData.users]);


  const exportToExcel = (worksheet: XLSX.WorkSheet, sheetName: string, fileName: string) => {
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
    XLSX.writeFile(workbook, fileName);
  };
  
  const exportSummaryToExcel = () => {
    const worksheet = XLSX.utils.json_to_sheet(summaryData);
    exportToExcel(worksheet, 'Engineer Summary', 'SitePilot_Engineer_Summary.xlsx');
  };
  
  const exportPerformanceToExcel = () => {
    const worksheet = XLSX.utils.json_to_sheet(performanceData);
    exportToExcel(worksheet, 'Engineer Performance', 'SitePilot_Engineer_Performance.xlsx');
  };
  
  const exportDetailedClaimsToExcel = () => {
    const worksheet = XLSX.utils.json_to_sheet(detailedClaimsData);
    exportToExcel(worksheet, 'Detailed Claims', 'SitePilot_Detailed_Claims.xlsx');
  };

  const exportProjectStatusToExcel = () => {
    const worksheet = XLSX.utils.json_to_sheet(projectStatusData);
    exportToExcel(worksheet, 'Project Status', 'SitePilot_Project_Status.xlsx');
  };

  const exportTaskMilestoneToExcel = () => {
    const worksheet = XLSX.utils.json_to_sheet(taskMilestoneData);
    exportToExcel(worksheet, 'Task & Milestone Details', 'SitePilot_Task_Milestone_Report.xlsx');
  }
  
  const exportAllToExcel = () => {
    const projectStatusWorksheet = XLSX.utils.json_to_sheet(projectStatusData);
    const summaryWorksheet = XLSX.utils.json_to_sheet(summaryData);
    const performanceWorksheet = XLSX.utils.json_to_sheet(performanceData);
    const detailedClaimsWorksheet = XLSX.utils.json_to_sheet(detailedClaimsData);
    const taskMilestoneWorksheet = XLSX.utils.json_to_sheet(taskMilestoneData);

    
    const workbook = XLSX.utils.book_new();
    
    XLSX.utils.book_append_sheet(workbook, projectStatusWorksheet, 'Project Status');
    XLSX.utils.book_append_sheet(workbook, summaryWorksheet, 'Engineer Summary');
    XLSX.utils.book_append_sheet(workbook, performanceWorksheet, 'Engineer Performance');
    XLSX.utils.book_append_sheet(workbook, detailedClaimsWorksheet, 'Detailed Claims');
    XLSX.utils.book_append_sheet(workbook, taskMilestoneWorksheet, 'Task & Milestone Details');
    
    XLSX.writeFile(workbook, 'SitePilot_All_Reports.xlsx');
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
