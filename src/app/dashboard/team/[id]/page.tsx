'use client';

import { useParams, notFound, useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { useDoc, useCollection, useMemoFirebase, useFirestore } from '@/firebase';
import { doc, collection, query, where, updateDoc } from 'firebase/firestore';
import type { User, Project } from '@/types';
import { Loader2, ArrowLeft, Mail, Phone, Edit, Briefcase, Calendar, Shield, Activity } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { format, parseISO } from 'date-fns';
import Link from 'next/link';
import { useState } from 'react';
import { toast } from '@/hooks/use-toast';

const getInitials = (name: string) => {
  if (!name) return '';
  const names = name.split(' ');
  if (names.length > 1) {
    return `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase();
  }
  return name.substring(0, 2).toUpperCase();
};

const getRoleBadgeVariant = (role: string) => {
  switch (role) {
    case 'admin':
      return 'default';
    case 'director':
      return 'secondary';
    case 'engineer':
      return 'outline';
    default:
      return 'outline';
  }
};

const InfoCard = ({ icon: Icon, label, value, href, showCallButton }: { icon: React.ElementType; label: string; value?: string | null; href?: string; showCallButton?: boolean }) => {
  const content = (
    <div className="flex items-start gap-3 p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors">
      <div className="p-2 rounded-md bg-primary/10">
        <Icon className="h-5 w-5 text-primary" />
      </div>
      <div className="space-y-1 flex-1 min-w-0">
        <p className="text-sm font-medium text-muted-foreground">{label}</p>
        <p className="text-sm font-semibold break-words">{value || 'Not provided'}</p>
      </div>
      {showCallButton && value && (
        <Button size="sm" variant="outline" asChild className="shrink-0">
          <a href={`tel:${value}`}>
            <Phone className="h-4 w-4 mr-1" />
            Call
          </a>
        </Button>
      )}
    </div>
  );

  if (href && !showCallButton) {
    return <a href={href} className="block">{content}</a>;
  }
  return content;
};

export default function UserDetailsPage() {
  const router = useRouter();
  const params = useParams();
  const rawUserId = params.id;
  const userId = Array.isArray(rawUserId) ? rawUserId[0] : rawUserId;
  const { user: currentUser, company } = useAuth();
  const firestore = useFirestore();
  
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editForm, setEditForm] = useState({
    name: '',
    email: '',
    phone: '',
    role: '',
    status: ''
  });

  const userRef = useMemoFirebase(() => {
    if (!firestore || !userId) return null;
    return doc(firestore, 'users', userId);
  }, [firestore, userId]);
  
  const { data: user, isLoading: userLoading, error: userError } = useDoc<User>(userRef);

  const projectsQuery = useMemoFirebase(() => {
    if (!firestore || !user?.id || user.role !== 'engineer' || !company?.id) {
      return null;
    }
    
    return query(
      collection(firestore, 'projects'),
      where('companyId', '==', company.id),
      where('assignedEngineers', 'array-contains', user.id)
    );
  }, [firestore, user?.id, user?.role, company?.id]);

  const { data: assignedProjects, isLoading: projectsLoading } = useCollection<Project>(projectsQuery);

  // Loading states
  if (!firestore) {
    return (
      <div className="flex h-[calc(100vh-10rem)] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!userId) {
    return <div>No user ID in URL</div>;
  }

  if (userLoading) {
    return (
      <div className="flex h-[calc(100vh-10rem)] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (userError) {
    return (
      <div className="flex h-[calc(100vh-10rem)] items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="pt-6">
            <p className="text-destructive">Error loading user: {userError.message}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex h-[calc(100vh-10rem)] items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="pt-6">
            <p>User not found in database</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!currentUser) {
    return (
      <div className="flex h-[calc(100vh-10rem)] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Security checks
  if (currentUser.role !== 'admin' && currentUser.role !== 'director') {
    notFound();
  }

  if (user.companyId !== currentUser.companyId) {
    notFound();
  }

  if (user.role === 'engineer' && projectsLoading) {
    return (
      <div className="flex h-[calc(100vh-10rem)] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const handleEditClick = () => {
    setEditForm({
      name: user.name || '',
      email: user.email || '',
      phone: user.phone || '',
      role: user.role || '',
      status: user.status || 'Active'
    });
    setIsEditOpen(true);
  };

  const handleSaveEdit = async () => {
    if (!userRef) {
      toast({
        title: 'Error',
        description: 'User reference not available',
        variant: 'destructive',
      });
      return;
    }

    try {
      setIsSaving(true);
      
      await updateDoc(userRef, {
        name: editForm.name,
        email: editForm.email,
        phone: editForm.phone,
        role: editForm.role,
        status: editForm.status,
        updatedAt: new Date().toISOString()
      });

      toast({
        title: 'Success',
        description: 'User details updated successfully',
      });
      setIsEditOpen(false);
    } catch (error) {
      console.error('Error updating user:', error);
      toast({
        title: 'Error',
        description: 'Failed to update user details',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="container mx-auto py-8 px-4 max-w-6xl space-y-6">
      {/* Header with back button and edit */}
      <div className="flex items-center justify-between">
        <Button 
          variant="ghost" 
          onClick={() => router.push('/dashboard/team')}
          className="gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Team
        </Button>
        
        <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
          <DialogTrigger asChild>
            <Button onClick={handleEditClick} className="gap-2">
              <Edit className="h-4 w-4" />
              Edit Details
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Edit Team Member</DialogTitle>
              <DialogDescription>
                Update the team member's information below.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  placeholder="Enter full name"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={editForm.email}
                  onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                  placeholder="email@example.com"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  value={editForm.phone}
                  onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                  placeholder="+1 (555) 000-0000"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="role">Role</Label>
                <Select value={editForm.role} onValueChange={(value) => setEditForm({ ...editForm, role: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="director">Director</SelectItem>
                    <SelectItem value="engineer">Engineer</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="status">Status</Label>
                <Select value={editForm.status} onValueChange={(value) => setEditForm({ ...editForm, status: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Active">Active</SelectItem>
                    <SelectItem value="Inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsEditOpen(false)} disabled={isSaving}>
                Cancel
              </Button>
              <Button onClick={handleSaveEdit} disabled={isSaving}>
                {isSaving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  'Save Changes'
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Profile Header Card */}
      <Card className="border-2">
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row items-start gap-6">
            {/* Avatar */}
            <div className="relative">
              <Avatar className="h-24 w-24 border-4 border-background shadow-lg ring-2 ring-primary/10">
                <AvatarImage src={user.avatarUrl} alt={user.name} />
                <AvatarFallback className="text-2xl font-bold bg-gradient-to-br from-primary/20 to-primary/5">
                  {getInitials(user.name)}
                </AvatarFallback>
              </Avatar>
              <div className="absolute -bottom-1 -right-1">
                <Badge 
                  variant={user.status === 'Active' ? 'default' : 'destructive'}
                  className="shadow-lg text-xs"
                >
                  {user.status}
                </Badge>
              </div>
            </div>

            {/* User Info */}
            <div className="flex-1 space-y-3">
              <div>
                <h1 className="text-3xl font-bold tracking-tight">{user.name}</h1>
                <div className="flex items-center gap-2 mt-2">
                  <Badge variant={getRoleBadgeVariant(user.role)} className="text-sm px-3 py-1">
                    <Shield className="h-3 w-3 mr-1" />
                    {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                  </Badge>
                </div>
              </div>

              <div className="flex items-center gap-2 text-muted-foreground">
                <Calendar className="h-4 w-4" />
                <span className="text-sm">
                  Member since {format(parseISO(user.createdAt), 'MMMM d, yyyy')}
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Contact Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Phone className="h-5 w-5 text-primary" />
              Contact Information
            </CardTitle>
            <CardDescription>Ways to reach this team member</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <InfoCard 
              icon={Mail} 
              label="Email Address" 
              value={user.email}
              href={`mailto:${user.email}`}
            />
            <InfoCard 
              icon={Phone} 
              label="Phone Number" 
              value={user.phone}
              showCallButton={true}
            />
          </CardContent>
        </Card>

        {/* Role & Status */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-primary" />
              Account Details
            </CardTitle>
            <CardDescription>Role and status information</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <InfoCard 
              icon={Shield} 
              label="Role" 
              value={user.role.charAt(0).toUpperCase() + user.role.slice(1)}
            />
            <InfoCard 
              icon={Activity} 
              label="Status" 
              value={user.status}
            />
          </CardContent>
        </Card>
      </div>

      {/* Assigned Projects (for engineers only) */}
      {user.role === 'engineer' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Briefcase className="h-5 w-5 text-primary" />
              Assigned Projects
              <Badge variant="secondary" className="ml-2">
                {assignedProjects?.length || 0}
              </Badge>
            </CardTitle>
            <CardDescription>
              Projects currently assigned to this engineer
            </CardDescription>
          </CardHeader>
          <CardContent>
            {assignedProjects && assignedProjects.length > 0 ? (
              <div className="grid gap-3">
                {assignedProjects.map(project => (
                  <Link key={project.id} href={`/dashboard/projects/${project.id}`}>
                    <div className="group flex items-center justify-between p-4 rounded-lg border-2 hover:border-primary hover:bg-accent/50 transition-all">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-md bg-primary/10 group-hover:bg-primary/20 transition-colors">
                          <Briefcase className="h-4 w-4 text-primary" />
                        </div>
                        <span className="font-semibold group-hover:text-primary transition-colors">
                          {project.name}
                        </span>
                      </div>
                      <Badge variant="outline" className="group-hover:border-primary transition-colors">
                        {project.status}
                      </Badge>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <Briefcase className="h-12 w-12 mx-auto text-muted-foreground/50 mb-3" />
                <p className="text-sm text-muted-foreground">No projects assigned yet</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}