'use client';

import { useParams, notFound, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { getDoc, doc, collection, query, where } from 'firebase/firestore';
// import { useAuth, useFirestore, useCompany } from '@/contexts';
// import { useDoc, useCollection, useMemoFirebase } from '@/hooks';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Task, Project, User } from '@/types';
import { useCollection, useDoc, useFirestore, useMemoFirebase } from '@/firebase';
import { useAuth } from '@/hooks/use-auth';

export default function WorkItemDetailPage() {
  const { id } = useParams();
  const router = useRouter();

  const firestore = useFirestore();
  const { user, company } = useAuth();

  const [project, setProject] = useState<Project | null>(null);
  const [workItemRef, setWorkItemRef] = useState<any>(null);
  const [isInitializing, setIsInitializing] = useState(true);

  // === Company Users ===
  const companyUsersQuery = useMemoFirebase(() => {
    if (!firestore || !company?.id) return null;
    return query(collection(firestore, 'users'), where('companyId', '==', company.id));
  }, [firestore, company?.id]);

  const { data: users = [], isLoading: usersLoading } = useCollection<User>(companyUsersQuery);

  // === Work Item ===
  const { data: workItem, isLoading: workItemLoading } = useDoc<Task>(
    workItemRef ? workItemRef : null
  );

  // === Parent Project (already fetched, no need useDoc again) ===
  const parentProject = project;
  const projectLoading = false;

  // === Find and set WorkItem reference ===
  useEffect(() => {
    const findWorkItem = async () => {
      if (!firestore || !id) return;

      // Step 1: find the project that contains this workItem
      const projectQuery = query(collection(firestore, 'projects'));
      const snapshot = await getDoc(doc(firestore, `projects/${id}`));

      if (snapshot.exists()) {
        const projectData = { id: snapshot.id, ...snapshot.data() } as Project;
        setProject(projectData);

        // Step 2: find work item reference under this project
        const workItemRef = doc(firestore, `projects/${projectData.id}/workItems/${id}`);
        setWorkItemRef(workItemRef);
      } else {
        notFound();
      }
    };

    findWorkItem();
  }, [id, firestore]);

  // === Stop initializing once we found the Firestore ref ===
  useEffect(() => {
    if (workItemRef) {
      setIsInitializing(false);
    }
  }, [workItemRef]);

  // === Handle loading state ===
  const isLoading =
    isInitializing ||
    workItemLoading ||
    projectLoading ||
    usersLoading ||
    !user ||
    !firestore;

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-1/2" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  // === Handle missing data ===
  if (!workItem && !workItemLoading) {
    notFound();
  }

  // === Find assigned user ===
  const assignedUser = users?.find((u) => u.id === workItem?.owner);

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>{workItem?.title}</CardTitle>
              <CardDescription>{parentProject?.name}</CardDescription>
            </div>
            <Badge variant={workItem?.status === 'Completed' ? 'success' : 'secondary'}>
              {workItem?.status}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <p>{workItem?.description}</p>
          <div className="mt-4">
            <p className="text-sm text-muted-foreground">
              Assigned to:{' '}
              {assignedUser ? (
                <span className="font-medium text-foreground">{assignedUser.name}</span>
              ) : (
                'Unassigned'
              )}
            </p>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-between">
        <Button variant="outline" onClick={() => router.back()}>
          Back
        </Button>
        <Link href={`/projects/${parentProject?.id}/work-items/${workItem?.id}/edit`}>
          <Button>Edit Work Item</Button>
        </Link>
      </div>
    </div>
  );
}
