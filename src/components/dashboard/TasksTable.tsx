
'use client';
import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { Task, User, UserRole } from '@/types';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { format, parseISO } from 'date-fns';
import { GanttChartSquare, Milestone, Calendar, User as UserIcon, FolderKanban, ArrowUpDown, ArrowDown, ArrowUp, Tags } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useRouter } from 'next/navigation';
import { useFirestore, updateDocumentNonBlocking } from '@/firebase';
import { doc } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tooltip, TooltipProvider, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';

type ViewMode = 'grid' | 'list';

interface TasksTableProps {
  tasks: Task[];
  user: User;
  users: User[];
  viewMode: ViewMode;
}

type SortOrder = 'asc' | 'desc' | 'none';
type TypeFilter = 'all' | 'Task' | 'Milestone';

const statusVariant: { [key: string]: 'default' | 'secondary' | 'destructive' | 'outline' } = {
  'Completed': 'default',
  'In Progress': 'secondary',
  'Not Started': 'outline',
  'Overdue': 'destructive',
};

const typeIcon: { [key: string]: React.ElementType } = {
    'Task': GanttChartSquare,
    'Milestone': Milestone
}

const getSafeDate = (dateValue: string | Date | undefined): Date | null => {
    if (!dateValue) return null;
    if (dateValue instanceof Date) return dateValue;
    try {
      return parseISO(dateValue);
    } catch (error) {
      return null;
    }
  };

