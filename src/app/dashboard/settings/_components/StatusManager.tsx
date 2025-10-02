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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { PlusCircle, Edit, Trash2, GripVertical, Check, X, RotateCcw, FolderKanban, Tags } from 'lucide-react';
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
interface ProjectStatus {
  id: string;
  name: string;
  category: string;
}

interface StatusCategory {
  id: string;
  name: string;
}

// Default categories - used only for initial setup or reset
const defaultCategories: StatusCategory[] = [
  { id: 'not-started', name: 'Not Started' },
  { id: 'in-progress', name: 'In Progress' },
  { id: 'on-hold', name: 'On Hold' },
  { id: 'completed', name: 'Completed' },
  { id: 'cancelled', name: 'Cancelled' },
];

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
const CATEGORIES_STORAGE_KEY = 'sitepilot-status-categories';

const statusFormSchema = z.object({
  name: z.string().min(2, 'Status name must be at least 2 characters.').max(50, 'Status name is too long.'),
  category: z.string().min(1, 'Please select a category'),
});

const categoryFormSchema = z.object({
  name: z.string().min(2, 'Category name must be at least 2 characters.').max(30, 'Category name is too long.'),
});

type StatusFormValues = z.infer<typeof statusFormSchema>;
type CategoryFormValues = z.infer<typeof categoryFormSchema>;

