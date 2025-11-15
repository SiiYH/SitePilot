
'use client';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { PlusCircle, ShieldCheck } from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/hooks/use-auth';

interface ActivateLicenseDialogProps {
  featureName?: string;
}

export default function ActivateLicenseDialog({ featureName = 'add new users' }: ActivateLicenseDialogProps) {
  const { isLicenseExpired } = useAuth();

  const title = isLicenseExpired ? "License Expired" : "Activate Your Company License";
  const description = isLicenseExpired
    ? `To ${featureName}, your company's license must be active. Please go to your company settings to enter a new license key.`
    : `To ${featureName}, your company's license must be activated first. Please go to your company settings to enter your license key.`;

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button>
          <PlusCircle className="mr-2 h-4 w-4" />
          Create {featureName === 'create projects' ? 'Project' : 'User'}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ShieldCheck className="h-6 w-6 text-primary" />
            <span>{title}</span>
          </DialogTitle>
          <DialogDescription>
            {description}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button asChild>
            <Link href="/dashboard/company">Go to Company Settings</Link>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
