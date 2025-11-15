
'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { defaultProjectStatuses } from '@/lib/data';
import { ProjectStatus, ProjectStatusCategory } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { PlusCircle, Edit, Trash2, GripVertical, Check, X, RotateCcw } from 'lucide-react';
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
} from "@/components/ui/alert-dialog";
import { useAuth } from '@/hooks/use-auth';
import { useFirestore, updateDocumentNonBlocking } from '@/firebase';
import { doc } from 'firebase/firestore';

const statusCategories: ProjectStatusCategory[] = ['Not Started', 'In Progress', 'On Hold', 'Completed', 'Cancelled'];

const formSchema = z.object({
  name: z.string().min(2, 'Status name must be at least 2 characters.'),
  category: z.enum(statusCategories),
});

type FormValues = z.infer<typeof formSchema>;

export default function StatusManager() {
  const { company, setCompany } = useAuth();
  const firestore = useFirestore();
  const [statuses, setStatuses] = useState<ProjectStatus[]>([]);
  const [editingStatus, setEditingStatus] = useState<ProjectStatus | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (company) {
      setStatuses(company.projectStatuses || defaultProjectStatuses);
    }
  }, [company]);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      category: 'In Progress',
    },
  });
  
  const updateStatusesInFirestore = (updatedStatuses: ProjectStatus[]) => {
    if (!firestore || !company) return;
    const companyDocRef = doc(firestore, 'companies', company.id);
    updateDocumentNonBlocking(companyDocRef, { projectStatuses: updatedStatuses });
    setCompany({ ...company, projectStatuses: updatedStatuses });
  };

  const handleEditClick = (status: ProjectStatus) => {
    setEditingStatus(status);
    form.reset({
      name: status.name,
      category: status.category,
    });
  };

  const handleCancelEdit = () => {
    setEditingStatus(null);
    form.reset({ name: '', category: 'In Progress' });
  };

  const onSubmit = (values: FormValues) => {
    let updatedStatuses;
    if (editingStatus) {
      updatedStatuses = statuses.map(s =>
        s.id === editingStatus.id ? { ...s, name: values.name, category: values.category } : s
      );
      toast({ title: 'Status Updated', description: `"${values.name}" has been successfully updated.` });
    } else {
      const newStatus: ProjectStatus = {
        id: `status-${Date.now()}`,
        name: values.name,
        category: values.category,
      };
      updatedStatuses = [...statuses, newStatus];
      toast({ title: 'Status Added', description: `"${newStatus.name}" has been added.` });
    }

    updateStatusesInFirestore(updatedStatuses);
    handleCancelEdit();
  };
  
  const handleDelete = (statusId: string) => {
    const isDefault = defaultProjectStatuses.some(ds => ds.id === statusId);
    if (isDefault) {
      toast({
        variant: 'destructive',
        title: 'Deletion Failed',
        description: 'You cannot delete a default system status.',
      });
      return;
    }
    
    const updatedStatuses = statuses.filter(s => s.id !== statusId);
    updateStatusesInFirestore(updatedStatuses);
    toast({ title: 'Status Deleted', description: 'The status has been successfully removed.' });
  }

  const handleReset = () => {
    updateStatusesInFirestore(defaultProjectStatuses);
    toast({ title: 'Statuses Reset', description: 'Your project statuses have been reset to the defaults.' });
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
            <div>
                <CardTitle>Project Status Settings</CardTitle>
                <CardDescription>
                  Customize project statuses used across your workspace. Changes apply to all projects.
                </CardDescription>
            </div>
            <AlertDialog>
                <AlertDialogTrigger asChild>
                    <Button variant="outline" size="sm"><RotateCcw className="mr-2 h-4 w-4"/> Reset to Default</Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                    <AlertDialogHeader>
                    <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                        This will reset all project statuses to their default settings. This action cannot be undone.
                    </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleReset}>Reset</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <ul className="space-y-2">
            {statuses.map(status => (
                <li key={status.id} className="flex items-center gap-2 rounded-md border bg-muted/20 p-2">
                    <GripVertical className="h-5 w-5 text-muted-foreground" />
                    {editingStatus?.id === status.id ? (
                        <Form {...form}>
                          <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-1 items-center gap-2">
                             <FormField
                                control={form.control}
                                name="name"
                                render={({ field }) => (
                                <FormItem className="flex-1">
                                    <FormControl><Input {...field} /></FormControl>
                                    <FormMessage className="text-xs" />
                                </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="category"
                                render={({ field }) => (
                                <FormItem>
                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <FormControl><SelectTrigger className="w-40" /></FormControl>
                                    <SelectContent>
                                        {statusCategories.map(cat => <SelectItem key={cat} value={cat}>{cat}</SelectItem>)}
                                    </SelectContent>
                                    </Select>
                                </FormItem>
                                )}
                            />
                             <Button type="submit" size="icon" variant="ghost" className="text-green-600 hover:text-green-700"><Check className="h-4 w-4" /></Button>
                             <Button type="button" size="icon" variant="ghost" onClick={handleCancelEdit} className="text-red-600 hover:text-red-700"><X className="h-4 w-4" /></Button>
                          </form>
                        </Form>
                    ) : (
                        <>
                            <div className="flex-1">
                                <span className="font-medium">{status.name}</span>
                                <span className="ml-2 text-xs text-muted-foreground">({status.category})</span>
                            </div>
                            <Button variant="ghost" size="icon" onClick={() => handleEditClick(status)}>
                                <Edit className="h-4 w-4" />
                            </Button>
                            <AlertDialog>
                                <AlertDialogTrigger asChild>
                                    <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive/80" disabled={defaultProjectStatuses.some(ds => ds.id === status.id)}>
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                    <AlertDialogHeader>
                                    <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                        This will permanently delete the "{status.name}" status. This action cannot be undone.
                                    </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction onClick={() => handleDelete(status.id)}>Delete</AlertDialogAction>
                                    </AlertDialogFooter>
                                </AlertDialogContent>
                            </AlertDialog>
                        </>
                    )}
                </li>
            ))}
        </ul>

         {!editingStatus && (
            <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="flex items-start gap-2 rounded-md border p-2">
                <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                    <FormItem className="flex-1">
                        <FormLabel className="sr-only">New Status Name</FormLabel>
                        <FormControl><Input placeholder="New status name..." {...field} /></FormControl>
                        <FormMessage className="text-xs" />
                    </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="category"
                    render={({ field }) => (
                    <FormItem>
                        <FormLabel className="sr-only">Status Category</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                            <SelectTrigger className="w-40">
                                <SelectValue placeholder="Select category..." />
                            </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                             {statusCategories.map(cat => <SelectItem key={cat} value={cat}>{cat}</SelectItem>)}
                        </SelectContent>
                        </Select>
                    </FormItem>
                    )}
                />
                <Button type="submit">
                    <PlusCircle className="mr-2 h-4 w-4" /> Add Status
                </Button>
            </form>
            </Form>
        )}
      </CardContent>
    </Card>
  );
}
