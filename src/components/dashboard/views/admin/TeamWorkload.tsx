
'use client';

import { useState, useMemo, useCallback, useEffect } from 'react';
import { Project, Task, User, UserRole, UserStatus } from '@/types';
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
import { Users, Clock, History, UserPlus, FileClock, CheckCircle2, Loader2, AlertCircle, Circle, FolderKanban, List, Briefcase, UserCheck, UserCog, Users2Icon, Eye, Edit } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useIsMobile } from '@/hooks/use-mobile';
import { useRouter } from 'next/navigation';
import { useFirestore } from '@/firebase';
import { collection, getDocs } from 'firebase/firestore';

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
  'admin': 'bg-gradient-to-br from-purple-500/10 to-purple-600/10 text-purple-700 dark:from-purple-500/20 dark:to-purple-600/20 dark:text-purple-300 border-purple-500/20',
  'director': 'bg-gradient-to-br from-blue-500/10 to-blue-600/10 text-blue-700 dark:from-blue-500/20 dark:to-blue-600/20 dark:text-blue-300 border-blue-500/20',
  'engineer': 'bg-gradient-to-br from-green-500/10 to-green-600/10 text-green-700 dark:from-green-500/20 dark:to-green-600/20 dark:text-green-300 border-green-500/20',
  'system super admin': 'bg-gradient-to-br from-gray-500/10 to-gray-600/10 text-gray-700 dark:from-gray-500/20 dark:to-gray-600/20 dark:text-gray-300 border-gray-500/20',
  '': ''
};

const roles: UserRole[] = ['admin', 'director', 'engineer'];
const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

const roleIcons: { [key in UserRole]: React.ElementType } = {
  director: UserCheck,
  admin: UserCog,
  engineer: Users2Icon,
  'system super admin': Briefcase,
  '': Users,
};

