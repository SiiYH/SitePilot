
'use client';

import { Project, ProgressTrackingMode, User } from '@/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Slider } from '@/components/ui/slider';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { mockUsers } from '@/lib/data';
import { format, parseISO } from 'date-fns';
import { History, User as UserIcon, Calendar } from 'lucide-react';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';

interface SettingsTabProps {
  project: Project;
  onProjectUpdate: (updatedProject: Project) => void;
  user: User;
}

const getInitials = (name: string) => {
  if (!name) return '';
  const names = name.split(' ');
  if (names.length > 1) {
    return `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase();
  }
  return name.substring(0, 2).toUpperCase();
};


export default function SettingsTab({ project, onProjectUpdate, user }: SettingsTabProps) {
  const { toast } = useToast();

  const handleModeChange = (newMode: ProgressTrackingMode) => {
    const newHistoryEntry = {
      mode: newMode,
      date: new Date().toISOString(),
      changedBy: user.id,
    };
    
    const updatedHistory = project.progressTrackingModeHistory 
      ? [...project.progressTrackingModeHistory, newHistoryEntry] 
      : [newHistoryEntry];

    onProjectUpdate({ 
      ...project, 
      progressTrackingMode: newMode,
      progressTrackingModeHistory: updatedHistory,
    });
    
    toast({
      title: 'Settings Updated',
      description: `Progress tracking mode changed to "${newMode.replace(/-/g, ' ')}".`,
    });
  };

  const handleManualProgressChange = (value: number) => {
     onProjectUpdate({ ...project, progress: value });
  };
  
  const getUserById = (id: string) => mockUsers.find(u => u.id === id);


  return (
    <Card>
      <CardHeader>
        <CardTitle>Project Settings</CardTitle>
        <CardDescription>Manage how project progress is calculated and displayed.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="progress-mode">Progress Tracking Mode</Label>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <Select value={project.progressTrackingMode} onValueChange={handleModeChange}>
              <SelectTrigger id="progress-mode" className="w-full md:w-1/2">
                <SelectValue placeholder="Select tracking mode" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="task-driven">Task-Driven</SelectItem>
                <SelectItem value="milestone-driven">Milestone-Driven</SelectItem>
                <SelectItem value="manual">Manual</SelectItem>
                <SelectItem value="mixed-mode">Mixed Mode</SelectItem>
              </SelectContent>
            </Select>
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline" className="w-full sm:w-auto">
                    <History className="mr-2 h-4 w-4" />
                    View History
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>Tracking Mode History</DialogTitle>
                  <DialogDescription>
                    A log of all changes made to the progress tracking mode for this project.
                  </DialogDescription>
                </DialogHeader>
                <div className="max-h-[60vh] space-y-4 overflow-y-auto p-1">
                  {project.progressTrackingModeHistory && project.progressTrackingModeHistory.length > 0 ? (
                    [...project.progressTrackingModeHistory].reverse().map((entry, index) => {
                        const changingUser = getUserById(entry.changedBy);
                        return (
                           <div key={index} className="space-y-4">
                             <div className="flex gap-4">
                                <Avatar className="h-10 w-10">
                                    <AvatarImage src={changingUser?.avatarUrl} alt={changingUser?.name} />
                                    <AvatarFallback>{changingUser ? getInitials(changingUser.name) : '?'}</AvatarFallback>
                                </Avatar>
                                <div className="space-y-1">
                                    <p className="text-sm font-medium">
                                        Mode set to <span className="font-bold text-primary">{entry.mode.replace(/-/g, ' ')}</span>
                                    </p>
                                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                                        <div className="flex items-center gap-1">
                                            <UserIcon className="h-3 w-3"/>
                                            <span>by {changingUser?.name || 'Unknown User'}</span>
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <Calendar className="h-3 w-3"/>
                                            <span>{format(parseISO(entry.date), 'PPP p')}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            {index < project.progressTrackingModeHistory.length - 1 && <Separator/>}
                           </div>
                        )
                    })
                  ) : (
                    <p className="text-sm text-center text-muted-foreground py-8">No history found.</p>
                  )}
                </div>
              </DialogContent>
            </Dialog>
          </div>
           <p className="text-xs text-muted-foreground">
            This setting determines how the overall project progress percentage is calculated.
          </p>
        </div>
        {project.progressTrackingMode === 'manual' && (
          <div className="space-y-2 rounded-md border bg-muted/30 p-4">
            <Label>Manual Progress Override</Label>
             <div className='flex items-center gap-4'>
                <Slider
                    value={[project.progress]}
                    onValueChange={(value) => handleManualProgressChange(value[0])}
                    max={100}
                    step={1}
                    className='flex-1'
                />
                <Input
                    type="number"
                    value={project.progress}
                    onChange={(e) => handleManualProgressChange(Math.min(100, Math.max(0, parseInt(e.target.value, 10) || 0)))}
                    className="w-20"
                    min="0"
                    max="100"
                />
            </div>
            <p className="text-xs text-muted-foreground">
                Drag the slider or enter a value to set the project's progress manually.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

