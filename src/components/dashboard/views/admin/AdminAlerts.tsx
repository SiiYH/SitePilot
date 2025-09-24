
'use client';

import Link from 'next/link';
import { AlertCircle, Users } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Claim } from '@/types';

interface AdminAlertsProps {
  claims: Claim[];
  unassignedTasksCount: number;
}

export default function AdminAlerts({ claims, unassignedTasksCount }: AdminAlertsProps) {
  const pendingClaimsCount = claims.filter(c => c.status === 'Pending' || c.status === 'Overdue').length;

  if (pendingClaimsCount === 0 && unassignedTasksCount === 0) {
    return null;
  }

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {pendingClaimsCount > 0 && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Pending Claims</AlertTitle>
          <AlertDescription className='flex flex-col sm:flex-row sm:items-center sm:justify-between'>
            <span>There are {pendingClaimsCount} claims that need your attention.</span>
            <Button asChild variant="link" className="p-0 h-auto">
              <Link href="/dashboard/claims">Review Claims</Link>
            </Button>
          </AlertDescription>
        </Alert>
      )}
      {unassignedTasksCount > 0 && (
        <Alert>
          <Users className="h-4 w-4" />
          <AlertTitle>Unassigned Tasks</AlertTitle>
          <AlertDescription className='flex flex-col sm:flex-row sm:items-center sm:justify-between'>
            <span>There are {unassignedTasksCount} tasks without an assigned engineer.</span>
            <Button asChild variant="link" className="p-0 h-auto">
                <Link href="/dashboard/team">Assign Tasks</Link>
            </Button>
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}
