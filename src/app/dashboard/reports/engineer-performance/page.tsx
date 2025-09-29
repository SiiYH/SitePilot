
'use client';

import { useEffect, useState } from 'react';
import { DateRange } from 'react-day-picker';
import { addDays, format } from 'date-fns';
import { Calendar as CalendarIcon, User } from 'lucide-react';
import { mockUsers, mockProjects, mockClaims } from '@/lib/data';
import ReportsPageLayout from '../ReportsPageLayout';
import { useReportContext } from '@/contexts/ReportContext';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import EngineerPerformanceReport from '@/components/dashboard/views/admin/EngineerPerformanceReport';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';


export default function EngineerPerformancePage() {
  const { setReportData, setDateRange, setSelectedEngineerId, reportData } = useReportContext();
  const { toast } = useToast();
  const [date, setDate] = useState<DateRange | undefined>({
    from: addDays(new Date(), -30),
    to: new Date(),
  });
  const [selectedEngineer, setSelectedEngineer] = useState<string>('all');

  const engineers = reportData.users.filter(u => u.role === 'Engineer');

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
    }
  }, [setReportData, setDateRange, date, toast]);
  
  useEffect(() => {
    setSelectedEngineerId(selectedEngineer === 'all' ? undefined : selectedEngineer);
    toast({
        title: 'Report Loaded',
        description: 'The performance summary has been updated for the selected filters.',
      });
  }, [date, selectedEngineer, setSelectedEngineerId, toast]);

  return (
      <ReportsPageLayout>
        <div className="space-y-6">
          <div className="print-hidden flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
                <h2 className="text-2xl font-bold tracking-tight">Engineer Performance Report</h2>
                <p className="text-muted-foreground">
                An overview of task completions, overdue tasks, and on-time rates.
                </p>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row">
              <Select value={selectedEngineer} onValueChange={setSelectedEngineer}>
                <SelectTrigger className="w-full sm:w-[200px]">
                  <User className="mr-2 h-4 w-4" />
                  <SelectValue placeholder="Select Engineer" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Engineers</SelectItem>
                  {engineers.map(engineer => (
                    <SelectItem key={engineer.id} value={engineer.id}>
                      {engineer.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
          </div>
          <EngineerPerformanceReport />
        </div>
      </ReportsPageLayout>
  );
}
