
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
import { Textarea } from '@/components/ui/textarea';

interface UploadDocumentDialogProps {
  project: Project;
  onDocumentUploaded: (newDocument: DocType) => void;
}

// File size limit: 20MB
const MAX_FILE_SIZE = 20 * 1024 * 1024;
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
});

const documentTypes: DocType['type'][] = ['Blueprint', 'Contract', 'Permit', 'Report'];

export default function UploadDocumentDialog({ project, onDocumentUploaded }: UploadDocumentDialogProps) {
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState<string>('');
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

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    setFileError('');
    
    if (!file) {
      setSelectedFile(null);
      form.setValue('name', '');
      return;
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      setFileError('File size must be less than 20MB.');
      setSelectedFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    // Validate file type
    if (!ACCEPTED_FILE_TYPES.includes(file.type)) {
      setFileError('Only PDF, Word, Excel, and image files are accepted.');
      setSelectedFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }
    
    // Auto-fill the name field with the filename (without extension)
    const fileNameWithoutExt = file.name.split('.').slice(0, -1).join('.') || file.name;
    form.setValue('name', fileNameWithoutExt);
    setSelectedFile(file);
  };

  const handleRemoveFile = () => {
    setSelectedFile(null);
    setFileError('');
    form.setValue('name', '');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    // Validate file is selected
    if (!selectedFile) {
      setFileError('Please select a file to upload.');
      return;
    }

    setIsLoading(true);
    setUploadProgress(0);

    if (!firestore || !storage) {
        toast({ 
          variant: 'destructive', 
          title: 'Error', 
          description: 'Firebase not initialized. Please refresh the page.' 
        });
        setIsLoading(false);
        return;
    }

    if (!storage.app.options.storageBucket) {
        console.error('Storage bucket not configured!');
        toast({ 
          variant: 'destructive', 
          title: 'Configuration Error', 
          description: 'Storage bucket is not configured. Please check your Firebase settings.' 
        });
        setIsLoading(false);
        return;
    }

    const documentId = `doc-${Date.now()}`;
    const sanitizedFileName = selectedFile.name.replace(/[^a-zA-Z0-9.-]/g, '_');
    const storagePath = `projects/${project.id}/documents/${documentId}-${sanitizedFileName}`;
    
    const storageRef = ref(storage, storagePath);

    try {
        const uploadTask = uploadBytesResumable(storageRef, selectedFile);

        await new Promise<string>((resolve, reject) => {
          uploadTask.on(
            'state_changed',
            (snapshot) => {
              const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
              setUploadProgress(Math.round(progress));
            },
            (error) => {
              console.error("Upload error:", error);
              let errorMessage = 'Could not upload the document.';
              
              switch (error.code) {
                case 'storage/unauthorized':
                  errorMessage = 'You do not have permission to upload files. Please check your Firebase Storage rules.';
                  break;
                case 'storage/canceled':
                  errorMessage = 'Upload was canceled.';
                  break;
                case 'storage/unknown':
                  errorMessage = `An unknown error occurred. Please check your storage rules and configuration.`;
                  break;
                default:
                  errorMessage = `Upload failed: ${error.message}`;
              }
              
              reject(new Error(errorMessage));
            },
            async () => {
              try {
                const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
                resolve(downloadURL);
              } catch (urlError) {
                console.error("Error getting download URL:", urlError);
                reject(new Error('Upload succeeded but could not get file URL.'));
              }
            }
          );
        }).then(async (downloadURL) => {
          const newDocument: Omit<DocType, 'id'> = {
              name: values.name,
              originalFileName: selectedFile.name,
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
              description: `"${selectedFile.name}" has been added to the project.`,
          });

          setOpen(false);
          form.reset();
          handleRemoveFile();
          setUploadProgress(0);
        });

    } catch (error: any) {
        console.error("Error uploading document:", error);
        toast({
            variant: 'destructive',
            title: 'Upload Failed',
            description: error.message || 'Could not upload the document. Please try again.',
        });
    } finally {
        setIsLoading(false);
        setUploadProgress(0);
    }
  };

  const handleDialogChange = (isOpen: boolean) => {
    setOpen(isOpen);
    if (!isOpen) {
      form.reset();
      handleRemoveFile();
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
            Select a file and provide details for the new document. Max file size: 20MB.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                File
              </label>
              <div 
                className="relative flex items-center w-full rounded-md border border-input bg-background text-sm ring-offset-background cursor-pointer hover:bg-accent hover:text-accent-foreground"
                onClick={() => fileInputRef.current?.click()}
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  className="hidden"
                  accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png"
                  disabled={isLoading}
                  onChange={handleFileChange}
                />
                <div className="flex items-center gap-2 pl-3 py-2 flex-1 min-w-0">
                  <File className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  <span className="text-muted-foreground break-words whitespace-normal leading-tight">
                    {selectedFile ? selectedFile.name : 'Click to choose a file...'}
                  </span>
                </div>
                {selectedFile && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 mr-2 text-destructive flex-shrink-0"
                    disabled={isLoading}
                    onClick={(e) => { e.stopPropagation(); handleRemoveFile(); }}
                  >
                    <X className="h-4 w-4"/>
                  </Button>
                )}
              </div>
              {fileError && <p className="text-sm font-medium text-destructive">{fileError}</p>}
            </div>

            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Document Name</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="e.g., Q3 Financial Report" 
                      disabled={isLoading}
                      rows={2}
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
