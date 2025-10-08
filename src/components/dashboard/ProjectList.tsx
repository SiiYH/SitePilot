
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Project } from '@/types';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Progress } from '@/components/ui/progress';
import { getProjectProgress } from '@/lib/projects';
import { format, parseISO } from 'date-fns';
import { mockUsers } from '@/lib/data';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import ProjectStatusBadge from './ProjectStatusBadge';

interface ProjectListProps {
  projects: Project[];
}

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

export default function ProjectList({ projects }: ProjectListProps) {
  const router = useRouter();

  const handleRowClick = (slug: string) => {
    router.push(`/dashboard/projects/${slug}`);
  };

  return (
    <div className="overflow-hidden rounded-lg border">
        <Table>
            <TableHeader>
                <TableRow>
                    <TableHead>Project Name</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Progress</TableHead>
                    <TableHead>Start Date</TableHead>
                    <TableHead>End Date</TableHead>
                    <TableHead>Team</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {projects.map(project => {
                    const progress = getProjectProgress(project);
                    const startDate = getSafeDate(project.startDate);
                    const endDate = getSafeDate(project.endDate);

                    const assignedEngineers = project.assignedEngineers
                        .map(id => mockUsers.find(u => u.id === id))
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
  );
}
