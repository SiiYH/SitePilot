
import Image from 'next/image';
import Link from 'next/link';
import { Project } from '@/types';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Calendar, Users } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { getProjectProgress } from '@/lib/projects';
import ProjectStatusBadge from './ProjectStatusBadge';

interface ProjectCardProps {
  project: Project;
}

export default function ProjectCard({ project }: ProjectCardProps) {
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
    <Card className="flex flex-col overflow-hidden transition-all hover:shadow-lg">
      <Link href={`/dashboard/projects/${project.slug}`} className="block">
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
      <CardHeader>
        <div className='flex items-center justify-between'>
            <CardTitle>
                <Link href={`/dashboard/projects/${project.slug}`} className="hover:underline">
                    {project.name}
                </Link>
            </CardTitle>
            <ProjectStatusBadge statusId={project.status} />
        </div>
        <CardDescription className="line-clamp-2">{project.description}</CardDescription>
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
          <Link href={`/dashboard/projects/${project.slug}`}>View Details</Link>
        </Button>
      </CardFooter>
    </Card>
  );
}
