
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
import { Calendar, Users, ArrowUpDown, ArrowDown, ArrowUp, MoreHorizontal, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/use-auth';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';


interface ProjectListProps {
  projects: Project[];
  users: User[];
  onDelete: (project: Project) => void;
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

export default function ProjectList({ projects, users, onDelete }: ProjectListProps) {
  const router = useRouter();
  const { company } = useAuth();
  const [sortKey, setSortKey] = useState<SortKey | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  
  const projectStatuses = useMemo(() => company?.projectStatuses || [], [company]);

  const handleRowClick = (projectId: string) => {
    router.push(`/dashboard/projects/${projectId}`);
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
      {/* Mobile View is now handled by the grid view in projects/page.tsx */}
      
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
                      <TableHead className="text-right">Actions</TableHead>
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
                          <TableRow key={project.id}>
                              <TableCell className="font-medium" onClick={() => handleRowClick(project.id)}>{project.name}</TableCell>
                              <TableCell onClick={() => handleRowClick(project.id)}>
                                  <ProjectStatusBadge statusId={project.status} />
                              </TableCell>
                              <TableCell onClick={() => handleRowClick(project.id)}>
                                  <div className="flex items-center gap-2">
                                      <Progress value={progress} className="h-2 w-20" />
                                      <span className="text-xs font-medium text-muted-foreground">{progress}%</span>
                                  </div>
                              </TableCell>
                              <TableCell onClick={() => handleRowClick(project.id)}>{startDate ? format(startDate, 'MMM dd, yyyy') : 'N/A'}</TableCell>
                              <TableCell onClick={() => handleRowClick(project.id)}>{endDate ? format(endDate, 'MMM dd, yyyy') : 'N/A'}</TableCell>
                              <TableCell onClick={() => handleRowClick(project.id)}>
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
                              <TableCell className="text-right">
                                <AlertDialog>
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" size="icon" className="h-8 w-8">
                                                <MoreHorizontal className="h-4 w-4" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end">
                                            <AlertDialogTrigger asChild>
                                                <DropdownMenuItem className="text-destructive" onSelect={(e) => e.preventDefault()}>
                                                    <Trash2 className="mr-2 h-4 w-4" />
                                                    Delete
                                                </DropdownMenuItem>
                                            </AlertDialogTrigger>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                    <AlertDialogContent>
                                        <AlertDialogHeader>
                                        <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                                        <AlertDialogDescription>
                                            This will permanently delete the project "{project.name}", its tasks, documents, and all associated data. This action cannot be undone.
                                        </AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter>
                                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                                        <AlertDialogAction onClick={() => onDelete(project)} className="bg-destructive hover:bg-destructive/90">Delete Project</AlertDialogAction>
                                        </AlertDialogFooter>
                                    </AlertDialogContent>
                                </AlertDialog>
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
