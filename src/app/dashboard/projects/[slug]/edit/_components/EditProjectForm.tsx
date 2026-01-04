

'use client';

import { useState, useEffect, useMemo } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Check, ChevronsUpDown, Loader2, Info } from 'lucide-react';
import { parseISO } from 'date-fns';
import { cn } from '@/lib/utils';
import { User, Project, ProjectStatus } from '@/types';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/hooks/use-auth';
import { DateInput } from '@/components/ui/date-input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useFirestore, updateDocumentNonBlocking } from '@/firebase';
import { doc } from 'firebase/firestore';
import { Tooltip, TooltipProvider, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';


interface EditProjectFormProps {
  project: Project;
  users: User[];
}

const formSchema = z.object({
  name: z.string().min(3, 'Project name must be at least 3 characters.'),
  description: z.string().min(10, 'Description must be at least 10 characters.'),
  status: z.string().min(1, "Status is required"),
  startDate: z.date({ required_error: 'A start date is required.' }),
  endDate: z.date({ required_error: 'An end date is required.' }),
  assignedEngineers: z.array(z.string()),
  orderNo: z.string().optional(),
  siteName: z.string().optional(),
  jobLocation: z.string().optional(),
  distance: z.coerce.number().optional(),
  performanceBondNo: z.string().optional(),
  performanceBondAmount: z.any().optional(),
  grossProfit: z.any().optional(),
  marginProfit: z.coerce.number().optional(),
  insuranceAmount: z.any().optional(),
  currency: z.string().optional(),
});

const currencies = ['MYR', 'USD', 'SGD', 'EUR', 'GBP'];

export default function EditProjectForm({ project, users }: EditProjectFormProps) {
  const router = useRouter();
  const { user, company } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const canEditFinancials = user?.role === 'admin' || user?.role === 'director';
  const firestore = useFirestore();

  const projectStatuses: ProjectStatus[] = useMemo(() => company?.projectStatuses || [], [company]);


  const getSafeDate = (dateValue: string | Date): Date => {
    if (dateValue instanceof Date) {
      return dateValue;
    }
    return parseISO(dateValue);
  };

  const formatAmountForDisplay = (amount: number | undefined) => {
    if (amount === undefined || isNaN(amount)) return '';
    return new Intl.NumberFormat('en-US').format(amount);
  };

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: project.name,
      description: project.description,
      status: project.status,
      startDate: getSafeDate(project.startDate),
      endDate: getSafeDate(project.endDate),
      assignedEngineers: project.assignedEngineers,
      orderNo: project.orderNo || '',
      siteName: project.siteName || '',
      jobLocation: project.jobLocation || '',
      distance: project.distance || ('' as any),
      performanceBondNo: project.performanceBondNo || '',
      performanceBondAmount: formatAmountForDisplay(project.performanceBondAmount),
      grossProfit: formatAmountForDisplay(project.grossProfit),
      marginProfit: project.marginProfit || ('' as any),
      insuranceAmount: formatAmountForDisplay(project.insuranceAmount),
      currency: project.currency || company?.currency || 'MYR',
    },
  });

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    setIsLoading(true);

    if (!user || !firestore) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "You must be logged in to edit projects.",
      });
      setIsLoading(false);
      return;
    }

    const parseOptionalFloat = (value: any): number | undefined => {
      if (value === '' || value === null || value === undefined) {
        return undefined;
      }
      const num = parseFloat(String(value).replace(/,/g, ''));
      return isNaN(num) ? undefined : num;
    };

    const projectDocRef = doc(firestore, 'projects', project.id);
    const updateData: Record<string, any> = {
      ...values,
      startDate: values.startDate.toISOString(),
      endDate: values.endDate.toISOString(),
      modifiedAt: new Date().toISOString(),
      modifiedBy: user.id,
    };
    
    // Remove undefined values to avoid Firestore errors
    const numericFields = ['performanceBondAmount', 'grossProfit', 'insuranceAmount', 'marginProfit', 'distance'];
    numericFields.forEach(field => {
      const parsedValue = parseOptionalFloat(values[field as keyof typeof values]);
      if (parsedValue !== undefined) {
        updateData[field] = parsedValue;
      } else {
        delete updateData[field];
      }
    });
    
    updateDocumentNonBlocking(projectDocRef, updateData);
    
    setTimeout(() => {
      toast({
        title: 'Project Updated',
        description: `${values.name} has been successfully updated.`,
      });
      setIsLoading(false);
      router.replace(`/dashboard/projects/${project.id}`);
      router.refresh();
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
    <Card>
      <CardHeader>
          <CardTitle>Project Information</CardTitle>
          <CardDescription>Update the form below and click save.</CardDescription>
      </CardHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <CardContent className="space-y-4">
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
                    <FormItem>
                        <FormLabel>Job No.</FormLabel>
                        <FormControl><Input value={project.id} disabled /></FormControl>
                    </FormItem>
                    <FormField
                    control={form.control}
                    name="orderNo"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Order No.</FormLabel>
                        <FormControl><Input placeholder="e.g., ORD-2024-001" {...field} value={field.value || ''} /></FormControl>
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
                        <FormControl><Input placeholder="e.g., Apex Tower Site" {...field} value={field.value || ''} /></FormControl>
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
                        <FormControl><Input placeholder="e.g., Kuala Lumpur City Centre" {...field} value={field.value || ''} /></FormControl>
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
                        <FormControl><Input type="number" placeholder="e.g., 15" {...field} value={field.value || ''} /></FormControl>
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
                            <FormControl><Input placeholder="e.g., PB-12345" {...field} value={field.value || ''} /></FormControl>
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
                                                    <p className="font-medium">Formula: Revenue - Direct Costs</p>
                                                    <p className="text-xs text-muted-foreground mt-1">
                                                        Auto-calculated, but you can override
                                                    </p>
                                                </TooltipContent>
                                            </Tooltip>
                                        </TooltipProvider>
                                    </div>
                                    <FormControl>
                                        <Input 
                                            type="text" 
                                            placeholder="e.g., 150,000.00" 
                                            {...field} 
                                            onChange={(e) => handleNumericInputChange(e, field)}
                                            onBlur={(e) => handleNumericInputBlur(e, field)}
                                        />
                                    </FormControl>
                                    <p className="text-xs text-muted-foreground mt-1">
                                        💡 Typically auto-calculated. Manual entry will override.
                                    </p>
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
                            <FormControl><Input type="number" placeholder="e.g., 20" {...field} value={field.value || ''} /></FormControl>
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
              <h4 className="text-sm font-semibold">Schedule & Team</h4>
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
                    <Popover>
                    <PopoverTrigger asChild>
                        <FormControl>
                        <Button variant="outline" role="combobox" className="w-full justify-between">
                            {field.value?.length > 0
                            ? `${field.value.length} user(s) selected`
                            : 'Select users...'}
                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                        </FormControl>
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

