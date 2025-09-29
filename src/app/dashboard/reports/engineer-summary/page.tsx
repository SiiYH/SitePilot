
'use client';

import { useEffect, useState } from 'react';
import { DateRange } from 'react-day-picker';
import { addDays, format } from 'date-fns';
import { Calendar as CalendarIcon, X } from 'lucide-react';
import EngineerSummaryReport from '@/components/dashboard/views/admin/EngineerSummaryReport';
import ReportsPageLayout from '../ReportsPageLayout';
import { useReportContext } from '@/contexts/ReportContext';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

// This is now a client component to allow updating the context
export default function EngineerSummaryPage() {
  const { setDateRange } = useReportContext();
  const { toast } = useToast();
  const [date, setDate] = useState<DateRange | undefined>({
    from: addDays(new Date(), -30),
    to: new Date(),
  });

  useEffect(() => {
    setDateRange(date);
    toast({
      title: 'Report Loaded',
      description: 'The summary has been updated for the selected date range.',
    });
  }, [setDateRange, date, toast]);

  return (
      <ReportsPageLayout>
        <div className="space-y-6">
          <div className="print-hidden flex flex-col gap-4">
            <div>
                <h2 className="text-2xl font-bold tracking-tight">Engineer Summary Report</h2>
                <p className="text-muted-foreground">
                A summary of performance and financial metrics for each engineer.
                </p>
            </div>
             <div className="flex flex-col gap-4">
              <div className="grid gap-2">
                <span className="text-sm font-medium">Date range</span>
                <div className="flex items-center gap-2">
                    <Popover>
                        <PopoverTrigger asChild>
                        <Button
                            id="date"
                            variant={'outline'}
                            className={cn(
                            'w-full justify-start text-left font-normal sm:w-[300px]',
                            !date && 'text-muted-foreground'
                            )}
                        >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {date?.from ? (
                            date.to ? (
                                <>
                                {format(date.from, 'LLL dd, y')} - {format(date.to, 'LLL dd, y')}
                                </>
                            ) : (
                                format(date.from, 'LLL dd, y')
                            )
                            ) : (
                            <span>All time</span>
                            )}
                        </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="end">
                        <Calendar
                            initialFocus
                            mode="range"
                            defaultMonth={date?.from}
                            selected={date}
                            onSelect={setDate}
                            numberOfMonths={2}
                        />
                        </PopoverContent>
                    </Popover>
                    {date && (
                        <Button variant="ghost" onClick={() => setDate(undefined)} className="px-2">
                            <X className="h-4 w-4" />
                            <span className="sr-only">Clear date filter</span>
                        </Button>
                    )}
                </div>
              </div>
            </div>
          </div>
          <EngineerSummaryReport />
        </div>
      </ReportsPageLayout>
  );
}
