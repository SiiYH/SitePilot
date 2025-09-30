

'use client';

import { Project, User, UserRole, UserStatus } from '@/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import Link from 'next/link';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { mockUsers } from '@/lib/data'; // To update mock data
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

interface TeamWorkloadProps {
  users: User[];
  projects: Project[];
  onUserUpdated: (updatedUser: User) => void;
}

const getInitials = (name: string) => {
  if (!name) return '';
  const names = name.split(' ');
  if (names.length > 1) {
    return `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase();
  }
  return name.substring(0, 2).toUpperCase();
};

const statusVariant: { [key: string]: 'default' | 'secondary' | 'destructive' | 'outline' } = {
  'Completed': 'default',
  'In Progress': 'secondary',
  'Not Started': 'outline',
  'Overdue': 'destructive',
};

const roles: UserRole[] = ['Admin', 'Director', 'Engineer'];

export default function TeamWorkload({ users, projects, onUserUpdated }: TeamWorkloadProps) {
  const { user: currentUser } = useAuth();
  const { toast } = useToast();
  const canManageUsers = currentUser?.role === 'Admin' || currentUser?.role === 'Director';

  const getTasksForEngineer = (engineerId: string) => {
    return projects.flatMap(p => 
      p.tasks
        .filter(t => t.assignedTo === engineerId)
        .map(t => ({ ...t, projectName: p.name, projectSlug: p.slug }))
    );
  };
  
  const handleRoleChange = (userId: string, newRole: UserRole) => {
    const userIndex = mockUsers.findIndex(u => u.id === userId);
    if(userIndex !== -1) {
        const updatedUser = { ...mockUsers[userIndex], role: newRole };
        mockUsers[userIndex] = updatedUser;
        onUserUpdated(updatedUser);
        toast({
            title: "Role Updated",
            description: `${updatedUser.name}'s role has been changed to ${newRole}.`
        });
    }
  };

  const handleStatusChange = (userId: string, newStatus: boolean) => {
    const status: UserStatus = newStatus ? 'Active' : 'Inactive';
    const userIndex = mockUsers.findIndex(u => u.id === userId);
    if(userIndex !== -1) {
        const updatedUser = { ...mockUsers[userIndex], status };
        mockUsers[userIndex] = updatedUser;
        onUserUpdated(updatedUser);
        toast({
            title: "Status Updated",
            description: `${updatedUser.name} has been set to ${status}.`
        });
    }
  };

  const sortedUsers = [...users].sort((a, b) => {
    if (a.status === b.status) return a.name.localeCompare(b.name);
    return a.status === 'Active' ? -1 : 1;
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Team Overview</CardTitle>
        <CardDescription>Overview of all team members, their roles, and assigned tasks.</CardDescription>
      </CardHeader>
      <CardContent>
        {users.length > 0 ? (
          <Accordion type="single" collapsible className="w-full">
            {sortedUsers.map(user => {
              const tasks = user.role === 'Engineer' ? getTasksForEngineer(user.id) : [];
              return (
                <AccordionItem value={user.id} key={user.id} className={cn(user.status === 'Inactive' && 'opacity-60')}>
                  <div className="flex flex-col sm:flex-row sm:items-center">
                    <AccordionTrigger className="flex-1 py-4 hover:no-underline">
                      <div className="flex items-center gap-3">
                          <Avatar className="h-9 w-9">
                              <AvatarImage src={user.avatarUrl} alt={user.name} />
                              <AvatarFallback>{getInitials(user.name)}</AvatarFallback>
                          </Avatar>
                          <div className="text-left">
                              <div className="font-medium flex items-center gap-2">
                                {user.name}
                                {user.status === 'Inactive' && <Badge variant="destructive">Inactive</Badge>}
                              </div>
                              <p className="text-sm text-muted-foreground">
                                  {user.role === 'Engineer' ? `${tasks.length} task(s) assigned` : user.role}
                              </p>
                          </div>
                      </div>
                    </AccordionTrigger>
                    {canManageUsers && (
                      <div className="flex flex-wrap items-center gap-4 py-2 pl-4 pr-2 sm:py-0 sm:pl-0 sm:ml-auto">
                          <div className="w-32">
                              <Select 
                                value={user.role} 
                                onValueChange={(newRole: UserRole) => handleRoleChange(user.id, newRole)}
                                disabled={user.id === currentUser?.id}
                              >
                                  <SelectTrigger>
                                      <SelectValue placeholder="Set role" />
                                  </SelectTrigger>
                                  <SelectContent>
                                      {roles.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                                  </SelectContent>
                              </Select>
                          </div>
                           <div className="flex items-center space-x-2">
                            <Switch
                                id={`status-switch-${user.id}`}
                                checked={user.status === 'Active'}
                                onCheckedChange={(checked) => handleStatusChange(user.id, checked)}
                                disabled={user.id === currentUser?.id}
                            />
                            <Label htmlFor={`status-switch-${user.id}`}>{user.status}</Label>
                           </div>
                      </div>
                    )}
                  </div>
                  <AccordionContent>
                    {user.role === 'Engineer' ? (
                        tasks.length > 0 ? (
                        <Table>
                            <TableHeader>
                            <TableRow>
                                <TableHead>Task</TableHead>
                                <TableHead>Project</TableHead>
                                <TableHead>Due Date</TableHead>
                                <TableHead className="text-right">Status</TableHead>
                            </TableRow>
                            </TableHeader>
                            <TableBody>
                            {tasks.map(task => (
                                <TableRow key={task.id}>
                                <TableCell className="font-medium">{task.title}</TableCell>
                                <TableCell>
                                    <Link href={`/dashboard/projects/${task.projectSlug}`} className="hover:underline text-primary">
                                    {task.projectName}
                                    </Link>
                                </TableCell>
                                <TableCell>{format(new Date(task.dueDate), 'MMM dd, yyyy')}</TableCell>
                                <TableCell className="text-right">
                                    <Badge variant={statusVariant[task.status] || 'secondary'}>{task.status}</Badge>
                                </TableCell>
                                </TableRow>
                            ))}
                            </TableBody>
                        </Table>
                        ) : (
                        <div className="px-4 py-8 text-center text-sm text-muted-foreground">
                            No tasks assigned to {user.name}.
                        </div>
                        )
                    ) : (
                        <div className="px-4 py-8 text-center text-sm text-muted-foreground">
                            Task overview is only available for Engineers.
                        </div>
                    )}
                  </AccordionContent>
                </AccordionItem>
              );
            })}
          </Accordion>
        ) : (
          <div className="text-center text-muted-foreground">
            No users found in the team.
          </div>
        )}
      </CardContent>
    </Card>
  );
}
