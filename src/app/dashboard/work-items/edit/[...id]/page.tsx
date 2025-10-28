'use client';

import { notFound, useParams } from 'next/navigation';
import { Project, Task, User } from '@/types';
import EditWorkItemForm from './_components/EditWorkItemForm';
import { useFirestore } from '@/firebase';
import { doc, getDoc, query, collection, where, getDocs } from 'firebase/firestore';
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

    useEffect(() => {
        const fetchData = async () => {
            try {
                // Validate path
                if (!isValidPath || !projectId || !taskId) {
                    console.error('Invalid path:', idParts);
                    setLoading(false);
                    return;
                }

                // Create document references
                const projectRef = doc(firestore, 'projects', projectId);
                const taskRef = doc(firestore, 'projects', projectId, 'tasks', taskId);

                // Fetch project and task in parallel
                const [projectSnap, taskSnap] = await Promise.all([
                    getDoc(projectRef),
                    getDoc(taskRef)
                ]);

                // Check if documents exist
                if (!projectSnap.exists() || !taskSnap.exists()) {
                    console.warn('Project or task does not exist.');
                    setLoading(false);
                    notFound();
                    return;
                }

                // Set project and work item
                setProject({ id: projectSnap.id, ...projectSnap.data() } as Project);
                setWorkItem({ id: taskSnap.id, ...taskSnap.data() } as Task);

                // Fetch company users if company exists
                if (company?.id) {
                    const usersQuery = query(
                        collection(firestore, 'users'),
                        where('companyId', '==', company.id)
                    );
                    const usersSnap = await getDocs(usersQuery);
                    const users = usersSnap.docs.map(doc => ({
                        id: doc.id,
                        ...doc.data()
                    })) as User[];
                    setCompanyUsers(users);
                }
            } catch (err) {
                console.error('Error fetching Firestore data:', err);
            } finally {
                setLoading(false);
            }
        };

        if (firestore) {
            fetchData();
        }
    }, [firestore, projectId, taskId, company?.id, isValidPath, idParts]);

    // Loading state
    if (loading) {
        return (
            <div className="flex h-[calc(100vh-10rem)] items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    // Not found state
    if (!project || !workItem) {
        return (
            <div className="flex h-[calc(100vh-10rem)] items-center justify-center">
                <p className="text-muted-foreground">Project or task not found.</p>
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