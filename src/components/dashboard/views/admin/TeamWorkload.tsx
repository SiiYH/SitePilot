
import { Project, User } from '@/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import Link from 'next/link';

interface TeamWorkloadProps {
  users: User[];
  projects: Project[];
}

const getInitials = (name: string) => {
  if (!name) return '';
  const names = name.split(' ');
  if (names.length > 1) {
    return `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase();
  }
  return name.substring(0, 2).toUpperCase();
};

const statusVariant: { [key: string]: 'default' | 'secondary' | 'destructive' | 'outline' } = {
  'Completed': 'default',
  'In Progress': 'secondary',
  'Not Started': 'outline',
  'Overdue': 'destructive',
};

export default function TeamWorkload({ users, projects }: TeamWorkloadProps) {
  const engineers = users.filter(u => u.role === 'Engineer');

  const getTasksForEngineer = (engineerId: string) => {
    return projects.flatMap(p => 
      p.tasks
        .filter(t => t.assignedTo === engineerId)
        .map(t => ({ ...t, projectName: p.name, projectSlug: p.slug }))
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Team Workload</CardTitle>
        <CardDescription>Overview of tasks assigned to each engineer.</CardDescription>
      </CardHeader>
      <CardContent>
        {engineers.length > 0 ? (
          <Accordion type="single" collapsible className="w-full">
            {engineers.map(engineer => {
              const tasks = getTasksForEngineer(engineer.id);
              return (
                <AccordionItem value={engineer.id} key={engineer.id}>
                  <AccordionTrigger>
                    <div className="flex items-center gap-3">
                      <Avatar className="h-9 w-9">
                        <AvatarImage src={engineer.avatarUrl} alt={engineer.name} />
                        <AvatarFallback>{getInitials(engineer.name)}</AvatarFallback>
                      </Avatar>
                      <div className="text-left">
                        <p className="font-medium">{engineer.name}</p>
                        <p className="text-sm text-muted-foreground">{tasks.length} task(s) assigned</p>
                      </div>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    {tasks.length > 0 ? (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Task</TableHead>
                            <TableHead>Project</TableHead>
                            <TableHead>Due Date</TableHead>
                            <TableHead className="text-right">Status</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {tasks.map(task => (
                            <TableRow key={task.id}>
                              <TableCell className="font-medium">{task.title}</TableCell>
                              <TableCell>
                                <Link href={`/dashboard/projects/${task.projectSlug}`} className="hover:underline text-primary">
                                  {task.projectName}
                                </Link>
                              </TableCell>
                              <TableCell>{format(new Date(task.dueDate), 'MMM dd, yyyy')}</TableCell>
                              <TableCell className="text-right">
                                <Badge variant={statusVariant[task.status] || 'secondary'}>{task.status}</Badge>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    ) : (
                      <div className="px-4 py-8 text-center text-sm text-muted-foreground">
                        No tasks assigned to {engineer.name}.
                      </div>
                    )}
                  </AccordionContent>
                </AccordionItem>
              );
            })}
          </Accordion>
        ) : (
          <div className="text-center text-muted-foreground">
            No engineers found in the team.
          </div>
        )}
      </CardContent>
    </Card>
  );
}
