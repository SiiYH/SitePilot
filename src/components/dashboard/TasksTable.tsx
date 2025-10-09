
'use client';
import { useState } from 'react';
import Link from 'next/link';
import { Task, User, UserRole } from '@/types';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { mockUsers } from '@/lib/data';
import { cn } from '@/lib/utils';
import { format, parseISO } from 'date-fns';
import { GanttChartSquare, Milestone, Calendar, User as UserIcon, FolderKanban } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useRouter } from 'next/navigation';

interface TasksTableProps {
  tasks: Task[];
  user: User;
}

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

export default function TasksTable({ tasks: initialTasks, user }: TasksTableProps) {
  const router = useRouter();
  const [tasks, setTasks] = useState<Task[]>(initialTasks);
  const canEdit = user.role === 'Engineer' || user.role === 'Admin' || user.role === 'Director';

  const handleStatusChange = (taskId: string, newStatus: Task['status']) => {
    setTasks(currentTasks => 
      currentTasks.map(task => 
        task.id === taskId ? { ...task, status: newStatus } : task
      )
    );
  };

  const getUserName = (userId: string | undefined) => {
    if (!userId) return 'Unassigned';
    return mockUsers.find(u => u.id === userId)?.name || 'Unassigned';
  }

  const handleRowClick = (taskId: string) => {
    router.push(`/dashboard/work-items/${taskId}`);
  };

  const showProjectColumn = tasks.some(task => task.projectName && task.projectSlug);
  
  const showAssignedToColumn = new Set(tasks.map(t => t.owner)).size > 1;

  if (tasks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-muted-foreground/30 bg-muted/20 p-12 text-center">
        <h3 className="text-lg font-semibold text-muted-foreground">No Work Items Found</h3>
        <p className="mt-1 text-sm text-muted-foreground">There are no work items associated with this project yet.</p>
      </div>
    )
  }

  return (
    <>
        {/* Mobile View: List of Cards */}
        <div className="space-y-4 md:hidden">
            {tasks.map(task => {
                const Icon = typeIcon[task.type] || GanttChartSquare;
                const dueDate = getSafeDate(task.dueDate);
                return (
                    <Card key={task.id} onClick={() => handleRowClick(task.id)} className={cn("cursor-pointer transition-shadow hover:shadow-md", !task.owner && "bg-yellow-500/5 border-yellow-500/20")}>
                        <CardHeader>
                            <div className="flex items-start justify-between gap-4">
                                <CardTitle className="text-lg">{task.title}</CardTitle>
                                <Badge variant="outline" className='h-8'>
                                    <Icon className="h-4 w-4 mr-1 text-muted-foreground" />
                                    {task.type}
                                </Badge>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-3 text-sm">
                            {showProjectColumn && task.projectSlug && (
                                <div className="flex items-center gap-2">
                                    <FolderKanban className="h-4 w-4 text-muted-foreground" />
                                    <Link href={`/dashboard/projects/${task.projectSlug}`} className="text-primary hover:underline" onClick={(e) => e.stopPropagation()}>
                                        {task.projectName}
                                    </Link>
                                </div>
                            )}
                            {(showAssignedToColumn || !task.owner) && (
                                <div className="flex items-center gap-2">
                                    <UserIcon className="h-4 w-4 text-muted-foreground" />
                                    <span className={cn("text-muted-foreground", !task.owner && "font-bold text-yellow-600 dark:text-yellow-400")}>{getUserName(task.owner)}</span>
                                </div>
                            )}
                            <div className="flex items-center gap-2">
                                <Calendar className="h-4 w-4 text-muted-foreground" />
                                <span className="text-muted-foreground">{dueDate ? format(dueDate, 'MMM dd, yyyy') : 'N/A'}</span>
                            </div>
                             <div className="pt-2" onClick={(e) => e.stopPropagation()}>
                                {canEdit ? (
                                    <Select value={task.status} onValueChange={(newStatus: Task['status']) => handleStatusChange(task.id, newStatus)}>
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
                        </CardContent>
                    </Card>
                )
            })}
        </div>

        {/* Desktop View: Table */}
        <div className="hidden md:block">
            <Table>
            <TableHeader>
                <TableRow>
                <TableHead>Type</TableHead>
                <TableHead>Work Item</TableHead>
                {showProjectColumn && <TableHead>Project</TableHead>}
                {showAssignedToColumn && <TableHead>Owner</TableHead>}
                <TableHead>Due Date</TableHead>
                <TableHead className="text-right">Status</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {tasks.map(task => {
                    const Icon = typeIcon[task.type] || GanttChartSquare;
                    const dueDate = getSafeDate(task.dueDate);
                    return (
                    <TableRow key={task.id} onClick={() => handleRowClick(task.id)} className={cn("cursor-pointer", !task.owner && "bg-yellow-500/5 hover:bg-yellow-500/10")}>
                        <TableCell>
                            <Badge variant="outline" className='h-8'>
                                <Icon className="h-4 w-4 mr-1 text-muted-foreground" />
                                {task.type}
                            </Badge>
                        </TableCell>
                        <TableCell className="font-medium">{task.title}</TableCell>
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
                        {showAssignedToColumn && <TableCell className={cn(!task.owner && "font-bold text-yellow-600 dark:text-yellow-400")}>{getUserName(task.owner)}</TableCell>}
                        <TableCell>{dueDate ? format(dueDate, 'MMM dd, yyyy') : 'N/A'}</TableCell>
                        <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                        {canEdit ? (
                            <Select value={task.status} onValueChange={(newStatus: Task['status']) => handleStatusChange(task.id, newStatus)}>
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
    </>
  );
}

