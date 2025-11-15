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
import { PlusCircle, Edit, Trash2, Check, X, RotateCcw, Shield } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
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

// Category color mapping for visual distinction
const categoryColors: Record<ProjectStatusCategory, string> = {
  'Not Started': 'bg-slate-100 text-slate-700 border-slate-200',
  'In Progress': 'bg-blue-100 text-blue-700 border-blue-200',
  'On Hold': 'bg-amber-100 text-amber-700 border-amber-200',
  'Completed': 'bg-green-100 text-green-700 border-green-200',
  'Cancelled': 'bg-red-100 text-red-700 border-red-200',
};

const formSchema = z.object({
  name: z.string().min(2, 'Status name must be at least 2 characters.').max(50, 'Status name is too long.'),
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
    const isDefault = defaultProjectStatuses.some(ds => ds.id === status.id);
    if (isDefault) {
      toast({
        variant: 'destructive',
        title: 'Cannot Edit',
        description: 'Standard statuses cannot be edited. You can create custom statuses instead.',
      });
      return;
    }
    
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
    // Check for duplicates
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
      updatedStatuses = statuses.map(s =>
        s.id === editingStatus.id ? { ...s, name: values.name, category: values.category } : s
      );
      toast({ title: 'Status Updated', description: `"${values.name}" has been successfully updated.` });
    } else {
      const newStatus: ProjectStatus = {
        id: `status-${Date.now()}-${values.name.toLowerCase().replace(/\s+/g, '-')}`,
        name: values.name,
        category: values.category,
      };
      updatedStatuses = [...statuses, newStatus];
      toast({ title: 'Status Added', description: `"${newStatus.name}" has been added successfully.` });
    }

    setStatuses(updatedStatuses);
    updateStatusesInFirestore(updatedStatuses);
    handleCancelEdit();
  };
  
  const handleDelete = (statusId: string) => {
    const isDefault = defaultProjectStatuses.some(ds => ds.id === statusId);
    const statusToDelete = statuses.find(s => s.id === statusId);
    
    if (isDefault) {
      toast({
        variant: 'destructive',
        title: 'Cannot Delete',
        description: 'Standard statuses cannot be deleted.',
      });
      return;
    }
    
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
    updateStatusesInFirestore(updatedStatuses);
    toast({ 
      title: 'Status Deleted', 
      description: `"${statusToDelete?.name}" has been successfully removed.` 
    });
  }

  const handleReset = () => {
    setStatuses(defaultProjectStatuses);
    updateStatusesInFirestore(defaultProjectStatuses);
    setEditingStatus(null);
    form.reset({ name: '', category: 'In Progress' });
    toast({ 
      title: 'Reset Complete', 
      description: 'All statuses have been reset to defaults.' 
    });
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div>
            <CardTitle>Project Status Management</CardTitle>
            <CardDescription>
              Customize statuses for your workspace projects. Statuses are organized into workflow categories.
            </CardDescription>
          </div>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="outline" size="sm" className="shrink-0">
                <RotateCcw className="mr-2 h-4 w-4"/> Reset to Defaults
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Reset to Default Settings?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will replace all current statuses with the default set. All custom statuses will be lost. This action cannot be undone.
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
        {/* Current Statuses - Grouped by Category */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold">Current Statuses</h3>
            <Badge variant="secondary" className="font-normal">
              {statuses.length} total
            </Badge>
          </div>
          
          <div className="space-y-6">
            {statusCategories.map(category => {
              const categoryStatuses = statuses.filter(s => s.category === category);
              
              return (
                <div key={category} className="space-y-2">
                  {/* Category Header */}
                  <div className="flex items-center gap-2 pb-2">
                    <div className={`h-1 w-1 rounded-full ${categoryColors[category].split(' ')[0]}`} />
                    <h4 className="text-sm font-medium text-muted-foreground">{category}</h4>
                    <Badge variant="outline" className="text-xs font-normal">
                      {categoryStatuses.length}
                    </Badge>
                  </div>
                  
                  {/* Statuses in Category */}
                  {categoryStatuses.length > 0 ? (
                    <ul className="space-y-2 pl-3 border-l-2 border-muted ml-1">
                      {categoryStatuses.map(status => {
                        const isStandard = defaultProjectStatuses.some(ds => ds.id === status.id);
                        
                        return (
                          <li 
                            key={status.id} 
                            className={`rounded-lg border transition-colors ${
                              editingStatus?.id === status.id 
                                ? 'bg-muted/50 border-primary/50' 
                                : 'bg-card hover:bg-muted/30'
                            }`}
                          >
                            {editingStatus?.id === status.id ? (
                              <Form {...form}>
                                <form onSubmit={form.handleSubmit(onSubmit)} className="p-3">
                                  <div className="flex flex-col sm:flex-row items-stretch sm:items-start gap-2">
                                    <FormField
                                      control={form.control}
                                      name="name"
                                      render={({ field }) => (
                                        <FormItem className="flex-1">
                                          <FormControl>
                                            <Input {...field} autoFocus placeholder="Status name..." />
                                          </FormControl>
                                          <FormMessage className="text-xs" />
                                        </FormItem>
                                      )}
                                    />
                                    <FormField
                                      control={form.control}
                                      name="category"
                                      render={({ field }) => (
                                        <FormItem className="w-full sm:w-44">
                                          <Select onValueChange={field.onChange} value={field.value}>
                                            <FormControl>
                                              <SelectTrigger>
                                                <SelectValue />
                                              </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                              {statusCategories.map(cat => (
                                                <SelectItem key={cat} value={cat}>
                                                  {cat}
                                                </SelectItem>
                                              ))}
                                            </SelectContent>
                                          </Select>
                                          <FormMessage className="text-xs" />
                                        </FormItem>
                                      )}
                                    />
                                    <div className="flex gap-1 justify-end sm:justify-start">
                                      <Button 
                                        type="submit" 
                                        size="icon" 
                                        variant="ghost" 
                                        className="text-green-600 hover:text-green-700 hover:bg-green-50"
                                      >
                                        <Check className="h-4 w-4" />
                                      </Button>
                                      <Button 
                                        type="button" 
                                        size="icon" 
                                        variant="ghost" 
                                        onClick={handleCancelEdit} 
                                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                      >
                                        <X className="h-4 w-4" />
                                      </Button>
                                    </div>
                                  </div>
                                </form>
                              </Form>
                            ) : (
                              <div className="flex items-center gap-3 p-3">
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <span className="font-medium">{status.name}</span>
                                    {isStandard && (
                                      <Badge variant="secondary" className="text-xs gap-1">
                                        <Shield className="h-3 w-3" />
                                        Standard
                                      </Badge>
                                    )}
                                  </div>
                                </div>
                                <div className="flex items-center gap-1 shrink-0">
                                  <Button 
                                    variant="ghost" 
                                    size="icon" 
                                    onClick={() => handleEditClick(status)}
                                    disabled={isStandard}
                                    title={isStandard ? "Standard statuses cannot be edited" : "Edit status"}
                                    className="h-8 w-8"
                                  >
                                    <Edit className="h-4 w-4" />
                                  </Button>
                                  <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                      <Button 
                                        variant="ghost" 
                                        size="icon" 
                                        className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                                        disabled={isStandard || statuses.length === 1}
                                        title={
                                          isStandard 
                                            ? "Standard statuses cannot be deleted" 
                                            : statuses.length === 1 
                                              ? "Cannot delete last status" 
                                              : "Delete status"
                                        }
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
                                        <AlertDialogAction 
                                          onClick={() => handleDelete(status.id)}
                                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                        >
                                          Delete
                                        </AlertDialogAction>
                                      </AlertDialogFooter>
                                    </AlertDialogContent>
                                  </AlertDialog>
                                </div>
                              </div>
                            )}
                          </li>
                        );
                      })}
                    </ul>
                  ) : (
                    <p className="text-xs text-muted-foreground pl-4 py-2 italic">
                      No statuses in this category
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Add New Status Form */}
        {!editingStatus && (
          <div className="pt-2">
            <h3 className="text-sm font-semibold mb-3">Add New Status</h3>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="rounded-lg border bg-muted/20 p-4">
                <div className="flex flex-col sm:flex-row items-stretch sm:items-start gap-3">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem className="flex-1">
                        <FormLabel className="sr-only">New Status Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter status name..." {...field} />
                        </FormControl>
                        <FormMessage className="text-xs" />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="category"
                    render={({ field }) => (
                      <FormItem className="w-full sm:w-44">
                        <FormLabel className="sr-only">Status Category</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select category..." />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {statusCategories.map(cat => (
                              <SelectItem key={cat} value={cat}>
                                <div className="flex items-center gap-2">
                                  <div className={`h-2 w-2 rounded-full ${categoryColors[cat].split(' ')[0]}`} />
                                  {cat}
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage className="text-xs" />
                      </FormItem>
                    )}
                  />
                  <Button type="submit" className="w-full sm:w-auto">
                    <PlusCircle className="mr-2 h-4 w-4" /> Add Status
                  </Button>
                </div>
              </form>
            </Form>
          </div>
        )}
      </CardContent>
    </Card>
  );
}