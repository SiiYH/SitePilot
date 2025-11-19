
'use client';

import { useState, useEffect } from 'react';
import LicenseGenerator, { License } from './_components/LicenseGenerator';
import { Separator } from '@/components/ui/separator';
import { useAuth } from '@/hooks/use-auth';
import { Loader2, List, Trash2, AlertTriangle } from 'lucide-react';
import { useCollection, useFirestore, useStorage } from '@/firebase';
import { collection, orderBy, query, getDocs, writeBatch, doc } from 'firebase/firestore';
import { Company, Project, Claim, Task, Document as DocType } from '@/types';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { ref, deleteObject } from 'firebase/storage';


export default function SystemAdminPage() {
  const { user, loading, company } = useAuth();
  const firestore = useFirestore();
  const storage = useStorage();
  const { toast } = useToast();
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteConfirmationText, setDeleteConfirmationText] = useState('');
  
  const companiesQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'companies'));
  }, [firestore]);

  const { data: companies, isLoading: companiesLoading } = useCollection<Company>(companiesQuery);

  const handleLicenseGenerated = (newLicense: License) => {
    // The useCollection hook will automatically update the list on the licenses page
  };

  const handleDeleteAllData = async () => {
    if (!firestore || !company || !storage) {
        toast({
            variant: "destructive",
            title: "Error",
            description: "Required services not available. Cannot perform deletion."
        });
        return;
    }
    
    setIsDeleting(true);
    toast({
        title: "Deletion in Progress",
        description: "This may take a few moments. Please do not navigate away."
    });

    try {
        const deletionLog = [];

        // 1. Get all projects for the company
        const projectsQuery = query(collection(firestore, 'projects'), where('companyId', '==', company.id));
        const projectsSnapshot = await getDocs(projectsQuery);
        
        for (const projectDoc of projectsSnapshot.docs) {
            const projectData = { id: projectDoc.id, ...projectDoc.data() } as Project;

            const logEntry: any = {
                deletedProjectName: projectData.name,
                projectId: projectData.id,
                grossProfit: projectData.grossProfit || 0,
                engineers: projectData.assignedEngineers,
                deletedBy: user?.name,
                deletedAt: new Date().toISOString(),
                claims: []
            };

            // Delete subcollections (tasks and documents)
            const tasksRef = collection(firestore, 'projects', projectData.id, 'tasks');
            const tasksSnap = await getDocs(tasksRef);
            const batch = writeBatch(firestore);
            tasksSnap.docs.forEach(doc => batch.delete(doc.ref));
            
            const docsRef = collection(firestore, 'projects', projectData.id, 'documents');
            const docsSnap = await getDocs(docsRef);
            for (const docSnap of docsSnap.docs) {
                const docData = docSnap.data() as DocType;
                if (docData.path) {
                    const fileRef = ref(storage, docData.path);
                    await deleteObject(fileRef).catch(err => console.warn(`Could not delete storage file ${docData.path}:`, err));
                }
                batch.delete(docSnap.ref);
            }
            
            await batch.commit();

            // Delete the project header image
            if (projectData.imageUrl && projectData.imageUrl.includes('firebasestorage')) {
                const imageRef = ref(storage, projectData.imageUrl);
                await deleteObject(imageRef).catch(err => console.warn(`Could not delete project image ${projectData.imageUrl}:`, err));
            }
            
            // Log claims associated with this project
            const projectClaimsQuery = query(collection(firestore, 'claims'), where('projectId', '==', projectData.id));
            const claimsSnapshot = await getDocs(projectClaimsQuery);
            logEntry.totalClaims = claimsSnapshot.size;
            logEntry.claims = claimsSnapshot.docs.map(d => ({id: d.id, amount: d.data().amount}));
            
            // Add project deletion to a final batch
            const finalBatch = writeBatch(firestore);
            finalBatch.delete(projectDoc.ref);
            await finalBatch.commit();

            deletionLog.push(logEntry);
        }

        // 2. Delete all claims for the company (that might not be linked to the deleted projects, just in case)
        const allClaimsQuery = query(collection(firestore, 'claims'), where('companyId', '==', company.id));
        const allClaimsSnapshot = await getDocs(allClaimsQuery);
        const claimsBatch = writeBatch(firestore);
        allClaimsSnapshot.docs.forEach(doc => claimsBatch.delete(doc.ref));
        await claimsBatch.commit();
        
        console.log("DELETION LOG:");
        console.table(deletionLog);
        
        toast({
            title: "All Data Deleted",
            description: "All projects, claims, and related documents for your company have been removed."
        });

    } catch (error) {
        console.error("Error deleting all data:", error);
        toast({
            variant: "destructive",
            title: "Deletion Failed",
            description: "An error occurred. Check the console for details."
        });
    } finally {
        setIsDeleting(false);
        setDeleteConfirmationText('');
    }
  }


  const pageLoading = loading || companiesLoading;

  if (pageLoading) {
    return (
      <div className="flex h-[calc(100vh-10rem)] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (user?.role !== 'system super admin') {
    return (
      <div className="space-y-6">
        <h2 className="text-2xl font-bold tracking-tight">Access Denied</h2>
        <p className="text-muted-foreground">
          You do not have permission to view this page.
        </p>
      </div>
    );
  }


  return (
    <div className="space-y-6">
       <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">System Administration</h2>
          <p className="text-muted-foreground">
            Generate new software licenses for companies.
          </p>
        </div>
         <Button asChild>
            <Link href="/dashboard/system-admin/licenses">
                <List className="mr-2 h-4 w-4" />
                View All Licenses
            </Link>
        </Button>
      </div>
      <LicenseGenerator onLicenseGenerated={handleLicenseGenerated} companies={companies || []} />

      <Separator />

      <Card className="border-destructive/50">
        <CardHeader>
            <div className="flex items-center gap-3">
                <AlertTriangle className="h-6 w-6 text-destructive" />
                <CardTitle className="text-destructive">Danger Zone</CardTitle>
            </div>
            <p className="text-sm text-muted-foreground">
                These actions are irreversible. Please proceed with extreme caution.
            </p>
        </CardHeader>
        <CardContent>
             <AlertDialog>
                <AlertDialogTrigger asChild>
                    <Button variant="destructive" disabled={isDeleting}>
                        {isDeleting ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                            <Trash2 className="mr-2 h-4 w-4" />
                        )}
                        Delete All Company Data
                    </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                    <AlertDialogHeader>
                    <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                    <AlertDialogDescription className="space-y-4">
                        <p>This action cannot be undone. This will permanently delete <strong>all projects, tasks, documents, and claims</strong> for your currently associated company (<span className="font-bold">{company?.name}</span>).</p>
                        <p>To confirm, please type <strong>delete all data</strong> below.</p>
                        <Input 
                            value={deleteConfirmationText}
                            onChange={(e) => setDeleteConfirmationText(e.target.value)}
                            placeholder="delete all data"
                            className="bg-muted"
                        />
                    </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction 
                        onClick={handleDeleteAllData} 
                        disabled={deleteConfirmationText !== 'delete all data' || isDeleting}
                        className="bg-destructive hover:bg-destructive/90"
                    >
                        {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Yes, delete everything
                    </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </CardContent>
      </Card>
    </div>
  );
}

