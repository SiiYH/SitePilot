
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
import { PlusCircle, Edit, Trash2, GripVertical, Check, X } from 'lucide-react';
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

const STORAGE_KEY = 'sitepilot-project-statuses';

const statusCategories: ProjectStatusCategory[] = ['Not Started', 'In Progress', 'On Hold', 'Completed', 'Cancelled'];

const formSchema = z.object({
  name: z.string().min(2, 'Status name must be at least 2 characters.'),
  category: z.enum(statusCategories),
});

type FormValues = z.infer<typeof formSchema>;

export default function StatusManager() {
  const [statuses, setStatuses] = useState<ProjectStatus[]>([]);
  const [editingStatus, setEditingStatus] = useState<ProjectStatus | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    const storedStatuses = localStorage.getItem(STORAGE_KEY);
    if (storedStatuses) {
      setStatuses(JSON.parse(storedStatuses));
    } else {
      setStatuses(defaultProjectStatuses);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(defaultProjectStatuses));
    }
  }, []);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      category: 'In Progress',
    },
  });

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
      // Editing existing status
      updatedStatuses = statuses.map(s =>
        s.id === editingStatus.id ? { ...s, name: values.name, category: values.category } : s
      );
      toast({ title: 'Status Updated', description: `"${values.name}" has been successfully updated.` });
    } else {
      // Adding new status
      const newStatus: ProjectStatus = {
        id: values.name.toLowerCase().replace(/ /g, '-'),
        name: values.name,
        category: values.category,
      };
      updatedStatuses = [...statuses, newStatus];
      toast({ title: 'Status Added', description: `"${newStatus.name}" has been added.` });
    }

    setStatuses(updatedStatuses);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedStatuses));
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
    setStatuses(updatedStatuses);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedStatuses));
    toast({ title: 'Status Deleted', description: 'The status has been successfully removed.' });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Project Status Options</CardTitle>
        <CardDescription>
          Customize the project statuses used across your workspace. Changes will apply to all projects.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <ul className="space-y-2">
            {statuses.map(status => (
                <li key={status.id} className="flex items-center gap-2 rounded-md border bg-muted/20 p-2 flex-wrap">
                    <GripVertical className="h-5 w-5 text-muted-foreground hidden sm:block" />
                    {editingStatus?.id === status.id ? (
                        <Form {...form}>
                          <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-1 flex-col sm:flex-row items-stretch sm:items-center gap-2">
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
                                    <FormControl><SelectTrigger className="w-full sm:w-40" /></FormControl>
                                    <SelectContent>
                                        {statusCategories.map(cat => <SelectItem key={cat} value={cat}>{cat}</SelectItem>)}
                                    </SelectContent>
                                    </Select>
                                </FormItem>
                                )}
                            />
                            <div className="flex justify-end gap-2">
                                <Button type="submit" size="icon" variant="ghost" className="text-green-600 hover:text-green-700"><Check className="h-4 w-4" /></Button>
                                <Button type="button" size="icon" variant="ghost" onClick={handleCancelEdit} className="text-red-600 hover:text-red-700"><X className="h-4 w-4" /></Button>
                            </div>
                          </form>
                        </Form>
                    ) : (
                        <>
                            <div className="flex-1 min-w-0">
                                <span className="font-medium">{status.name}</span>
                                <span className="ml-2 text-xs text-muted-foreground">({status.category})</span>
                            </div>
                            <div className="flex items-center">
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
                            </div>
                        </>
                    )}
                </li>
            ))}
        </ul>

         {!editingStatus && (
            <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col sm:flex-row items-stretch sm:items-start gap-2 rounded-md border p-2">
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
                    <FormItem className="w-full sm:w-auto">
                        <FormLabel className="sr-only">Status Category</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                            <SelectTrigger className="w-full sm:w-40">
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
                <Button type="submit" className="w-full sm:w-auto">
                    <PlusCircle className="mr-2 h-4 w-4" /> Add Status
                </Button>
            </form>
            </Form>
        )}
      </CardContent>
    </Card>
  );
}
