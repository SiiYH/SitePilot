

'use client';

import { useState } from 'react';
import { Project, User, UserRole, UserStatus } from '@/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { format, formatDistanceToNow, parseISO } from 'date-fns';
import Link from 'next/link';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { mockUsers } from '@/lib/data';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { licenseLimits } from '@/lib/license';
import { Users, Clock, History, UserPlus, FileClock } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

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

const roleColors: { [key in UserRole]: string } = {
  'Admin': 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
  'Director': 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  'Engineer': 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
};

const roles: UserRole[] = ['Admin', 'Director', 'Engineer'];

export default function TeamWorkload({ users, projects, onUserUpdated }: TeamWorkloadProps) {
  const { user: currentUser, licenseUsage } = useAuth();
  const { toast } = useToast();
  const canManageUsers = currentUser?.role === 'Admin' || currentUser?.role === 'Director';
  const [roleFilter, setRoleFilter] = useState<UserRole | 'All'>('All');

  const getTasksForEngineer = (engineerId: string) => {
    return projects.flatMap(p => 
      p.tasks
        .filter(t => t.assignedTo === engineerId)
        .map(t => ({ ...t, projectName: p.name, projectSlug: p.slug }))
    );
  };
  
  const getTaskStats = (tasks: any[]) => {
    return {
      total: tasks.length,
      completed: tasks.filter(t => t.status === 'Completed').length,
      inProgress: tasks.filter(t => t.status === 'In Progress').length,
      overdue: tasks.filter(t => t.status === 'Overdue').length,
    };
  };

  const handleRoleChange = (userId: string, newRole: UserRole) => {
    const user = users.find(u => u.id === userId);
    if (!user) return;

    if (newRole !== user.role && licenseUsage[newRole] >= licenseLimits[newRole]) {
      toast({
        variant: 'destructive',
        title: 'License Limit Reached',
        description: `Cannot assign the ${newRole} role as the license limit has been met.`,
      });
      return;
    }
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
        const now = new Date().toISOString();
        const updatedUser = { 
            ...mockUsers[userIndex], 
            status,
            history: [...(mockUsers[userIndex].history || []), { status, date: now }]
        };
        mockUsers[userIndex] = updatedUser;
        onUserUpdated(updatedUser);
        toast({
            title: "Status Updated",
            description: `${updatedUser.name} has been set to ${status}.`
        });
    }
  };
  
  const filteredUsers = users.filter(user => {
      if (roleFilter === 'All') return true;
      return user.role === roleFilter;
  });

  const sortedUsers = [...filteredUsers].sort((a, b) => {
    if (a.status === b.status) return a.name.localeCompare(b.name);
    return a.status === 'Active' ? -1 : 1;
  });

  return (
    <Card className="shadow-sm">
      <CardHeader className="border-b bg-gradient-to-br from-background to-muted/20 pb-6">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div>
            <CardTitle className="text-2xl font-bold">Team Overview</CardTitle>
            <CardDescription className="mt-1.5">
              Manage team members, roles, and track workload distribution
            </CardDescription>
          </div>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="w-full sm:w-48">
              <Select value={roleFilter} onValueChange={(value: UserRole | 'All') => setRoleFilter(value)}>
                  <SelectTrigger>
                      <Users className="mr-2 h-4 w-4" />
                      <SelectValue placeholder="Filter by role" />
                  </SelectTrigger>
                  <SelectContent>
                      <SelectItem value="All">All Roles</SelectItem>
                      {roles.map(r => (
                          <SelectItem key={r} value={r}>{r}</SelectItem>
                      ))}
                  </SelectContent>
              </Select>
            </div>
            <div className="flex gap-2 sm:gap-3 text-xs text-muted-foreground">
              {roles.map(role => (
                <div key={role} className="flex flex-col items-center px-3 py-2 bg-background rounded-lg border shadow-sm flex-1 sm:flex-initial">
                  <span className="text-lg font-bold text-primary">{licenseUsage[role]}/{licenseLimits[role]}</span>
                  <span className="font-medium">{role}s</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-6">
        {sortedUsers.length > 0 ? (
          <Accordion type="single" collapsible className="w-full space-y-2">
            {sortedUsers.map(user => {
              const tasks = user.role === 'Engineer' ? getTasksForEngineer(user.id) : [];
              const stats = getTaskStats(tasks);
              
              return (
                <AccordionItem 
                  value={user.id} 
                  key={user.id} 
                  className={cn(
                    "border rounded-lg px-4 transition-all duration-200 hover:shadow-md",
                    user.status === 'Inactive' && 'opacity-50 hover:opacity-60'
                  )}
                >
                  <div className="flex flex-col lg:flex-row lg:items-center gap-2">
                    <AccordionTrigger className="flex-1 py-4 hover:no-underline group">
                      <div className="flex items-center gap-4 flex-1 min-w-0">
                        <div className="relative">
                          <Avatar className="h-11 w-11 ring-2 ring-background group-hover:ring-primary/20 transition-all">
                            <AvatarImage src={user.avatarUrl} alt={user.name} />
                            <AvatarFallback className="bg-gradient-to-br from-primary/10 to-primary/5 text-primary font-semibold">
                              {getInitials(user.name)}
                            </AvatarFallback>
                          </Avatar>
                          {user.status === 'Active' && (
                            <div className="absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full bg-green-500 ring-2 ring-background" />
                          )}
                        </div>
                        
                        <div className="flex-1 text-left min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-semibold text-base truncate">{user.name}</span>
                            <div className="flex items-center gap-2">
                                <Badge className={cn("text-xs font-medium", roleColors[user.role])}>
                                {user.role}
                                </Badge>
                                {user.status === 'Inactive' && (
                                <Badge variant="outline" className="text-xs border-destructive/50 text-destructive">
                                    Inactive
                                </Badge>
                                )}
                            </div>
                          </div>
                          
                          {user.role === 'Engineer' && (
                            <div className="flex items-center gap-3 mt-1.5 text-sm">
                              <span className="text-muted-foreground">
                                {tasks.length} {tasks.length === 1 ? 'task' : 'tasks'}
                              </span>
                              {tasks.length > 0 && (
                                <div className="flex items-center gap-2">
                                  {stats.inProgress > 0 && (
                                    <span className="text-xs text-blue-600 dark:text-blue-400">
                                      {stats.inProgress} in progress
                                    </span>
                                  )}
                                  {stats.overdue > 0 && (
                                    <span className="text-xs text-destructive">
                                      {stats.overdue} overdue
                                    </span>
                                  )}
                                </div>
                              )}
                            </div>
                          )}
                          {user.role !== 'Engineer' && (
                            <p className="text-sm text-muted-foreground mt-1">
                              Management role
                            </p>
                          )}
                        </div>
                      </div>
                    </AccordionTrigger>
                    
                    {canManageUsers && (
                      <div className="flex flex-wrap items-center justify-start gap-3 pb-2 pl-[60px] lg:justify-end lg:py-0 lg:pl-0 lg:ml-auto">
                        <div className="w-36">
                          <Select 
                            value={user.role} 
                            onValueChange={(newRole: UserRole) => handleRoleChange(user.id, newRole)}
                            disabled={user.id === currentUser?.id}
                          >
                            <SelectTrigger className="h-9 text-sm">
                              <SelectValue placeholder="Set role" />
                            </SelectTrigger>
                            <SelectContent>
                              {roles.map(r => (
                                <SelectItem key={r} value={r} disabled={r !== user.role && licenseUsage[r] >= licenseLimits[r]}>
                                  {r}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        
                        <div className="flex items-center gap-2 px-3 py-1.5 rounded-md border bg-background/50">
                          <Switch
                            id={`status-${user.id}`}
                            checked={user.status === 'Active'}
                            onCheckedChange={(checked) => handleStatusChange(user.id, checked)}
                            disabled={user.id === currentUser?.id}
                          />
                          <Label 
                            htmlFor={`status-${user.id}`}
                            className="text-sm font-medium cursor-pointer"
                          >
                            {user.status}
                          </Label>
                        </div>
                      </div>
                    )}
                  </div>
                  
                  <AccordionContent className="pb-4 pt-2">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {user.role === 'Engineer' ? (
                        tasks.length > 0 ? (
                            <div className="rounded-md border bg-muted/30">
                            <Table>
                                <TableHeader>
                                <TableRow className="hover:bg-transparent border-b">
                                    <TableHead className="font-semibold">Task</TableHead>
                                    <TableHead className="font-semibold">Project</TableHead>
                                    <TableHead className="font-semibold">Due Date</TableHead>
                                    <TableHead className="text-right font-semibold">Status</TableHead>
                                </TableRow>
                                </TableHeader>
                                <TableBody>
                                {tasks.map((task, idx) => (
                                    <TableRow 
                                    key={task.id}
                                    className={cn(
                                        "transition-colors",
                                        idx === tasks.length - 1 && "border-b-0"
                                    )}
                                    >
                                    <TableCell className="font-medium">{task.title}</TableCell>
                                    <TableCell>
                                        <Link 
                                        href={`/dashboard/projects/${task.projectSlug}`} 
                                        className="text-primary hover:underline hover:text-primary/80 transition-colors inline-flex items-center gap-1 font-medium"
                                        >
                                        {task.projectName}
                                        </Link>
                                    </TableCell>
                                    <TableCell className="text-muted-foreground">
                                        {format(new Date(task.dueDate), 'MMM dd, yyyy')}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <Badge 
                                        variant={statusVariant[task.status] || 'secondary'}
                                        className="font-medium"
                                        >
                                        {task.status}
                                        </Badge>
                                    </TableCell>
                                    </TableRow>
                                ))}
                                </TableBody>
                            </Table>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center px-4 py-10 text-center bg-muted/20 rounded-lg border-2 border-dashed">
                            <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center mb-3">
                                <svg className="h-6 w-6 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                                </svg>
                            </div>
                            <p className="text-sm font-medium text-muted-foreground">
                                No tasks assigned to {user.name}
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">
                                Tasks will appear here when assigned
                            </p>
                            </div>
                        )
                        ) : (
                        <div className="flex flex-col items-center justify-center px-4 py-10 text-center bg-muted/20 rounded-lg border">
                            <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center mb-3">
                            <svg className="h-6 w-6 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                            </svg>
                            </div>
                            <p className="text-sm font-medium text-muted-foreground">
                            {user.name} does not have tasks
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">
                            Only users with the 'Engineer' role can be assigned tasks.
                            </p>
                        </div>
                        )}
                        <Dialog>
                            <DialogTrigger asChild>
                                <Button variant="outline" className='md:col-start-2'>
                                    <FileClock className="mr-2 h-4 w-4" />
                                    View History
                                </Button>
                            </DialogTrigger>
                            <DialogContent>
                                <DialogHeader>
                                    <DialogTitle>Change Log for {user.name}</DialogTitle>
                                    <DialogDescription>
                                        A record of this user's status changes.
                                    </DialogDescription>
                                </DialogHeader>
                                <div className="space-y-4 py-4 max-h-[60vh] overflow-y-auto">
                                    <div className="flex items-center gap-4">
                                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
                                            <UserPlus className="h-5 w-5 text-muted-foreground" />
                                        </div>
                                        <div>
                                            <p className="font-medium">User Created</p>
                                            <p className="text-sm text-muted-foreground">{format(parseISO(user.createdAt), "PPP p")} ({formatDistanceToNow(parseISO(user.createdAt), { addSuffix: true })})</p>
                                        </div>
                                    </div>
                                    {user.history.map((item, index) => (
                                         <div key={index} className="flex items-center gap-4">
                                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
                                                <Clock className="h-5 w-5 text-muted-foreground" />
                                            </div>
                                             <div>
                                                <p className="font-medium">Status changed to <span className={cn('font-bold', item.status === 'Active' ? 'text-green-600' : 'text-red-600')}>{item.status}</span></p>
                                                <p className="text-sm text-muted-foreground">{format(parseISO(item.date), "PPP p")} ({formatDistanceToNow(parseISO(item.date), { addSuffix: true })})</p>
                                             </div>
                                         </div>
                                    ))}
                                </div>
                            </DialogContent>
                        </Dialog>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              );
            })}
          </Accordion>
        ) : (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mb-4">
              <svg className="h-8 w-8 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <p className="text-base font-medium text-muted-foreground">
              No team members found
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              Add team members to start managing workload
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
