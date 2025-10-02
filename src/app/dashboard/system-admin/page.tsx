
'use client';

import { useState, useEffect } from 'react';
import LicenseGenerator, { License } from './_components/LicenseGenerator';
import LicenseList from './_components/LicenseList';
import { Separator } from '@/components/ui/separator';

const STORAGE_KEY = 'sitepilot-licenses';

export default function SystemAdminPage() {
  const [licenses, setLicenses] = useState<License[]>([]);

  useEffect(() => {
    const storedLicenses = localStorage.getItem(STORAGE_KEY);
    if (storedLicenses) {
      setLicenses(JSON.parse(storedLicenses));
    }
  }, []);

  const handleLicenseGenerated = (newLicense: License) => {
    setLicenses(prevLicenses => [newLicense, ...prevLicenses]);
  };

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
