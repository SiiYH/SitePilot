
import { notFound } from 'next/navigation';
import { mockProjects, mockUsers } from '@/lib/data';
import { Project, Task } from '@/types';
import EditWorkItemForm from './_components/EditWorkItemForm';

async function getWorkItem(id: string): Promise<{ workItem: Task; project: Project } | undefined> {
  for (const project of mockProjects) {
    const workItem = project.tasks.find(t => t.id === id);
    if (workItem) {
      return { workItem, project };
    }
  }
  return undefined;
}

export default async function EditWorkItemPage({ params }: { params: { id: string } }) {
  const itemData = await getWorkItem(params.id);
  
  if (!itemData) {
    notFound();
  }
  
  const { workItem, project } = itemData;
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

    