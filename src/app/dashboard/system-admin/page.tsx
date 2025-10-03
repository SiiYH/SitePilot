'use client';

import { useState, useEffect } from 'react';
import LicenseGenerator, { License } from './_components/LicenseGenerator';
import LicenseList from './_components/LicenseList';
import { Separator } from '@/components/ui/separator';
import { useAuth } from '@/hooks/use-auth';
import { Loader2 } from 'lucide-react';

const STORAGE_KEY = 'sitepilot-licenses';

export default function SystemAdminPage() {
  const { user, loading } = useAuth();
  const [licenses, setLicenses] = useState<License[]>([]);

  useEffect(() => {
    const storedLicenses = localStorage.getItem(STORAGE_KEY);
    if (storedLicenses) {
      setLicenses(JSON.parse(storedLicenses));
    }
  }, []);

  const handleLicenseGenerated = (newLicense: License) => {
    const updatedLicenses = [newLicense, ...licenses];
    setLicenses(updatedLicenses);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedLicenses));
  };

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
        <h2 className="text-2xl font-bold tracking-tight">System Administration</h2>
        <p className="text-muted-foreground">
          Manage system-level settings and generate licenses.
        </p>
      </div>
      <LicenseGenerator onLicenseGenerated={handleLicenseGenerated} />
      <Separator />
      <LicenseList licenses={licenses} />
    </div>
  );
}
