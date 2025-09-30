
'use client';

import { notFound, useParams } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { mockProjects, mockClaims, mockUsers } from '@/lib/data';
import { Project, User, Claim } from '@/types';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import TasksTable from '@/components/dashboard/TasksTable';
import DocumentsList from '@/components/dashboard/DocumentsList';
import GenerateReportButton from '@/components/dashboard/GenerateReportButton';
import ClaimsTab from './_components/ClaimsTab';
import { Button } from '@/components/ui/button';
import { Edit, Upload, Settings } from 'lucide-react';
import OverviewTab from './_components/OverviewTab';
import SettingsTab from './_components/SettingsTab';
import { useAuth } from '@/hooks/use-auth';
import { useEffect, useState, useRef } from 'react';
import { Loader2 } from 'lucide-react';
import { Dialog, DialogContent, DialogTitle, DialogTrigger } from '@/components/ui/dialog';


async function getProject(slug: string): Promise<Project | undefined> {
  // In a real app, this would be a database query.
  return mockProjects.find(p => p.slug === slug);
}

async function getClaimsForProject(projectId: string): Promise<Claim[]> {
  return mockClaims.filter(claim => claim.projectId === projectId);
}

async function getAssignedEngineers(engineerIds: string[]): Promise<User[]> {
    return mockUsers.filter(user => engineerIds.includes(user.id));
}


export default function ProjectDetailsPage() {
  const params = useParams();
  const slug = params.slug as string;
  const { user, loading: authLoading } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [project, setProject] = useState<Project | undefined>(undefined);
  const [claims, setClaims] = useState<Claim[]>([]);
  const [assignedEngineers, setAssignedEngineers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  const canManageSettings = user?.role === 'Admin' || user?.role === 'Director';

  const updateProjectState = (updatedProject: Project) => {
    setProject(updatedProject);
    const projectIndex = mockProjects.findIndex(p => p.id === updatedProject.id);
    if (projectIndex !== -1) {
      mockProjects[projectIndex] = updatedProject;
    }
  };

  useEffect(() => {
    if (slug && user) {
      const fetchData = async () => {
        setLoading(true);
        const projectData = await getProject(slug);
        if (projectData) {
          setProject(projectData);
          let claimsData = await getClaimsForProject(projectData.id);

          if (user.role === 'Engineer') {
            claimsData = claimsData.filter(claim => claim.submittedBy === user.id);
          }

          setClaims(claimsData);
          const engineersData = await getAssignedEngineers(projectData.assignedEngineers);
          setAssignedEngineers(engineersData);
        }
        setLoading(false);
      };
      fetchData();
    }
  }, [slug, user]);

  const handleClaimCreated = (newClaim: Claim) => {
    setClaims(prevClaims => [newClaim, ...prevClaims]);
  };
  
  const handleImageUploadClick = () => {
    fileInputRef.current?.click();
  };
  
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && project) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const newImageUrl = e.target?.result as string;
        updateProjectState({ ...project, imageUrl: newImageUrl });
      };
      reader.readAsDataURL(file);
    }
  };

  if (loading || authLoading) {
     return (
      <div className="flex h-[calc(100vh-10rem)] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!project || !user) {
    notFound();
  }
  
  const canEditProject = user.role === 'Admin' || user.role === 'Director';
  const canUploadImage = user.role === 'Director' || user.role === 'Admin';


  return (
    <div className="space-y-6">
      <Dialog>
      <div className="group relative -mx-4 -mt-4 h-60 w-[calc(100%+2rem)] sm:-mx-6 sm:-mt-6 sm:w-[calc(100%+3rem)]">
        <DialogTrigger asChild>
          <div className="absolute inset-0 cursor-pointer">
              <Image
                src={project.imageUrl}
                alt={project.name}
                fill
                className="object-cover"
                data-ai-hint={project.imageHint}
              />
          </div>
        </DialogTrigger>

        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/50 to-transparent" />
         {canUploadImage && (
          <>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              className="hidden"
              accept="image/*"
            />
            <div className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 transition-opacity group-hover:opacity-100">
              <Button onClick={handleImageUploadClick} variant="secondary">
                <Upload className="mr-2 h-4 w-4" />
                Upload Image
              </Button>
            </div>
          </>
        )}
      </div>
      <DialogContent className="p-0 sm:max-w-4xl border-0 bg-transparent shadow-none">
          <DialogTitle className="sr-only">{project.name} - Site Image</DialogTitle>
          <div className="relative aspect-video w-full">
              <Image
                  src={project.imageUrl}
                  alt={project.name}
                  fill
                  className="object-contain"
              />
          </div>
      </DialogContent>
      </Dialog>
      
      <div className="space-y-2">
          <Badge>In Progress</Badge>
          <div className="flex flex-col justify-between gap-4 md:flex-row md:items-start">
             <h1 className="text-3xl font-bold tracking-tight">{project.name}</h1>
             <div className="flex flex-col gap-2 sm:flex-row">
                {canEditProject && (
                  <Button variant="outline" asChild>
                      <Link href={`/dashboard/projects/${project.slug}/edit`}>
                          <Edit className="mr-2 h-4 w-4" />
                          Edit Project
                      </Link>
                  </Button>
                )}
                <GenerateReportButton project={project} />
             </div>
          </div>
      </div>
      
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-1 h-auto sm:h-10 sm:grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="claims">Claims</TabsTrigger>
          <TabsTrigger value="tasks">Tasks</TabsTrigger>
          <TabsTrigger value="documents">Documents</TabsTrigger>
          {canManageSettings && <TabsTrigger value="settings">Settings</TabsTrigger>}
        </TabsList>
        <TabsContent value="overview" className="mt-6">
          <OverviewTab project={project} engineers={assignedEngineers} user={user} onProjectUpdate={updateProjectState} />
        </TabsContent>
        <TabsContent value="claims" className="mt-6">
          <ClaimsTab claims={claims} project={project} onClaimCreated={handleClaimCreated} />
        </TabsContent>
        <TabsContent value="tasks" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Task Management</CardTitle>
              <CardDescription>All tasks associated with this project.</CardDescription>
            </CardHeader>
            <CardContent>
              <TasksTable tasks={project.tasks} user={user} />
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="documents" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Document Repository</CardTitle>
              <CardDescription>All documents related to this project.</CardDescription>
            </CardHeader>
            <CardContent>
              <DocumentsList documents={project.documents} user={user} />
            </CardContent>
          </Card>
        </TabsContent>
         {canManageSettings && (
            <TabsContent value="settings" className="mt-6">
                <SettingsTab project={project} onProjectUpdate={updateProjectState} />
            </TabsContent>
        )}
      </Tabs>
    </div>
  );
}
