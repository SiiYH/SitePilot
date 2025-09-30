
'use client';
import { useState } from 'react';
import Link from 'next/link';
import { Task, User, UserRole } from '@/types';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { mockUsers } from '@/lib/data';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { GanttChartSquare, Milestone } from 'lucide-react';

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

export default function TasksTable({ tasks: initialTasks, user }: TasksTableProps) {
  const [tasks, setTasks] = useState<Task[]>(initialTasks);
  const canEdit = user.role === 'Engineer' || user.role === 'Admin';

  const handleStatusChange = (taskId: string, newStatus: Task['status']) => {
    setTasks(currentTasks => 
      currentTasks.map(task => 
        task.id === taskId ? { ...task, status: newStatus } : task
      )
    );
  };

  const getUserName = (userId: string) => {
    return mockUsers.find(u => u.id === userId)?.name || 'Unassigned';
  }

  const showProjectColumn = tasks.some(task => task.projectName && task.projectSlug);
  
  // Only show the "Assigned To" column if there are multiple assignees in the list
  const showAssignedToColumn = new Set(tasks.map(t => t.assignedTo)).size > 1;

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Type</TableHead>
          <TableHead>Work Item</TableHead>
          {showProjectColumn && <TableHead>Project</TableHead>}
          {showAssignedToColumn && <TableHead>Assigned To</TableHead>}
          <TableHead>Due Date</TableHead>
          <TableHead className="text-right">Status</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {tasks.map(task => {
            const Icon = typeIcon[task.type] || GanttChartSquare;
            return (
              <TableRow key={task.id}>
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
                      <Link href={`/dashboard/projects/${task.projectSlug}`} className="text-primary hover:underline">
                        {task.projectName}
                      </Link>
                    ) : (
                      task.projectName || 'N/A'
                    )}
                  </TableCell>
                )}
                {showAssignedToColumn && <TableCell>{getUserName(task.assignedTo)}</TableCell>}
                <TableCell>{format(new Date(task.dueDate), 'MMM dd, yyyy')}</TableCell>
                <TableCell className="text-right">
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
  );
}
