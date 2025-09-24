
'use client';

import { useState } from 'react';
import { Project } from '@/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar } from '@/components/ui/calendar';
import { Badge } from '@/components/ui/badge';
import { isWithinInterval, startOfDay, parseISO } from 'date-fns';

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

  const DayWithProjectCount = ({ date }: { date: Date }) => {
    const day = startOfDay(date);
    const activeProjectsCount = projectsWithIntervals.filter(p => 
      p.interval && isWithinInterval(day, p.interval)
    ).length;

    return (
      <div className="relative flex h-full w-full items-center justify-center">
        <span>{date.getDate()}</span>
        {activeProjectsCount > 0 && (
          <Badge
            variant="secondary"
            className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full p-0 text-xs"
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
          A count of your active projects on each day.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex justify-center">
        <Calendar
          mode="single"
          selected={date}
          onSelect={setDate}
          className="rounded-md border p-4"
          components={{
            Day: ({ date }) => <DayWithProjectCount date={date as Date} />,
          }}
        />
      </CardContent>
    </Card>
  );
}
