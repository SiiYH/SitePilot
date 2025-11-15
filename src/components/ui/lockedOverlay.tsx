'use client';

import { Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { User } from '@/types';

interface LockedOverlayProps {
  message?: string;
  user?: User | null;
  isLicenseExpired?: boolean;
}

export default function LockedOverlay({ 
  message = "Activate your license to access this feature",
  user,
  isLicenseExpired = false
}: LockedOverlayProps) {
  const canManageLicense = user?.role === 'admin' || user?.role === 'director';
  
  return (
    <div className="absolute inset-0 z-10 flex items-center justify-center rounded-lg bg-gradient-to-br from-background/98 via-background/95 to-background/98 backdrop-blur-md p-4 border border-destructive/20 shadow-xl overflow-hidden">
      <div className="text-center animate-in fade-in-50 slide-in-from-bottom-4 duration-500 max-w-md">
        <div className="relative mx-auto mb-6 w-20 h-20 flex items-center justify-center">
          <div className="absolute inset-[-10px] animate-pulse rounded-full bg-destructive/20 blur-xl" />
          <div className="relative flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-destructive/20 via-destructive/10 to-destructive/5 shadow-lg ring-2 ring-destructive/30 ring-offset-2 ring-offset-background">
            <Lock className="h-10 w-10 text-destructive drop-shadow-sm" />
          </div>
        </div>
        
        <p className="font-bold text-xl mb-2 bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
          {isLicenseExpired ? 'License Expired' : 'Feature Locked'}
        </p>
        
        {canManageLicense ? (
          <>
            <p className="text-sm text-muted-foreground/80 mb-6 leading-relaxed px-4">
              {isLicenseExpired 
                ? "Your company's license has expired. Renew to restore access to all features."
                : message
              }
            </p>
            <Button asChild size="sm" className="shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
              <Link href="/dashboard/company">
                {isLicenseExpired ? 'Renew License' : 'Activate License'}
              </Link>
            </Button>
          </>
        ) : (
          <>
            <p className="text-sm text-muted-foreground/80 mb-4 leading-relaxed px-4">
              {isLicenseExpired 
                ? "Your company's license has expired. This feature is unavailable until the license is renewed."
                : "This feature is locked. Your company's license needs to be activated to access this feature."
              }
            </p>
            <div className="bg-muted/50 rounded-lg p-4 mb-4 border border-muted-foreground/20">
              <p className="text-xs text-muted-foreground leading-relaxed">
                Please contact your <span className="font-semibold text-foreground">Admin</span> or <span className="font-semibold text-foreground">Director</span> to {isLicenseExpired ? 'renew' : 'activate'} the company license.
              </p>
            </div>
            <Button variant="outline" size="sm" disabled className="cursor-not-allowed">
              License Management Restricted
            </Button>
          </>
        )}
      </div>
    </div>
  );
}