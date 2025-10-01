
'use client';

import { Project, ProgressTrackingMode } from '@/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Slider } from '@/components/ui/slider';
import { Input } from '@/components/ui/input';

interface SettingsTabProps {
  project: Project;
  onProjectUpdate: (updatedProject: Project) => void;
}

export default function SettingsTab({ project, onProjectUpdate }: SettingsTabProps) {
  const { toast } = useToast();

  const handleModeChange = (newMode: ProgressTrackingMode) => {
    onProjectUpdate({ ...project, progressTrackingMode: newMode });
    toast({
      title: 'Settings Updated',
      description: `Progress tracking mode changed to "${newMode.replace('-', ' ')}".`,
    });
  };

  const handleManualProgressChange = (value: number) => {
     onProjectUpdate({ ...project, progress: value });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Project Settings</CardTitle>
        <CardDescription>Manage how project progress is calculated and displayed.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="progress-mode">Progress Tracking Mode</Label>
          <Select value={project.progressTrackingMode} onValueChange={handleModeChange}>
            <SelectTrigger id="progress-mode" className="w-full md:w-1/2">
              <SelectValue placeholder="Select tracking mode" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="task-driven">Task-Driven</SelectItem>
              <SelectItem value="milestone-driven">Milestone-Driven</SelectItem>
              <SelectItem value="manual">Manual</SelectItem>
              <SelectItem value="task-milestone-driven">Task + Milestone</SelectItem>
            </SelectContent>
          </Select>
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
