import { Project, User } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import TasksTable from '../TasksTable';
import AttendanceCard from './engineer/AttendanceCard';
import ProjectCalendar from './engineer/ProjectCalendar';
import LockedOverlay from '@/components/ui/lockedOverlay';
import { useAuth } from '@/hooks/use-auth';

interface EngineerDashboardProps {
    projects: Project[];
    tasks: Project['tasks'];
    user: User;
    users: User[];
}

export default function EngineerDashboard({ projects, tasks, user, users }: EngineerDashboardProps) {
    const { isLicenseValid, isLicenseExpired } = useAuth();
    const isLicenseActive = isLicenseValid;
    return (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            <div className="space-y-6 md:col-span-2">
                <Card>
                    <CardHeader>
                        <CardTitle>My Assigned Tasks</CardTitle>
                    </CardHeader>
                    <div className="relative">
                        {!isLicenseActive && (
                            <LockedOverlay
                                user={user}
                                isLicenseExpired={isLicenseExpired}
                                message="Activate your license to access Tasks."
                            />
                        )}
                        <div className={!isLicenseActive ? 'pointer-events-none select-none' : ''}>
                            <CardContent>
                                {tasks.length > 0 ? (
                                    <TasksTable tasks={tasks} user={user} users={users} viewMode="list" />
                                ) : (
                                    <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-muted-foreground/30 bg-muted/20 p-12 text-center">
                                        <h3 className="text-lg font-semibold text-muted-foreground">No Tasks Assigned</h3>
                                        <p className="mt-1 text-sm text-muted-foreground">You do not have any tasks assigned to you across all projects.</p>
                                    </div>
                                )}
                            </CardContent>
                        </div>
                    </div>
                </Card>
                
                        <ProjectCalendar projects={projects} />
                    </div>

            <div className="md:col-span-1">
                <AttendanceCard />
            </div>
        </div>
    );
}
