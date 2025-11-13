
'use client';
import { Document as DocType, User } from '@/types';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Download, FileText, EyeOff, Loader2, Trash2 } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { useStorage, useFirestore } from '@/firebase';
import { ref, getDownloadURL, deleteObject } from 'firebase/storage';
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { doc, deleteDoc } from 'firebase/firestore';
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

interface DocumentsListProps {
  documents: DocType[];
  user: User;
  projectId: string;
}

export default function DocumentsList({ documents, user, projectId }: DocumentsListProps) {
  const storage = useStorage();
  const firestore = useFirestore();
  const [loadingDoc, setLoadingDoc] = useState<string | null>(null);
  const { toast } = useToast();
  
  const canManageDoc = (docType: DocType['type']) => {
    return user.role === 'admin' || user.role === 'director';
  }

  const canView = (docType: DocType['type']) => {
    // director can see everything
    if (user.role === 'director' || user.role === 'admin' || user.role === 'system super admin') {
      return true;
    }
    // For now, Engineers can see everything except contracts
    if (docType === 'Contract') {
      return false;
    }
    return true;
  };

  const handleDownload = async (doc: DocType) => {
    if (!doc.path) {
      console.error("Download failed: Document path is missing.");
      toast({
        variant: "destructive",
        title: "Download Error",
        description: "Could not download the file because its path is missing.",
      });
      return;
    }
    setLoadingDoc(doc.id);
    try {
      const docRef = ref(storage, doc.path);
      const url = await getDownloadURL(docRef);
      
      const link = document.createElement('a');
      link.href = url;
      // Use original file name for download, or fall back to the display name
      link.download = doc.originalFileName || `${doc.name}.pdf`; 
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
    } catch (error) {
      console.error("Error getting download URL:", error);
      toast({
        variant: "destructive",
        title: "Download Failed",
        description: "Could not retrieve the file. See console for details.",
      });
    } finally {
      setLoadingDoc(null);
    }
  };
  
  const handleDelete = async (docToDelete: DocType) => {
    if (!firestore || !storage || !docToDelete.path) {
        toast({
            variant: "destructive",
            title: "Error",
            description: "Cannot delete document. Services not available.",
        });
        return;
    }

    setLoadingDoc(docToDelete.id);

    try {
        // 1. Delete from Firebase Storage
        const fileRef = ref(storage, docToDelete.path);
        await deleteObject(fileRef);

        // 2. Delete from Firestore
        const docRef = doc(firestore, 'projects', projectId, 'documents', docToDelete.id);
        await deleteDoc(docRef);
        
        toast({
            title: "Document Deleted",
            description: `"${docToDelete.originalFileName || docToDelete.name}" has been removed.`,
        });

    } catch (error) {
        console.error("Error deleting document:", error);
        toast({
            variant: "destructive",
            title: "Deletion Failed",
            description: "Could not delete the document. It may have already been removed.",
        });
    } finally {
        setLoadingDoc(null);
    }
  }


  if (!documents || documents.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-muted-foreground/30 bg-muted/20 p-12 text-center">
        <h3 className="text-lg font-semibold text-muted-foreground">No Documents Found</h3>
        <p className="mt-1 text-sm text-muted-foreground">This project does not have any documents yet. Upload one to get started.</p>
      </div>
    )
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Name</TableHead>
          <TableHead>Type</TableHead>
          <TableHead>Uploaded</TableHead>
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {documents.map(doc => (
          <TableRow key={doc.id}>
            <TableCell className="font-medium flex items-center gap-2">
                <FileText className="h-4 w-4 text-muted-foreground"/>
                {canView(doc.type) ? (doc.originalFileName || doc.name) : 'Restricted Document'}
            </TableCell>
            <TableCell>{doc.type}</TableCell>
            <TableCell>{format(parseISO(doc.uploadedAt), 'MMM dd, yyyy')}</TableCell>
            <TableCell className="text-right">
              {canView(doc.type) ? (
                <div className="flex justify-end gap-2">
                    <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => handleDownload(doc)}
                        disabled={loadingDoc === doc.id}
                        className="h-8"
                    >
                        {loadingDoc === doc.id && !(loadingDoc === doc.id) ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                            <Download className="mr-2 h-4 w-4" />
                        )}
                        Download
                    </Button>
                    {canManageDoc(doc.type) && (
                         <AlertDialog>
                            <AlertDialogTrigger asChild>
                                 <Button 
                                    variant="destructive" 
                                    size="icon" 
                                    disabled={loadingDoc === doc.id}
                                    className="h-8 w-8"
                                >
                                    {loadingDoc === doc.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                                </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                                <AlertDialogHeader>
                                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                                <AlertDialogDescription>
                                    This action cannot be undone. This will permanently delete the document
                                    <span className="font-bold"> "{doc.originalFileName || doc.name}"</span> from the server.
                                </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={() => handleDelete(doc)}>Delete</AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                    )}
                </div>
              ) : (
                <div className="flex items-center justify-end gap-2 text-muted-foreground">
                    <EyeOff className="h-4 w-4" />
                    <span>Restricted</span>
                </div>
              )}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
