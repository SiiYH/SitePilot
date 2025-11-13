
'use client';

import { useParams, notFound, useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { useDoc, useCollection, useMemoFirebase, useFirestore } from '@/firebase';
import { doc, collection, query, where } from 'firebase/firestore';
import type { User, Project } from '@/types';
import { Loader2, ArrowLeft, Mail, Phone, Edit } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
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

const InfoField = ({ icon, label, value, children }: { icon: React.ElementType; label: string; value?: string | null; children?: React.ReactNode }) => {
    const Icon = icon;
    return (
        <div className="flex items-start gap-4">
            <Icon className="h-5 w-5 mt-1 flex-shrink-0 text-muted-foreground" />
            <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">{label}</p>
                {value && <p className="text-sm break-words">{value}</p>}
                {children && <div className="text-sm">{children}</div>}
            </div>
        </div>
    );
};

export default function UserDetailsPage() {
  const router = useRouter();
  const params = useParams();
  const userId = params.id as string;
  const { user: currentUser, company } = useAuth();
  const firestore = useFirestore(); // Call hook at top level

  const userRef = useMemoFirebase(() => doc(firestore, 'users', userId), [firestore, userId]);
  const { data: user, isLoading: userLoading } = useDoc<User>(userRef);

  const projectsQuery = useMemoFirebase(() => {
    if (!user || user.role !== 'engineer' || !firestore) return null;
    return query(
      collection(firestore, 'projects'),
      where('companyId', '==', company?.id),
      where('assignedEngineers', 'array-contains', user.id)
    );
  }, [user, company?.id, firestore]);
  const { data: assignedProjects, isLoading: projectsLoading } = useCollection<Project>(projectsQuery);

  const isLoading = userLoading || projectsLoading;

  if (isLoading) {
    return (
      <div className="flex h-[calc(100vh-10rem)] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    notFound();
  }

  // Security check: Only admin/director can view this page for users in their company
  if (currentUser?.role !== 'admin' && currentUser?.role !== 'director') {
    return notFound();
  }
  if (user.companyId !== currentUser.companyId) {
    return notFound();
  }

  return (
    <div className="space-y-6">
       <Button variant="outline" onClick={() => router.push('/dashboard/team')}>
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Team
      </Button>
      <Card className="max-w-4xl mx-auto">
        <CardHeader>
          <div className="flex flex-col sm:flex-row items-start gap-6">
            <Avatar className="h-28 w-28 border-4 border-background shadow-md">
              <AvatarImage src={user.avatarUrl} alt={user.name} />
              <AvatarFallback className="text-3xl">{getInitials(user.name)}</AvatarFallback>
            </Avatar>
            <div className="space-y-2">
              <CardTitle className="text-3xl">{user.name}</CardTitle>
              <div className="flex items-center gap-2">
                <Badge variant="secondary">{user.role}</Badge>
                <Badge variant={user.status === 'Active' ? 'default' : 'destructive'}>
                  {user.status}
                </Badge>
              </div>
              <CardDescription>
                Member since {format(parseISO(user.createdAt), 'MMMM yyyy')}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <Separator />
          <h3 className="font-semibold text-lg">Contact Information</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <InfoField icon={Mail} label="Email" value={user.email} />
            <InfoField icon={Phone} label="Phone" value={user.phone} />
          </div>

          {user.role === 'engineer' && (
            <>
              <Separator />
              <h3 className="font-semibold text-lg">Assigned Projects ({assignedProjects?.length || 0})</h3>
              <div className="space-y-2">
                {assignedProjects && assignedProjects.length > 0 ? (
                  assignedProjects.map(project => (
                    <Link key={project.id} href={`/dashboard/projects/${project.id}`}>
                      <div className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors">
                        <span className="font-medium">{project.name}</span>
                        <Badge variant="outline">{project.status}</Badge>
                      </div>
                    </Link>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground">No projects assigned.</p>
                )}
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
