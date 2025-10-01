
'use client';

import { useAuth } from '@/hooks/use-auth';
import { Separator } from '@/components/ui/separator';
import StatusManager from './_components/StatusManager';

export default function SettingsPage() {
  const { user } = useAuth();

  const canManageSettings = user?.role === 'Admin' || user?.role === 'Director';

  if (!canManageSettings) {
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
        <h2 className="text-2xl font-bold tracking-tight">Settings</h2>
        <p className="text-muted-foreground">
          Manage workspace settings and configurations.
        </p>
      </div>
      <Separator />
      <StatusManager />
    </div>
  );
}
