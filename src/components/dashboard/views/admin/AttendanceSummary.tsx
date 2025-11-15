
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Clock } from "lucide-react";

export default function AttendanceSummary() {
    return (
        <Card className="h-full">
            <CardHeader>
                <CardTitle>Team Attendance</CardTitle>
                <CardDescription>GPS-based site check-in & out.</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground p-8 rounded-lg bg-muted/50 border-2 border-dashed">
                    <Clock className="h-10 w-10 mb-4" />
                    <p className="font-semibold text-lg">Coming Soon</p>
                    <p className="text-sm">This feature is currently under development.</p>
                </div>
            </CardContent>
        </Card>
    );
}
