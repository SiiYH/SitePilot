
'use client';

import { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
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
import { Textarea } from '@/components/ui/textarea';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Check, ChevronsUpDown, PlusCircle, Calendar as CalendarIcon, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { User, Project } from '@/types';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { useToast } from '@/hooks/use-toast';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';


interface CreateProjectDialogProps {
  engineers: User[];
  onProjectCreated: (project: Project) => void;
}

const formSchema = z.object({
  name: z.string().min(3, 'Project name must be at least 3 characters.'),
  description: z.string().min(10, 'Description must be at least 10 characters.'),
  startDate: z.date({ required_error: 'A start date is required.' }),
  endDate: z.date({ required_error: 'An end date is required.' }),
  assignedEngineers: z.array(z.string()),
  jobNo: z.string().optional(),
  orderNo: z.string().optional(),
  siteName: z.string().optional(),
  jobLocation: z.string().optional(),
  distance: z.coerce.number().optional(),
  performanceBondNo: z.string().optional(),
  performanceBondAmount: z.coerce.number().optional(),
  grossProfit: z.coerce.number().optional(),
  marginProfit: z.coerce.number().optional(),
  insuranceAmount: z.coerce.number().optional(),
  currency: z.string().optional(),
});

const createSlug = (name: string) => {
  return name
    .toLowerCase()
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
};

const currencies = ['MYR', 'USD', 'SGD', 'EUR', 'GBP'];

export default function CreateProjectDialog({ engineers, onProjectCreated }: CreateProjectDialogProps) {
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      description: '',
      assignedEngineers: [],
      currency: 'MYR',
    },
  });

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    setIsLoading(true);

    // Mock project creation
    const newProject: Project = {
      id: `proj-${Date.now()}`,
      slug: createSlug(values.name),
      name: values.name,
      description: values.description,
      startDate: values.startDate.toISOString(),
      endDate: values.endDate.toISOString(),
      assignedEngineers: values.assignedEngineers,
      progress: 0,
      imageUrl: `https://picsum.photos/seed/proj${Date.now()}/600/400`,
      imageHint: 'construction site',
      tasks: [],
      documents: [],
      milestones: [],
      ...values,
    };
    
    // Simulate API call
    setTimeout(() => {
      onProjectCreated(newProject);
      setIsLoading(false);
      setOpen(false);
      form.reset();
      toast({
        title: 'Project Created',
        description: `${newProject.name} has been successfully created.`,
      });
    }, 1000);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <PlusCircle className="mr-2 h-4 w-4" />
          Create Project
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[625px]">
        <DialogHeader>
          <DialogTitle>Create New Project</DialogTitle>
          <DialogDescription>Fill in the details below to create a new project.</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Project Name</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Apex Tower" {...field} />
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
                    <FormLabel>Job/Site Description</FormLabel>
                    <FormControl>
                      <Textarea placeholder="A short description of the project." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Separator className="my-4"/>
              <h4 className="text-sm font-semibold">Site Information</h4>
              
               <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                 <FormField
                    control={form.control}
                    name="jobNo"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Job No.</FormLabel>
                        <FormControl><Input placeholder="e.g., JB-001" {...field} /></FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                    />
                    <FormField
                    control={form.control}
                    name="orderNo"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Order No.</FormLabel>
                        <FormControl><Input placeholder="e.g., ORD-2024-001" {...field} /></FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                    />
               </div>
                <FormField
                    control={form.control}
                    name="siteName"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Site Name</FormLabel>
                        <FormControl><Input placeholder="e.g., Apex Tower Site" {...field} /></FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="jobLocation"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Job Location</FormLabel>
                        <FormControl><Input placeholder="e.g., Kuala Lumpur City Centre" {...field} /></FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="distance"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Distance (km)</FormLabel>
                        <FormControl><Input type="number" placeholder="e.g., 15" {...field} /></FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                />

              <Separator className="my-4"/>
              <h4 className="text-sm font-semibold">Financials & Insurance</h4>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <FormField
                    control={form.control}
                    name="performanceBondNo"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Performance Bond No.</FormLabel>
                        <FormControl><Input placeholder="e.g., PB-12345" {...field} /></FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                    />
                    <FormField
                    control={form.control}
                    name="performanceBondAmount"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Performance Bond Amt.</FormLabel>
                        <FormControl><Input type="number" placeholder="e.g., 500000" {...field} /></FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                    />
                </div>
                 <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <FormField
                    control={form.control}
                    name="grossProfit"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Gross Profit</FormLabel>
                        <FormControl><Input type="number" placeholder="e.g., 2000000" {...field} /></FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                    />
                    <FormField
                    control={form.control}
                    name="marginProfit"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Margin Profit (%)</FormLabel>
                        <FormControl><Input type="number" placeholder="e.g., 20" {...field} /></FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                    />
                </div>
                 <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <FormField
                        control={form.control}
                        name="insuranceAmount"
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel>Insurance Amt.</FormLabel>
                            <FormControl><Input type="number" placeholder="e.g., 100000" {...field} /></FormControl>
                            <FormMessage />
                            </FormItem>
                        )}
                    />
                     <FormField
                      control={form.control}
                      name="currency"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Currency</FormLabel>
                           <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select a currency" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {currencies.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                </div>


              <Separator className="my-4"/>
              <h4 className="text-sm font-semibold">Schedule & Team</h4>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="startDate"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Start Date</FormLabel>
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
                  name="endDate"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>End Date</FormLabel>
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
              </div>

              <FormField
                control={form.control}
                name="assignedEngineers"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Assign Engineers</FormLabel>
                    <Controller
                      control={form.control}
                      name="assignedEngineers"
                      render={({ field }) => (
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button variant="outline" role="combobox" className="w-full justify-between">
                              {field.value?.length > 0
                                ? `${field.value.length} engineer(s) selected`
                                : 'Select engineers...'}
                              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                            </Button>
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
                      )}
                    />
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Create Project
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