const getInitials = (name: string) => {
    if (!name) return '';
    const names = name.split(' ');
    if (names.length > 1) {
        return `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
};

export default function TasksTable({ tasks: initialTasks, user, users, viewMode }: TasksTableProps) {
  const router = useRouter();
  const firestore = useFirestore();
  const { toast } = useToast();
  const [tasks, setTasks] = useState<Task[]>(initialTasks);
  const [sortOrder, setSortOrder] = useState<SortOrder>('none');
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('all');

  React.useEffect(() => {
    setTasks(initialTasks);
  }, [initialTasks]);
  
  const filteredTasks = useMemo(() => {
    if (typeFilter === 'all') {
      return tasks;
    }
    return tasks.filter(task => task.type === typeFilter);
  }, [tasks, typeFilter]);

  const sortedTasks = useMemo(() => {
    const sortableTasks = [...filteredTasks];
    if (sortOrder === 'none') {
      return sortableTasks;
    }
    sortableTasks.sort((a, b) => {
      const dateA = getSafeDate(a.dueDate)?.getTime() || 0;
      const dateB = getSafeDate(b.dueDate)?.getTime() || 0;
      if (sortOrder === 'asc') {
        return dateA - dateB;
      } else {
        return dateB - dateA;
      }
    });
    return sortableTasks;
  }, [filteredTasks, sortOrder]);

  const handleSort = () => {
    if (sortOrder === 'none') {
      setSortOrder('desc');
    } else if (sortOrder === 'desc') {
      setSortOrder('asc');
    } else {
      setSortOrder('none');
    }
  };

  const handleStatusChange = (taskId: string, projectId: string | undefined, newStatus: Task['status']) => {
    if (!projectId) return;
    
    const taskDocRef = doc(firestore, 'projects', projectId, 'tasks', taskId);
    updateDocumentNonBlocking(taskDocRef, { status: newStatus });

    toast({
        title: "Status Updated",
        description: `The work item status has been set to ${newStatus}.`
    });
  };

  const getUserFromId = (userId: string | undefined) => {
    if (!userId) return undefined;
    return users.find(u => u.id === userId);
  }

  const handleRowClick = (task: Task) => {
      if (!task.projectId) {
          console.error('Missing projectId!');
          return;
      }
      const path = `projects/${task.projectId}/tasks/${task.id}`;
      router.push(`/dashboard/work-items/${path}`);
  };

    const showProjectColumn = sortedTasks.some(task => task.projectName && task.projectSlug);

    const showAssignedToColumn = new Set(sortedTasks.map(t => t.owner)).size > 1 || sortedTasks.some(t => !t.owner || (t.contributors && t.contributors.length > 0));

    const SortIcon = sortOrder === 'asc' ? ArrowUp : sortOrder === 'desc' ? ArrowDown : ArrowUpDown;

  if (tasks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-muted-foreground/30 bg-muted/20 p-12 text-center">
        <h3 className="text-lg font-semibold text-muted-foreground">No Work Items Found</h3>
        <p className="mt-1 text-sm text-muted-foreground">There are no work items that match the current filters.</p>
      </div>
    )
  }

  return (
    <>
        <div className="flex items-center gap-2 mb-4">
            <div className="w-full sm:w-48">
                 <Select value={typeFilter} onValueChange={(value: TypeFilter) => setTypeFilter(value)}>
                    <SelectTrigger>
                        <Tags className="mr-2 h-4 w-4" />
                        <SelectValue placeholder="Filter by type" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Types</SelectItem>
                        <SelectItem value="Task">Tasks</SelectItem>
                        <SelectItem value="Milestone">Milestones</SelectItem>
                    </SelectContent>
                </Select>
            </div>
             <Button variant="ghost" onClick={handleSort} className="px-3">
                Due Date
                <SortIcon className="ml-2 h-4 w-4" />
            </Button>
        </div>

        {viewMode === 'grid' ? (
             <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                {sortedTasks.map(task => {
                    const Icon = typeIcon[task.type] || GanttChartSquare;
                    const dueDate = getSafeDate(task.dueDate);
                    const canEditTask = user.role === 'admin' || user.role === 'director' || task.owner === user.id || task.contributors?.includes(user.id);
                    const owner = getUserFromId(task.owner);
                    const contributors = task.contributors?.map(id => getUserFromId(id)).filter(Boolean) as User[] || [];
                    return (
                        <Card key={task.id} onClick={() => handleRowClick(task)} className={cn("cursor-pointer flex flex-col transition-shadow hover:shadow-md", !task.owner && "bg-yellow-500/5 border-yellow-500/20")}>
                            <CardHeader>
                                <div className="flex items-start justify-between gap-4">
                                    <CardTitle className="text-lg">{task.title}</CardTitle>
                                    <Badge variant="outline" className='h-8'>
                                        <Icon className="h-4 w-4 mr-1 text-muted-foreground" />
                                        {task.type}
                                    </Badge>
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-3 text-sm flex-grow">
                                {showProjectColumn && task.projectSlug && (
                                    <div className="flex items-center gap-2">
                                        <FolderKanban className="h-4 w-4 text-muted-foreground" />
                                        <Link href={`/dashboard/projects/${task.projectSlug}`} className="text-primary hover:underline" onClick={(e) => e.stopPropagation()}>
                                            {task.projectName}
                                        </Link>
                                    </div>
                                )}
                                <div className="flex items-center gap-2">
                                    <Calendar className="h-4 w-4 text-muted-foreground" />
                                    <span className="text-muted-foreground">{dueDate ? format(dueDate, 'MMM dd, yyyy') : 'N/A'}</span>
                                </div>
                                {(showAssignedToColumn) && (
                                    <div className="flex items-center gap-2">
                                        <UserIcon className="h-4 w-4 text-muted-foreground" />
                                         <div className="flex items-center -space-x-2">
                                            {owner ? (
                                                 <TooltipProvider>
                                                    <Tooltip>
                                                        <TooltipTrigger>
                                                            <Avatar className="h-7 w-7 border-2 border-background">
                                                                <AvatarImage src={owner.avatarUrl} alt={owner.name} />
                                                                <AvatarFallback>{getInitials(owner.name)}</AvatarFallback>
                                                            </Avatar>
                                                        </TooltipTrigger>
                                                        <TooltipContent>{owner.name} (Owner)</TooltipContent>
                                                    </Tooltip>
                                                </TooltipProvider>
                                            ) : (
                                                <span className="text-muted-foreground italic text-xs">Unassigned</span>
                                            )}
                                            {contributors.slice(0, 3).map(c => (
                                                <TooltipProvider key={c.id}>
                                                    <Tooltip>
                                                        <TooltipTrigger>
                                                            <Avatar className="h-7 w-7 border-2 border-background">
                                                                <AvatarImage src={c.avatarUrl} alt={c.name} />
                                                                <AvatarFallback>{getInitials(c.name)}</AvatarFallback>
                                                            </Avatar>
                                                        </TooltipTrigger>
                                                        <TooltipContent>{c.name}</TooltipContent>
                                                    </Tooltip>
                                                </TooltipProvider>
                                            ))}
                                             {contributors.length > 3 && (
                                                <div className="flex h-7 w-7 items-center justify-center rounded-full border-2 border-background bg-muted text-xs font-medium text-muted-foreground">
                                                    +{contributors.length - 3}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </CardContent>
                            <div className="p-6 pt-0" onClick={(e) => e.stopPropagation()}>
                                {canEditTask ? (
                                    <Select value={task.status} onValueChange={(newStatus: Task['status']) => handleStatusChange(task.id, task.projectId, newStatus)}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Set status" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="Not Started">Not Started</SelectItem>
                                        <SelectItem value="In Progress">In Progress</SelectItem>
                                        <SelectItem value="Completed">Completed</SelectItem>
                                    </SelectContent>
                                    </Select>
                                ) : (
                                    <Badge variant={statusVariant[task.status] || 'secondary'}>{task.status}</Badge>
                                )}
                            </div>
                        </Card>
                    )
                })}
            </div>
        ) : (
             <div className="hidden md:block">
                <Table>
                <TableHeader>
                    <TableRow>
                    <TableHead>Work Item</TableHead>
                    <TableHead>Type</TableHead>
                    {showProjectColumn && <TableHead>Project</TableHead>}
                    {showAssignedToColumn && <TableHead>Assigned To</TableHead>}
                    <TableHead>
                       Due Date
                    </TableHead>
                    <TableHead className="text-right">Status</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {sortedTasks.map(task => {
                        const Icon = typeIcon[task.type] || GanttChartSquare;
                        const dueDate = getSafeDate(task.dueDate);
                        const canEditTask = user.role === 'admin' || user.role === 'director' || task.owner === user.id || task.contributors?.includes(user.id);
                        const owner = getUserFromId(task.owner);
                        const contributors = task.contributors?.map(id => getUserFromId(id)).filter(Boolean) as User[] || [];

                        return (
                        <TableRow key={task.id} onClick={() => handleRowClick(task)} className={cn("cursor-pointer", !task.owner && "bg-yellow-500/5 hover:bg-yellow-500/10")}>
                            <TableCell className="font-medium">{task.title}</TableCell>
                            <TableCell>
                                <Badge variant="outline" className='h-8'>
                                    <Icon className="h-4 w-4 mr-1 text-muted-foreground" />
                                    {task.type}
                                </Badge>
                            </TableCell>
                            {showProjectColumn && (
                            <TableCell>
                                {task.projectSlug ? (
                                <Link href={`/dashboard/projects/${task.projectSlug}`} className="text-primary hover:underline" onClick={(e) => e.stopPropagation()}>
                                    {task.projectName}
                                </Link>
                                ) : (
                                task.projectName || 'N/A'
                                )}
                            </TableCell>
                            )}
                            {showAssignedToColumn && 
                                <TableCell>
                                    <div className="flex items-center -space-x-2">
                                        {owner ? (
                                            <TooltipProvider>
                                                <Tooltip>
                                                    <TooltipTrigger>
                                                        <Avatar className="h-7 w-7 border-2 border-background">
                                                            <AvatarImage src={owner.avatarUrl} alt={owner.name} />
                                                            <AvatarFallback>{getInitials(owner.name)}</AvatarFallback>
                                                        </Avatar>
                                                    </TooltipTrigger>
                                                    <TooltipContent>{owner.name} (Owner)</TooltipContent>
                                                </Tooltip>
                                            </TooltipProvider>
                                        ) : (
                                            <span className="text-muted-foreground italic text-xs">Unassigned</span>
                                        )}
                                        {contributors.slice(0, 2).map(c => (
                                            <TooltipProvider key={c.id}>
                                                <Tooltip>
                                                    <TooltipTrigger>
                                                        <Avatar className="h-7 w-7 border-2 border-background">
                                                            <AvatarImage src={c.avatarUrl} alt={c.name} />
                                                            <AvatarFallback>{getInitials(c.name)}</AvatarFallback>
                                                        </Avatar>
                                                    </TooltipTrigger>
                                                    <TooltipContent>{c.name}</TooltipContent>
                                                </Tooltip>
                                            </TooltipProvider>
                                        ))}
                                        {contributors.length > 2 && (
                                            <div className="flex h-7 w-7 items-center justify-center rounded-full border-2 border-background bg-muted text-xs font-medium text-muted-foreground">
                                                +{contributors.length - 2}
                                            </div>
                                        )}
                                    </div>
                                </TableCell>
                            }
                            <TableCell>{dueDate ? format(dueDate, 'MMM dd, yyyy') : 'N/A'}</TableCell>
                            <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                            {canEditTask ? (
                                <Select value={task.status} onValueChange={(newStatus: Task['status']) => handleStatusChange(task.id, task.projectId, newStatus)}>
                                <SelectTrigger className="w-[150px] ml-auto">
                                    <SelectValue placeholder="Set status" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Not Started">Not Started</SelectItem>
                                    <SelectItem value="In Progress">In Progress</SelectItem>
                                    <SelectItem value="Completed">Completed</SelectItem>
                                </SelectContent>
                                </Select>
                            ) : (
                                <Badge variant={statusVariant[task.status] || 'secondary'}>{task.status}</Badge>
                            )}
                            </TableCell>
                        </TableRow>
                        )
                    })}
                </TableBody>
                </Table>
            </div>
        )}
    </>
  );
}
