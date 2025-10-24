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
import { useState, useEffect } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { useFirestore } from '@/firebase';
import { doc, getDoc, collection, query, where, documentId, getDocs, updateDoc } from 'firebase/firestore';

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
  const { user } = useAuth();
  const { toast } = useToast();
  const firestore = useFirestore();

  const [workItem, setWorkItem] = useState<Task | null>(null);
  const [project, setProject] = useState<Project | null>(null);
  const [itemUsers, setItemUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const idParts = params.id as string[];
        console.log('🧭 idParts:', idParts);

        if (!idParts || idParts.length !== 4 || idParts[0] !== 'projects' || idParts[2] !== 'tasks') {
          throw new Error('Invalid path format');
        }

        const projectId = idParts[1];
        const taskId = idParts[3];

        // Fetch work item
        const taskRef = doc(firestore, 'projects', projectId, 'tasks', taskId);
        console.log('📄 Fetching task from path:', taskRef.path);
        const taskSnapshot = await getDoc(taskRef);

        if (!taskSnapshot.exists()) {
          console.log('❌ Task not found');
          setError('Task not found');
          setLoading(false);
          return;
        }

        const taskData = { id: taskSnapshot.id, ...taskSnapshot.data() } as Task;
        console.log('✅ Task data:', taskData);
        setWorkItem(taskData);

        // Fetch project
        const projectRef = doc(firestore, 'projects', projectId);
        console.log('📄 Fetching project from path:', projectRef.path);
        const projectSnapshot = await getDoc(projectRef);

        if (projectSnapshot.exists()) {
          const projectData = { id: projectSnapshot.id, ...projectSnapshot.data() } as Project;
          console.log('✅ Project data:', projectData);
          setProject(projectData);
        }

        // Fetch users
        const userIds = new Set<string>();
        if (taskData.owner) userIds.add(taskData.owner);
        if (taskData.contributors) {
          taskData.contributors.forEach(id => userIds.add(id));
        }

        if (userIds.size > 0) {
          const userIdsArray = Array.from(userIds);
          // Firestore 'in' query has a limit of 30
          const usersQuery = query(
            collection(firestore, 'users'),
            where(documentId(), 'in', userIdsArray.slice(0, 30))
          );
          const usersSnapshot = await getDocs(usersQuery);
          const usersData = usersSnapshot.docs.map(doc => ({ 
            id: doc.id, 
            ...doc.data() 
          })) as User[];
          console.log('✅ Users data:', usersData);
          setItemUsers(usersData);
        }

      } catch (err: any) {
        console.error('🔥 Error fetching data:', err);
        setError(err.message || 'Failed to fetch work item details');
      } finally {
        setLoading(false);
      }
    };

    if (firestore) {
      fetchData();
    }
  }, [firestore, params.id]);

  const handleStatusChange = async (newStatus: Task['status']) => {
    if (!workItem || !firestore) return;

    try {
      const idParts = params.id as string[];
      const projectId = idParts[1];
      const taskId = idParts[3];
      const taskRef = doc(firestore, 'projects', projectId, 'tasks', taskId);

      await updateDoc(taskRef, { status: newStatus });

      // Update local state
      setWorkItem({ ...workItem, status: newStatus });

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
  const idParts = params.id as string[];

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