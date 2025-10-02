
'use client';

import { useEffect, useState, useMemo } from 'react';
import { Loader2, FolderKanban } from 'lucide-react';
import { mockProjects } from '@/lib/data';
import { Project, Task, User } from '@/types';
import TasksTable from '@/components/dashboard/TasksTable';
import { useAuth } from '@/hooks/use-auth';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function MyTasksPage() {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProjectId, setSelectedProjectId] = useState<string>('all');

  useEffect(() => {
    if (user) {
      if (user.role === 'Engineer') {
        const engineerTasks = mockProjects.flatMap(p => 
            p.tasks
            .filter(t => t.owner === user.id || t.contributors?.includes(user.id))
            .map(t => ({ ...t, projectName: p.name, projectSlug: p.slug, projectId: p.id }))
        );
        setTasks(engineerTasks);
      }
      setLoading(false);
    }
  }, [user]);

  const projectsWithTasks = useMemo(() => {
    if (tasks.length === 0) return [];
    
    const projectMap = new Map<string, { id: string; name: string }>();
    tasks.forEach(task => {
        if (task.projectId && task.projectName && !projectMap.has(task.projectId)) {
            projectMap.set(task.projectId, { id: task.projectId, name: task.projectName });
        }
    });

    return Array.from(projectMap.values());
  }, [tasks]);

  const filteredTasks = useMemo(() => {
    if (selectedProjectId === 'all') {
      return tasks;
    }
    return tasks.filter(task => task.projectId === selectedProjectId);
  }, [tasks, selectedProjectId]);


  if (loading || !user) {
    return (
      <div className="flex h-[calc(100vh-10rem)] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // This page is only for Engineers
  if (user.role !== 'Engineer') {
      return (
          <div className="space-y-6">
              <h2 className="text-2xl font-bold tracking-tight">Access Denied</h2>
              <p className="text-muted-foreground">This page is only available for users with the 'Engineer' role.</p>
          </div>
      )
  }

  return (
    <div className="space-y-6">
       <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">
            My Tasks
          </h2>
          <p className="text-muted-foreground">
            All tasks and work items assigned to you. Click a work item to view details.
          </p>
        </div>
        {projectsWithTasks.length > 0 && (
            <div className="w-full sm:w-64">
                <Select value={selectedProjectId} onValueChange={setSelectedProjectId}>
                    <SelectTrigger>
                        <FolderKanban className="mr-2 h-4 w-4 text-muted-foreground" />
                        <SelectValue placeholder="Filter by project..." />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Projects</SelectItem>
                        {projectsWithTasks.map(project => (
                            <SelectItem key={project.id} value={project.id}>
                                {project.name}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>
        )}
      </div>
        <Card>
            <CardHeader>
                <CardTitle>All My Work Items</CardTitle>
            </CardHeader>
            <CardContent>
                <TasksTable tasks={filteredTasks} user={user} />
            </CardContent>
        </Card>
    </div>
  );
}
