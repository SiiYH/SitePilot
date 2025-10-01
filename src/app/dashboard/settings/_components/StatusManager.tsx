'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
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

// Types
type ProjectStatusCategory = 'Not Started' | 'In Progress' | 'On Hold' | 'Completed' | 'Cancelled';

interface ProjectStatus {
  id: string;
  name: string;
  category: ProjectStatusCategory;
}

// Default statuses - used only for initial setup or reset
const defaultProjectStatuses: ProjectStatus[] = [
  { id: 'not-started', name: 'Not Started', category: 'Not Started' },
  { id: 'planning', name: 'Planning', category: 'In Progress' },
  { id: 'in-progress', name: 'In Progress', category: 'In Progress' },
  { id: 'on-hold', name: 'On Hold', category: 'On Hold' },
  { id: 'completed', name: 'Completed', category: 'Completed' },
  { id: 'cancelled', name: 'Cancelled', category: 'Cancelled' },
];

const STORAGE_KEY = 'sitepilot-project-statuses';
const statusCategories: ProjectStatusCategory[] = ['Not Started', 'In Progress', 'On Hold', 'Completed', 'Cancelled'];

const formSchema = z.object({
  name: z.string().min(2, 'Status name must be at least 2 characters.').max(50, 'Status name is too long.'),
  category: z.enum(['Not Started', 'In Progress', 'On Hold', 'Completed', 'Cancelled']),
});

type FormValues = z.infer<typeof formSchema>;

export default function StatusManager() {
  const [statuses, setStatuses] = useState<ProjectStatus[]>([]);
  const [editingStatus, setEditingStatus] = useState<ProjectStatus | null>(null);
  const { toast } = useToast();

  // Initialize statuses from localStorage or use defaults
  useEffect(() => {
    const storedStatuses = localStorage.getItem(STORAGE_KEY);
    if (storedStatuses) {
      try {
        const parsed = JSON.parse(storedStatuses);
        setStatuses(parsed);
      } catch (e) {
        console.error('Failed to parse stored statuses:', e);
        setStatuses(defaultProjectStatuses);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(defaultProjectStatuses));
      }
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
    // Check for duplicate names
    const duplicateExists = statuses.some(s => 
      s.name.toLowerCase() === values.name.toLowerCase() && 
      s.id !== editingStatus?.id
    );

    if (duplicateExists) {
      toast({
        variant: 'destructive',
        title: 'Duplicate Status',
        description: 'A status with this name already exists.',
      });
      return;
    }

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
        id: `status-${Date.now()}-${values.name.toLowerCase().replace(/\s+/g, '-')}`,
        name: values.name,
        category: values.category,
      };
      updatedStatuses = [...statuses, newStatus];
      toast({ title: 'Status Added', description: `"${newStatus.name}" has been added successfully.` });
    }

    setStatuses(updatedStatuses);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedStatuses));
    handleCancelEdit();
  };
  
  const handleDelete = (statusId: string) => {
    const statusToDelete = statuses.find(s => s.id === statusId);
    if (!statusToDelete) return;

    // Prevent deleting the last status
    if (statuses.length === 1) {
      toast({
        variant: 'destructive',
        title: 'Cannot Delete',
        description: 'You must have at least one status.',
      });
      return;
    }
    
    const updatedStatuses = statuses.filter(s => s.id !== statusId);
    setStatuses(updatedStatuses);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedStatuses));
    toast({ 
      title: 'Status Deleted', 
      description: `"${statusToDelete.name}" has been successfully removed.` 
    });
  };

  const resetToDefaults = () => {
    setStatuses(defaultProjectStatuses);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(defaultProjectStatuses));
    setEditingStatus(null);
    form.reset({ name: '', category: 'In Progress' });
    toast({
      title: 'Reset Complete',
      description: 'All statuses have been reset to defaults.',
    });
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-4">
          <div>
            <CardTitle>Project Status Options</CardTitle>
            <CardDescription>
              Customize all project statuses for your workspace. Add, edit, or remove statuses as needed.
            </CardDescription>
          </div>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="outline" size="sm">
                <RotateCcw className="mr-2 h-4 w-4" />
                Reset to Defaults
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Reset to Default Statuses?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will replace all current statuses with the default set. Any custom statuses will be lost. This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={resetToDefaults}>Reset</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-medium">Current Statuses</h3>
            <span className="text-xs text-muted-foreground">{statuses.length} status{statuses.length !== 1 ? 'es' : ''}</span>
          </div>
          <ul className="space-y-2">
            {statuses.map(status => (
              <li key={status.id} className="flex items-center gap-2 rounded-md border bg-background p-2 flex-wrap hover:bg-muted/30 transition-colors">
                <GripVertical className="h-5 w-5 text-muted-foreground hidden sm:block" />
                {editingStatus?.id === status.id ? (
                  <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-1 flex-col sm:flex-row items-stretch sm:items-center gap-2">
                      <FormField
                        control={form.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem className="flex-1">
                            <FormControl><Input {...field} autoFocus /></FormControl>
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
                              <FormControl>
                                <SelectTrigger className="w-full sm:w-40">
                                  <SelectValue />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {statusCategories.map(cat => <SelectItem key={cat} value={cat}>{cat}</SelectItem>)}
                              </SelectContent>
                            </Select>
                          </FormItem>
                        )}
                      />
                      <div className="flex justify-end gap-1">
                        <Button type="submit" size="icon" variant="ghost" className="text-green-600 hover:text-green-700 hover:bg-green-50">
                          <Check className="h-4 w-4" />
                        </Button>
                        <Button type="button" size="icon" variant="ghost" onClick={handleCancelEdit} className="text-red-600 hover:text-red-700 hover:bg-red-50">
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </form>
                  </Form>
                ) : (
                  <>
                    <div className="flex-1 min-w-0">
                      <span className="font-medium">{status.name}</span>
                      <span className="ml-2 text-xs text-muted-foreground">({status.category})</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button variant="ghost" size="icon" onClick={() => handleEditClick(status)} title="Edit status">
                        <Edit className="h-4 w-4" />
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="text-destructive hover:text-destructive hover:bg-destructive/10"
                            disabled={statuses.length === 1}
                            title={statuses.length === 1 ? "Cannot delete last status" : "Delete status"}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete Status?</AlertDialogTitle>
                            <AlertDialogDescription>
                              This will permanently delete the "{status.name}" status. Projects using this status may need to be updated. This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleDelete(status.id)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </>
                )}
              </li>
            ))}
          </ul>
        </div>

        {!editingStatus && (
          <div>
            <h3 className="text-sm font-medium mb-3">Add New Status</h3>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col sm:flex-row items-stretch sm:items-start gap-2 rounded-md border p-3 bg-muted/20">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem className="flex-1">
                      <FormLabel className="sr-only">New Status Name</FormLabel>
                      <FormControl><Input placeholder="Enter status name..." {...field} /></FormControl>
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
          </div>
        )}
      </CardContent>
    </Card>
  );
}