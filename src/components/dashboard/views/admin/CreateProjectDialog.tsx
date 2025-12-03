

'use client';

import { useState, useEffect, useMemo } from 'react';
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
import { Check, ChevronsUpDown, PlusCircle, Loader2, Info } from 'lucide-react';
import { User, Project, ProgressTrackingMode, ProjectStatus } from '@/types';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { useToast } from '@/hooks/use-toast';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { useAuth } from '@/hooks/use-auth';
import { defaultProjectStatuses } from '@/lib/data';
import { useFirestore, setDocumentNonBlocking } from '@/firebase';
import { doc } from 'firebase/firestore';
import { DateInput } from '@/components/ui/date-input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipProvider, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';

interface CreateProjectDialogProps {
  users: User[];
  onProjectCreated: (project: Project) => void;
  companyId: string;
}

const formSchema = z.object({
  name: z.string().min(3, 'Project name must be at least 3 characters.'),
  description: z.string().min(10, 'Description must be at least 10 characters.'),
  status: z.string().min(1, "Status is required"),
  startDate: z.date({ required_error: 'A start date is required.' }),
  endDate: z.date({ required_error: 'An end date is required.' }),
  assignedEngineers: z.array(z.string()),
  progressTrackingMode: z.enum(['task-driven', 'milestone-driven', 'manual', 'task-milestone-driven']),
  progress: z.number().min(0).max(100).optional(),
  orderNo: z.string().optional(),
  siteName: z.string().optional(),
  jobLocation: z.string().optional(),
  distance: z.coerce.number().optional(),
  performanceBondNo: z.string().optional(),
  performanceBondAmount: z.any().optional(),
  grossProfit: z.coerce.number().optional(),
  marginProfit: z.coerce.number().optional(),
  insuranceAmount: z.any().optional(),
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

export default function CreateProjectDialog({ users, onProjectCreated, companyId }: CreateProjectDialogProps) {
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const { user, company } = useAuth();
  const firestore = useFirestore();

  const projectStatuses: ProjectStatus[] = useMemo(() => company?.projectStatuses || [], [company]);


  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      description: '',
      status: projectStatuses.find(s => s.category === 'Not Started')?.id || 'not-started',
      assignedEngineers: [],
      progressTrackingMode: 'task-driven',
      progress: 0,
      orderNo: '',
      siteName: '',
      jobLocation: '',
      distance: '' as any,
      performanceBondNo: '',
      performanceBondAmount: '' as any,
      grossProfit: '' as any,
      marginProfit: '' as any,
      insuranceAmount: '' as any,
      currency: 'MYR',
    },
  });

  const progressTrackingMode = form.watch('progressTrackingMode');
  const canEditFinancials = user?.role === 'admin' || user?.role === 'director';


  const onSubmit = (values: z.infer<typeof formSchema>) => {
    setIsLoading(true);

    if (!user) {
        toast({
            variant: 'destructive',
            title: 'Authentication Error',
            description: 'You must be logged in to create a project.',
        });
        setIsLoading(false);
        return;
    }
    
    const projectId = `proj-${Date.now()}`;
    const jobNo = `JB-${Date.now()}`;
    const now = new Date().toISOString();
    
    const parseOptionalFloat = (value: any): number | undefined => {
      if (value === '' || value === null || value === undefined) {
        return undefined;
      }
      const num = parseFloat(String(value).replace(/,/g, ''));
      return isNaN(num) ? undefined : num;
    }

    const newProjectData: Omit<Project, 'tasks' | 'documents' | 'milestones'> = {
      id: projectId,
      name: values.name,
      slug: createSlug(values.name),
      description: values.description,
      status: values.status,
      startDate: values.startDate.toISOString(),
      endDate: values.endDate.toISOString(),
      assignedEngineers: values.assignedEngineers,
      progressTrackingMode: values.progressTrackingMode as ProgressTrackingMode,
      progress: values.progress || 0,
      jobNo: jobNo,
      companyId: companyId,
      imageUrl: `https://picsum.photos/seed/${projectId}/600/400`,
      imageHint: 'construction site',
      createdAt: now,
      createdBy: user.id,
      modifiedAt: now,
      modifiedBy: user.id,
    };
    
    // Conditionally add optional fields to avoid sending 'undefined'
    if (values.orderNo) newProjectData.orderNo = values.orderNo;
    if (values.siteName) newProjectData.siteName = values.siteName;
    if (values.jobLocation) newProjectData.jobLocation = values.jobLocation;
    if (values.performanceBondNo) newProjectData.performanceBondNo = values.performanceBondNo;
    if (values.currency) newProjectData.currency = values.currency;

    const distance = parseOptionalFloat(values.distance);
    if (distance !== undefined) newProjectData.distance = distance;
    
    const performanceBondAmount = parseOptionalFloat(values.performanceBondAmount);
    if (performanceBondAmount !== undefined) newProjectData.performanceBondAmount = performanceBondAmount;

    const insuranceAmount = parseOptionalFloat(values.insuranceAmount);
    if (insuranceAmount !== undefined) newProjectData.insuranceAmount = insuranceAmount;

    const grossProfit = parseOptionalFloat(values.grossProfit);
    if (grossProfit !== undefined) newProjectData.grossProfit = grossProfit;

    const marginProfit = parseOptionalFloat(values.marginProfit);
    if (marginProfit !== undefined) newProjectData.marginProfit = marginProfit;

    
    const projectDocRef = doc(firestore, 'projects', projectId);
    setDocumentNonBlocking(projectDocRef, newProjectData, {});
    
    setTimeout(() => {
      onProjectCreated(newProjectData as Project);
      setIsLoading(false);
      setOpen(false);
      form.reset();
      toast({
        title: 'Project Created',
        description: `${newProjectData.name} has been successfully created.`,
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
              <FormField
                  control={form.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Project Status</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select status" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {projectStatuses.map(status => (
                             <SelectItem key={status.id} value={status.id}>{status.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

              <Separator className="my-4"/>
              <h4 className="text-sm font-semibold">Site Information</h4>
              
               <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
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
               </div>
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
              
              {canEditFinancials && (
                <>
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
                                    <FormControl>
                                        <Input
                                            type="text"
                                            placeholder="e.g., 500,000.00"
                                            {...field}
                                            onChange={(e) => handleNumericInputChange(e, field)}
                                            onBlur={(e) => handleNumericInputBlur(e, field)}
                                        />
                                    </FormControl>
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
                                    <div className="flex items-center gap-2">
                                        <FormLabel>Gross Profit</FormLabel>
                                        <TooltipProvider>
                                            <Tooltip>
                                                <TooltipTrigger asChild>
                                                    <Info className="h-4 w-4 text-muted-foreground cursor-help" />
                                                </TooltipTrigger>
                                                <TooltipContent>
                                                    <p>Gross Profit is auto-calculated based on other financial inputs.</p>
                                                </TooltipContent>
                                            </Tooltip>
                                        </TooltipProvider>
                                    </div>
                                    <FormControl>
                                        <Input type="number" placeholder="Auto-calculated" {...field} disabled />
                                    </FormControl>
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
                                <FormControl>
                                    <Input
                                        type="text"
                                        placeholder="e.g., 100,000.00"
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
                </>
              )}

              <Separator className="my-4"/>
              <h4 className="text-sm font-semibold">Schedule, Team & Progress</h4>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                 <FormField
                    control={form.control}
                    name="startDate"
                    render={({ field }) => (
                        <FormItem className="flex flex-col">
                        <FormLabel>Start Date</FormLabel>
                        <FormControl>
                           <DateInput 
                            value={field.value}
                            onChange={field.onChange}
                          />
                        </FormControl>
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
                        <FormControl>
                            <DateInput 
                              value={field.value}
                              onChange={field.onChange}
                            />
                        </FormControl>
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
                    <FormLabel>Assign Users</FormLabel>
                    <Controller
                      control={form.control}
                      name="assignedEngineers"
                      render={({ field }) => (
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button variant="outline" role="combobox" className="w-full justify-between">
                              {field.value?.length > 0
                                ? `${field.value.length} user(s) selected`
                                : 'Select users...'}
                              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                            <Command>
                              <CommandInput placeholder="Search users..." />
                              <CommandList>
                                  <CommandEmpty>No users found.</CommandEmpty>
                                  <CommandGroup>
                                  {users.map((user) => (
                                      <CommandItem
                                      key={user.id}
                                      onSelect={() => {
                                          const selected = field.value || [];
                                          const newValue = selected.includes(user.id)
                                          ? selected.filter((id) => id !== user.id)
                                          : [...selected, user.id];
                                          field.onChange(newValue);
                                      }}
                                      >
                                      <Check
                                          className={cn(
                                          'mr-2 h-4 w-4',
                                          field.value?.includes(user.id) ? 'opacity-100' : 'opacity-0'
                                          )}
                                      />
                                      {user.name} ({user.role})
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
              <FormField
                  control={form.control}
                  name="progressTrackingMode"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Progress Tracking</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select tracking mode" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="task-driven">Task-Driven</SelectItem>
                          <SelectItem value="milestone-driven">Milestone-Driven</SelectItem>
                          <SelectItem value="manual">Manual</SelectItem>
                          <SelectItem value="task-milestone-driven">Task + Milestone</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                {progressTrackingMode === 'manual' && (
                   <FormField
                    control={form.control}
                    name="progress"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Initial Progress (%)</FormLabel>
                        <FormControl>
                          <div className='flex items-center gap-4'>
                            <Slider
                              value={[field.value || 0]}
                              onValueChange={(value) => field.onChange(value[0])}
                              max={100}
                              step={1}
                              className='flex-1'
                            />
                            <Input
                              type="number"
                              value={field.value || 0}
                              onChange={(e) => field.onChange(parseInt(e.target.value, 10))}
                              className="w-20"
                              min="0"
                              max="100"
                            />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}
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


