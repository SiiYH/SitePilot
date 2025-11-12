'use client';

import { useState, useRef } from 'react';
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
import { PlusCircle, Loader2, File, Upload, X } from 'lucide-react';
import { Project, Document as DocType } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { useFirestore, useStorage, setDocumentNonBlocking } from '@/firebase';
import { doc } from 'firebase/firestore';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';

interface UploadDocumentDialogProps {
  project: Project;
  onDocumentUploaded: (newDocument: DocType) => void;
}

// File size limit: 10MB
const MAX_FILE_SIZE = 10 * 1024 * 1024;
const ACCEPTED_FILE_TYPES = [
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/jpg',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
];

const formSchema = z.object({
  name: z.string().min(3, 'Document name must be at least 3 characters.'),
  type: z.enum(['Blueprint', 'Contract', 'Permit', 'Report']),
  file: z
    .instanceof(File, { message: "A file is required." })
    .refine((file) => file.size <= MAX_FILE_SIZE, 'File size must be less than 10MB.')
    .refine(
      (file) => ACCEPTED_FILE_TYPES.includes(file.type),
      'Only PDF, Word, Excel, and image files are accepted.'
    ),
});

const documentTypes: DocType['type'][] = ['Blueprint', 'Contract', 'Permit', 'Report'];

export default function UploadDocumentDialog({ project, onDocumentUploaded }: UploadDocumentDialogProps) {
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const { toast } = useToast();
  const firestore = useFirestore();
  const storage = useStorage();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      type: 'Report',
    },
  });

  const selectedFile = form.watch('file');

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setIsLoading(true);
    setUploadProgress(0);

    const file = values.file;
    
    // Validation checks
    if (!file) {
        toast({ 
          variant: 'destructive', 
          title: 'Error', 
          description: 'No file selected.' 
        });
        setIsLoading(false);
        return;
    }

    if (!firestore || !storage) {
        toast({ 
          variant: 'destructive', 
          title: 'Error', 
          description: 'Firebase not initialized. Please refresh the page.' 
        });
        setIsLoading(false);
        return;
    }

    const documentId = `doc-${Date.now()}`;
    const sanitizedFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
    const storageRef = ref(storage, `projects/${project.id}/documents/${documentId}-${sanitizedFileName}`);

    const uploadTask = uploadBytesResumable(storageRef, file);

    uploadTask.on(
      'state_changed',
      (snapshot) => {
        const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
        setUploadProgress(Math.round(progress));
      },
      (error) => {
        console.error("Upload error:", error);
        toast({
          variant: 'destructive',
          title: 'Upload Failed',
          description: error.message,
        });
        setIsLoading(false);
        setUploadProgress(0);
      },
      async () => {
        try {
          const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
          const newDocument: Omit<DocType, 'id'> = {
              name: values.name,
              path: storageRef.fullPath,
              url: downloadURL,
              type: values.type,
              uploadedAt: new Date().toISOString(),
          };

          const documentDocRef = doc(firestore, 'projects', project.id, 'documents', documentId);
          await setDocumentNonBlocking(documentDocRef, newDocument);

          onDocumentUploaded({ ...newDocument, id: documentId });
          
          toast({
              title: 'Document Uploaded',
              description: `"${values.name}" has been added to the project.`,
          });

        } catch (error) {
           console.error("Error creating Firestore document:", error);
            toast({
                variant: 'destructive',
                title: 'Save Failed',
                description: 'File uploaded, but failed to save document record.',
            });
        } finally {
            setIsLoading(false);
            setOpen(false);
            form.reset();
            setUploadProgress(0);
        }
      }
    );
  };

  const handleDialogChange = (isOpen: boolean) => {
    setOpen(isOpen);
    if (!isOpen) {
      form.reset();
      setUploadProgress(0);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleDialogChange}>
      <DialogTrigger asChild>
        <Button>
          <PlusCircle className="mr-2 h-4 w-4" />
          Upload Document
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Upload New Document</DialogTitle>
          <DialogDescription>
            Select a file and provide details for the new document. Max file size: 10MB.
          </DialogDescription>
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
                    <Input 
                      placeholder="e.g., Q3 Financial Report" 
                      disabled={isLoading}
                      {...field} 
                    />
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
                  <Select 
                    onValueChange={field.onChange} 
                    defaultValue={field.value}
                    disabled={isLoading}
                  >
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
              render={({ field: { onChange, value, ...fieldProps } }) => (
                <FormItem>
                  <FormLabel>File</FormLabel>
                  <FormControl>
                    <div>
                        <input
                            type="file"
                            ref={fileInputRef}
                            className="hidden"
                            accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png"
                            disabled={isLoading}
                            onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) onChange(file);
                            }}
                            {...fieldProps}
                        />
                        {!selectedFile ? (
                             <Button
                                type="button"
                                variant="outline"
                                className="w-full"
                                disabled={isLoading}
                                onClick={() => fileInputRef.current?.click()}
                            >
                                <Upload className="mr-2 h-4 w-4" />
                                Choose File
                            </Button>
                        ) : (
                            <div className="space-y-2">
                              <div className="flex items-center justify-between rounded-md border p-2">
                                  <div className="flex items-center gap-2 truncate">
                                      <File className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                                      <span className="text-sm truncate">{selectedFile.name}</span>
                                      <span className="text-xs text-muted-foreground flex-shrink-0">
                                        ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
                                      </span>
                                  </div>
                                  <Button
                                      type="button"
                                      variant="ghost"
                                      size="icon"
                                      className="h-7 w-7 text-destructive flex-shrink-0"
                                      disabled={isLoading}
                                      onClick={() => {
                                          onChange(undefined);
                                          if (fileInputRef.current) fileInputRef.current.value = "";
                                      }}
                                  >
                                      <X className="h-4 w-4"/>
                                  </Button>
                              </div>
                              {isLoading && uploadProgress > 0 && (
                                <div className="space-y-1">
                                  <div className="flex justify-between text-xs text-muted-foreground">
                                    <span>Uploading...</span>
                                    <span>{uploadProgress}%</span>
                                  </div>
                                  <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
                                    <div 
                                      className="h-full bg-primary transition-all duration-300"
                                      style={{ width: `${uploadProgress}%` }}
                                    />
                                  </div>
                                </div>
                              )}
                            </div>
                        )}
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter className="pt-4">
              <Button 
                type="button" 
                variant="ghost" 
                onClick={() => handleDialogChange(false)}
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading || !selectedFile}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isLoading ? 'Uploading...' : 'Upload Document'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
