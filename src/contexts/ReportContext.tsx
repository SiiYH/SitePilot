
'use client';

import { createContext, useContext, ReactNode, useMemo, useState } from 'react';
import { User, Project, Claim } from '@/types';
import * as XLSX from 'xlsx';

interface ReportDataContext {
  users: User[];
  projects: Project[];
  claims: Claim[];
}

interface ReportContextType {
  reportData: ReportDataContext;
  setReportData: (data: ReportDataContext) => void;
  exportToExcel: () => void;
}

const ReportContext = createContext<ReportContextType | undefined>(undefined);

export function ReportProvider({ children, reportData: initialReportData }: { children: ReactNode; reportData: ReportDataContext }) {
  const [reportData, setReportData] = useState<ReportDataContext>(initialReportData);
  
  const summaryData = useMemo(() => {
    const { users, projects, claims } = reportData;
    if (!users.length || !projects.length || !claims.length) return [];
    
    const engineers = users.filter(u => u.role === 'Engineer');

    return engineers.map(engineer => {
      const assignedProjects = projects.filter(p => p.assignedEngineers.includes(engineer.id));
      const engineerClaims = claims.filter(c => c.submittedBy === engineer.id);

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
  }, [reportData]);

  const exportToExcel = () => {
    if(summaryData.length === 0) return;
    const worksheet = XLSX.utils.json_to_sheet(summaryData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Engineer Summary');
    XLSX.writeFile(workbook, 'Engineer_Summary_Report.xlsx');
  };

  const value = {
    reportData,
    setReportData,
    exportToExcel,
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
