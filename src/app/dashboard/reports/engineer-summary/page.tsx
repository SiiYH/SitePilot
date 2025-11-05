'use client';

import { useEffect, useState } from 'react';
import { DateRange } from 'react-day-picker';
import { format } from 'date-fns';
import { Calendar as CalendarIcon, X, Filter } from 'lucide-react';
import EngineerSummaryReport from '@/components/dashboard/views/admin/EngineerSummaryReport';
import ReportsPageLayout from '../ReportsPageLayout';
import { useReportContext } from '@/contexts/ReportContext';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export default function EngineerSummaryPage() {
  const { setDateRange } = useReportContext();
  const { toast } = useToast();
  const [date, setDate] = useState<DateRange | undefined>();
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const loadReport = async () => {
      setIsLoading(true);
      setDateRange(date);
      
      // Simulate async report generation
      await new Promise(resolve => setTimeout(resolve, 300));
      
      setIsLoading(false);
      
      if (date?.from || date?.to) {
        toast({
          title: 'Report Updated',
          description: `Showing data from ${date?.from ? format(date.from, 'MMM dd, yyyy') : 'start'} to ${date?.to ? format(date.to, 'MMM dd, yyyy') : 'today'}`,
        });
      }
    };
    
    loadReport();
  }, [date, setDateRange, toast]);

  const clearFilters = () => {
    setDate(undefined);
    toast({
      title: 'Filters Cleared',
      description: 'Showing all-time data',
    });
  };

  const hasActiveFilters = !!date?.from || !!date?.to;

  return (
    <ReportsPageLayout>
      <div className="space-y-6">
        {/* Page Header - Hidden on Print */}
        <div className="print-hidden">
          <Card className="p-6">
            <div className="space-y-4">
              {/* Title Section */}
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <h2 className="text-2xl font-bold tracking-tight">
                    Engineer Summary Report
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    Performance and financial metrics for each engineer
                  </p>
                </div>
                {hasActiveFilters && (
                  <Badge variant="secondary" className="ml-4">
                    <Filter className="mr-1 h-3 w-3" />
                    Filtered
                  </Badge>
                )}
              </div>

              {/* Filters Section */}
              <div className="flex flex-wrap items-end gap-4 pt-2">
                <div className="flex-1 min-w-[280px] max-w-md space-y-2">
                  <label className="text-sm font-medium">Date Range</label>
                  <div className="flex items-center gap-2">
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            'w-full justify-start text-left font-normal',
                            !date && 'text-muted-foreground'
                          )}
                          disabled={isLoading}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {date?.from ? (
                            date.to ? (
                              <>
                                {format(date.from, 'MMM dd, yyyy')} - {format(date.to, 'MMM dd, yyyy')}
                              </>
                            ) : (
                              format(date.from, 'MMM dd, yyyy')
                            )
                          ) : (
                            <span>All time</span>
                          )}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
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
                      <Button 
                        variant="ghost" 
                        size="icon"
                        onClick={() => setDate(undefined)}
                        disabled={isLoading}
                      >
                        <X className="h-4 w-4" />
                        <span className="sr-only">Clear date range</span>
                      </Button>
                    )}
                  </div>
                </div>

                {/* Clear All Filters Button */}
                {hasActiveFilters && (
                  <Button 
                    variant="outline" 
                    onClick={clearFilters}
                    disabled={isLoading}
                  >
                    <X className="mr-2 h-4 w-4" />
                    Clear All Filters
                  </Button>
                )}
              </div>
            </div>
          </Card>
        </div>

        {/* Print-Only Header Info */}
        <div className="print-only hidden">
          <div className="mb-4 pb-3 border-b">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="font-semibold text-sm">Report Parameters</h3>
              </div>
              <div className="text-xs text-muted-foreground">
                {date?.from || date?.to ? (
                  <span>
                    Period: {date?.from ? format(date.from, 'MMM dd, yyyy') : 'Start'} - {date?.to ? format(date.to, 'MMM dd, yyyy') : 'Today'}
                  </span>
                ) : (
                  <span>Period: All Time</span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Report Content */}
        <div className="printable-content" id="report-data">
          {isLoading ? (
            <Card className="p-8">
              <div className="flex flex-col items-center justify-center space-y-4">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
                <p className="text-sm text-muted-foreground">Loading report data...</p>
              </div>
            </Card>
          ) : (
            <EngineerSummaryReport />
          )}
        </div>
      </div>
    </ReportsPageLayout>
  );
}