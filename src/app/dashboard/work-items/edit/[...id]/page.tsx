'use client';

import { notFound, useParams } from 'next/navigation';
import { Project, Task, User } from '@/types';
import EditWorkItemForm from './_components/EditWorkItemForm';
import { useFirestore } from '@/firebase';
import { doc, onSnapshot, query, collection, where } from 'firebase/firestore';
import { Loader2 } from 'lucide-react';
import { useEffect, useState, useMemo } from 'react';
import { useAuth } from '@/hooks/use-auth';

export default function EditWorkItemPage() {
    const params = useParams();
    const idParts = params.id as string[];
    const firestore = useFirestore();
    const { company } = useAuth();
    
    const [workItem, setWorkItem] = useState<Task | null>(null);
    const [project, setProject] = useState<Project | null>(null);
    const [companyUsers, setCompanyUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Validate and extract IDs
    const { projectId, taskId, isValidPath } = useMemo(() => {
        if (!idParts || idParts.length !== 4 || idParts[0] !== 'projects' || idParts[2] !== 'tasks') {
            return { projectId: null, taskId: null, isValidPath: false };
        }
        return { 
            projectId: idParts[1], 
            taskId: idParts[3],
            isValidPath: true 
        };
    }, [idParts]);

    // Real-time listeners for project and task
    useEffect(() => {
        if (!firestore || !isValidPath || !projectId || !taskId) {
            setError('Invalid path format');
            setLoading(false);
            return;
        }

        // Real-time listener for project
        const projectRef = doc(firestore, 'projects', projectId);
        const unsubscribeProject = onSnapshot(
            projectRef,
            (projectSnap) => {
                if (!projectSnap.exists()) {
                    console.warn('Project does not exist');
                    setError('Project not found');
                    setLoading(false);
                    return;
                }
                setProject({ id: projectSnap.id, ...projectSnap.data() } as Project);
                setError(null);
            },
            (err) => {
                console.error('🔥 Error listening to project:', err);
                setError('Failed to fetch project');
                setLoading(false);
            }
        );

        // Real-time listener for task
        const taskRef = doc(firestore, 'projects', projectId, 'tasks', taskId);
        const unsubscribeTask = onSnapshot(
            taskRef,
            (taskSnap) => {
                if (!taskSnap.exists()) {
                    console.warn('Task does not exist');
                    setError('Task not found');
                    setLoading(false);
                    return;
                }
                setWorkItem({ id: taskSnap.id, ...taskSnap.data() } as Task);
                setError(null);
                setLoading(false);
            },
            (err) => {
                console.error('🔥 Error listening to task:', err);
                setError('Failed to fetch task');
                setLoading(false);
            }
        );

        // Cleanup listeners
        return () => {
            unsubscribeProject();
            unsubscribeTask();
        };
    }, [firestore, projectId, taskId, isValidPath]);

    // Real-time listener for company users
    useEffect(() => {
        if (!firestore || !company?.id) {
            return;
        }

        const usersQuery = query(
            collection(firestore, 'users'),
            where('companyId', '==', company.id)
        );

        const unsubscribeUsers = onSnapshot(
            usersQuery,
            (usersSnap) => {
                const users = usersSnap.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                })) as User[];
                setCompanyUsers(users);
            },
            (err) => {
                console.error('🔥 Error listening to users:', err);
            }
        );

        return () => {
            unsubscribeUsers();
        };
    }, [firestore, company?.id]);

    // Loading state
    if (loading) {
        return (
            <div className="flex h-[calc(100vh-10rem)] items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    <p className="text-sm text-muted-foreground">Loading work item...</p>
                </div>
            </div>
        );
    }

    // Error or not found state
    if (error || !project || !workItem) {
        return (
            <div className="flex h-[calc(100vh-10rem)] items-center justify-center">
                <div className="text-center space-y-2">
                    <p className="text-lg font-semibold text-destructive">
                        {error || 'Project or task not found'}
                    </p>
                    <p className="text-sm text-muted-foreground">
                        The work item you're looking for doesn't exist or you don't have access to it.
                    </p>
                </div>
            </div>
        );
    }

    // Filter engineers
    const engineers = companyUsers.filter(u => u.role === 'engineer');

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-2xl font-bold tracking-tight">Edit Work Item</h2>
                <p className="text-muted-foreground">
                    Make changes to "{workItem.title}" details.
                </p>
            </div>
            <EditWorkItemForm 
                workItem={workItem} 
                project={project} 
                engineers={engineers} 
                pathSegments={idParts} 
            />
        </div>
    );
}