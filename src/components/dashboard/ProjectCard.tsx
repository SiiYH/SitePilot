
import Image from 'next/image';
import Link from 'next/link';
import { Project } from '@/types';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Calendar, Users, MoreVertical, Trash2, CheckSquare } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { getProjectProgress } from '@/lib/projects';
import ProjectStatusBadge from './ProjectStatusBadge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '../ui/dropdown-menu';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '../ui/alert-dialog';
import { Checkbox } from '../ui/checkbox';
import { cn } from '@/lib/utils';

interface ProjectCardProps {
  project: Project;
  onDelete: (projects: Project[]) => void;
  isSelected: boolean;
  onSelect: (projectId: string, isSelected: boolean) => void;
}

export default function ProjectCard({ project, onDelete, isSelected, onSelect }: ProjectCardProps) {
  const calculatedProgress = getProjectProgress(project);

  const getSafeDate = (dateValue: string | Date | undefined): Date | null => {
    if (!dateValue) return null;
    if (dateValue instanceof Date) return dateValue;
    try {
      return parseISO(dateValue);
    } catch (error) {
      return null;
    }
  };

  const endDate = getSafeDate(project.endDate);

  return (
    <Card className={cn(
        "flex flex-col overflow-hidden transition-all hover:shadow-lg",
        isSelected && "ring-2 ring-primary border-primary"
      )}>
      <div className="relative">
        <Link href={`/dashboard/projects/${project.id}`} className="block">
          <div className="relative h-32 w-full sm:h-48">
            <Image
              src={project.imageUrl}
              alt={project.name}
              fill
              className="object-cover"
              data-ai-hint={project.imageHint}
            />
          </div>
        </Link>
        <div className="absolute top-2 left-2 bg-background/50 p-1 rounded-sm backdrop-blur-sm">
          <Checkbox 
            checked={isSelected}
            onCheckedChange={(checked) => onSelect(project.id, !!checked)}
            aria-label={`Select project ${project.name}`}
            className="h-5 w-5"
          />
        </div>
      </div>
      <CardHeader>
        <div className='flex items-start justify-between gap-4'>
            <div className="space-y-2">
                <CardTitle>
                    <Link href={`/dashboard/projects/${project.id}`} className="hover:underline">
                        {project.name}
                    </Link>
                </CardTitle>
                 <ProjectStatusBadge statusId={project.status} />
            </div>
            <AlertDialog>
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreVertical className="h-4 w-4" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <AlertDialogTrigger asChild>
                            <DropdownMenuItem className="text-destructive" onSelect={(e) => e.preventDefault()}>
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete
                            </DropdownMenuItem>
                        </AlertDialogTrigger>
                    </DropdownMenuContent>
                </DropdownMenu>
                 <AlertDialogContent>
                    <AlertDialogHeader>
                    <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                        This will permanently delete the project "{project.name}", its tasks, documents, and all associated data. This action cannot be undone.
                    </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={() => onDelete([project])} className="bg-destructive hover:bg-destructive/90">Delete Project</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
        <CardDescription className="line-clamp-2 pt-2">{project.description}</CardDescription>
      </CardHeader>
      <CardContent className="flex-grow space-y-4">
        <div>
          <div className="mb-1 flex justify-between text-sm font-medium">
            <span>Progress</span>
            <span className="text-muted-foreground">{calculatedProgress}%</span>
          </div>
          <Progress value={calculatedProgress} aria-label={`${calculatedProgress}% complete`} />
        </div>
        <div className="flex justify-between text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            <span>{endDate ? format(endDate, 'MMM dd, yyyy') : 'N/A'}</span>
          </div>
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            <span>{project.assignedEngineers.length} Engineers</span>
          </div>
        </div>
      </CardContent>
      <CardFooter>
        <Button asChild className="w-full">
          <Link href={`/dashboard/projects/${project.id}`}>View Details</Link>
        </Button>
      </CardFooter>
    </Card>
  );
}
