
'use client';

import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { mockProjects, mockUsers, mockClaims, mockAttendance } from '@/lib/data';
import { Project, User, Claim, AttendanceRecord } from '@/types';
import AdminDashboard from '@/components/dashboard/views/AdminDashboard';
import DirectorDashboard from '@/components/dashboard/views/DirectorDashboard';
import EngineerDashboard from '@/components/dashboard/views/EngineerDashboard';
import { useAuth } from '@/hooks/use-auth';

export default function DashboardPage() {
  const { user } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [tasks, setTasks] = useState<Project['tasks']>([]);
  const [claims, setClaims] = useState<Claim[]>([]);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      if (user.role === 'Engineer') {
        const engineerProjects = mockProjects.filter(p => p.assignedEngineers.includes(user.id));
        setProjects(engineerProjects);
        
        const engineerTasks = engineerProjects.flatMap(p => p.tasks.filter(t => t.assignedTo === user.id));
        setTasks(engineerTasks);
        
      } else if (user.role === 'Admin' || user.role === 'Director') {
        setProjects(mockProjects);
        setClaims(mockClaims);
        setAttendance(mockAttendance);
        setUsers(mockUsers);
        setTasks(mockProjects.flatMap(p => p.tasks));
      }
      setLoading(false);
    }
  }, [user]);

  if (loading || !user) {
    return (
      <div className="flex h-[calc(100vh-10rem)] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const renderDashboard = () => {
    switch (user.role) {
      case 'Admin':
        return <AdminDashboard projects={projects} claims={claims} attendance={attendance} users={users} />;
      case 'Director':
        return <DirectorDashboard projects={projects} claims={claims} attendance={attendance} users={users} />;
      case 'Engineer':
        return <EngineerDashboard projects={projects} tasks={tasks} user={user} />;
      default:
        return <div>Welcome! Your dashboard is being set up.</div>;
    }
  }

  return (
    <div className="space-y-6">
       <div>
        <h2 className="text-2xl font-bold tracking-tight">
          {user.role} Dashboard
        </h2>
        <p className="text-muted-foreground">
          Welcome, {user.name}. Here's your overview.
        </p>
      </div>
      {renderDashboard()}
    </div>
  );
}
