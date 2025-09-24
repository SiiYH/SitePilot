
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { User, AttendanceRecord } from "@/types";
import { MapPin } from "lucide-react";

interface AttendanceSummaryProps {
    attendance: AttendanceRecord[];
    users: User[];
}

const getInitials = (name: string) => {
  if (!name) return '';
  const names = name.split(' ');
  if (names.length > 1) {
    return `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase();
  }
  return name.substring(0, 2).toUpperCase();
};

export default function AttendanceSummary({ attendance, users }: AttendanceSummaryProps) {
    const clockedInUsers = attendance.filter(a => a.status === 'Clocked In');

    const getUserDetails = (userId: string) => {
        return users.find(u => u.id === userId);
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle>Team Attendance</CardTitle>
                <CardDescription>Who is currently on site.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                {clockedInUsers.length > 0 ? (
                    clockedInUsers.map(record => {
                        const user = getUserDetails(record.userId);
                        if (!user) return null;
                        
                        return (
                            <div key={record.userId} className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <Avatar>
                                        <AvatarImage src={user.avatarUrl} alt={user.name} />
                                        <AvatarFallback>{getInitials(user.name)}</AvatarFallback>
                                    </Avatar>
                                    <div>
                                        <p className="text-sm font-medium">{user.name}</p>
                                        <p className="flex items-center gap-1 text-xs text-muted-foreground">
                                            <MapPin className="h-3 w-3" />
                                            {record.location}
                                        </p>
                                    </div>
                                </div>
                                <Badge variant="default">Clocked In</Badge>
                            </div>
                        );
                    })
                ) : (
                    <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-muted-foreground/30 bg-muted/20 p-8 text-center">
                        <p className="text-sm text-muted-foreground">No team members are currently clocked in.</p>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
