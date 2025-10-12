
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
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { Users, Clock, History, UserPlus, FileClock, CheckCircle2, Loader2, AlertCircle, Circle, FolderKanban } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

interface TeamWorkloadProps {
  users: User[];
  projects: Project[];
  onUserUpdated: (userId: string, updates: Partial<User>) => void;
}

const getInitials = (name: string) => {
  if (!name) return '';
  const names = name.split(' ');
  if (names.length > 1) {
    return `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase();
  }
  return name.substring(0, 2).toUpperCase();
};

const statusConfig = {
  'Completed': { 
    variant: 'default' as const, 
    icon: CheckCircle2,
    className: 'bg-green-500/10 text-green-700 dark:bg-green-500/20 dark:text-green-400 border-green-500/20'
  },
  'In Progress': { 
    variant: 'secondary' as const, 
    icon: Loader2,
    className: 'bg-blue-500/10 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400 border-blue-500/20'
  },
  'Not Started': { 
    variant: 'outline' as const, 
    icon: Circle,
    className: 'bg-gray-500/10 text-gray-700 dark:bg-gray-500/20 dark:text-gray-400 border-gray-500/20'
  },
  'Overdue': { 
    variant: 'destructive' as const, 
    icon: AlertCircle,
    className: 'bg-red-500/10 text-red-700 dark:bg-red-500/20 dark:text-red-400 border-red-500/20'
  },
};

const roleColors: { [key in UserRole]: string } = {
  'Admin': 'bg-gradient-to-br from-purple-500/10 to-purple-600/10 text-purple-700 dark:from-purple-500/20 dark:to-purple-600/20 dark:text-purple-300 border-purple-500/20',
  'Director': 'bg-gradient-to-br from-blue-500/10 to-blue-600/10 text-blue-700 dark:from-blue-500/20 dark:to-blue-600/20 dark:text-blue-300 border-blue-500/20',
  'Engineer': 'bg-gradient-to-br from-green-500/10 to-green-600/10 text-green-700 dark:from-green-500/20 dark:to-green-600/20 dark:text-green-300 border-green-500/20',
  'System Super Admin': 'bg-gradient-to-br from-gray-500/10 to-gray-600/10 text-gray-700 dark:from-gray-500/20 dark:to-gray-600/20 dark:text-gray-300 border-gray-500/20',
};

const roles: UserRole[] = ['Admin', 'Director', 'Engineer'];

export default function TeamWorkload({ users, projects, onUserUpdated }: TeamWorkloadProps) {
  const { user: currentUser, licenseUsage, licenseLimits } = useAuth();
  const { toast } = useToast();
  const canManageUsers = currentUser?.role === 'Admin' || currentUser?.role === 'Director';
  const [roleFilter, setRoleFilter] = useState<UserRole | 'All'>('All');

  const getTasksForEngineer = (engineerId: string) => {
    return projects.flatMap(p => 
      (p.tasks || [])
        .filter(t => t.owner === engineerId)
        .map(t => ({ ...t, projectName: p.name, projectSlug: p.slug }))
    );
  };
  
  const getProjectsForEngineer = (engineerId: string) => {
    return projects.filter(p => p.assignedEngineers.includes(engineerId));
  }

  const unassignedTasks = projects.flatMap(p => 
    (p.tasks || [])
      .filter(t => !t.owner)
      .map(t => ({ ...t, projectName: p.name, projectSlug: p.slug }))
  );
  
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
    
    onUserUpdated(userId, { role: newRole });

    toast({
        title: "Role Updated",
        description: `${user.name}'s role has been changed to ${newRole}.`
    });
  };

  const handleStatusChange = (userId: string, newStatus: boolean) => {
    const status: UserStatus = newStatus ? 'Active' : 'Inactive';
    const user = users.find(u => u.id === userId);
    if(user) {
        const now = new Date().toISOString();
        const newHistoryEntry = { status, date: now };
        const updatedHistory = [...(user.history || []), newHistoryEntry];
        
        onUserUpdated(userId, { status, history: updatedHistory });

        toast({
            title: "Status Updated",
            description: `${user.name} has been set to ${status}.`
        });
    }
  };
  
  const filteredUsers = users.filter(user => {
      if (roleFilter === 'All') return user.role !== 'System Super Admin';
      return user.role === roleFilter;
  });

  const sortedUsers = [...filteredUsers].sort((a, b) => {
    if (a.status === b.status) return a.name.localeCompare(b.name);
    return a.status === 'Active' ? -1 : 1;
  });

  return (
    <Card className="shadow-lg border-0 overflow-hidden">
      <CardHeader className="border-b bg-gradient-to-br from-background via-primary/[0.02] to-primary/[0.05] pb-8 relative overflow-hidden">
        <div className="absolute inset-0 bg-grid-white/[0.02] bg-[size:20px_20px]" />
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl" />
        <div className="relative">
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6">
            <div className="space-y-2">
              <CardTitle className="text-3xl font-bold bg-gradient-to-br from-foreground to-foreground/70 bg-clip-text">
                Team Overview
              </CardTitle>
              <CardDescription className="text-base">
                Manage team members, roles, and track workload distribution
              </CardDescription>
            </div>
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="w-full sm:w-52">
                <Select value={roleFilter} onValueChange={(value: UserRole | 'All') => setRoleFilter(value)}>
                    <SelectTrigger className="h-11 border-primary/20 shadow-sm hover:border-primary/40 transition-colors">
                        <Users className="mr-2 h-4 w-4 text-primary" />
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
              <div className="flex gap-3 text-xs">
                {roles.filter(r => r !== 'System Super Admin').map(role => (
                  <div key={role} className="flex flex-col items-center px-4 py-3 bg-background/80 backdrop-blur-sm rounded-xl border shadow-sm hover:shadow-md transition-all duration-200 flex-1 sm:flex-initial group hover:scale-105">
                    <span className="text-2xl font-bold bg-gradient-to-br from-primary to-primary/70 bg-clip-text text-transparent group-hover:from-primary/90 group-hover:to-primary/60 transition-all">
                      {licenseUsage[role]}/{licenseLimits[role]}
                    </span>
                    <span className="font-medium text-muted-foreground mt-1">{role}s</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-6 px-3 sm:px-6">
        <Accordion type="single" collapsible className="w-full space-y-3">
            {unassignedTasks.length > 0 && (
                 <AccordionItem 
                  value="unassigned"
                  className={cn(
                    "border-0 rounded-xl overflow-hidden transition-all duration-300 bg-yellow-500/10 hover:shadow-lg hover:scale-[1.01]"
                  )}
                >
                    <AccordionTrigger className="flex-1 px-3 sm:px-5 py-5 hover:no-underline group [&[data-state=open]]:bg-yellow-500/20 transition-all">
                      <div className="flex items-center gap-3 sm:gap-5 flex-1 min-w-0">
                        <div className="relative">
                          <div className="h-14 w-14 rounded-full ring-2 ring-background group-hover:ring-yellow-500/30 transition-all duration-300 shadow-md flex items-center justify-center bg-yellow-500/10">
                            <Users className="h-7 w-7 text-yellow-600"/>
                          </div>
                        </div>
                        
                        <div className="flex-1 text-left min-w-0">
                            <div className="flex items-center gap-2.5 flex-wrap mb-1.5">
                                <div className="font-bold text-lg truncate">Unassigned Tasks</div>
                                <Badge variant="destructive">{unassignedTasks.length} task{unassignedTasks.length > 1 && 's'}</Badge>
                            </div>
                            <p className="text-sm font-medium text-yellow-700 dark:text-yellow-400">These tasks need an owner.</p>
                        </div>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="px-3 sm:px-5 pb-5 pt-3">
                        <div className="rounded-xl border-0 overflow-hidden shadow-md bg-gradient-to-br from-background to-muted/30">
                            <Table>
                                <TableHeader>
                                <TableRow className="hover:bg-transparent border-b bg-muted/40">
                                    <TableHead className="font-bold text-foreground/90">Task</TableHead>
                                    <TableHead className="font-bold text-foreground/90 hidden sm:table-cell">Project</TableHead>
                                    <TableHead className="font-bold text-foreground/90 hidden md:table-cell">Due Date</TableHead>
                                    <TableHead className="text-right font-bold text-foreground/90">Status</TableHead>
                                </TableRow>
                                </TableHeader>
                                <TableBody>
                                {unassignedTasks.map((task, idx) => {
                                  const StatusIcon = statusConfig[task.status]?.icon || Circle;
                                  return (
                                    <TableRow 
                                      key={task.id}
                                      className={cn(
                                        "transition-colors hover:bg-muted/40",
                                        idx === unassignedTasks.length - 1 && "border-b-0"
                                      )}
                                    >
                                      <TableCell className="font-semibold">{task.title}</TableCell>
                                      <TableCell className="hidden sm:table-cell">
                                        <Link 
                                          href={`/dashboard/projects/${task.projectSlug}`} 
                                          className="text-primary hover:text-primary/80 transition-colors inline-flex items-center gap-1.5 font-semibold hover:underline decoration-2 underline-offset-2"
                                        >
                                          {task.projectName}
                                        </Link>
                                      </TableCell>
                                      <TableCell className="text-muted-foreground font-medium hidden md:table-cell">
                                        {format(new Date(task.dueDate), 'MMM dd, yyyy')}
                                      </TableCell>
                                      <TableCell className="text-right">
                                        <Badge 
                                          className={cn("font-semibold border shadow-sm", statusConfig[task.status]?.className)}
                                        >
                                          <StatusIcon className={cn("h-3 w-3 mr-1.5", task.status === 'In Progress' && "animate-spin")} />
                                          <span className='hidden sm:inline'>{task.status}</span>
                                        </Badge>
                                      </TableCell>
                                    </TableRow>
                                  );
                                })}
                                </TableBody>
                            </Table>
                            </div>
                    </AccordionContent>
                </AccordionItem>
            )}
            {sortedUsers.length > 0 ? (
                sortedUsers.map(user => {
                  const tasks = user.role === 'Engineer' ? getTasksForEngineer(user.id) : [];
                  const assignedProjects = user.role === 'Engineer' ? getProjectsForEngineer(user.id) : [];
                  const stats = getTaskStats(tasks);
                  
                  return (
                    <AccordionItem 
                      value={user.id} 
                      key={user.id} 
                      className={cn(
                        "border-0 rounded-xl overflow-hidden transition-all duration-300 bg-gradient-to-br from-background to-muted/20 hover:shadow-lg hover:scale-[1.01]",
                        user.status === 'Inactive' && 'opacity-60 hover:opacity-70'
                      )}
                    >
                      <div className="flex flex-col md:flex-row md:items-center gap-2 bg-background/50 backdrop-blur-sm">
                        <AccordionTrigger className="flex-1 px-3 sm:px-5 py-5 hover:no-underline group [&[data-state=open]]:bg-muted/30 transition-all">
                          <div className="flex items-center gap-3 sm:gap-5 flex-1 min-w-0">
                            <div className="relative">
                              <Avatar className="h-14 w-14 ring-2 ring-background group-hover:ring-primary/30 transition-all duration-300 shadow-md">
                                <AvatarImage src={user.avatarUrl} alt={user.name} />
                                <AvatarFallback className="bg-gradient-to-br from-primary/20 to-primary/10 text-primary font-bold text-lg">
                                  {getInitials(user.name)}
                                </AvatarFallback>
                              </Avatar>
                              {user.status === 'Active' && (
                                <div className="absolute -bottom-1 -right-1 h-4 w-4 rounded-full bg-green-500 ring-3 ring-background shadow-lg animate-pulse" />
                              )}
                            </div>
                            
                            <div className="flex-1 text-left min-w-0">
                                <div className="flex items-center gap-2.5 flex-wrap mb-1.5">
                                    <div className="font-bold text-lg truncate">{user.name}</div>
                                    <div className="flex items-center gap-2">
                                        <Badge className={cn("text-xs font-semibold px-3 py-1 border", roleColors[user.role])}>
                                        {user.role}
                                        </Badge>
                                        {user.status === 'Inactive' && (
                                        <Badge variant="outline" className="text-xs border-destructive/50 text-destructive bg-destructive/5 px-3 py-1">
                                            Inactive
                                        </Badge>
                                        )}
                                    </div>
                                </div>
                              
                              {user.role === 'Engineer' && (
                                <div className="flex items-center gap-4 text-sm">
                                  <span className="text-muted-foreground font-medium">
                                      {assignedProjects.length} {assignedProjects.length === 1 ? 'project' : 'projects'}
                                  </span>
                                  <span className="text-muted-foreground font-medium text-xs">•</span>
                                  <span className="text-muted-foreground font-medium">
                                    {tasks.length} {tasks.length === 1 ? 'task' : 'tasks'}
                                  </span>
                                  {tasks.length > 0 && (
                                    <div className="hidden sm:flex items-center gap-3">
                                      {stats.inProgress > 0 && (
                                        <span className="text-xs font-medium px-2 py-1 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                                          {stats.inProgress} in progress
                                        </span>
                                      )}
                                      {stats.overdue > 0 && (
                                        <span className="text-xs font-medium px-2 py-1 rounded-full bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20">
                                          {stats.overdue} overdue
                                        </span>
                                      )}
                                    </div>
                                  )}
                                </div>
                              )}
                              {user.role !== 'Engineer' && (
                                <p className="text-sm text-muted-foreground font-medium">
                                  Management role
                                </p>
                              )}
                            </div>
                          </div>
                        </AccordionTrigger>
                        
                        {canManageUsers && (
                          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-start gap-3 px-3 sm:px-5 pb-4 md:justify-end md:py-5 md:pl-0 md:pr-5 md:ml-auto">
                            <div className="w-full sm:w-40">
                              <Select 
                                value={user.role} 
                                onValueChange={(newRole: UserRole) => handleRoleChange(user.id, newRole)}
                                disabled={user.id === currentUser?.id || user.role === 'System Super Admin'}
                              >
                                <SelectTrigger className="h-10 text-sm border-primary/20 hover:border-primary/40 transition-colors shadow-sm w-full">
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
                            
                            <div className="flex items-center justify-center gap-2.5 px-4 py-2 rounded-lg border bg-background/80 backdrop-blur-sm shadow-sm hover:shadow-md transition-all h-10">
                              <Switch
                                id={`status-${user.id}`}
                                checked={user.status === 'Active'}
                                onCheckedChange={(checked) => handleStatusChange(user.id, checked)}
                                disabled={user.id === currentUser?.id || user.role === 'System Super Admin'}
                              />
                              <Label 
                                htmlFor={`status-${user.id}`}
                                className="text-sm font-semibold cursor-pointer"
                              >
                                {user.status}
                              </Label>
                            </div>
                          </div>
                        )}
                      </div>
                      
                      <AccordionContent className="px-3 sm:px-5 pb-5 pt-3">
                        <div className="flex flex-col gap-4">
                            <Dialog>
                                <DialogTrigger asChild>
                                    <Button variant="outline" className="w-full h-auto hover:shadow-md transition-all border-primary/20 hover:border-primary/40 hover:bg-primary/5">
                                        <div className="flex items-center gap-3 py-2">
                                          <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center">
                                            <FileClock className="h-5 w-5 text-primary" />
                                          </div>
                                          <span className="font-semibold text-sm">View Change History</span>
                                        </div>
                                    </Button>
                                </DialogTrigger>
                                <DialogContent className="max-w-2xl">
                                    <DialogHeader>
                                        <DialogTitle className="text-2xl">Change Log for {user.name}</DialogTitle>
                                        <DialogDescription className="text-base">
                                            A complete record of this user's status changes.
                                        </DialogDescription>
                                    </DialogHeader>
                                    <div className="space-y-4 py-4 max-h-[60vh] overflow-y-auto">
                                        <div className="flex items-center gap-4 p-4 rounded-lg bg-muted/50 border">
                                            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-primary/20 to-primary/10 shadow-sm">
                                                <UserPlus className="h-6 w-6 text-primary" />
                                            </div>
                                            <div>
                                                <p className="font-bold text-base">User Created</p>
                                                <p className="text-sm text-muted-foreground font-medium">{format(parseISO(user.createdAt), "PPP p")}</p>
                                                <p className="text-xs text-muted-foreground">{formatDistanceToNow(parseISO(user.createdAt), { addSuffix: true })}</p>
                                            </div>
                                        </div>
                                        {(user.history || []).map((item, index) => (
                                             <div key={index} className="flex items-center gap-4 p-4 rounded-lg hover:bg-muted/30 transition-colors border border-transparent hover:border-muted-foreground/20">
                                                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-muted shadow-sm">
                                                    <Clock className="h-6 w-6 text-muted-foreground" />
                                                </div>
                                                 <div>
                                                    <p className="font-semibold">Status changed to <span className={cn('font-bold', item.status === 'Active' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400')}>{item.status}</span></p>
                                                    <p className="text-sm text-muted-foreground font-medium">{format(parseISO(item.date), "PPP p")}</p>
                                                    <p className="text-xs text-muted-foreground">{formatDistanceToNow(parseISO(item.date), { addSuffix: true })}</p>
                                                 </div>
                                             </div>
                                        ))}
                                    </div>
                                </DialogContent>
                            </Dialog>
                            {user.role === 'Engineer' ? (
                            tasks.length > 0 ? (
                                <div className="rounded-xl border-0 overflow-hidden shadow-md bg-gradient-to-br from-background to-muted/30">
                                <Table>
                                    <TableHeader>
                                    <TableRow className="hover:bg-transparent border-b bg-muted/40">
                                        <TableHead className="font-bold text-foreground/90">Task</TableHead>
                                        <TableHead className="font-bold text-foreground/90 hidden sm:table-cell">Project</TableHead>
                                        <TableHead className="font-bold text-foreground/90 hidden md:table-cell">Due Date</TableHead>
                                        <TableHead className="text-right font-bold text-foreground/90">Status</TableHead>
                                    </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                    {tasks.map((task, idx) => {
                                      const StatusIcon = statusConfig[task.status]?.icon || Circle;
                                      return (
                                        <TableRow 
                                          key={task.id}
                                          className={cn(
                                            "transition-colors hover:bg-muted/40",
                                            idx === tasks.length - 1 && "border-b-0"
                                          )}
                                        >
                                          <TableCell className="font-semibold">{task.title}</TableCell>
                                          <TableCell className="hidden sm:table-cell">
                                            <Link 
                                              href={`/dashboard/projects/${task.projectSlug}`} 
                                              className="text-primary hover:text-primary/80 transition-colors inline-flex items-center gap-1.5 font-semibold hover:underline decoration-2 underline-offset-2"
                                            >
                                              {task.projectName}
                                            </Link>
                                          </TableCell>
                                          <TableCell className="text-muted-foreground font-medium hidden md:table-cell">
                                            {format(new Date(task.dueDate), 'MMM dd, yyyy')}
                                          </TableCell>
                                          <TableCell className="text-right">
                                            <Badge 
                                              className={cn("font-semibold border shadow-sm", statusConfig[task.status]?.className)}
                                            >
                                              <StatusIcon className={cn("h-3 w-3 mr-1.5", task.status === 'In Progress' && "animate-spin")} />
                                              <span className='hidden sm:inline'>{task.status}</span>
                                            </Badge>
                                          </TableCell>
                                        </TableRow>
                                      );
                                    })}
                                    </TableBody>
                                </Table>
                                </div>
                            ) : (
                                <div className="flex flex-col items-center justify-center px-4 py-12 text-center bg-gradient-to-br from-muted/30 to-muted/10 rounded-xl border-2 border-dashed border-muted-foreground/20">
                                  <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center mb-4 shadow-sm">
                                      <FolderKanban className="h-8 w-8 text-muted-foreground"/>
                                  </div>
                                  <p className="text-sm font-semibold text-foreground/80 mb-1">
                                      No tasks assigned to {user.name}
                                  </p>
                                  {assignedProjects.length > 0 ? (
                                    <div className="text-xs text-muted-foreground mt-2">
                                        <p>This user is assigned to {assignedProjects.length} project(s):</p>
                                        <ul className='mt-1 list-disc list-inside'>
                                            {assignedProjects.map(p => <li key={p.id}>{p.name}</li>)}
                                        </ul>
                                    </div>
                                  ) : (
                                     <p className="text-xs text-muted-foreground">
                                        This user is not assigned to any projects.
                                    </p>
                                  )}
                                </div>
                            )
                            ) : (
                            <div className="flex flex-col items-center justify-center px-4 py-12 text-center bg-gradient-to-br from-muted/30 to-muted/10 rounded-xl border border-muted-foreground/20">
                                <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center mb-4 shadow-sm">
                                <svg className="h-8 w-8 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                </svg>
                                </div>
                                <p className="text-sm font-semibold text-foreground/80 mb-1">
                                {user.name} does not have tasks
                                </p>
                                <p className="text-xs text-muted-foreground">
                                Only users with the 'Engineer' role can be assigned tasks.
                                </p>
                            </div>
                            )}
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  );
                })
            ) : (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <div className="h-20 w-20 rounded-2xl bg-gradient-to-br from-muted to-muted/50 flex items-center justify-center mb-6 shadow-lg">
                  <svg className="h-10 w-10 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                <p className="text-lg font-semibold text-foreground/80 mb-2">
                  No team members found
                </p>
                <p className="text-sm text-muted-foreground">
                  Add team members to start managing workload
                </p>
              </div>
            )}
        </Accordion>
      </CardContent>
    </Card>
  );
}
