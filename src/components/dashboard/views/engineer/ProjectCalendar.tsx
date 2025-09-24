
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

interface ProjectCalendarProps {
  projects: Project[];
}

const getProjectInterval = (project: Project): { start: Date; end: Date } | null => {
  const dates = [
    ...project.tasks.map(t => parseISO(t.dueDate)),
    ...project.documents.map(d => parseISO(d.uploadedAt)),
    ...project.milestones.map(m => parseISO(m.date)),
  ];

  if (dates.length === 0) {
    return null;
  }

  const startDate = new Date(Math.min(...dates.map(d => d.getTime())));
  const endDate = parseISO(project.deadline);

  return { start: startOfDay(startDate), end: startOfDay(endDate) };
};

export default function ProjectCalendar({ projects }: ProjectCalendarProps) {
  const [date, setDate] = useState<Date | undefined>(new Date());

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
                                            <p className="text-sm text-muted-foreground">Deadline: {format(parseISO(project.deadline), 'PPP')}</p>
                                        </div>
                                        <Button asChild variant="ghost" size="icon">
                                            <Link href={`/dashboard/projects/${project.slug}`}>
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
    </Card>
  );
}
