
'use client';

import { Project, User, UserRole } from '@/types';
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

const roles: UserRole[] = ['Admin', 'Director', 'Engineer', 'Reports'];

export default function TeamWorkload({ users, projects, onUserUpdated }: TeamWorkloadProps) {
  const { user: currentUser } = useAuth();
  const { toast } = useToast();
  const canChangeRole = currentUser?.role === 'Admin' || currentUser?.role === 'Director';

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

  return (
    <Card>
      <CardHeader>
        <CardTitle>Team Overview</CardTitle>
        <CardDescription>Overview of all team members, their roles, and assigned tasks.</CardDescription>
      </CardHeader>
      <CardContent>
        {users.length > 0 ? (
          <Accordion type="single" collapsible className="w-full">
            {users.map(user => {
              const tasks = user.role === 'Engineer' ? getTasksForEngineer(user.id) : [];
              return (
                <AccordionItem value={user.id} key={user.id}>
                  <div className="flex items-center">
                    <AccordionTrigger className="flex-1">
                      <div className="flex items-center gap-3">
                          <Avatar className="h-9 w-9">
                              <AvatarImage src={user.avatarUrl} alt={user.name} />
                              <AvatarFallback>{getInitials(user.name)}</AvatarFallback>
                          </Avatar>
                          <div className="text-left">
                              <p className="font-medium">{user.name}</p>
                              <p className="text-sm text-muted-foreground">
                                  {user.role === 'Engineer' ? `${tasks.length} task(s) assigned` : user.role}
                              </p>
                          </div>
                      </div>
                    </AccordionTrigger>
                    <div className="pl-4 pr-2">
                        {canChangeRole ? (
                            <div className="w-32">
                                <Select value={user.role} onValueChange={(newRole: UserRole) => handleRoleChange(user.id, newRole)}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Set role" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {roles.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                        ) : (
                            <Badge variant="secondary" className="mr-4">{user.role}</Badge>
                        )}
                    </div>
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
