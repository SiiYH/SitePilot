
'use client';

import { notFound, useParams } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { mockUsers, defaultProjectStatuses } from '@/lib/data';
import { Project, User, Claim, Task, ProjectStatus, Document as DocType } from '@/types';
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
import { useEffect, useState, useRef, useMemo } from 'react';
import { Loader2 } from 'lucide-react';
import { Dialog, DialogContent, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import CreateWorkItemDialog from './_components/CreateWorkItemDialog';
import { useFirestore, useStorage, errorEmitter, FirestorePermissionError, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, where, getDocs, limit, doc, updateDoc, onSnapshot, orderBy } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { useToast } from '@/hooks/use-toast';
import UploadDocumentDialog from './_components/UploadDocumentDialog';


async function getProject(slug: string, firestore: any): Promise<Project | undefined> {
  if (!firestore) return undefined;
  const projectsRef = collection(firestore, 'projects');
  const q = query(projectsRef, where('slug', '==', slug), limit(1));
  const querySnapshot = await getDocs(q);
  if (!querySnapshot.empty) {
    const projectDoc = querySnapshot.docs[0];
    return { id: projectDoc.id, ...projectDoc.data() } as Project;
  }
  return undefined;
}

async function getAssignedUsers(userIds: string[]): Promise<User[]> {
    return mockUsers.filter(user => userIds.includes(user.id));
}


export default function ProjectDetailsPage() {
  const params = useParams();
  const slug = params.slug as string;
  const { user, company, loading: authLoading } = useAuth();
  const firestore = useFirestore();
  const storage = useStorage();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [project, setProject] = useState<Project | undefined>(undefined);
  const [assignedUsers, setAssignedUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [projectStatuses, setProjectStatuses] = useState<ProjectStatus[]>([]);
  
  const tasksQuery = useMemoFirebase(() => {
    if (!firestore || !project?.id) return null;
    return query(collection(firestore, 'projects', project.id, 'tasks'), orderBy('createdAt', 'desc'));
  }, [firestore, project?.id]);

  const { data: tasks, isLoading: tasksLoading } = useCollection<Task>(tasksQuery);
  
  const documentsQuery = useMemoFirebase(() => {
    if (!firestore || !project?.id) return null;
    return query(collection(firestore, 'projects', project.id, 'documents'), orderBy('uploadedAt', 'desc'));
  }, [firestore, project?.id]);

  const { data: documents, isLoading: documentsLoading } = useCollection<DocType>(documentsQuery);
  
  const claimsQuery = useMemoFirebase(() => {
    if (!firestore || !project?.id || !user?.companyId) return null;
  
    // Always filter by companyId for security
    let q = query(collection(firestore, 'claims'), 
                  where('projectId', '==', project.id),
                  where('companyId', '==', user.companyId));
  
    // For engineers, add a filter for their own claims
    if (user.role === 'engineer') {
      q = query(q, where('submittedBy', '==', user.id));
    }
    
    return q;
  }, [firestore, project?.id, user?.id, user?.role, user?.companyId]);

  const { data: claims, isLoading: claimsLoading } = useCollection<Claim>(claimsQuery);


  const canManageSettings = user?.role === 'admin' || user?.role === 'director';
  const canManageWorkItems = user?.role === 'admin' || user?.role === 'director';

  useEffect(() => {
    const storedStatuses = localStorage.getItem('sitepilot-project-statuses');
    if (storedStatuses) {
      setProjectStatuses(JSON.parse(storedStatuses));
    } else {
      setProjectStatuses(defaultProjectStatuses);
    }
  }, []);

  const updateProjectState = (updatedProject: Project) => {
    setProject(updatedProject);
  };

  // Real-time listener for project data
  useEffect(() => {
    if (!slug || !user || !firestore) return;

    setLoading(true);
    
    const projectsRef = collection(firestore, 'projects');
    const q = query(projectsRef, where('slug', '==', slug), limit(1));
    
    const unsubscribe = onSnapshot(
      q,
      async (snapshot) => {
        if (!snapshot.empty) {
          const projectDoc = snapshot.docs[0];
          const projectData = { id: projectDoc.id, ...projectDoc.data() } as Project;
          setProject(projectData);
          
          // Fetch assigned users
          const usersData = await getAssignedUsers(projectData.assignedEngineers);
          setAssignedUsers(usersData);
        } else {
          notFound();
        }
        setLoading(false);
      },
      (error) => {
        console.error("Error fetching project:", error);
        toast({
          variant: "destructive",
          title: "Error Loading Project",
          description: "Could not load project data. Please refresh the page.",
        });
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [slug, user, firestore, toast]);
  
  const projectWithTasks = useMemo(() => {
    if (!project) return null;
    return {
      ...project,
      tasks: tasks || [],
    };
  }, [project, tasks]);

  const handleClaimCreated = (newClaim: Claim) => {
    // This is handled by useCollection now
  };
  
  const handleWorkItemCreated = (newTask: Task) => {
    // The real-time listener will automatically update the task list
    toast({
      title: "Work Item Created",
      description: "The new work item has been added successfully.",
    });
  };

  const handleDocumentUploaded = (newDocument: DocType) => {
     // The real-time listener for the documents collection will handle the UI update.
    toast({
      title: "Document Uploaded",
      description: "Your document has been successfully uploaded.",
    });
  };

  const handleImageUploadClick = () => {
    fileInputRef.current?.click();
  };
  
  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !project) return;
  
    setIsUploading(true);
    toast({ title: "Uploading Image...", description: "Please wait." });
    
    const fileName = `header-image`;
    const storageRef = ref(storage, `projects/${project.id}/${fileName}`);
    
    try {
      const snapshot = await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(snapshot.ref);

      const projectDocRef = doc(firestore, "projects", project.id);
      const updateData = { imageUrl: downloadURL };
      
      await updateDoc(projectDocRef, updateData).catch((serverError) => {
          const permissionError = new FirestorePermissionError({
            path: projectDocRef.path,
            operation: 'update',
            requestResourceData: updateData,
          });
          errorEmitter.emit('permission-error', permissionError);
          throw permissionError;
      });

      // Update local state for immediate UI feedback
      updateProjectState({ ...project, imageUrl: downloadURL });

      toast({
        title: "Project Image Updated!",
        description: "Your new project image has been saved.",
      });

    } catch (error) {
      if (!(error instanceof FirestorePermissionError)) {
          console.error("Error during image upload process:", error);
          toast({
            variant: "destructive",
            title: "Upload Failed",
            description: "Could not upload the new image. Please try again.",
          });
      }
    } finally {
      setIsUploading(false);
    }
  };


  if (loading || authLoading || !projectWithTasks) {
     return (
      <div className="flex h-[calc(100vh-10rem)] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    notFound();
  }
  
  const canEditProject = user.role === 'admin' || user.role === 'director';
  const canUploadImage = user.role === 'director' || user.role === 'admin';
  const currentStatus = projectStatuses.find(s => s.id === projectWithTasks.status);


  return (
    <div className="space-y-6">
      <Dialog>
      <div className="group relative -mx-4 -mt-4 h-48 w-[calc(100%+2rem)] sm:-mx-6 sm:-mt-6 sm:h-60 sm:w-[calc(100%+3rem)]">
        <DialogTrigger asChild>
          <div className="absolute inset-0 cursor-pointer">
              <Image
                src={projectWithTasks.imageUrl}
                alt={projectWithTasks.name}
                fill
                className="object-cover"
                data-ai-hint={projectWithTasks.imageHint}
              />
               {isUploading && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/60">
                    <Loader2 className="h-10 w-10 animate-spin text-white" />
                  </div>
                )}
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
              disabled={isUploading}
            />
            <div className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 transition-opacity group-hover:opacity-100">
              <Button onClick={handleImageUploadClick} disabled={isUploading}>
                <Upload className="mr-2 h-4 w-4" />
                Upload Image
              </Button>
            </div>
          </>
        )}
      </div>
      <DialogContent className="p-0 sm:max-w-4xl border-0 bg-transparent shadow-none">
          <DialogTitle className="sr-only">{projectWithTasks.name} - Site Image</DialogTitle>
          <div className="relative aspect-video w-full">
              <Image
                  src={projectWithTasks.imageUrl}
                  alt={projectWithTasks.name}
                  fill
                  className="object-contain"
              />
          </div>
      </DialogContent>
      </Dialog>
      
      <div className="space-y-2">
          {currentStatus && <Badge>{currentStatus.name}</Badge>}
          <div className="flex flex-col justify-between gap-4 md:flex-row md:items-start">
             <h1 className="text-3xl font-bold tracking-tight">{projectWithTasks.name}</h1>
             <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
                {canEditProject && (
                  <Button variant="outline" asChild className="w-full sm:w-auto">
                      <Link href={`/dashboard/projects/${projectWithTasks.slug}/edit`}>
                          <Edit className="mr-2 h-4 w-4" />
                          Edit Project
                      </Link>
                  </Button>
                )}
                <GenerateReportButton project={projectWithTasks} />
             </div>
          </div>
      </div>
      
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-1 h-auto sm:h-10 sm:grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="claims">Claims</TabsTrigger>
          <TabsTrigger value="tasks">Work Items</TabsTrigger>
          <TabsTrigger value="documents">Documents</TabsTrigger>
          {canManageSettings && <TabsTrigger value="settings">Settings</TabsTrigger>}
        </TabsList>
        <TabsContent value="overview" className="mt-6">
          <OverviewTab project={projectWithTasks} assignedUsers={assignedUsers} user={user} onProjectUpdate={updateProjectState} />
        </TabsContent>
        <TabsContent value="claims" className="mt-6">
          <ClaimsTab claims={claims || []} project={projectWithTasks} onClaimCreated={handleClaimCreated} />
        </TabsContent>
        <TabsContent value="tasks" className="mt-6">
          <Card>
            <CardHeader className="flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <CardTitle>Work Item Management</CardTitle>
                <CardDescription>All work items associated with this project.</CardDescription>
              </div>
              {canManageWorkItems && (
                <CreateWorkItemDialog 
                  project={projectWithTasks}
                  engineers={assignedUsers} 
                  onWorkItemCreated={handleWorkItemCreated} 
                />
              )}
            </CardHeader>
            <CardContent>
              {tasksLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                </div>
              ) : (
                <TasksTable tasks={tasks || []} user={user} />
              )}
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="documents" className="mt-6">
          <Card>
             <CardHeader className="flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <CardTitle>Document Repository</CardTitle>
                <CardDescription>All documents related to this project.</CardDescription>
              </div>
               <UploadDocumentDialog project={projectWithTasks} onDocumentUploaded={handleDocumentUploaded} />
            </CardHeader>
            <CardContent>
               {documentsLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                </div>
              ) : (
                <DocumentsList documents={documents || []} user={user} />
              )}
            </CardContent>
          </Card>
        </TabsContent>
         {canManageSettings && (
            <TabsContent value="settings" className="mt-6">
                <SettingsTab project={projectWithTasks} onProjectUpdate={updateProjectState} user={user} />
            </TabsContent>
        )}
      </Tabs>
    </div>
  );
}
