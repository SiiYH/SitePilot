'use client';
import { useState } from 'react';
import { BrainCircuit, Loader2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { getAiReport } from '@/app/actions';
import { Project } from '@/types';

interface GenerateReportButtonProps {
  project: Project;
}

export default function GenerateReportButton({ project }: GenerateReportButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [report, setReport] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { toast } = useToast();

  const handleGenerateReport = async () => {
    setIsLoading(true);
    setReport('');

    // Format data for the AI prompt
    const taskCompletionData = project.tasks
      .map(t => `- ${t.title}: ${t.status}`)
      .join('\n');

    const milestoneData = project.milestones
      .map(m => `- ${m.name}: ${m.status}`)
      .join('\n');

    const result = await getAiReport({
      projectName: project.name,
      taskCompletionData,
      milestoneData,
    });

    setIsLoading(false);
    if (result.success && result.report) {
      setReport(result.report);
      setIsDialogOpen(true);
    } else {
      toast({
        variant: 'destructive',
        title: 'Error Generating Report',
        description: result.error || 'An unexpected error occurred.',
      });
    }
  };

  return (
    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
      <Button onClick={handleGenerateReport} disabled>
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Generating...
          </>
        ) : (
          <>
            <BrainCircuit className="mr-2 h-4 w-4" />
            Generate AI Report
          </>
        )}
      </Button>
      <DialogContent className="sm:max-w-[625px]">
        <DialogHeader>
          <DialogTitle>AI-Generated Progress Report</DialogTitle>
          <DialogDescription>
            A summary of progress for {project.name}.
          </DialogDescription>
        </DialogHeader>
        <div className="prose prose-sm max-w-none rounded-md border bg-muted/30 p-4">
          <p className="whitespace-pre-wrap">{report}</p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
