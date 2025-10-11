

'use client';

import { notFound, useParams } from 'next/navigation';
import { Project, User } from '@/types';
import EditProjectForm from './_components/EditProjectForm';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, where, getDocs, limit } from 'firebase/firestore';
import { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';


async function getProject(slug: string, firestore: any): Promise<Project | undefined> {
  if (!firestore) return undefined;
  const projectsRef = collection(firestore, 'projects');
  const q = query(projectsRef, where('slug', '==', slug), limit(1));
  const querySnapshot = await getDocs(q);
  if (!querySnapshot.empty) {
    const projectDoc = querySnapshot.docs[0];
    return { id: projectDoc.id, ...projectDoc.data() } as Project;
  }
  return undefined;
}

export default function EditProjectPage() {
  const params = useParams();
  const slug = params.slug as string;
  const { company } = useAuth();
  const firestore = useFirestore();
  const [project, setProject] = useState<Project | undefined>(undefined);
  const [loadingProject, setLoadingProject] = useState(true);

  const usersQuery = useMemoFirebase(() => {
    if (!firestore || !company?.id) return null;
    return query(collection(firestore, 'users'), where('companyId', '==', company.id));
  }, [firestore, company?.id]);
  
  const { data: users, isLoading: loadingUsers } = useCollection<User>(usersQuery);

  useEffect(() => {
    if (slug && firestore) {
      getProject(slug, firestore).then(projectData => {
        if (projectData) {
          setProject(projectData);
        } else {
          notFound();
        }
        setLoadingProject(false);
      });
    }
  }, [slug, firestore]);
  
  if (loadingProject || loadingUsers) {
    return (
      <div className="flex h-[calc(100vh-10rem)] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!project) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Edit Project</h2>
        <p className="text-muted-foreground">Make changes to "{project.name}" details.</p>
      </div>
      <EditProjectForm project={project} users={users || []} />
    </div>
  );
}
