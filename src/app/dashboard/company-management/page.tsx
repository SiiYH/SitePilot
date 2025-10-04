
'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { Loader2 } from 'lucide-react';
import CompanyList from './_components/CompanyList';

export default function CompanyManagementPage() {
  const { user } = useAuth();
  const [companies, setCompanies] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedCompanies = localStorage.getItem('sitepilot-all-companies');
    if (storedCompanies) {
      setCompanies(JSON.parse(storedCompanies));
    }
    setLoading(false);
  }, []);

  if (loading) {
    return (
      <div className="flex h-[calc(100vh-10rem)] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (user?.role !== 'System Super Admin') {
    return (
      <div className="space-y-6">
        <h2 className="text-2xl font-bold tracking-tight">Access Denied</h2>
        <p className="text-muted-foreground">
          You do not have permission to view this page.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Company Management</h2>
        <p className="text-muted-foreground">
          An overview of all companies created in the system.
        </p>
      </div>
      <CompanyList companies={companies} />
    </div>
  );
}
