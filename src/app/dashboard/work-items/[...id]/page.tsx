
'use client';

import { useParams, notFound, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Task, Project, User } from '@/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Calendar, GanttChartSquare, Milestone, Edit, User as UserIcon, FolderKanban, Users, FileText, Loader2 } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { useState, useEffect, useMemo } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { useFirestore, useDoc, updateDocumentNonBlocking, useCollection, useMemoFirebase } from '@/firebase';
import { doc, getDoc, collection, query, where, documentId } from 'firebase/firestore';

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

const typeIcon: { [key: string]: React.ElementType } = {
    'Task': GanttChartSquare,
    'Milestone': Milestone
};

const InfoField = ({ icon, label, children }: { icon: React.ElementType; label: string; children?: React.ReactNode }) => {
    const Icon = icon;
    return (
        <div className="flex items-start gap-4">
            <Icon className="h-5 w-5 mt-1 flex-shrink-0 text-muted-foreground" />
            <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">{label}</p>
                {children}
            </div>
        </div>
    );
};

export default function WorkItemDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const idParts = params.id as string[]; // e.g., ['projects', 'proj-123', 'tasks', 'task-456']
  const { user } = useAuth();
  const { toast } = useToast();
  const firestore = useFirestore();

  const { projectId, taskId } = useMemo(() => {
    if (!idParts || idParts.length !== 4 || idParts[0] !== 'projects' || idParts[2] !== 'tasks') {
        return { projectId: null, taskId: null };
    }
    return { projectId: idParts[1], taskId: idParts[3] };
  }, [idParts]);

  const workItemRef = useMemoFirebase(() => {
    if (!firestore || !projectId || !taskId) return null;
    return doc(firestore, 'projects', projectId, 'tasks', taskId);
  }, [firestore, projectId, taskId]);

  const projectRef = useMemoFirebase(() => {
    if (!firestore || !projectId) return null;
    return doc(firestore, 'projects', projectId);
  }, [firestore, projectId]);
  
  const { data: workItem, isLoading: workItemLoading } = useDoc<Task>(workItemRef);
  const { data: project, isLoading: projectLoading } = useDoc<Project>(projectRef);
  
  const userIds = useMemo(() => {
    if (!workItem) return [];
    const ids = new Set<string>();
    if (workItem.owner) ids.add(workItem.owner);
    if (workItem.contributors) {
      workItem.contributors.forEach(id => ids.add(id));
    }
    return Array.from(ids);
  }, [workItem]);

  const usersQuery = useMemoFirebase(() => {
    if (!firestore || userIds.length === 0) return null;
    // Firestore 'in' queries are limited to 30 items in modern SDKs.
    return query(collection(firestore, 'users'), where(documentId(), 'in', userIds));
  }, [firestore, userIds]);

  const { data: itemUsers, isLoading: usersLoading } = useCollection<User>(usersQuery);

  const handleStatusChange = (newStatus: Task['status']) => {
    if (!workItem || !workItemRef) return;
    
    updateDocumentNonBlocking(workItemRef, { status: newStatus });

    toast({
        title: "Status Updated",
        description: `The status for "${workItem.title}" has been set to ${newStatus}.`
    });
  };
  
  const loading = projectLoading || workItemLoading || usersLoading;

  if (!user || loading) {
    return (
      <div className="flex h-[calc(100vh-10rem)] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!workItem || !project) {
    notFound();
  }

  const canManageWorkItem = user.role === 'admin' || user.role === 'director' || workItem.owner === user.id || workItem.contributors?.includes(user.id);
  const owner = itemUsers?.find(u => u.id === workItem.owner);
  const contributors = itemUsers?.filter(u => workItem.contributors?.includes(u.id)) || [];
  const Icon = typeIcon[workItem.type] || GanttChartSquare;
  
  const getSafeDate = (dateValue: string | Date | undefined): Date | null => {
    if (!dateValue) return null;
    if (dateValue instanceof Date) return dateValue;
    try {
      return parseISO(dateValue);
    } catch (error) {
      return null;
    }
  };

  const dueDate = getSafeDate(workItem.dueDate);

  return (
    <div className="space-y-6">
       <Button variant="outline" onClick={() => router.back()}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Work Item Details</h2>
        <p className="text-muted-foreground">Details for work item #{workItem.id.slice(-6)}</p>
      </div>
      
      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        <div className="md:col-span-2 space-y-6">
            <Card>
                <CardHeader>
                    <div className="flex flex-col-reverse items-start gap-4 sm:flex-row sm:items-center sm:justify-between">
                        <CardTitle>{workItem.title}</CardTitle>
                         <div className="flex items-center gap-2">
                             {canManageWorkItem && (
                                <Button variant="outline" size="sm" asChild>
                                    <Link href={`/dashboard/work-items/edit/${idParts.join('/')}`}>
                                        <Edit className="mr-2 h-4 w-4" />
                                        Edit
                                    </Link>
                                </Button>
                            )}
                            <Badge variant={statusVariant[workItem.status] || 'outline'} className="text-base px-3 py-1">
                                {workItem.status}
                            </Badge>
                         </div>
                    </div>
                    <CardDescription className="flex items-center gap-2">
                        <Icon className="h-4 w-4" />
                        <span>{workItem.type}</span>
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    {workItem.description && (
                        <InfoField icon={FileText} label="Description">
                            <p className="text-sm text-foreground whitespace-pre-wrap">{workItem.description}</p>
                        </InfoField>
                    )}
                    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                        <InfoField icon={Calendar} label="Due Date">
                           <p className="font-medium">{dueDate ? format(dueDate, 'PPP') : 'N/A'}</p>
                        </InfoField>

                        {project && (
                            <InfoField icon={FolderKanban} label="Associated Project">
                                <Link href={`/dashboard/projects/${project.slug}`} className="text-primary hover:underline font-medium">
                                    {project.name}
                                </Link>
                            </InfoField>
                        )}
                        {owner ? (
                            <InfoField icon={UserIcon} label="Owner">
                                <div className="flex items-center gap-2">
                                    <Avatar className="h-8 w-8">
                                        <AvatarImage src={owner.avatarUrl} alt={owner.name} />
                                        <AvatarFallback>{getInitials(owner.name)}</AvatarFallback>
                                    </Avatar>
                                    <p className="font-medium">{owner.name}</p>
                                </div>
                            </InfoField>
                        ) : (
                             <InfoField icon={UserIcon} label="Owner">
                                <Badge variant="destructive">Unassigned</Badge>
                            </InfoField>
                        )}
                        {contributors && contributors.length > 0 && (
                            <InfoField icon={Users} label="Contributors">
                                <div className="flex flex-wrap gap-2">
                                    {contributors.map(c => (
                                        <Avatar key={c.id} className="h-8 w-8">
                                            <AvatarImage src={c.avatarUrl} alt={c.name} />
                                            <AvatarFallback>{getInitials(c.name)}</AvatarFallback>
                                        </Avatar>
                                    ))}
                                </div>
                            </InfoField>
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
        
        <div className="md:col-span-1 space-y-6">
             <Card className="bg-muted/40">
                <CardHeader>
                    <CardTitle className="text-xl">Manage Work Item</CardTitle>
                    <CardDescription>
                        {canManageWorkItem 
                            ? "Update the status of this work item." 
                            : "Only assigned members, Admins, or Directors can change the status."}
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="max-w-xs">
                        {canManageWorkItem ? (
                            <Select value={workItem.status} onValueChange={(newStatus: Task['status']) => handleStatusChange(newStatus)}>
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
                             <Badge variant={statusVariant[workItem.status] || 'outline'} className="text-base px-3 py-1">
                                {workItem.status}
                             </Badge>
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
      </div>
    </div>
  );
}
