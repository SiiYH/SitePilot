
'use client';

import { useState, useEffect } from 'react';
import { formatDistanceToNowStrict, parseISO, differenceInDays, isValid, format } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { Clock } from 'lucide-react';
import { Tooltip, TooltipProvider, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';


interface LicenseExpiryCountdownProps {
  expiresAt: string | null; // ISO string or null
}

export default function LicenseExpiryCountdown({ expiresAt }: LicenseExpiryCountdownProps) {
  const [timeLeft, setTimeLeft] = useState('');
  const [expiryStatus, setExpiryStatus] = useState<'safe' | 'soon' | 'imminent' | 'expired'>('safe');
  const [fullDate, setFullDate] = useState('');

  useEffect(() => {
    if (!expiresAt) {
      return;
    }

    const expiryDate = parseISO(expiresAt);
    if (!isValid(expiryDate)) {
      setTimeLeft('');
      return;
    }
    
    setFullDate(format(expiryDate, 'PPP'));

    const updateCountdown = () => {
      const now = new Date();
      if (expiryDate < now) {
        setTimeLeft('Expired');
        setExpiryStatus('expired');
        return;
      }
      
      const daysLeft = differenceInDays(expiryDate, now);

      if (daysLeft < 7) {
        setExpiryStatus('imminent');
      } else if (daysLeft < 30) {
        setExpiryStatus('soon');
      } else {
        setExpiryStatus('safe');
      }

      setTimeLeft(formatDistanceToNowStrict(expiryDate, { addSuffix: true }));
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 60000); 

    return () => clearInterval(interval);
  }, [expiresAt]);

  const statusStyles = {
    safe: 'border-transparent bg-secondary text-secondary-foreground',
    soon: 'border-orange-400/50 bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300',
    imminent: 'border-red-400/50 bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
    expired: 'border-transparent bg-destructive text-destructive-foreground',
  };

  if (!timeLeft) {
    return null;
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger>
           <Badge className={cn('flex items-center gap-1.5', statusStyles[expiryStatus])}>
            <Clock className="h-3 w-3" />
            <span className="font-medium">{timeLeft}</span>
          </Badge>
        </TooltipTrigger>
        <TooltipContent>
          <p>Expires on {fullDate}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

