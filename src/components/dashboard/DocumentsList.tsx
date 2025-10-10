'use client';
import { Document as DocType, User } from '@/types';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Download, FileText, EyeOff, Loader2 } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { useStorage } from '@/firebase';
import { ref, getDownloadURL } from 'firebase/storage';
import { useState } from 'react';

interface DocumentsListProps {
  documents: DocType[];
  user: User;
}

export default function DocumentsList({ documents, user }: DocumentsListProps) {
  const storage = useStorage();
  const [loadingDoc, setLoadingDoc] = useState<string | null>(null);

  const canView = (docType: DocType['type']) => {
    // Director can see everything
    if (user.role === 'Director' || user.role === 'Admin' || user.role === 'System Super Admin') {
      return true;
    }
    // For now, Engineers can see everything except contracts
    if (docType === 'Contract') {
      return false;
    }
    return true;
  };

  const handleDownload = async (docPath: string) => {
    setLoadingDoc(docPath);
    try {
      const docRef = ref(storage, docPath);
      const url = await getDownloadURL(docRef);
      window.open(url, '_blank');
    } catch (error) {
      console.error("Error getting download URL:", error);
      // You might want to show a toast message to the user here
    } finally {
      setLoadingDoc(null);
    }
  };


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
                {canView(doc.type) ? doc.name : 'Restricted Document'}
            </TableCell>
            <TableCell>{doc.type}</TableCell>
            <TableCell>{format(parseISO(doc.uploadedAt), 'MMM dd, yyyy')}</TableCell>
            <TableCell className="text-right">
              {canView(doc.type) ? (
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => handleDownload(doc.path)}
                  disabled={loadingDoc === doc.path}
                >
                  {loadingDoc === doc.path ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Download className="mr-2 h-4 w-4" />
                  )}
                  Download
                </Button>
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