export default function StatusManager() {
  const [statuses, setStatuses] = useState<ProjectStatus[]>([]);
  const [categories, setCategories] = useState<StatusCategory[]>([]);
  const [editingStatus, setEditingStatus] = useState<ProjectStatus | null>(null);
  const [editingCategory, setEditingCategory] = useState<StatusCategory | null>(null);
  const { toast } = useToast();

  // Initialize from localStorage or use defaults
  useEffect(() => {
    const storedCategories = localStorage.getItem(CATEGORIES_STORAGE_KEY);
    if (storedCategories) {
      try {
        setCategories(JSON.parse(storedCategories));
      } catch (e) {
        console.error('Failed to parse stored categories:', e);
        setCategories(defaultCategories);
        localStorage.setItem(CATEGORIES_STORAGE_KEY, JSON.stringify(defaultCategories));
      }
    } else {
      setCategories(defaultCategories);
      localStorage.setItem(CATEGORIES_STORAGE_KEY, JSON.stringify(defaultCategories));
    }

    const storedStatuses = localStorage.getItem(STORAGE_KEY);
    if (storedStatuses) {
      try {
        setStatuses(JSON.parse(storedStatuses));
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

  const statusForm = useForm<StatusFormValues>({
    resolver: zodResolver(statusFormSchema),
    defaultValues: {
      name: '',
      category: '',
    },
  });

  const categoryForm = useForm<CategoryFormValues>({
    resolver: zodResolver(categoryFormSchema),
    defaultValues: {
      name: '',
    },
  });

  const handleEditStatusClick = (status: ProjectStatus) => {
    setEditingStatus(status);
    statusForm.reset({
      name: status.name,
      category: status.category,
    });
  };

  const handleCancelStatusEdit = () => {
    setEditingStatus(null);
    statusForm.reset({ name: '', category: categories[0]?.name || '' });
  };

  const handleEditCategoryClick = (category: StatusCategory) => {
    setEditingCategory(category);
    categoryForm.reset({ name: category.name });
  };

  const handleCancelCategoryEdit = () => {
    setEditingCategory(null);
    categoryForm.reset({ name: '' });
  };

  const onStatusSubmit = (values: StatusFormValues) => {
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
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedStatuses));
    handleCancelStatusEdit();
  };

  const onCategorySubmit = (values: CategoryFormValues) => {
    const duplicateExists = categories.some(c => 
      c.name.toLowerCase() === values.name.toLowerCase() && 
      c.id !== editingCategory?.id
    );

    if (duplicateExists) {
      toast({
        variant: 'destructive',
        title: 'Duplicate Category',
        description: 'A category with this name already exists.',
      });
      return;
    }

    let updatedCategories;
    const oldCategoryName = editingCategory?.name;

    if (editingCategory) {
      updatedCategories = categories.map(c =>
        c.id === editingCategory.id ? { ...c, name: values.name } : c
      );
      
      // Update all statuses using this category
      const updatedStatuses = statuses.map(s =>
        s.category === oldCategoryName ? { ...s, category: values.name } : s
      );
      setStatuses(updatedStatuses);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedStatuses));
      
      toast({ title: 'Category Updated', description: `"${values.name}" has been successfully updated.` });
    } else {
      const newCategory: StatusCategory = {
        id: `category-${Date.now()}-${values.name.toLowerCase().replace(/\s+/g, '-')}`,
        name: values.name,
      };
      updatedCategories = [...categories, newCategory];
      toast({ title: 'Category Added', description: `"${newCategory.name}" has been added successfully.` });
    }

    setCategories(updatedCategories);
    localStorage.setItem(CATEGORIES_STORAGE_KEY, JSON.stringify(updatedCategories));
    handleCancelCategoryEdit();
  };
  
  const handleDeleteStatus = (statusId: string) => {
    const statusToDelete = statuses.find(s => s.id === statusId);
    if (!statusToDelete) return;

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

  const handleDeleteCategory = (categoryId: string) => {
    const categoryToDelete = categories.find(c => c.id === categoryId);
    if (!categoryToDelete) return;

    if (categories.length === 1) {
      toast({
        variant: 'destructive',
        title: 'Cannot Delete',
        description: 'You must have at least one category.',
      });
      return;
    }

    // Check if any statuses use this category
    const statusesUsingCategory = statuses.filter(s => s.category === categoryToDelete.name);
    if (statusesUsingCategory.length > 0) {
      toast({
        variant: 'destructive',
        title: 'Cannot Delete',
        description: `This category is being used by ${statusesUsingCategory.length} status(es). Please reassign or delete them first.`,
      });
      return;
    }
    
    const updatedCategories = categories.filter(c => c.id !== categoryId);
    setCategories(updatedCategories);
    localStorage.setItem(CATEGORIES_STORAGE_KEY, JSON.stringify(updatedCategories));
    toast({ 
      title: 'Category Deleted', 
      description: `"${categoryToDelete.name}" has been successfully removed.` 
    });
  };

  const resetToDefaults = () => {
    setCategories(defaultCategories);
    setStatuses(defaultProjectStatuses);
    localStorage.setItem(CATEGORIES_STORAGE_KEY, JSON.stringify(defaultCategories));
    localStorage.setItem(STORAGE_KEY, JSON.stringify(defaultProjectStatuses));
    setEditingStatus(null);
    setEditingCategory(null);
    statusForm.reset({ name: '', category: '' });
    categoryForm.reset({ name: '' });
    toast({
      title: 'Reset Complete',
      description: 'All statuses and categories have been reset to defaults.',
    });
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-4">
          <div>
            <CardTitle>Project Status Management</CardTitle>
            <CardDescription>
              Customize statuses and categories for your workspace. Manage both status options and their grouping categories.
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
                <AlertDialogTitle>Reset to Default Settings?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will replace all current statuses and categories with the default set. All custom entries will be lost. This action cannot be undone.
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
      <CardContent>
        <Tabs defaultValue="statuses" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="statuses">
              <FolderKanban className="mr-2 h-4 w-4" />
              Statuses
            </TabsTrigger>
            <TabsTrigger value="categories">
              <Tags className="mr-2 h-4 w-4" />
              Categories
            </TabsTrigger>
          </TabsList>

          <TabsContent value="statuses" className="space-y-6">
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
                      <Form {...statusForm}>
                        <form onSubmit={statusForm.handleSubmit(onStatusSubmit)} className="flex flex-1 flex-col sm:flex-row items-stretch sm:items-center gap-2">
                          <FormField
                            control={statusForm.control}
                            name="name"
                            render={({ field }) => (
                              <FormItem className="flex-1">
                                <FormControl><Input {...field} autoFocus /></FormControl>
                                <FormMessage className="text-xs" />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={statusForm.control}
                            name="category"
                            render={({ field }) => (
                              <FormItem>
                                <Select onValueChange={field.onChange} value={field.value}>
                                  <FormControl>
                                    <SelectTrigger className="w-full sm:w-40">
                                      <SelectValue />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    {categories.map(cat => <SelectItem key={cat.id} value={cat.name}>{cat.name}</SelectItem>)}
                                  </SelectContent>
                                </Select>
                                <FormMessage className="text-xs" />
                              </FormItem>
                            )}
                          />
                          <div className="flex justify-end gap-1">
                            <Button type="submit" size="icon" variant="ghost" className="text-green-600 hover:text-green-700 hover:bg-green-50">
                              <Check className="h-4 w-4" />
                            </Button>
                            <Button type="button" size="icon" variant="ghost" onClick={handleCancelStatusEdit} className="text-red-600 hover:text-red-700 hover:bg-red-50">
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
                          <Button variant="ghost" size="icon" onClick={() => handleEditStatusClick(status)} title="Edit status">
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
                                <AlertDialogAction onClick={() => handleDeleteStatus(status.id)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
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
                <Form {...statusForm}>
                  <form onSubmit={statusForm.handleSubmit(onStatusSubmit)} className="flex flex-col sm:flex-row items-stretch sm:items-start gap-2 rounded-md border p-3 bg-muted/20">
                    <FormField
                      control={statusForm.control}
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
                      control={statusForm.control}
                      name="category"
                      render={({ field }) => (
                        <FormItem className="w-full sm:w-auto">
                          <FormLabel className="sr-only">Status Category</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger className="w-full sm:w-40">
                                <SelectValue placeholder="Select category..." />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {categories.map(cat => <SelectItem key={cat.id} value={cat.name}>{cat.name}</SelectItem>)}
                            </SelectContent>
                          </Select>
                          <FormMessage className="text-xs" />
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
          </TabsContent>

          <TabsContent value="categories" className="space-y-6">
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-medium">Current Categories</h3>
                <span className="text-xs text-muted-foreground">{categories.length} categor{categories.length !== 1 ? 'ies' : 'y'}</span>
              </div>
              <ul className="space-y-2">
                {categories.map(category => {
                  const statusCount = statuses.filter(s => s.category === category.name).length;
                  return (
                    <li key={category.id} className="flex items-center gap-2 rounded-md border bg-background p-2 flex-wrap hover:bg-muted/30 transition-colors">
                      <GripVertical className="h-5 w-5 text-muted-foreground hidden sm:block" />
                      {editingCategory?.id === category.id ? (
                        <Form {...categoryForm}>
                          <form onSubmit={categoryForm.handleSubmit(onCategorySubmit)} className="flex flex-1 flex-col sm:flex-row items-stretch sm:items-center gap-2">
                            <FormField
                              control={categoryForm.control}
                              name="name"
                              render={({ field }) => (
                                <FormItem className="flex-1">
                                  <FormControl><Input {...field} autoFocus /></FormControl>
                                  <FormMessage className="text-xs" />
                                </FormItem>
                              )}
                            />
                            <div className="flex justify-end gap-1">
                              <Button type="submit" size="icon" variant="ghost" className="text-green-600 hover:text-green-700 hover:bg-green-50">
                                <Check className="h-4 w-4" />
                              </Button>
                              <Button type="button" size="icon" variant="ghost" onClick={handleCancelCategoryEdit} className="text-red-600 hover:text-red-700 hover:bg-red-50">
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                          </form>
                        </Form>
                      ) : (
                        <>
                          <div className="flex-1 min-w-0">
                            <span className="font-medium">{category.name}</span>
                            <span className="ml-2 text-xs text-muted-foreground">({statusCount} status{statusCount !== 1 ? 'es' : ''})</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Button variant="ghost" size="icon" onClick={() => handleEditCategoryClick(category)} title="Edit category">
                              <Edit className="h-4 w-4" />
                            </Button>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button 
                                  variant="ghost" 
                                  size="icon" 
                                  className="text-destructive hover:text-destructive hover:bg-destructive/10"
                                  disabled={categories.length === 1 || statusCount > 0}
                                  title={categories.length === 1 ? "Cannot delete last category" : statusCount > 0 ? "Cannot delete category in use" : "Delete category"}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Delete Category?</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    This will permanently delete the "{category.name}" category. This action cannot be undone.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction onClick={() => handleDeleteCategory(category.id)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                                    Delete
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </>
                      )}
                    </li>
                  );
                })}
              </ul>
            </div>

            {!editingCategory && (
              <div>
                <h3 className="text-sm font-medium mb-3">Add New Category</h3>
                <Form {...categoryForm}>
                  <form onSubmit={categoryForm.handleSubmit(onCategorySubmit)} className="flex flex-col sm:flex-row items-stretch sm:items-start gap-2 rounded-md border p-3 bg-muted/20">
                    <FormField
                      control={categoryForm.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem className="flex-1">
                          <FormLabel className="sr-only">New Category Name</FormLabel>
                          <FormControl><Input placeholder="Enter category name..." {...field} /></FormControl>
                          <FormMessage className="text-xs" />
                        </FormItem>
                      )}
                    />
                    <Button type="submit" className="w-full sm:w-auto">
                      <PlusCircle className="mr-2 h-4 w-4" /> Add Category
                    </Button>
                  </form>
                </Form>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}