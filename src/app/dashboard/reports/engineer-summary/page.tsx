
'use client';

import { useEffect, useState } from 'react';
import { DateRange } from 'react-day-picker';
import { addDays, format } from 'date-fns';
import { Calendar as CalendarIcon } from 'lucide-react';
import { mockUsers, mockProjects, mockClaims } from '@/lib/data';
import { User, Project, Claim } from '@/types';
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
  const { setReportData, setDateRange } = useReportContext();
  const { toast } = useToast();
  const [date, setDate] = useState<DateRange | undefined>({
    from: addDays(new Date(), -30),
    to: new Date(),
  });

  useEffect(() => {
    // In a real app, you'd fetch this data. For now, we use mocks.
    const reportData = {
      users: mockUsers,
      projects: mockProjects,
      claims: mockClaims,
    };
    setReportData(reportData);
    if (date) {
      setDateRange(date);
      toast({
        title: 'Report Loaded',
        description: 'The summary has been updated for the selected date range.',
      });
    }
  }, [setReportData, setDateRange, date, toast]);

  return (
      <ReportsPageLayout>
        <div className="space-y-6">
          <div className="print-hidden flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
                <h2 className="text-2xl font-bold tracking-tight">Engineer Summary Report</h2>
                <p className="text-muted-foreground">
                A summary of performance and financial metrics for each engineer.
                </p>
            </div>
            <Popover>
                <PopoverTrigger asChild>
                <Button
                    id="date"
                    variant={'outline'}
                    className={cn(
                    'w-[300px] justify-start text-left font-normal',
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
                    <span>Pick a date</span>
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
          </div>
          <EngineerSummaryReport />
        </div>
      </ReportsPageLayout>
  );
}
