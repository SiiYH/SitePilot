import { Project, User } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import TasksTable from '../TasksTable';

interface EngineerDashboardProps {
    tasks: Project['tasks'];
    user: User;
}

export default function EngineerDashboard({ tasks, user }: EngineerDashboardProps) {
    return (
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
    );
}
