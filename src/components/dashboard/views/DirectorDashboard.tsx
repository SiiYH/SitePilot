import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Project } from "@/types";
import { DollarSign, GanttChartSquare, CheckCircle } from "lucide-react";

interface DirectorDashboardProps {
    projects: Project[];
}

export default function DirectorDashboard({ projects }: DirectorDashboardProps) {
    const totalProjects = projects.length;
    const completedProjects = projects.filter(p => p.progress === 100).length;
    const overallProgress = projects.reduce((acc, p) => acc + p.progress, 0) / totalProjects || 0;

    return (
        <div className="space-y-6">
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
                        <CardTitle className="text-sm font-medium">Completed Projects</CardTitle>
                        <CheckCircle className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{completedProjects}</div>
                         <p className="text-xs text-muted-foreground">
                            {((completedProjects / totalProjects) * 100).toFixed(0)}% completion rate.
                        </p>
                    </CardContent>
                </Card>
                 <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Overall Progress</CardTitle>
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{overallProgress.toFixed(0)}%</div>
                        <Progress value={overallProgress} className="mt-2 h-2" />
                    </CardContent>
                </Card>
            </div>
            <Card>
                <CardHeader>
                    <CardTitle>Projects At a Glance</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {projects.map(project => (
                            <div key={project.id}>
                                <div className="flex justify-between text-sm">
                                    <span className="font-medium">{project.name}</span>
                                    <span className="text-muted-foreground">{project.progress}%</span>
                                </div>
                                <Progress value={project.progress} className="mt-1 h-2" />
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
