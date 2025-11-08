
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
import { useFirestore, setDocumentNonBlocking, updateDocumentNonBlocking } from '@/firebase';
import { doc, collection, arrayUnion } from 'firebase/firestore';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { DateInput } from '@/components/ui/date-input';


const formSchema = z.object({
  title: z.string().min(3, 'Work item title must be at least 3 characters.'),
  description: z.string().optional(),
  owner: z.string().optional(),
  contributors: z.array(z.string()).optional(),
  dueDate: z.date({ required_error: 'A due date is required.' }),
  status: z.enum(['Not Started', 'In Progress', 'Completed']),
  type: z.enum(['Task', 'Milestone']),
  billableAmount: z.any().optional(),
  billableStatus: z.enum(['Not Billable', 'Unbilled', 'Billed', 'Paid']).optional(),
  invoiceDate: z.date().optional(),
  invoiceNo: z.string().optional(),
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
      billableStatus: 'Not Billable',
      billableAmount: '',
      invoiceDate: undefined,
      invoiceNo: '',
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
  
  const selectedOwnerId = form.watch('owner');


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
      projectId: project.id,
      projectName: project.name,
      billableAmount: values.billableAmount ? parseFloat(String(values.billableAmount).replace(/,/g, '')) : undefined,
      billableStatus: values.billableStatus,
      invoiceDate: values.invoiceDate ? values.invoiceDate.toISOString() : undefined,
      invoiceNo: values.invoiceNo,
    };

    if (values.owner && values.owner !== 'unassigned') {
      (newTask as Task).owner = values.owner;
    }
    
    if (firestore) {
      const taskDocRef = doc(firestore, 'projects', project.id, 'tasks', newTaskId);
      setDocumentNonBlocking(taskDocRef, newTask);

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
        billableStatus: 'Not Billable',
        billableAmount: '',
        invoiceDate: undefined,
        invoiceNo: '',
      });
      toast({
        title: 'Work Item Created',
        description: `"${newTask.title}" has been added to the project.`,
      });
    }, 1000);
  };
  
  const handleNumericInputChange = (e: React.ChangeEvent<HTMLInputElement>, field: any) => {
    let input = e.target.value;
    let cleaned = input.replace(/[^0-9.]/g, '');
    const parts = cleaned.split('.');
    if (parts.length > 2) {
      cleaned = parts[0] + '.' + parts.slice(1).join('');
    }
    const [integerPart, decimalPart] = cleaned.split('.');
    let formatted = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    if (decimalPart !== undefined) {
      formatted += '.' + decimalPart.slice(0, 2);
    }
    field.onChange(formatted);
  };

  const handleNumericInputBlur = (e: React.FocusEvent<HTMLInputElement>, field: any) => {
    const value = e.target.value.replace(/,/g, '');
    if (value && !isNaN(parseFloat(value))) {
      const num = parseFloat(value);
      const formatted = new Intl.NumberFormat('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      }).format(num);
      field.onChange(formatted);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <PlusCircle className="mr-2 h-4 w-4" />
          Create Work Item
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Create New Work Item</DialogTitle>
          <DialogDescription>Fill in the details for the new task or milestone.</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-4">
              <h4 className="text-sm font-semibold text-muted-foreground">General Details</h4>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
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

              <Separator />

              <h4 className="text-sm font-semibold text-muted-foreground">Team Assignment</h4>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
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
                                {engineers.filter(e => e.id !== selectedOwnerId).map((engineer) => (
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
              </div>

              <Separator />

              <h4 className="text-sm font-semibold text-muted-foreground">Financials (Optional)</h4>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="billableAmount"
                  render={({ field }) => (
                      <FormItem>
                          <FormLabel>Billable Amount</FormLabel>
                          <FormControl>
                              <Input
                                  type="text"
                                  placeholder="e.g., 1,500.00"
                                  {...field}
                                  onChange={(e) => handleNumericInputChange(e, field)}
                                  onBlur={(e) => handleNumericInputBlur(e, field)}
                              />
                          </FormControl>
                          <FormMessage />
                      </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="billableStatus"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Billing Status</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select billing status" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="Not Billable">Not Billable</SelectItem>
                          <SelectItem value="Unbilled">Unbilled</SelectItem>
                          <SelectItem value="Billed">Billed</SelectItem>
                          <SelectItem value="Paid">Paid</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
               <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="invoiceNo"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Invoice No.</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., INV-00123" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="invoiceDate"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Invoice Date</FormLabel>
                      <DateInput 
                          value={field.value}
                          onChange={field.onChange}
                          placeholder='Select invoice date'
                      />
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

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

