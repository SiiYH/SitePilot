
'use client';

import { createContext, useContext, ReactNode, useMemo, useState } from 'react';
import { User, Project, Claim, Task } from '@/types';
import * as XLSX from 'xlsx';
import { DateRange } from 'react-day-picker';
import { isWithinInterval, parseISO } from 'date-fns';


interface ReportDataContext {
  users: User[];
  projects: Project[];
  claims: Claim[];
}

interface SummaryData {
  "Engineer Name": string;
  "Completed Sites": number;
  "Total Amount (RM)": number;
  "Claim (RM)": number;
  "Ongoing Sites": number;
  "Due Sites": number;
}

interface PerformanceData {
  "Engineer Name": string;
  "Total Tasks": number;
  "Completed Tasks": number;
  "Overdue Tasks": number;
  "On-Time Rate": number;
}

interface DetailedClaimData {
    "Engineer Name": string;
    "Site Name": string;
    "e-Invoice No.": string;
    "Claim Title": string;
    "Amount": number;
    "Currency": string;
    "Date": string;
    "Status": string;
}

interface ReportContextType {
  reportData: ReportDataContext;
  setReportData: (data: ReportDataContext) => void;
  summaryData: SummaryData[];
  performanceData: PerformanceData[];
  detailedClaimsData: DetailedClaimData[];
  exportToExcel: () => void;
  dateRange: DateRange | undefined;
  setDateRange: (dateRange: DateRange | undefined) => void;
  selectedEngineerId: string | undefined;
  setSelectedEngineerId: (id: string | undefined) => void;
  selectedProjectId: string | undefined;
  setSelectedProjectId: (id: string | undefined) => void;
}

const ReportContext = createContext<ReportContextType | undefined>(undefined);

export function ReportProvider({ children, reportData: initialReportData }: { children: ReactNode; reportData: ReportDataContext }) {
  const [reportData, setReportData] = useState<ReportDataContext>(initialReportData);
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const [selectedEngineerId, setSelectedEngineerId] = useState<string | undefined>();
  const [selectedProjectId, setSelectedProjectId] = useState<string | undefined>();
  
  const allEngineers = useMemo(() => {
    return reportData.users.filter(u => u.role === 'Engineer');
  }, [reportData.users]);

  const engineers = useMemo(() => {
    if (!selectedEngineerId) return allEngineers;
    return allEngineers.filter(e => e.id === selectedEngineerId);
  }, [allEngineers, selectedEngineerId]);
  
  const interval = useMemo(() => {
    return dateRange?.from && dateRange?.to ? { start: dateRange.from, end: dateRange.to } : null;
  }, [dateRange]);

  const filteredProjects = useMemo(() => {
    return interval ? reportData.projects.filter(p => isWithinInterval(parseISO(p.startDate), interval) || isWithinInterval(parseISO(p.endDate), interval)) : reportData.projects;
  }, [reportData.projects, interval]);
  
  const filteredClaims = useMemo(() => {
     let claimsToFilter = reportData.claims;
     if (selectedEngineerId) {
        claimsToFilter = claimsToFilter.filter(c => c.submittedBy === selectedEngineerId);
     }
     if (selectedProjectId) {
      claimsToFilter = claimsToFilter.filter(c => c.projectId === selectedProjectId);
    }
     if (interval) {
        claimsToFilter = claimsToFilter.filter(c => isWithinInterval(parseISO(c.date), interval));
     }
     return claimsToFilter;
  }, [reportData.claims, interval, selectedEngineerId, selectedProjectId]);
  
  const filteredTasks = useMemo(() => {
    const allTasks: (Task & {projectId: string})[] = reportData.projects.flatMap(p => p.tasks.map(t => ({...t, projectId: p.id})));
    if (!interval) return allTasks;
    return allTasks.filter(t => {
      try {
        return isWithinInterval(parseISO(t.dueDate), interval);
      } catch (e) {
        // Ignore tasks with invalid dates
        return false;
      }
    });
  }, [reportData.projects, interval]);


  const summaryData: SummaryData[] = useMemo(() => {
    if (!engineers.length || !filteredProjects.length) return [];

    return engineers.map(engineer => {
      const assignedProjects = filteredProjects.filter(p => p.assignedEngineers.includes(engineer.id));
      const engineerClaims = filteredClaims.filter(c => c.submittedBy === engineer.id);

      const completedSites = assignedProjects.filter(p => p.progress === 100).length;
      const ongoingSites = assignedProjects.filter(p => p.progress < 100).length;
      
      const totalAmount = assignedProjects.reduce((acc, p) => acc + (p.grossProfit || 0), 0);
      const claimAmount = engineerClaims.reduce((acc, c) => acc + c.amount, 0);

      const dueSites = assignedProjects.filter(p => {
        const isOverdue = new Date(p.endDate) < new Date() && p.progress < 100;
        const hasOverdueTasks = p.tasks.some(t => t.assignedTo === engineer.id && t.status === 'Overdue');
        return isOverdue || hasOverdueTasks;
      }).length;

      return {
        "Engineer Name": engineer.name,
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
      const assignedTasks = filteredTasks.filter(t => t.assignedTo === engineer.id);
      const totalTasks = assignedTasks.length;
      const completedTasks = assignedTasks.filter(t => t.status === 'Completed').length;
      const overdueTasks = assignedTasks.filter(t => t.status === 'Overdue').length;
      
      const onTimeTasks = assignedTasks.filter(t => 
        t.status === 'Completed' && new Date(t.dueDate) >= new Date() // Simplified logic
      ).length;

      const onTimeRate = completedTasks > 0 ? (onTimeTasks / completedTasks) * 100 : 0;

      return {
        "Engineer Name": engineer.name,
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
            "Engineer Name": engineer?.name || 'N/A',
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

  const exportToExcel = () => {
    const summaryWorksheet = XLSX.utils.json_to_sheet(summaryData);
    const performanceWorksheet = XLSX.utils.json_to_sheet(performanceData);
    const detailedClaimsWorksheet = XLSX.utils.json_to_sheet(detailedClaimsData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, summaryWorksheet, 'Engineer Summary');
    XLSX.utils.book_append_sheet(workbook, performanceWorksheet, 'Engineer Performance');
    XLSX.utils.book_append_sheet(workbook, detailedClaimsWorksheet, 'Detailed Claims');
    XLSX.writeFile(workbook, 'SitePilot_Reports.xlsx');
  };

  const value = {
    reportData,
    setReportData,
    summaryData,
    performanceData,
    detailedClaimsData,
    exportToExcel,
    dateRange,
    setDateRange,
    selectedEngineerId,
    setSelectedEngineerId,
    selectedProjectId,
    setSelectedProjectId,
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
