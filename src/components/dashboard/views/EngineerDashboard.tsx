
import { Project, User } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import TasksTable from '../TasksTable';
import AttendanceCard from './engineer/AttendanceCard';
import ProjectCalendar from './engineer/ProjectCalendar';

interface EngineerDashboardProps {
    projects: Project[];
    tasks: Project['tasks'];
    user: User;
}

export default function EngineerDashboard({ projects, tasks, user }: EngineerDashboardProps) {
    return (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            <div className="space-y-6 md:col-span-2">
                <Card>
                    <CardHeader>
                        <CardTitle>My Assigned Tasks</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {tasks.length > 0 ? (
                            <TasksTable tasks={tasks} user={user} />
                        ) : (
                            <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-muted-foreground/30 bg-muted/20 p-12 text-center">
                                <h3 className="text-lg font-semibold text-muted-foreground">No Tasks Assigned</h3>
                                <p className="mt-1 text-sm text-muted-foreground">You do not have any tasks assigned to you across all projects.</p>
                            </div>
                        )}
                    </CardContent>
                </Card>
                <ProjectCalendar projects={projects} />
            </div>
            <div className="md:col-span-1">
                <AttendanceCard />
            </div>
        </div>
    );
}
