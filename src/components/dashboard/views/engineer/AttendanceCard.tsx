
'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Loader2, LogIn, LogOut, MapPin, Clock } from 'lucide-react';
import { format } from 'date-fns';

type AttendanceStatus = 'Clocked Out' | 'Clocked In';
type AttendanceLog = {
  type: AttendanceStatus;
  time: Date;
  location: string | null;
};

export default function AttendanceCard() {
  const [status, setStatus] = useState<AttendanceStatus>('Clocked Out');
  const [isLoading, setIsLoading] = useState(false);
  const [location, setLocation] = useState<string | null>(null);
  const [attendanceLog, setAttendanceLog] = useState<AttendanceLog[]>([]);
  const { toast } = useToast();

  const handleClockIn = () => {
    setIsLoading(true);
    setLocation(null);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        const newLocation = `${latitude.toFixed(5)}, ${longitude.toFixed(5)}`;
        setLocation(newLocation);
        setStatus('Clocked In');
        const newLogEntry = { type: 'Clocked In' as AttendanceStatus, time: new Date(), location: newLocation };
        setAttendanceLog([newLogEntry, ...attendanceLog]);
        toast({ title: 'Successfully Clocked In', description: `Location: ${newLocation}` });
        setIsLoading(false);
      },
      (error) => {
        console.log(`Geolocation error: ${error.message} (code: ${error.code})`);
        toast({
          variant: 'destructive',
          title: 'Location Error',
          description: 'Could not get your location. Please enable location services.',
        });
        setIsLoading(false);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  const handleClockOut = () => {
    setStatus('Clocked Out');
    const newLogEntry = { type: 'Clocked Out' as AttendanceStatus, time: new Date(), location: null };
    setAttendanceLog([newLogEntry, ...attendanceLog]);
    toast({ title: 'Successfully Clocked Out' });
    setLocation(null);
  };

  const isClockedIn = status === 'Clocked In';

  return (
    <Card>
      <CardHeader>
        <CardTitle>Attendance</CardTitle>
        <CardDescription>GPS-based site check-in & out.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between rounded-lg border p-4">
          <div>
            <p className="text-sm font-medium">Your Status</p>
            <Badge variant={isClockedIn ? 'default' : 'secondary'}>{status}</Badge>
          </div>
          {isClockedIn && location && (
            <div className="text-right">
              <p className="text-sm font-medium">Location</p>
              <p className="flex items-center gap-1 text-xs text-muted-foreground"><MapPin className="h-3 w-3" />{location}</p>
            </div>
          )}
        </div>

        <Button
          onClick={isClockedIn ? handleClockOut : handleClockIn}
          className="w-full"
          disabled={isLoading}
        >
          {isLoading ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : isClockedIn ? (
            <LogOut className="mr-2 h-4 w-4" />
          ) : (
            <LogIn className="mr-2 h-4 w-4" />
          )}
          {isClockedIn ? 'Clock Out' : 'Clock In'}
        </Button>

        <div className="space-y-2">
            <h4 className="text-sm font-medium">Recent Activity</h4>
            <div className="max-h-40 space-y-3 overflow-y-auto rounded-md bg-muted/50 p-3">
                {attendanceLog.length > 0 ? (
                    attendanceLog.map((log, index) => (
                        <div key={index} className="flex items-start justify-between text-xs">
                           <div className='flex items-center gap-2'>
                             {log.type === 'Clocked In' ? 
                                <LogIn className="h-3 w-3 text-green-500"/> : 
                                <LogOut className="h-3 w-3 text-red-500"/>
                            }
                            <span className={`font-medium ${log.type === 'Clocked In' ? 'text-green-600' : 'text-red-600'}`}>
                                {log.type}
                            </span>
                           </div>
                           <div className="flex items-center gap-1 text-muted-foreground">
                                <Clock className="h-3 w-3" />
                                <span>{format(log.time, 'p')}</span>
                           </div>
                        </div>
                    ))
                ) : (
                    <p className="text-center text-xs text-muted-foreground">No activity today.</p>
                )}
            </div>
        </div>
      </CardContent>
    </Card>
  );
}
