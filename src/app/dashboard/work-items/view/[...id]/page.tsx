'use client';

import { useParams, notFound, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Task, Project, User } from '@/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Calendar, Landmark, Edit, User as UserIcon, FolderKanban, Users, FileText, Loader2, Wrench } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { useState, useEffect } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { useFirestore } from '@/firebase';
import { doc, onSnapshot, collection, query, where, documentId, updateDoc } from 'firebase/firestore';

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
    'Task': Wrench,
    'Milestone': Landmark
};

const InfoField = ({ icon, label, children }: { icon: React.ElementType; label: string; children?: React.ReactNode }) => {
    const Icon = icon;
    return (
        <div className="flex items-start gap-3">
            <div className="rounded-lg bg-muted/50 p-2 mt-0.5">
                <Icon className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="flex-1 space-y-1">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{label}</p>
                <div className="text-sm">{children}</div>
            </div>
        </div>
    );
};

const UserDisplay = ({ user, isCurrentUser }: { user: User; isCurrentUser: boolean }) => (
    <div className="inline-flex items-center gap-2 rounded-lg bg-muted/30 pr-3 py-1 pl-1">
        <Avatar className="h-7 w-7 border-2 border-background">
            <AvatarImage src={user.avatarUrl} alt={user.name} />
            <AvatarFallback className="text-xs">{getInitials(user.name)}</AvatarFallback>
        </Avatar>
        <span className="font-medium text-sm">{user.name}</span>
        {isCurrentUser && (
            <Badge variant="secondary" className="h-5 px-1.5 text-[10px] font-semibold">
                You
            </Badge>
        )}
    </div>
);

