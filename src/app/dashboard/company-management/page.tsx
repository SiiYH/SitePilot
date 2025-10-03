
'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { Loader2 } from 'lucide-react';
import CompanyList from './_components/CompanyList';
import { License } from '@/app/dashboard/system-admin/_components/LicenseGenerator';

const STORAGE_KEY = 'sitepilot-licenses';

export default function CompanyManagementPage() {
  const { user } = useAuth();
  const [licenses, setLicenses] = useState<License[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedLicenses = localStorage.getItem(STORAGE_KEY);
    if (storedLicenses) {
      setLicenses(JSON.parse(storedLicenses));
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
          An overview of all companies with generated licenses.
        </p>
      </div>
      <CompanyList licenses={licenses} />
    </div>
  );
}
