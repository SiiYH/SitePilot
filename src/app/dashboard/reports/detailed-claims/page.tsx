
'use client';

import { useEffect, useState } from 'react';
import { DateRange } from 'react-day-picker';
import { addDays, format } from 'date-fns';
import { Calendar as CalendarIcon, User, X, FolderKanban } from 'lucide-react';
import ReportsPageLayout from '../ReportsPageLayout';
import { useReportContext } from '@/contexts/ReportContext';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import DetailedClaimsReport from '@/components/dashboard/views/admin/DetailedClaimsReport';

export default function DetailedClaimsPage() {
  const { setDateRange, setSelectedEngineerId, setSelectedProjectId, reportData } = useReportContext();
  const { toast } = useToast();
  const [date, setDate] = useState<DateRange | undefined>();
  const [selectedEngineer, setSelectedEngineer] = useState<string>('all');
  const [selectedProject, setSelectedProject] = useState<string>('all');

  const engineers = reportData.users.filter(u => u.role === 'engineer');
  const projects = reportData.projects;

  useEffect(() => {
    setDateRange(date);
    setSelectedEngineerId(selectedEngineer === 'all' ? undefined : selectedEngineer);
    setSelectedProjectId(selectedProject === 'all' ? undefined : selectedProject);
    toast({
        title: 'Report Loaded',
        description: 'The detailed claims report has been updated for the selected filters.',
      });
  }, [date, selectedEngineer, selectedProject, setSelectedEngineerId, setSelectedProjectId, setDateRange, toast]);

  return (
      <ReportsPageLayout>
        <div className="space-y-6">
          <div className="print-hidden flex flex-col gap-4">
            <div>
                <h2 className="text-2xl font-bold tracking-tight">Detailed Claims Report</h2>
                <p className="text-muted-foreground">
                A detailed breakdown of all claims.
                </p>
            </div>
            <div className="flex flex-wrap items-end gap-4">
               <div className="grid flex-auto gap-2 min-w-48">
                  <span className="text-sm font-medium">engineer</span>
                  <Select value={selectedEngineer} onValueChange={setSelectedEngineer}>
                    <SelectTrigger>
                      <User className="mr-2 h-4 w-4" />
                      <SelectValue placeholder="Select engineer" />
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
               </div>
                <div className="grid flex-auto gap-2 min-w-48">
                  <span className="text-sm font-medium">Project</span>
                  <Select value={selectedProject} onValueChange={setSelectedProject}>
                    <SelectTrigger>
                      <FolderKanban className="mr-2 h-4 w-4" />
                      <SelectValue placeholder="Select Project" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Projects</SelectItem>
                      {projects.map(project => (
                        <SelectItem key={project.id} value={project.id}>
                          {project.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
               </div>
              <div className="grid flex-auto gap-2 min-w-48">
                <span className="text-sm font-medium">Date range</span>
                <div className="flex items-center gap-2">
                    <Popover>
                        <PopoverTrigger asChild>
                        <Button
                            id="date"
                            variant={'outline'}
                            className={cn(
                            'w-full justify-start text-left font-normal',
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
          <div className="printable-content">
            <DetailedClaimsReport />
          </div>
        </div>
      </ReportsPageLayout>
  );
}
