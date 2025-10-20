
'use client';

import * as React from 'react';
import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Project, User } from '@/types';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Progress } from '@/components/ui/progress';
import { getProjectProgress } from '@/lib/projects';
import { format, parseISO } from 'date-fns';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import ProjectStatusBadge from './ProjectStatusBadge';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Calendar, Users, ArrowUpDown, ArrowDown, ArrowUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';


interface ProjectListProps {
  projects: Project[];
  users: User[];
}

type SortKey = 'startDate' | 'endDate';
type SortDirection = 'asc' | 'desc';

const getInitials = (name: string) => {
    if (!name) return '';
    const names = name.split(' ');
    if (names.length > 1) {
        return `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
};

const getSafeDate = (dateValue: string | Date | undefined): Date | null => {
    if (!dateValue) return null;
    if (dateValue instanceof Date) return dateValue;
    try {
        return parseISO(dateValue);
    } catch (error) {
        return null;
    }
};

export default function ProjectList({ projects, users }: ProjectListProps) {
  const router = useRouter();
  const [sortKey, setSortKey] = useState<SortKey | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

  const handleRowClick = (slug: string) => {
    router.push(`/dashboard/projects/${slug}`);
  };

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      if (sortDirection === 'desc') {
        setSortDirection('asc');
      } else {
        setSortKey(null);
      }
    } else {
      setSortKey(key);
      setSortDirection('desc');
    }
  };

  const sortedProjects = useMemo(() => {
    const sortableProjects = [...projects];
    if (!sortKey) {
      return sortableProjects;
    }
    sortableProjects.sort((a, b) => {
      const dateA = getSafeDate(a[sortKey])?.getTime() || 0;
      const dateB = getSafeDate(b[sortKey])?.getTime() || 0;
      
      if (dateA === dateB) return 0;
      
      const result = dateA < dateB ? -1 : 1;
      return sortDirection === 'asc' ? result : -result;
    });
    return sortableProjects;
  }, [projects, sortKey, sortDirection]);

  const getSortIcon = (key: SortKey) => {
    if (sortKey !== key) return ArrowUpDown;
    if (sortDirection === 'asc') return ArrowUp;
    return ArrowDown;
  };

  return (
    <>
      {/* Mobile View */}
      <div className="space-y-4 md:hidden">
        {sortedProjects.map(project => {
            const progress = getProjectProgress(project);
            const endDate = getSafeDate(project.endDate);
            const assignedEngineers = project.assignedEngineers
                .map(id => users.find(u => u.id === id))
                .filter((u): u is any => !!u);
            return (
                <Card key={project.id} onClick={() => handleRowClick(project.slug)} className="cursor-pointer transition-shadow hover:shadow-md">
                    <CardHeader>
                        <div className="flex items-start justify-between gap-4">
                            <h3 className="font-semibold text-lg">{project.name}</h3>
                            <ProjectStatusBadge statusId={project.status} />
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div>
                            <div className="mb-1 flex justify-between text-sm font-medium">
                                <span>Progress</span>
                                <span className="text-muted-foreground">{progress}%</span>
                            </div>
                            <Progress value={progress} />
                        </div>
                        <div className="flex justify-between text-sm text-muted-foreground">
                            <div className="flex items-center gap-2">
                                <Calendar className="h-4 w-4" />
                                <span>{endDate ? format(endDate, 'MMM dd, yyyy') : 'N/A'}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <Users className="h-4 w-4" />
                                <span>{assignedEngineers.length} Engineers</span>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )
        })}
      </div>

      {/* Desktop View */}
      <div className="hidden overflow-hidden rounded-lg border md:block">
          <Table>
              <TableHeader>
                  <TableRow>
                      <TableHead>Project Name</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Progress</TableHead>
                      <TableHead>
                        <Button variant="ghost" onClick={() => handleSort('startDate')} className="px-2">
                          Start Date
                          {React.createElement(getSortIcon('startDate'), { className: "ml-2 h-4 w-4" })}
                        </Button>
                      </TableHead>
                      <TableHead>
                        <Button variant="ghost" onClick={() => handleSort('endDate')} className="px-2">
                          End Date
                          {React.createElement(getSortIcon('endDate'), { className: "ml-2 h-4 w-4" })}
                        </Button>
                      </TableHead>
                      <TableHead>Team</TableHead>
                  </TableRow>
              </TableHeader>
              <TableBody>
                  {sortedProjects.map(project => {
                      const progress = getProjectProgress(project);
                      const startDate = getSafeDate(project.startDate);
                      const endDate = getSafeDate(project.endDate);

                      const assignedEngineers = project.assignedEngineers
                          .map(id => users.find(u => u.id === id))
                          .filter((u): u is any => !!u);

                      return (
                          <TableRow key={project.id} onClick={() => handleRowClick(project.slug)} className="cursor-pointer">
                              <TableCell className="font-medium">{project.name}</TableCell>
                              <TableCell>
                                  <ProjectStatusBadge statusId={project.status} />
                              </TableCell>
                              <TableCell>
                                  <div className="flex items-center gap-2">
                                      <Progress value={progress} className="h-2 w-20" />
                                      <span className="text-xs font-medium text-muted-foreground">{progress}%</span>
                                  </div>
                              </TableCell>
                              <TableCell>{startDate ? format(startDate, 'MMM dd, yyyy') : 'N/A'}</TableCell>
                              <TableCell>{endDate ? format(endDate, 'MMM dd, yyyy') : 'N/A'}</TableCell>
                              <TableCell>
                                  <div className="flex items-center -space-x-2">
                                      <TooltipProvider>
                                      {assignedEngineers.slice(0, 3).map(engineer => (
                                          <Tooltip key={engineer.id}>
                                              <TooltipTrigger asChild>
                                                  <Avatar className="h-7 w-7 border-2 border-background">
                                                      <AvatarImage src={engineer.avatarUrl} alt={engineer.name} />
                                                      <AvatarFallback>{getInitials(engineer.name)}</AvatarFallback>
                                                  </Avatar>
                                              </TooltipTrigger>
                                              <TooltipContent>
                                                  <p>{engineer.name}</p>
                                              </TooltipContent>
                                          </Tooltip>
                                      ))}
                                      </TooltipProvider>
                                      {assignedEngineers.length > 3 && (
                                          <div className="flex h-7 w-7 items-center justify-center rounded-full border-2 border-background bg-muted text-xs font-medium text-muted-foreground">
                                              +{assignedEngineers.length - 3}
                                          </div>
                                      )}
                                  </div>
                              </TableCell>
                          </TableRow>
                      );
                  })}
              </TableBody>
          </Table>
      </div>
    </>
  );
}
