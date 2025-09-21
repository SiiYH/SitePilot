'use client';
import { Document as DocType, User } from '@/types';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Download, FileText, EyeOff } from 'lucide-react';
import { format } from 'date-fns';

interface DocumentsListProps {
  documents: DocType[];
  user: User;
}

export default function DocumentsList({ documents, user }: DocumentsListProps) {
  const canView = (docType: DocType['type']) => {
    if (docType === 'Contract' && user.role !== 'Director') {
      return false;
    }
    return true;
  };

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
            <TableCell>{format(new Date(doc.uploadedAt), 'MMM dd, yyyy')}</TableCell>
            <TableCell className="text-right">
              {canView(doc.type) ? (
                <Button variant="outline" size="sm">
                  <Download className="mr-2 h-4 w-4" />
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
