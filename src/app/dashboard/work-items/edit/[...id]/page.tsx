
'use client';

import { notFound, useParams } from 'next/navigation';
import { Project, Task, User } from '@/types';
import EditWorkItemForm from './_components/EditWorkItemForm';
import { useFirestore, useDoc, useCollection, useMemoFirebase } from '@/firebase';
import { doc, getDoc, query, collection, where } from 'firebase/firestore';
import { Loader2 } from 'lucide-react';
import { useEffect, useState, useMemo } from 'react';
import { useAuth } from '@/hooks/use-auth';

export default function EditWorkItemPage() {
    const params = useParams();
    const idParts = params.id as string[]; // e.g., ['projects', 'proj-123', 'tasks', 'task-456']
    const firestore = useFirestore();
    const { company } = useAuth();
    
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
    
    const companyUsersQuery = useMemoFirebase(() => {
        if (!firestore || !company?.id) return null;
        return query(collection(firestore, 'users'), where('companyId', '==', company.id));
    }, [firestore, company?.id]);
    const { data: companyUsers, isLoading: usersLoading } = useCollection<User>(companyUsersQuery);
    

    if (workItemLoading || usersLoading || projectLoading) {
        return (
            <div className="flex h-[calc(100vh-10rem)] items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    if (!workItem || !project) {
        notFound();
    }
    
    const engineers = companyUsers?.filter(u => u.role === 'engineer') || [];

    return (
        <div className="space-y-6">
        <div>
            <h2 className="text-2xl font-bold tracking-tight">Edit Work Item</h2>
            <p className="text-muted-foreground">Make changes to "{workItem.title}" details.</p>
        </div>
        <EditWorkItemForm workItem={workItem} project={project} engineers={engineers} pathSegments={idParts} />
        </div>
    );
}