export default function WorkItemDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const { toast } = useToast();
  const firestore = useFirestore();

  const [workItem, setWorkItem] = useState<Task | null>(null);
  const [project, setProject] = useState<Project | null>(null);
  const [itemUsers, setItemUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const idParts = params.id as string[];

  useEffect(() => {
    if (!firestore) return;

    if (!idParts || idParts.length !== 4 || idParts[0] !== 'projects' || idParts[2] !== 'tasks') {
      setError('Invalid path format');
      setLoading(false);
      return;
    }

    const projectId = idParts[1];
    const taskId = idParts[3];

    const taskRef = doc(firestore, 'projects', projectId, 'tasks', taskId);

    const unsubscribeTask = onSnapshot(
      taskRef,
      (taskSnapshot) => {
        if (!taskSnapshot.exists()) {
          setError('Task not found');
          setLoading(false);
          return;
        }

        const taskData = { id: taskSnapshot.id, ...taskSnapshot.data() } as Task;
        setWorkItem(taskData);
        setLoading(false);
      },
      (err) => {
        console.error('🔥 Error listening to task:', err);
        setError(err.message || 'Failed to fetch work item');
        setLoading(false);
      }
    );

    const projectRef = doc(firestore, 'projects', projectId);

    const unsubscribeProject = onSnapshot(
      projectRef,
      (projectSnapshot) => {
        if (projectSnapshot.exists()) {
          const projectData = { id: projectSnapshot.id, ...projectSnapshot.data() } as Project;
          setProject(projectData);
        }
      },
      (err) => {
        console.error('🔥 Error listening to project:', err);
      }
    );

    return () => {
      unsubscribeTask();
      unsubscribeProject();
    };
  }, [firestore, idParts]);

  useEffect(() => {
    if (!firestore || !workItem) return;

    const userIds = new Set<string>();
    if (workItem.owner) userIds.add(workItem.owner);
    if (workItem.contributors) {
      workItem.contributors.forEach(id => userIds.add(id));
    }

    if (userIds.size === 0) {
      setItemUsers([]);
      return;
    }

    const userIdsArray = Array.from(userIds);
    const usersQuery = query(
      collection(firestore, 'users'),
      where(documentId(), 'in', userIdsArray.slice(0, 30))
    );

    const unsubscribeUsers = onSnapshot(
      usersQuery,
      (usersSnapshot) => {
        const usersData = usersSnapshot.docs.map(doc => ({ 
          id: doc.id, 
          ...doc.data() 
        })) as User[];
        setItemUsers(usersData);
      },
      (err) => {
        console.error('🔥 Error listening to users:', err);
      }
    );

    return () => {
      unsubscribeUsers();
    };
  }, [firestore, workItem]);

  const handleStatusChange = async (newStatus: Task['status']) => {
    if (!workItem || !firestore) return;

    try {
      const projectId = idParts[1];
      const taskId = idParts[3];
      const taskRef = doc(firestore, 'projects', projectId, 'tasks', taskId);

      await updateDoc(taskRef, { status: newStatus });

      toast({
        title: "Status Updated",
        description: `The status for "${workItem.title}" has been set to ${newStatus}.`
      });
    } catch (err: any) {
      console.error('Error updating status:', err);
      toast({
        title: "Error",
        description: "Failed to update status. Please try again.",
        variant: "destructive"
      });
    }
  };

  if (loading || !user) {
    return (
      <div className="flex h-[calc(100vh-10rem)] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !workItem) {
    return (
      <div className="flex h-[calc(100vh-10rem)] items-center justify-center">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle>Error</CardTitle>
            <CardDescription>{error || 'Work item not found'}</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => router.back()}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Go Back
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const canManageWorkItem = user.role === 'admin' || user.role === 'director' || workItem.owner === user.id || workItem.contributors?.includes(user.id);
  const canEditWorkItem = user.role === 'admin' || user.role === 'director';
  const owner = itemUsers?.find(u => u.id === workItem.owner);
  const contributors = itemUsers?.filter(u => workItem.contributors?.includes(u.id)) || [];
  const Icon = typeIcon[workItem.type] || Wrench;
  
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
    <div className="space-y-6 pb-8">
      <div className="flex items-center justify-between">
        <Button variant="ghost" onClick={() => router.back()} className="gap-2">
          <ArrowLeft className="h-4 w-4" />
          Back
        </Button>
      </div>

      <div className="space-y-1">
        <h1 className="text-3xl font-bold tracking-tight">{workItem.title}</h1>
        <div className="flex items-center gap-2 text-muted-foreground">
          <Icon className="h-4 w-4" />
          <span className="text-sm">{workItem.type}</span>
          <span className="text-sm">·</span>
          <span className="text-sm font-mono">#{workItem.id.slice(-6)}</span>
        </div>
      </div>
      
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader className="space-y-3">
              <div className="flex items-start justify-between gap-4">
                <Badge variant={statusVariant[workItem.status] || 'outline'} className="text-sm px-3 py-1.5">
                  {workItem.status}
                </Badge>
                {canEditWorkItem && (
                  <Button variant="outline" size="sm" asChild>
                    <Link href={`/dashboard/work-items/edit/${idParts.join('/')}`}>
                      <Edit className="mr-2 h-4 w-4" />
                      Edit
                    </Link>
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-8">
              {workItem.description && (
                <InfoField icon={FileText} label="Description">
                  <p className="text-foreground leading-relaxed whitespace-pre-wrap">
                    {workItem.description}
                  </p>
                </InfoField>
              )}

              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                <InfoField icon={Calendar} label="Due Date">
                  <p className="font-semibold text-foreground">
                    {dueDate ? format(dueDate, 'PPP') : 'Not set'}
                  </p>
                </InfoField>

                {project && (
                  <InfoField icon={FolderKanban} label="Project">
                    <Link 
                      href={`/dashboard/projects/${project.slug}`} 
                      className="inline-flex items-center font-semibold text-primary hover:underline underline-offset-4"
                    >
                      {project.name}
                    </Link>
                  </InfoField>
                )}
              </div>

              <div className="border-t pt-6">
                <div className="space-y-6">
                  {owner ? (
                    <InfoField icon={UserIcon} label="Owner">
                      <UserDisplay user={owner} isCurrentUser={owner.id === user.id} />
                    </InfoField>
                  ) : (
                    <InfoField icon={UserIcon} label="Owner">
                      <Badge variant="outline" className="text-muted-foreground">
                        Unassigned
                      </Badge>
                    </InfoField>
                  )}

                  {contributors && contributors.length > 0 && (
                    <InfoField icon={Users} label="Contributors">
                      <div className="flex flex-wrap gap-2">
                        {contributors.map(contributor => (
                          <UserDisplay 
                            key={contributor.id} 
                            user={contributor} 
                            isCurrentUser={contributor.id === user.id} 
                          />
                        ))}
                      </div>
                    </InfoField>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
        
        <div className="lg:col-span-1">
          <Card className="sticky top-6">
            <CardHeader>
              <CardTitle className="text-lg">Update Status</CardTitle>
              <CardDescription className="text-xs">
                {canManageWorkItem 
                  ? "Change the current status of this work item" 
                  : "Only assigned members can update the status"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {canManageWorkItem ? (
                <Select 
                  value={workItem.status} 
                  onValueChange={(newStatus: Task['status']) => handleStatusChange(newStatus)}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Not Started">Not Started</SelectItem>
                    <SelectItem value="In Progress">In Progress</SelectItem>
                    <SelectItem value="Completed">Completed</SelectItem>
                  </SelectContent>
                </Select>
              ) : (
                <div className="rounded-lg border border-dashed p-4 text-center">
                  <p className="text-sm text-muted-foreground">
                    You don't have permission to update this status
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
    