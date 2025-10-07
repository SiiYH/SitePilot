
import { notFound } from 'next/navigation';
import { mockUsers } from '@/lib/data';
import { Project } from '@/types';
import EditProjectForm from './_components/EditProjectForm';
import { initializeFirebase } from '@/firebase';
import { collection, query, where, getDocs, limit } from 'firebase/firestore';


async function getProject(slug: string): Promise<Project | undefined> {
  const { firestore } = initializeFirebase();
  const projectsRef = collection(firestore, 'projects');
  const q = query(projectsRef, where('slug', '==', slug), limit(1));
  const querySnapshot = await getDocs(q);
  if (!querySnapshot.empty) {
    const projectDoc = querySnapshot.docs[0];
    return { id: projectDoc.id, ...projectDoc.data() } as Project;
  }
  return undefined;
}

export default async function EditProjectPage({ params }: { params: { slug: string } }) {
  const project = await getProject(params.slug);
  
  if (!project) {
    notFound();
  }
  
  const engineers = mockUsers.filter(u => u.role === 'Engineer');

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Edit Project</h2>
        <p className="text-muted-foreground">Make changes to "{project.name}" details.</p>
      </div>
      <EditProjectForm project={project} engineers={engineers} />
    </div>
  );
}

    
