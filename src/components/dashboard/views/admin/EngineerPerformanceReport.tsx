'use client';

import { useReportContext } from '@/contexts/ReportContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { format, parseISO } from 'date-fns';
import Link from 'next/link';

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
  'Paid': 'default',
  'In Progress': 'secondary',
  'Pending': 'secondary',
  'Not Started': 'outline',
  'Overdue': 'destructive',
  'Rejected': 'destructive',
};

export default function EngineerPerformanceReport() {
  const { performanceData } = useReportContext();

  return (
    <Card className="print-card">
      <CardHeader className="print-hidden">
        <CardTitle>Performance Details</CardTitle>
        <CardDescription>Detailed breakdown of projects, tasks, and claims for each engineer.</CardDescription>
      </CardHeader>
      <CardContent>
        {performanceData.length > 0 ? (
          <Accordion type="multiple" className="w-full space-y-4">
            {performanceData.map(engineerData => (
              <AccordionItem value={engineerData['engineer Name']} key={engineerData['engineer Name']} className="border rounded-lg overflow-hidden">
                <AccordionTrigger className="px-6 py-4 hover:no-underline bg-muted/30">
                  <div className="flex items-center gap-4">
                    <Avatar>
                      <AvatarImage src={engineerData.avatarUrl} alt={engineerData['engineer Name']} />
                      <AvatarFallback>{getInitials(engineerData['engineer Name'])}</AvatarFallback>
                    </Avatar>
                    <div className="text-left">
                      <p className="font-bold text-lg">{engineerData['engineer Name']}</p>
                      <div className="flex flex-wrap gap-2 mt-1">
                        <Badge variant="outline">Projects: {engineerData.projects.length}</Badge>
                        <Badge variant="outline">Tasks: {engineerData.tasks.length}</Badge>
                        <Badge variant="outline">Claims: {engineerData.claims.length}</Badge>
                      </div>
                    </div>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="p-6 space-y-6">
                  {/* Projects Table */}
                  <div>
                    <h4 className="font-semibold mb-2">Assigned Projects</h4>
                    {engineerData.projects.length > 0 ? (
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Project Name</TableHead>
                              <TableHead>Status</TableHead>
                              <TableHead className="text-right">Perf. Bond</TableHead>
                              <TableHead className="text-right">Gross Profit</TableHead>
                              <TableHead className="text-right">End Date</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {engineerData.projects.map(project => (
                              <TableRow key={project.id}>
                                <TableCell className="font-medium">
                                  <Link href={`/dashboard/projects/${project.id}`} className="hover:underline text-primary">
                                    {project.name}
                                  </Link>
                                </TableCell>
                                <TableCell>
                                    <Badge variant="secondary">{project.status}</Badge>
                                </TableCell>
                                <TableCell className="text-right">
                                  {project.performanceBondAmount ? `${project.currency || 'USD'} ${project.performanceBondAmount.toLocaleString()}` : '-'}
                                </TableCell>
                                <TableCell className="text-right">
                                  {project.grossProfit ? `${project.currency || 'USD'} ${project.grossProfit.toLocaleString()}` : '-'}
                                </TableCell>
                                <TableCell className="text-right">{format(parseISO(project.endDate), 'MMM dd, yyyy')}</TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                    ) : (
                        <p className="text-sm text-muted-foreground text-center py-4">No projects assigned.</p>
                    )}
                  </div>
                  
                  {/* Tasks Table */}
                  <div>
                    <h4 className="font-semibold mb-2">Assigned Tasks</h4>
                     {engineerData.tasks.length > 0 ? (
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Task Title</TableHead>
                              <TableHead>Project</TableHead>
                              <TableHead>Role</TableHead>
                              <TableHead>Due Date</TableHead>
                              <TableHead className="text-right">Status</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {engineerData.tasks.map(task => (
                              <TableRow key={task.id}>
                                <TableCell className="font-medium">{task.title}</TableCell>
                                <TableCell>{task.projectName}</TableCell>
                                <TableCell>
                                  <Badge variant={task.owner === engineerData.id ? 'default' : 'secondary'}>
                                    {task.owner === engineerData.id ? 'Owner' : 'Contributor'}
                                  </Badge>
                                </TableCell>
                                <TableCell>{format(parseISO(task.dueDate), 'MMM dd, yyyy')}</TableCell>
                                <TableCell className="text-right">
                                    <Badge variant={statusVariant[task.status] || 'outline'}>{task.status}</Badge>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                     ) : (
                        <p className="text-sm text-muted-foreground text-center py-4">No tasks assigned.</p>
                     )}
                  </div>

                  {/* Claims Table */}
                  <div>
                    <h4 className="font-semibold mb-2">Submitted Claims</h4>
                    {engineerData.claims.length > 0 ? (
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Claim Title</TableHead>
                              <TableHead>Project</TableHead>
                              <TableHead className="text-right">Amount</TableHead>
                              <TableHead className="text-right">Status</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {engineerData.claims.map(claim => (
                              <TableRow key={claim.id}>
                                <TableCell className="font-medium">{claim.title}</TableCell>
                                <TableCell>{claim.projectName}</TableCell>
                                <TableCell className="text-right">{claim.currency} {claim.amount.toLocaleString()}</TableCell>
                                <TableCell className="text-right">
                                    <Badge variant={statusVariant[claim.status] || 'outline'}>{claim.status}</Badge>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                    ) : (
                        <p className="text-sm text-muted-foreground text-center py-4">No claims submitted.</p>
                    )}
                  </div>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        ) : (
          <div className="h-24 text-center flex items-center justify-center">
            <p>No engineer data available for the selected filters.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
