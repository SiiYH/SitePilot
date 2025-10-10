'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PlusCircle, Loader2, Upload, File as FileIcon } from 'lucide-react';
import { Project, Document as DocType } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { useFirestore, useStorage, errorEmitter, FirestorePermissionError } from '@/firebase';
import { doc, updateDoc, arrayUnion } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

interface UploadDocumentDialogProps {
  project: Project;
  onDocumentUploaded: (newDocument: DocType) => void;
}

const formSchema = z.object({
  name: z.string().min(3, 'Document name must be at least 3 characters.'),
  type: z.enum(['Blueprint', 'Contract', 'Permit', 'Report']),
  file: z.instanceof(File, { message: "A file is required." }),
});

const documentTypes: DocType['type'][] = ['Blueprint', 'Contract', 'Permit', 'Report'];

export default function UploadDocumentDialog({ project, onDocumentUploaded }: UploadDocumentDialogProps) {
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const firestore = useFirestore();
  const storage = useStorage();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      type: 'Report',
    },
  });

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setIsLoading(true);

    const file = values.file;
    if (!file) {
        toast({ variant: 'destructive', title: 'No file selected' });
        setIsLoading(false);
        return;
    }

    const documentId = `doc-${Date.now()}`;
    const storageRef = ref(storage, `projects/${project.id}/documents/${documentId}-${file.name}`);

    try {
        const snapshot = await uploadBytes(storageRef, file);
        const downloadURL = await getDownloadURL(snapshot.ref);

        const newDocument: DocType = {
            id: documentId,
            name: values.name,
            url: downloadURL,
            type: values.type,
            uploadedAt: new Date().toISOString(),
        };

        const projectDocRef = doc(firestore, 'projects', project.id);
        
        await updateDoc(projectDocRef, {
            documents: arrayUnion(newDocument)
        }).catch((serverError) => {
            const permissionError = new FirestorePermissionError({
              path: projectDocRef.path,
              operation: 'update',
              requestResourceData: { documents: '...' }, // Don't send full array
            });
            errorEmitter.emit('permission-error', permissionError);
            throw permissionError;
        });

        onDocumentUploaded(newDocument);
        
        toast({
            title: 'Document Uploaded',
            description: `"${values.name}" has been added to the project.`,
        });

        setOpen(false);
        form.reset();

    } catch (error) {
        if (!(error instanceof FirestorePermissionError)) {
             console.error("Error uploading document:", error);
            toast({
                variant: 'destructive',
                title: 'Upload Failed',
                description: 'Could not upload the document. Please check console for details.',
            });
        }
    } finally {
        setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <PlusCircle className="mr-2 h-4 w-4" />
          Upload Document
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Upload New Document</DialogTitle>
          <DialogDescription>Select a file and provide details for the new document.</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Document Name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Q3 Financial Report" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Document Type</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {documentTypes.map(type => (
                        <SelectItem key={type} value={type}>{type}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="file"
              render={({ field: { onChange, value, ...rest } }) => (
                <FormItem>
                  <FormLabel>File</FormLabel>
                  <FormControl>
                    <Input
                      type="file"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        onChange(file);
                      }}
                      {...rest}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter className="pt-4">
              <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Upload Document
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
