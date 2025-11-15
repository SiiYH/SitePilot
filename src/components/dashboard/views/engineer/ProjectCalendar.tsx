
'use client';

import * as React from 'react';
import { useState } from 'react';
import { Project } from '@/types';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar } from '@/components/ui/calendar';
import { Badge } from '@/components/ui/badge';
import { isWithinInterval, startOfDay, parseISO, format } from 'date-fns';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';
import { DayProps, useDayRender } from 'react-day-picker';
import { cn } from '@/lib/utils';
import LockedOverlay from '@/components/ui/lockedOverlay';
import { useAuth } from '@/hooks/use-auth';

interface ProjectCalendarProps {
  projects: Project[];
}

const getProjectInterval = (project: Project): { start: Date; end: Date } | null => {
  const startDate = parseISO(project.startDate);
  const endDate = parseISO(project.endDate);


  if (!startDate || !endDate) {
    return null;
  }

  return { start: startOfDay(startDate), end: startOfDay(endDate) };
};

export default function ProjectCalendar({ projects }: ProjectCalendarProps) {
  const [date, setDate] = useState<Date | undefined>(new Date());
  const { user, isLicenseValid, isLicenseExpired } = useAuth();
  const isLicenseActive = isLicenseValid;

  const projectsWithIntervals = projects.map(p => ({
    ...p,
    interval: getProjectInterval(p),
  }));

  const activeProjectsForSelectedDay = date
    ? projectsWithIntervals.filter(p => p.interval && isWithinInterval(startOfDay(date), p.interval))
    : [];

  const DayWithProjectCount = (props: DayProps) => {
    const buttonRef = React.useRef<HTMLButtonElement>(null);
    const { buttonProps, activeModifiers } = useDayRender(props.date, props.displayMonth, buttonRef);
    const { selected } = activeModifiers;

    const day = startOfDay(props.date);
    const activeProjectsCount = projectsWithIntervals.filter(p =>
      p.interval && isWithinInterval(day, p.interval)
    ).length;

    return (
      <div
        className={cn("relative flex h-full w-full items-center justify-center")}
      >
        <button ref={buttonRef} {...buttonProps} className={cn(buttonProps.className, 'h-9 w-9 p-0', {
          "font-bold text-primary-foreground": selected
        })}>
          {props.date.getDate()}
        </button>
        {activeProjectsCount > 0 && (
          <Badge
            className={cn("absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full p-0 text-xs font-bold",
              selected ? "bg-primary-foreground text-primary" : "bg-secondary text-secondary-foreground"
            )}
          >
            {activeProjectsCount}
          </Badge>
        )}
      </div>
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Project Calendar</CardTitle>
        <CardDescription>
          A count of your active projects on each day. Click a day to see the list.
        </CardDescription>
      </CardHeader>
      <div className="relative">
        {!isLicenseActive && (
          <LockedOverlay
            user={user}
            isLicenseExpired={isLicenseExpired}
            message="Activate your license to access Project Calender."
          />
        )}
        <div className={!isLicenseActive ? 'pointer-events-none select-none' : ''}>
          <CardContent className="flex flex-col items-center gap-6">
            <Calendar
              mode="single"
              selected={date}
              onSelect={setDate}
              className="rounded-md"
              components={{
                Day: DayWithProjectCount,
              }}
            />
            {date && (
              <div className='w-full'>
                <Separator />
                <div className='mt-6 rounded-lg bg-muted/30 p-4'>
                  <h4 className="text-md font-semibold">
                    Active Projects for <span className="text-primary">{format(date, 'PPP')}</span>
                  </h4>
                  {activeProjectsForSelectedDay.length > 0 ? (
                    <ul className="mt-4 space-y-2">
                      {activeProjectsForSelectedDay.map(project => (
                        <li key={project.id} className="rounded-lg border bg-background p-3 transition-colors hover:bg-muted/50">
                          <div className="flex items-center justify-between">
                            <div className='space-y-1'>
                              <p className="font-medium">{project.name}</p>
                              <p className="text-sm text-muted-foreground">End Date: {format(parseISO(project.endDate), 'PPP')}</p>
                            </div>
                            <Button asChild variant="ghost" size="icon">
                              <Link href={`/dashboard/projects/${project.id}`}>
                                <ArrowRight />
                                <span className="sr-only">View Project</span>
                              </Link>
                            </Button>
                          </div>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="mt-2 text-sm text-muted-foreground">No active projects on this day.</p>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </div>
      </div>
    </Card>
  );
}
