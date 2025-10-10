
'use client';

import { notFound, useParams } from 'next/navigation';
import { mockUsers } from '@/lib/data';
import { Project, Task } from '@/types';
import EditWorkItemForm from './_components/EditWorkItemForm';
import { useFirestore, useDoc } from '@/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { Loader2 } from 'lucide-react';
import { useEffect, useState } from 'react';

export default function EditWorkItemPage() {
    const params = useParams();
    const id = decodeURIComponent(params.id as string);
    const firestore = useFirestore();

    const [project, setProject] = useState<Project | null>(null);
    const [workItemRef, setWorkItemRef] = useState<any>(null);

    const { data: workItem, isLoading: workItemLoading } = useDoc<Task>(workItemRef);
    
    useEffect(() => {
        const findWorkItem = async () => {
            if (!firestore || !id) return;

            const pathParts = id.split('/tasks/');
            if (pathParts.length !== 2 || !pathParts[0].startsWith('projects/')) {
                notFound();
                return;
            }
            const projectId = pathParts[0].replace('projects/', '');
            const taskId = pathParts[1];

            try {
                const projectDocRef = doc(firestore, 'projects', projectId);
                const projectDoc = await getDoc(projectDocRef);
                if (projectDoc.exists()) {
                    const workItemDocRef = doc(firestore, 'projects', projectId, 'tasks', taskId);
                    setWorkItemRef(workItemDocRef);
                    setProject({ id: projectDoc.id, ...projectDoc.data() } as Project);
                } else {
                    notFound();
                }
            } catch (error) {
                console.error("Error fetching documents:", error);
                notFound();
            }
        };
        findWorkItem();
    }, [id, firestore]);

    if (workItemLoading || !workItem || !project) {
        return (
            <div className="flex h-[calc(100vh-10rem)] items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }
    
    const engineers = mockUsers.filter(u => u.role === 'Engineer');

    return (
        <div className="space-y-6">
        <div>
            <h2 className="text-2xl font-bold tracking-tight">Edit Work Item</h2>
            <p className="text-muted-foreground">Make changes to "{workItem.title}" details.</p>
        </div>
        <EditWorkItemForm workItem={workItem} project={project} engineers={engineers} />
        </div>
    );
}

    