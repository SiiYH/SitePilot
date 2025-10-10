
'use client';

import { useState, useEffect } from 'react';
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
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { PlusCircle, Loader2, CalendarIcon, Check, ChevronsUpDown } from 'lucide-react';
import { Task, User, CreateWorkItemDialogProps } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { useFirestore, setDocumentNonBlocking } from '@/firebase';
import { doc, collection } from 'firebase/firestore';
import { Textarea } from '@/components/ui/textarea';


const formSchema = z.object({
  title: z.string().min(3, 'Work item title must be at least 3 characters.'),
  description: z.string().optional(),
  owner: z.string().optional(),
  contributors: z.array(z.string()).optional(),
  dueDate: z.date({ required_error: 'A due date is required.' }),
  status: z.enum(['Not Started', 'In Progress', 'Completed']),
  type: z.enum(['Task', 'Milestone']),
});

export default function CreateWorkItemDialog({ project, engineers, onWorkItemCreated }: CreateWorkItemDialogProps) {
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const firestore = useFirestore();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: '',
      description: '',
      owner: 'unassigned',
      contributors: [],
      status: 'Not Started',
      type: project.progressTrackingMode === 'task-driven' ? 'Task' : project.progressTrackingMode === 'milestone-driven' ? 'Milestone' : 'Task',
    },
  });
  
  useEffect(() => {
    if (project) {
      let defaultType: 'Task' | 'Milestone' = 'Task';
      if (project.progressTrackingMode === 'task-driven') {
        defaultType = 'Task';
      } else if (project.progressTrackingMode === 'milestone-driven') {
        defaultType = 'Milestone';
      }
      form.setValue('type', defaultType);
    }
  }, [project, form]);

  const isTypeSelectionDisabled = project.progressTrackingMode === 'task-driven' || project.progressTrackingMode === 'milestone-driven';


  const onSubmit = (values: z.infer<typeof formSchema>) => {
    setIsLoading(true);

    const newTaskId = `task-${Date.now()}`;
    const newTask: Omit<Task, 'id'> = {
      title: values.title,
      description: values.description,
      contributors: values.contributors,
      status: values.status,
      dueDate: values.dueDate.toISOString(),
      type: values.type,
      createdAt: new Date().toISOString(),
    };

    if (values.owner && values.owner !== 'unassigned') {
      (newTask as Task).owner = values.owner;
    }
    
    if (firestore) {
      const taskDocRef = doc(firestore, 'projects', project.id, 'tasks', newTaskId);
      setDocumentNonBlocking(taskDocRef, newTask);
    }

    setTimeout(() => {
      onWorkItemCreated({ ...newTask, id: newTaskId }); // Optimistic update
      setIsLoading(false);
      setOpen(false);
      form.reset({
        title: '',
        description: '',
        owner: 'unassigned',
        contributors: [],
        status: 'Not Started',
        type: project.progressTrackingMode === 'task-driven' ? 'Task' : project.progressTrackingMode === 'milestone-driven' ? 'Milestone' : 'Task',
      });
      toast({
        title: 'Work Item Created',
        description: `"${newTask.title}" has been added to the project.`,
      });
    }, 1000);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <PlusCircle className="mr-2 h-4 w-4" />
          Create Work Item
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Create New Work Item</DialogTitle>
          <DialogDescription>Fill in the details for the new task or milestone.</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-4">
             <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Type</FormLabel>
                    <Select 
                      onValueChange={field.onChange} 
                      defaultValue={field.value}
                      disabled={isTypeSelectionDisabled}
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
                    <Textarea placeholder="Add more details about this work item..." {...field} />
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
                            {field.value?.length > 0
                            ? `${field.value.length} engineer(s) selected`
                            : 'Select contributors...'}
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
                  <FormLabel>Initial Status</FormLabel>
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
            </div>
            <DialogFooter className="pt-4">
              <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Create Item
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
