import Image from 'next/image';
import Link from 'next/link';
import { Project } from '@/types';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar, Users } from 'lucide-react';
import { format } from 'date-fns';

interface ProjectCardProps {
  project: Project;
}

export default function ProjectCard({ project }: ProjectCardProps) {
  return (
    <Card className="flex flex-col overflow-hidden transition-all hover:shadow-lg">
      <Link href={`/dashboard/projects/${project.id}`} className="block">
        <div className="relative h-48 w-full">
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
        <CardTitle>
            <Link href={`/dashboard/projects/${project.id}`} className="hover:underline">
                {project.name}
            </Link>
        </CardTitle>
        <CardDescription className="line-clamp-2">{project.description}</CardDescription>
      </CardHeader>
      <CardContent className="flex-grow space-y-4">
        <div>
          <div className="mb-1 flex justify-between text-sm font-medium">
            <span>Progress</span>
            <span className="text-muted-foreground">{project.progress}%</span>
          </div>
          <Progress value={project.progress} aria-label={`${project.progress}% complete`} />
        </div>
        <div className="flex justify-between text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            <span>{format(new Date(project.deadline), 'MMM dd, yyyy')}</span>
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