export default function TeamWorkload({ users, projects, onUserUpdated }: TeamWorkloadProps) {
  const { user: currentUser, licenseUsage, licenseLimits } = useAuth();
  const { toast } = useToast();
  const router = useRouter();
  const canManageUsers = currentUser?.role === 'admin' || currentUser?.role === 'director';
  const [roleFilter, setRoleFilter] = useState<UserRole | 'All'>('All');
  const [viewMode, setViewMode] = useState<'accordion' | 'table'>('table');
  const isMobile = useIsMobile();

  useEffect(() => {
    const savedView = localStorage.getItem('sitepilot-team-view-mode') as 'accordion' | 'table' | null;
    if (savedView) {
      setViewMode(savedView);
    } else {
      setViewMode(isMobile ? 'accordion' : 'table');
    }
  }, [isMobile]);

  const firestore = useFirestore();
const [projectsWithTasks, setProjectsWithTasks] = useState<Project[]>([]);

useEffect(() => {
  const fetchTasksForProjects = async () => {
    if (!firestore || !projects.length) return;

    const projectsWithTasksData = await Promise.all(
      projects.map(async (project) => {
        const tasksRef = collection(firestore, 'projects', project.id, 'tasks');
        const tasksSnapshot = await getDocs(tasksRef);
        
        const tasks = tasksSnapshot.docs.map(taskDoc => ({
          id: taskDoc.id,
          ...taskDoc.data()
        })) as Task[];

        return {
          ...project,
          tasks
        };
      })
    );

    setProjectsWithTasks(projectsWithTasksData);
  };

  fetchTasksForProjects();
}, [projects, firestore]);

  // PERFORMANCE OPTIMIZATION 1: Memoize unassigned tasks
  const unassignedTasks = useMemo(() => {
    return projectsWithTasks.flatMap(p => 
      (p.tasks || [])
        .filter(t => !t.owner)
        .map(t => ({ ...t, projectName: p.name, projectId: p.id }))
    );
  }, [projects]);

  // PERFORMANCE OPTIMIZATION 2: Memoize engineer projects map
  const engineerProjectsMap = useMemo(() => {
    const map: Record<string, Project[]> = {};
  
    users.forEach(user => {
      if (user.role === 'engineer') map[user.id] = [];
    });
  
    projects.forEach(project => {
      project.assignedEngineers?.forEach(engineerId => {
        if (map[engineerId]) {
            map[engineerId].push(project);
        }
      });
    });
  
    return map;
  }, [users, projects]);

  
  // PERFORMANCE OPTIMIZATION 3: Memoize engineer tasks map
  const engineerTasksMap = useMemo(() => {
    const map: Record<string, any[]> = {};
    users.forEach(user => {
      if (user.role === 'engineer') {
        map[user.id] = projectsWithTasks.flatMap(p => 
          (p.tasks || [])
            .filter(t => t.owner === user.id || t.contributors?.includes(user.id))
            .map(t => ({ ...t, projectName: p.name, projectId: p.id }))
        );
      }
    });
    return map;
  }, [users, projectsWithTasks]);

  // console.log(engineerTasksMap);

  // PERFORMANCE OPTIMIZATION 4: Memoize task stats calculation
  const getTaskStats = useCallback((tasks: any[]) => {
    return {
      total: tasks.length,
      completed: tasks.filter(t => t.status === 'Completed').length,
      inProgress: tasks.filter(t => t.status === 'In Progress').length,
      overdue: tasks.filter(t => t.status === 'Overdue').length,
    };
  }, []);

  // PERFORMANCE OPTIMIZATION 5: Memoize filtered users
  const filteredUsers = useMemo(() => {
    return users.filter(user => {
      if (roleFilter === 'All') return user.role !== 'system super admin';
      return user.role === roleFilter;
    });
  }, [users, roleFilter]);

  // PERFORMANCE OPTIMIZATION 6: Memoize sorted users
  const sortedUsers = useMemo(() => {
    return [...filteredUsers].sort((a, b) => {
      if (a.status === b.status) return a.name.localeCompare(b.name);
      return a.status === 'Active' ? -1 : 1;
    });
  }, [filteredUsers]);

  const handleRoleChange = useCallback((userId: string, newRole: UserRole) => {
    const user = users.find(u => u.id === userId);
    if (!user) return;

    if (newRole !== user.role && licenseUsage[newRole] >= licenseLimits[newRole]) {
      toast({
        variant: 'destructive',
        title: 'License Limit Reached',
        description: `Cannot assign the ${capitalize(newRole)} role as the license limit has been met.`,
      });
      return;
    }
    
    const now = new Date().toISOString();
    const newHistoryEntry = { role: newRole, date: now };
    const updatedHistory = [...(user.history || []), newHistoryEntry];
    
    onUserUpdated(userId, { role: newRole, history: updatedHistory });

    toast({
        title: "Role Updated",
        description: `${user.name}'s role has been changed to ${capitalize(newRole)}.`,
    });
  }, [users, licenseUsage, licenseLimits, onUserUpdated, toast]);

  const handleStatusChange = useCallback((userId: string, newStatus: boolean) => {
    const status: UserStatus = newStatus ? 'Active' : 'Inactive';
    const user = users.find(u => u.id === userId);

    if (!user) return;
    
    const isEditingDirector = user.role === 'director';
    const isCurrentUserAdmin = currentUser?.role === 'admin';

    if (isCurrentUserAdmin && isEditingDirector) {
      toast({
          variant: "destructive",
          title: "Permission Denied",
          description: "Administrators cannot change a Director's status.",
      });
      // Revert switch visually
      const switchEl = document.getElementById(`status-${userId}`) as HTMLInputElement | null;
      if (switchEl) {
        setTimeout(() => switchEl.click(), 50);
      }
      return;
    }

    // If activating a user, check license limits first
    if (status === 'Active' && user.status === 'Inactive') {
        if (licenseUsage[user.role] >= licenseLimits[user.role]) {
            toast({
                variant: 'destructive',
                title: 'Activation Failed',
                description: `The license limit for the ${capitalize(user.role)} role has been reached.`,
            });
            // Revert the switch visually if the update is blocked
            // This is a simple way to do it. A more robust solution might involve state management.
            setTimeout(() => {
                const switchEl = document.getElementById(`status-${userId}`) as HTMLButtonElement | null;
                if(switchEl) switchEl.click();
            }, 100);
            return;
        }
    }

    const now = new Date().toISOString();
    const newHistoryEntry = { status, date: now };
    const updatedHistory = [...(user.history || []), newHistoryEntry];
    
    onUserUpdated(userId, { status, history: updatedHistory });

    toast({
        title: "Status Updated",
        description: `${user.name} has been set to ${status}.`
    });
  }, [users, onUserUpdated, toast, licenseUsage, licenseLimits, currentUser?.role]);
  
  const handleViewModeChange = (mode: 'accordion' | 'table') => {
    setViewMode(mode);
    localStorage.setItem('sitepilot-team-view-mode', mode);
  }

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
                            <SelectItem key={r} value={r}>{capitalize(r)}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
              </div>
              <div className="hidden items-center gap-1 rounded-lg bg-muted p-1 md:flex">
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleViewModeChange('table')}
                    aria-label="Table view"
                    className={cn('h-8 w-8', viewMode === 'table' && 'bg-background shadow-sm')}
                >
                    <List className="h-4 w-4" />
                </Button>
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleViewModeChange('accordion')}
                    aria-label="Accordion view"
                    className={cn('h-8 w-8', viewMode === 'accordion' && 'bg-background shadow-sm')}
                >
                    <Users className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
           <div className="relative mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {(['director', 'admin', 'engineer'] as UserRole[]).map(role => {
                const Icon = roleIcons[role];
                const used = licenseUsage[role];
                const limit = licenseLimits[role];
                const isOverLimit = used > limit;
                return (
                    <div key={role} className="flex items-center gap-3 rounded-lg border bg-background/50 p-3 shadow-sm backdrop-blur-sm">
                        <div className="p-2 bg-primary/10 rounded-md">
                            <Icon className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                            <p className="font-semibold text-sm">{capitalize(role)}s</p>
                            <p className={cn(
                                "text-sm font-bold",
                                isOverLimit ? "text-destructive" : "text-muted-foreground"
                            )}>
                                {used} / {limit === Infinity ? '∞' : limit}
                            </p>
                        </div>
                    </div>
                )
            })}
        </div>
        </div>
      </CardHeader>
      <CardContent className="pt-6 px-3 sm:px-6">
        {viewMode === 'accordion' ? (
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
                                  const StatusIcon = statusConfig[task.status as keyof typeof statusConfig]?.icon || Circle;
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
                                          href={`/dashboard/projects/${task.projectId}`} 
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
                                          className={cn("font-semibold border shadow-sm", statusConfig[task.status as keyof typeof statusConfig]?.className)}
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
                  // OPTIMIZED: Use pre-computed maps instead of filtering on every render
                  const tasks = engineerTasksMap[user.id] || [];
                  const assignedProjects = engineerProjectsMap[user.id] || [];
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
                              {user.status === 'Inactive' && (
                                <div className="absolute -bottom-1 -right-1 h-4 w-4 rounded-full bg-destructive ring-3 ring-background shadow-lg" />
                              )}
                            </div>
                            
                            <div className="flex-1 text-left min-w-0">
                                <div className="flex items-center gap-2.5 flex-wrap mb-1.5">
                                    <div className="font-bold text-lg truncate">{user.name}</div>
                                    <div className="flex items-center gap-2">
                                        <Badge className={cn("text-xs font-semibold px-3 py-1 border", roleColors[user.role])}>
                                        {capitalize(user.role)}
                                        </Badge>
                                        {user.status === 'Inactive' && (
                                        <Badge variant="outline" className="text-xs border-destructive/50 text-destructive bg-destructive/5 px-3 py-1">
                                            Inactive
                                        </Badge>
                                        )}
                                    </div>
                                </div>
                              
                              {user.role === 'engineer' && (
                                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4 text-sm">
                                  <div className="flex items-center gap-2">
                                    <FolderKanban className="h-4 w-4 text-muted-foreground" />
                                    <span className="text-muted-foreground font-medium">
                                        {assignedProjects.length} {assignedProjects.length === 1 ? 'project' : 'projects'}
                                    </span>
                                  </div>
                                  <span className="text-muted-foreground font-medium text-xs hidden sm:inline">•</span>
                                  <div className="flex items-center gap-2">
                                     <span className="text-muted-foreground font-medium">
                                        {tasks.length} {tasks.length === 1 ? 'task' : 'tasks'}
                                    </span>
                                    {tasks.length > 0 && (
                                    <div className="flex items-center gap-3">
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
                                </div>
                              )}
                              {user.role !== 'engineer' && (
                                <p className="text-sm text-muted-foreground font-medium">
                                  Management role
                                </p>
                              )}
                            </div>
                          </div>
                        </AccordionTrigger>
                        
                        {canManageUsers && (
                          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-start gap-3 px-3 sm:px-5 pb-4 md:justify-end md:py-5 md:pl-0 md:pr-5 md:ml-auto">
                           <Button variant="outline" size="icon" onClick={() => router.push(`/dashboard/team/${user.id}`)}>
                                <Eye className="h-4 w-4" />
                            </Button>
                            <div className="w-full sm:w-32">
                              <Select 
                                value={user.role} 
                                onValueChange={(newRole: UserRole) => handleRoleChange(user.id, newRole)}
                                disabled={user.id === currentUser?.id || user.role === 'system super admin' || (currentUser?.role === 'admin' && user.role === 'director')}
                              >
                                <SelectTrigger className="h-9 text-sm border-primary/20 hover:border-primary/40 transition-colors shadow-sm w-full">
                                  <SelectValue placeholder="Set role" />
                                </SelectTrigger>
                                <SelectContent>
                                  {roles.map(r => (
                                    <SelectItem key={r} value={r} disabled={r !== user.role && licenseUsage[r] >= licenseLimits[r]}>
                                      {capitalize(r)}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                            
                            <div className="flex items-center justify-center gap-2.5 px-4 py-2 rounded-lg border bg-background/80 backdrop-blur-sm shadow-sm hover:shadow-md transition-all h-9">
                              <Switch
                                id={`status-${user.id}`}
                                checked={user.status === 'Active'}
                                onCheckedChange={(checked) => handleStatusChange(user.id, checked)}
                                disabled={user.id === currentUser?.id || user.role === 'system super admin' || (currentUser?.role === 'admin' && user.role === 'director')}
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
                                    <Button variant="outline" className="w-full h-auto hover:shadow-md transition-all border-primary/20 hover:border-primary/40 hover:bg-accent group">
                                        <div className="flex items-center gap-3 py-2">
                                          <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center">
                                            <History className="h-5 w-5 text-primary group-hover:text-white transition-colors" />
                                          </div>
                                          <span className="font-semibold text-sm group-hover:text-white transition-colors">View Change History</span>
                                        </div>
                                    </Button>
                                </DialogTrigger>
                                <DialogContent className="max-w-2xl">
                                    <DialogHeader>
                                        <DialogTitle className="text-2xl">Change Log for {user.name}</DialogTitle>
                                        <DialogDescription className="text-base">
                                            A complete record of this user's status and role changes.
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
                                                    {item.status ? <Clock className="h-6 w-6 text-muted-foreground" /> : <Briefcase className="h-6 w-6 text-muted-foreground" />}
                                                </div>
                                                 <div>
                                                    {item.status && <p className="font-semibold">Status changed to <span className={cn('font-bold', item.status === 'Active' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400')}>{item.status}</span></p>}
                                                    {item.role && <p className="font-semibold">Role changed to <span className="font-bold text-primary">{capitalize(item.role)}</span></p>}
                                                    <p className="text-sm text-muted-foreground font-medium">{format(parseISO(item.date), "PPP p")}</p>
                                                    <p className="text-xs text-muted-foreground">{formatDistanceToNow(parseISO(item.date), { addSuffix: true })}</p>
                                                 </div>
                                             </div>
                                        ))}
                                    </div>
                                </DialogContent>
                            </Dialog>
                            
                            {/* NEW FEATURE: Show assigned projects breakdown */}
                            {user.role === 'engineer' && assignedProjects.length > 0 && (
                              <div className="p-4 rounded-lg bg-muted/30 border">
                                <h4 className="font-semibold text-sm mb-3 flex items-center gap-2">
                                  <FolderKanban className="h-4 w-4" />
                                  Assigned Projects ({assignedProjects.length})
                                </h4>
                                <div className="flex flex-wrap gap-2">
                                  {assignedProjects.map(project => (
                                    <Link
                                      key={project.id}
                                      href={`/dashboard/projects/${project.id}`}
                                      className="text-xs px-3 py-1.5 rounded-full bg-primary/10 text-primary hover:bg-primary/20 transition-colors font-medium inline-flex items-center gap-1.5 border border-primary/20 hover:border-primary/40"
                                    >
                                      {project.name}
                                    </Link>
                                  ))}
                                </div>
                              </div>
                            )}
                            
                            {user.role === 'engineer' ? (
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
                                      const StatusIcon = statusConfig[task.status as keyof typeof statusConfig]?.icon || Circle;

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
                                              href={`/dashboard/projects/${task.projectId}`} 
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
                                              className={cn("font-semibold border shadow-sm", statusConfig[task.status as keyof typeof statusConfig]?.className)}
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
                                    <p className="text-xs text-muted-foreground mt-2">
                                        Assigned to {assignedProjects.length} {assignedProjects.length === 1 ? 'project' : 'projects'} but no specific tasks yet
                                    </p>
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
                                Only users with the 'engineer' role can be assigned tasks.
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
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Workload</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedUsers.map(user => {
                  const tasks = engineerTasksMap[user.id] || [];
                  const assignedProjects = engineerProjectsMap[user.id] || [];
                  return (
                    <TableRow key={user.id} className={cn(user.status === 'Inactive' && 'opacity-60')}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="h-10 w-10">
                            <AvatarImage src={user.avatarUrl} alt={user.name} />
                            <AvatarFallback>{getInitials(user.name)}</AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-semibold">{user.name}</p>
                            <p className="text-xs text-muted-foreground">{user.email || user.phone}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={cn("text-xs font-semibold px-2 py-1 border", roleColors[user.role])}>
                          {capitalize(user.role)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className={cn("h-2 w-2 rounded-full", user.status === 'Active' ? 'bg-green-500' : 'bg-destructive')} />
                          <span>{user.status}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {user.role === 'engineer' ? (
                          <div className="flex flex-col">
                            <span>{assignedProjects.length} Project(s)</span>
                            <span className="text-xs text-muted-foreground">{tasks.length} Task(s)</span>
                          </div>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                         {canManageUsers && (
                          <div className="flex items-center justify-end gap-2">
                            <Button variant="ghost" size="icon" onClick={() => router.push(`/dashboard/team/${user.id}`)}>
                                <Edit className="h-4 w-4" />
                            </Button>
                            <div className="w-32">
                              <Select 
                                value={user.role} 
                                onValueChange={(newRole: UserRole) => handleRoleChange(user.id, newRole)}
                                disabled={user.id === currentUser?.id || user.role === 'system super admin' || (currentUser?.role === 'admin' && user.role === 'director')}
                              >
                                <SelectTrigger className="h-8 text-xs">
                                  <SelectValue placeholder="Set role" />
                                </SelectTrigger>
                                <SelectContent>
                                  {roles.map(r => (
                                    <SelectItem key={r} value={r} disabled={r !== user.role && licenseUsage[r] >= licenseLimits[r]}>
                                      {capitalize(r)}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                            <Switch
                              id={`status-table-${user.id}`}
                              checked={user.status === 'Active'}
                              onCheckedChange={(checked) => handleStatusChange(user.id, checked)}
                              disabled={user.id === currentUser?.id || user.role === 'system super admin' || (currentUser?.role === 'admin' && user.role === 'director')}
                            />
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
