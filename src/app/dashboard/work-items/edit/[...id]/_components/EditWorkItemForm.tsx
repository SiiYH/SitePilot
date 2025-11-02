
'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Check, ChevronsUpDown, Calendar as CalendarIcon, Loader2 } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { cn } from '@/lib/utils';
import { Task, User, Project } from '@/types';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useFirestore, updateDocumentNonBlocking } from '@/firebase';
import { doc, arrayUnion } from 'firebase/firestore';
import { Textarea } from '@/components/ui/textarea';


interface EditWorkItemFormProps {
  workItem: Task;
  project: Project;
  engineers: User[];
  pathSegments: string[];
}

const formSchema = z.object({
  title: z.string().min(3, 'Work item title must be at least 3 characters.'),
  description: z.string().optional(),
  owner: z.string().optional(),
  contributors: z.array(z.string()).optional(),
  dueDate: z.date({ required_error: 'A due date is required.' }),
  status: z.enum(['Not Started', 'In Progress', 'Completed', 'Overdue']),
  type: z.enum(['Task', 'Milestone']),
});

export default function EditWorkItemForm({ workItem, project, engineers, pathSegments }: EditWorkItemFormProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const firestore = useFirestore();

  const getSafeDate = (dateValue: string | Date | undefined): Date | undefined => {
    if (!dateValue) return undefined;
    if (dateValue instanceof Date) return dateValue;
    try {
      return parseISO(dateValue);
    } catch (error) {
      return undefined;
    }
  };

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: workItem.title,
      description: workItem.description || '',
      owner: workItem.owner || 'unassigned',
      contributors: workItem.contributors || [],
      dueDate: getSafeDate(workItem.dueDate),
      status: workItem.status,
      type: workItem.type,
    },
  });

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    setIsLoading(true);

    const updatedData: Partial<Task> = {
      ...values,
      dueDate: values.dueDate.toISOString(),
    };

    if (values.owner === 'unassigned') {
        delete updatedData.owner;
    } else {
        updatedData.owner = values.owner;
    }
    
    if (firestore) {
      const taskDocRef = doc(firestore, 'projects', project.id, 'tasks', workItem.id);
      updateDocumentNonBlocking(taskDocRef, updatedData);

      const projectDocRef = doc(firestore, 'projects', project.id);
      const usersToAdd = new Set<string>();

      // Check owner
      if (values.owner && values.owner !== 'unassigned' && !project.assignedEngineers.includes(values.owner)) {
        usersToAdd.add(values.owner);
      }

      // Check contributors
      if (values.contributors) {
        values.contributors.forEach(contributorId => {
          if (!project.assignedEngineers.includes(contributorId)) {
            usersToAdd.add(contributorId);
          }
        });
      }

      if (usersToAdd.size > 0) {
        const usersToAddArray = Array.from(usersToAdd);
        updateDocumentNonBlocking(projectDocRef, {
            assignedEngineers: arrayUnion(...usersToAddArray)
        });
        
        const addedUsersNames = usersToAddArray.map(id => engineers.find(e => e.id === id)?.name).filter(Boolean);

        toast({
            title: 'Team Updated',
            description: `${addedUsersNames.join(', ')} has been added to the project team.`,
        });
      }
    }
    
    setTimeout(() => {
      toast({
        title: 'Work Item Updated',
        description: `${values.title} has been successfully updated.`,
      });
      setIsLoading(false);
      
      const viewPath = pathSegments.join('/');
      router.replace(`/dashboard/work-items/view/${viewPath}`);
      router.refresh();
    }, 1000);
  };

  return (
    <Card>
      <CardHeader>
          <CardTitle>Work Item Information</CardTitle>
          <CardDescription>Update the form below and click save.</CardDescription>
      </CardHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <CardContent className="space-y-4">
             <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Type</FormLabel>
                    <Select 
                      onValueChange={field.onChange} 
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select work item type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Task">Task</SelectItem>
                        <SelectItem value="Milestone">Milestone</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Title</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Finalize plumbing" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description (Optional)</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Add more details about this work item..." {...field} value={field.value ?? ''} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="owner"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Owner (Optional)</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select an owner" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="unassigned">Unassigned</SelectItem>
                      {engineers.map(e => (
                        <SelectItem key={e.id} value={e.id}>{e.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
             <FormField
                control={form.control}
                name="contributors"
                render={({ field }) => (
                <FormItem>
                    <FormLabel>Contributors (Optional)</FormLabel>
                    <Popover>
                    <PopoverTrigger asChild>
                        <FormControl>
                          <Button variant="outline" role="combobox" className="w-full justify-between">
                            {(() => {
                              const length = field.value?.length ?? 0;
                              return length > 0
                                ? `${length} engineer(s) selected`
                                : 'Select contributors...';
                            })()}
                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                          </Button>
                        </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                        <Command>
                        <CommandInput placeholder="Search engineers..." />
                        <CommandList>
                            <CommandEmpty>No engineers found.</CommandEmpty>
                            <CommandGroup>
                            {engineers.map((engineer) => (
                                <CommandItem
                                key={engineer.id}
                                onSelect={() => {
                                    const selected = field.value || [];
                                    const newValue = selected.includes(engineer.id)
                                    ? selected.filter((id) => id !== engineer.id)
                                    : [...selected, engineer.id];
                                    field.onChange(newValue);
                                }}
                                >
                                <Check
                                    className={cn(
                                    'mr-2 h-4 w-4',
                                    field.value?.includes(engineer.id) ? 'opacity-100' : 'opacity-0'
                                    )}
                                />
                                {engineer.name}
                                </CommandItem>
                            ))}
                            </CommandGroup>
                        </CommandList>
                        </Command>
                    </PopoverContent>
                    </Popover>
                    <FormMessage />
                </FormItem>
                )}
            />
            <FormField
              control={form.control}
              name="dueDate"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Due Date</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant={'outline'}
                          className={cn(
                            'w-full pl-3 text-left font-normal',
                            !field.value && 'text-muted-foreground'
                          )}
                        >
                          {field.value ? format(field.value, 'PPP') : <span>Pick a date</span>}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={field.onChange}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Status</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Set initial status" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="Not Started">Not Started</SelectItem>
                      <SelectItem value="In Progress">In Progress</SelectItem>
                      <SelectItem value="Completed">Completed</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
          <CardFooter className="flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={() => router.back()}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Changes
            </Button>
          </CardFooter>
        </form>
      </Form>
    </Card>
  );
}
