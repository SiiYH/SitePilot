
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Project } from "@/types";
import { DollarSign, GanttChartSquare, CheckCircle } from "lucide-react";

interface ProgressOverviewProps {
    projects: Project[];
}

export default function ProgressOverview({ projects }: ProgressOverviewProps) {
    const totalProjects = projects.length;
    const completedProjects = projects.filter(p => p.progress === 100).length;
    const overallProgress = totalProjects > 0 ? projects.reduce((acc, p) => acc + p.progress, 0) / totalProjects : 0;
    const completionRate = totalProjects > 0 ? (completedProjects / totalProjects) * 100 : 0;

    return (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Projects</CardTitle>
                    <GanttChartSquare className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{totalProjects}</div>
                    <p className="text-xs text-muted-foreground">
                        All active and completed projects.
                    </p>
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Completion Rate</CardTitle>
                    <CheckCircle className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{completionRate.toFixed(0)}%</div>
                     <p className="text-xs text-muted-foreground">
                        {completedProjects} of {totalProjects} projects completed.
                    </p>
                </CardContent>
            </Card>
             <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Overall Progress</CardTitle>
                    <GanttChartSquare className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{overallProgress.toFixed(0)}%</div>
                    <Progress value={overallProgress} className="mt-2 h-2" />
                </CardContent>
            </Card>
        </div>
    );
}
