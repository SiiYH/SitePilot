import ProjectCard from '@/components/dashboard/ProjectCard';
import { Project } from '@/types';

interface AdminDashboardProps {
    projects: Project[];
}

export default function AdminDashboard({ projects }: AdminDashboardProps) {
    return (
        <div>
            <h3 className="mb-4 text-xl font-semibold">Active Projects</h3>
            {projects.length > 0 ? (
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
                {projects.map(project => (
                    <ProjectCard key={project.id} project={project} />
                ))}
                </div>
            ) : (
                <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-muted-foreground/30 bg-muted/20 p-12 text-center">
                    <h3 className="text-lg font-semibold text-muted-foreground">No Projects Found</h3>
                    <p className="mt-1 text-sm text-muted-foreground">There are no active projects to display.</p>
                </div>
            )}
        </div>
    );
}
