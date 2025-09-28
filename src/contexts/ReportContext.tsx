
'use client';

import { createContext, useContext, ReactNode, useMemo, useState } from 'react';
import { User, Project, Claim } from '@/types';
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

interface ReportContextType {
  reportData: ReportDataContext;
  setReportData: (data: ReportDataContext) => void;
  summaryData: SummaryData[];
  exportToExcel: () => void;
  dateRange: DateRange | undefined;
  setDateRange: (dateRange: DateRange) => void;
}

const ReportContext = createContext<ReportContextType | undefined>(undefined);

export function ReportProvider({ children, reportData: initialReportData }: { children: ReactNode; reportData: ReportDataContext }) {
  const [reportData, setReportData] = useState<ReportDataContext>(initialReportData);
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  
  const summaryData: SummaryData[] = useMemo(() => {
    const { users, projects, claims } = reportData;
    if (!users.length || !projects.length) return [];
    
    const engineers = users.filter(u => u.role === 'Engineer');

    const interval = dateRange?.from && dateRange?.to ? { start: dateRange.from, end: dateRange.to } : null;

    const filteredProjects = interval ? projects.filter(p => isWithinInterval(parseISO(p.startDate), interval) || isWithinInterval(parseISO(p.endDate), interval)) : projects;
    const filteredClaims = interval ? claims.filter(c => isWithinInterval(parseISO(c.date), interval)) : claims;

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
  }, [reportData, dateRange]);

  const exportToExcel = () => {
    const worksheet = XLSX.utils.json_to_sheet(summaryData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Engineer Summary');
    XLSX.writeFile(workbook, 'Engineer_Summary_Report.xlsx');
  };

  const value = {
    reportData,
    setReportData,
    summaryData,
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
