
import { notFound } from 'next/navigation';
import { mockProjects, mockUsers } from '@/lib/data';
import { Project } from '@/types';
import EditProjectForm from './_components/EditProjectForm';

async function getProject(slug: string): Promise<Project | undefined> {
  return mockProjects.find(p => p.slug === slug);
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
