
import { Project, User } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Calendar, CheckCircle, Clock, Users, SlidersHorizontal } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { getProjectProgress } from '@/lib/projects';
import { Slider } from '@/components/ui/slider';
import { Input } from '@/components/ui/input';

const getInitials = (name: string) => {
  if (!name) return '';
  const names = name.split(' ');
  if (names.length > 1) {
    return `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase();
  }
  return name.substring(0, 2).toUpperCase();
};

const InfoField = ({ label, value, unit, currency }: { label: string; value?: string | number | null; unit?: string; currency?: string }) => {
    if (!value && value !== 0) return null;

    let displayValue: string | React.ReactNode = value;

    if (typeof value === 'number') {
        if (currency) {
            displayValue = (
                <>
                    <span className="mr-1 text-xs text-muted-foreground">{currency}</span>
                    {value.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                </>
            );
        } else {
            displayValue = value.toLocaleString();
        }
    }
    
    return (
        <div className="space-y-1">
            <p className="text-sm font-medium text-muted-foreground">{label}</p>
            <div className="text-sm break-words">{displayValue}{unit && <span className="text-muted-foreground">{unit}</span>}</div>
        </div>
    );
};


function AssignedTeam({ users, currentUser }: { users: User[], currentUser: User }) {
    if (users.length === 0) return null;

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5 text-primary" />
                    <span>Assigned Team</span>
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    {users.map(user => (
                        <div key={user.id} className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <Avatar>
                                    <AvatarImage src={user.avatarUrl} alt={user.name} />
                                    <AvatarFallback>{getInitials(user.name)}</AvatarFallback>
                                </Avatar>
                                <div>
                                    <p className="font-medium">{user.name}</p>
                                    <p className="text-sm text-muted-foreground">{user.role}</p>
                                </div>
                            </div>
                            {user.id === currentUser.id && (
                                <Badge variant="secondary">me</Badge>
                            )}
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    );
}


export default function OverviewTab({ project, assignedUsers, user, onProjectUpdate }: { project: Project, assignedUsers: User[], user: User, onProjectUpdate: (project: Project) => void }) {
    const milestones = (project.tasks || []).filter(task => task.type === 'Milestone');
    const achievedMilestones = milestones.filter(m => m.status === 'Completed');
    const upcomingMilestones = milestones.filter(m => m.status === 'In Progress' || m.status === 'Not Started');

    const canViewFinancials = user.role === 'admin' || user.role === 'director';
    const canEditManualProgress = user.role === 'admin' || user.role === 'director';
    const calculatedProgress = getProjectProgress(project);

    const progressModeLabels: Record<Project['progressTrackingMode'], string> = {
      'manual': 'Manual',
      'task-driven': 'Task-Driven',
      'milestone-driven': 'Milestone-Driven',
      'mixed-mode': 'Mixed Mode',
    };

    const handleManualProgressChange = (value: number) => {
        onProjectUpdate({ ...project, progress: value });
    };
    
    const getSafeDate = (dateValue: string | Date | undefined): Date | null => {
        if (!dateValue) return null;
        if (dateValue instanceof Date) return dateValue;
        try {
        return parseISO(dateValue);
        } catch (error) {
        return null;
        }
    };

    const startDate = getSafeDate(project.startDate);
    const endDate = getSafeDate(project.endDate);


    return (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            <Card className="lg:col-span-2">
                <CardHeader>
                    <CardTitle>Project Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div>
                        <h3 className="text-base font-semibold mb-2">Job/Site Description</h3>
                        <p className="text-muted-foreground">{project.description}</p>
                    </div>
                    <Separator/>
                     <div>
                        <div className="mb-1 flex justify-between text-sm font-medium">
                            <span>Overall Progress</span>
                            <span className="text-muted-foreground">{calculatedProgress}%</span>
                        </div>
                        <Progress value={calculatedProgress} />
                        <div className="mt-2 flex items-center text-xs text-muted-foreground">
                            <SlidersHorizontal className="mr-2 h-3 w-3"/>
                            <span>Tracking Mode: {progressModeLabels[project.progressTrackingMode]}</span>
                        </div>
                    </div>
                     {project.progressTrackingMode === 'manual' && canEditManualProgress && (
                        <div className="space-y-2 pt-2">
                            <p className="text-sm font-medium">Set Manual Progress</p>
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
                                    onChange={(e) => handleManualProgressChange(parseInt(e.target.value, 10))}
                                    className="w-20"
                                    min="0"
                                    max="100"
                                />
                            </div>
                        </div>
                    )}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="flex items-center text-sm text-muted-foreground">
                          <Calendar className="mr-2 h-4 w-4"/>
                          Start Date: {startDate ? format(startDate, 'PPP') : 'N/A'}
                      </div>
                       <div className="flex items-center text-sm text-muted-foreground">
                          <Calendar className="mr-2 h-4 w-4"/>
                          End Date: {endDate ? format(endDate, 'PPP') : 'N/A'}
                      </div>
                    </div>
                     <Separator/>
                    <h3 className="text-base font-semibold">Site Information</h3>
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <InfoField label="Job No." value={project.id} />
                        <InfoField label="Order No." value={project.orderNo} />
                        <InfoField label="Site Name" value={project.siteName} />
                        <InfoField label="Job Location" value={project.jobLocation} />
                        <InfoField label="Distance" value={project.distance} unit=" km" />
                    </div>
                    {canViewFinancials && (
                        <>
                            <Separator/>
                            <h3 className="text-base font-semibold">Financials & Insurance</h3>
                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                <InfoField label="Performance Bond No." value={project.performanceBondNo} />
                                <InfoField label="Performance Bond Amt." value={project.performanceBondAmount} currency={project.currency}/>
                                <InfoField label="Gross Profit" value={project.grossProfit} currency={project.currency} />
                                <InfoField label="Margin Profit" value={project.marginProfit} unit="%" />
                                <InfoField label="Insurance Amt." value={project.insuranceAmount} currency={project.currency} />
                                <InfoField label="Currency" value={project.currency} />
                            </div>
                        </>
                    )}
                </CardContent>
            </Card>
            <div className="space-y-6">
                <AssignedTeam users={assignedUsers} currentUser={user} />
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <CheckCircle className="h-5 w-5 text-green-500" />
                            <span>Achieved Milestones</span>
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {achievedMilestones.length > 0 ? (
                             <ul className="space-y-2 text-sm text-muted-foreground">
                                {achievedMilestones.map(m => (
                                    <li key={m.id} className="flex justify-between">
                                        <span>{m.title}</span>
                                        <span>{format(parseISO(m.dueDate), 'MMM, yyyy')}</span>
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <p className="text-sm text-muted-foreground">No milestones achieved yet.</p>
                        )}
                    </CardContent>
                </Card>
                 <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Clock className="h-5 w-5 text-blue-500" />
                            <span>Upcoming Milestones</span>
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {upcomingMilestones.length > 0 ? (
                            <ul className="space-y-2 text-sm text-muted-foreground">
                            {upcomingMilestones.map(m => (
                                    <li key={m.id} className="flex justify-between">
                                        <span>{m.title}</span>
                                        <span>{format(parseISO(m.dueDate), 'MMM, yyyy')}</span>
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <p className="text-sm text-muted-foreground">No upcoming milestones.</p>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
