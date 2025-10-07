
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

export default function ActivateLicenseDialog() {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button>
          <PlusCircle className="mr-2 h-4 w-4" />
          Create User
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ShieldCheck className="h-6 w-6 text-primary" />
            <span>Activate Your Company License</span>
          </DialogTitle>
          <DialogDescription>
            To add new users, your company's license must be activated first. Please go to your company settings to enter your license key.
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
