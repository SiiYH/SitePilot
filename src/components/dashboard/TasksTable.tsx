'use client';
import { useState } from 'react';
import { Task, User, UserRole } from '@/types';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { mockUsers } from '@/lib/data';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

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

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Task</TableHead>
          <TableHead>Assigned To</TableHead>
          <TableHead>Due Date</TableHead>
          <TableHead className="text-right">Status</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {tasks.map(task => (
          <TableRow key={task.id}>
            <TableCell className="font-medium">{task.title}</TableCell>
            <TableCell>{getUserName(task.assignedTo)}</TableCell>
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
        ))}
      </TableBody>
    </Table>
  );
}
