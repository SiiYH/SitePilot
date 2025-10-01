
'use client';

import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { mockProjects } from '@/lib/data';
import { Project, Task, User } from '@/types';
import TasksTable from '@/components/dashboard/TasksTable';
import { useAuth } from '@/hooks/use-auth';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

export default function MyTasksPage() {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      if (user.role === 'Engineer') {
        const engineerTasks = mockProjects.flatMap(p => 
            p.tasks
            .filter(t => t.owner === user.id || t.contributors?.includes(user.id))
            .map(t => ({ ...t, projectName: p.name, projectSlug: p.slug }))
        );
        setTasks(engineerTasks);
      }
      setLoading(false);
    }
  }, [user]);

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
       <div>
        <h2 className="text-2xl font-bold tracking-tight">
          My Tasks
        </h2>
        <p className="text-muted-foreground">
          All tasks and work items assigned to you. Click a work item to view details.
        </p>
      </div>
        <Card>
            <CardHeader>
                <CardTitle>All My Work Items</CardTitle>
            </CardHeader>
            <CardContent>
                <TasksTable tasks={tasks} user={user} />
            </CardContent>
        </Card>
    </div>
  );
}

    