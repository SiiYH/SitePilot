
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

interface ReportContextType {
  reportData: ReportDataContext;
  setReportData: (data: ReportDataContext) => void;
  summaryData: SummaryData[];
  performanceData: PerformanceData[];
  exportToExcel: () => void;
  dateRange: DateRange | undefined;
  setDateRange: (dateRange: DateRange) => void;
}

const ReportContext = createContext<ReportContextType | undefined>(undefined);

export function ReportProvider({ children, reportData: initialReportData }: { children: ReactNode; reportData: ReportDataContext }) {
  const [reportData, setReportData] = useState<ReportDataContext>(initialReportData);
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  
  const engineers = useMemo(() => {
    return reportData.users.filter(u => u.role === 'Engineer');
  }, [reportData.users]);
  
  const interval = useMemo(() => {
    return dateRange?.from && dateRange?.to ? { start: dateRange.from, end: dateRange.to } : null;
  }, [dateRange]);

  const filteredProjects = useMemo(() => {
    return interval ? reportData.projects.filter(p => isWithinInterval(parseISO(p.startDate), interval) || isWithinInterval(parseISO(p.endDate), interval)) : reportData.projects;
  }, [reportData.projects, interval]);
  
  const filteredClaims = useMemo(() => {
     return interval ? reportData.claims.filter(c => isWithinInterval(parseISO(c.date), interval)) : reportData.claims;
  }, [reportData.claims, interval]);
  
  const filteredTasks = useMemo(() => {
    const allTasks: (Task & {projectId: string})[] = reportData.projects.flatMap(p => p.tasks.map(t => ({...t, projectId: p.id})));
    return interval ? allTasks.filter(t => isWithinInterval(parseISO(t.dueDate), interval)) : allTasks;
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

  const exportToExcel = () => {
    const summaryWorksheet = XLSX.utils.json_to_sheet(summaryData);
    const performanceWorksheet = XLSX.utils.json_to_sheet(performanceData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, summaryWorksheet, 'Engineer Summary');
    XLSX.utils.book_append_sheet(workbook, performanceWorksheet, 'Engineer Performance');
    XLSX.writeFile(workbook, 'Engineer_Reports.xlsx');
  };

  const value = {
    reportData,
    setReportData,
    summaryData,
    performanceData,
    exportToExcel,
    dateRange,
    setDateRange,
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
