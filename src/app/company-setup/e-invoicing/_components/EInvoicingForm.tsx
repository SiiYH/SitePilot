
'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Link from 'next/link';
import { Check, ChevronsUpDown, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

type StateCode = {
  Code: string;
  State: string;
};

interface EInvoicingFormProps {
  stateCodes: StateCode[];
}

const identifierLabels = {
  'malaysia-business': 'Business Registration Number (MyCoID)',
  'malaysia-individual': 'NRIC (MyKad/MyTentera/MyPR)',
  'non-malaysian-business': 'Business/Company Registration Number',
  'non-malaysian-individual': 'Passport Number',
  'government': 'Government Entity Identifier',
};

const identifierPlaceholders = {
  'malaysia-business': 'e.g., 202401000123 (1234567-A)',
  'malaysia-individual': 'e.g., 901010141234',
  'non-malaysian-business': 'Enter company registration number',
  'non-malaysian-individual': 'Enter passport number',
  'government': 'Enter government entity ID',
};

const formSchema = z.object({
    eInvEnabled: z.boolean(),
    eInvVersion: z.enum(['v1', 'v2']),
    digitalSignature: z.string().optional(),
    customerType: z.enum([
      'malaysia-business',
      'malaysia-individual',
      'non-malaysian-business',
      'non-malaysian-individual',
      'government'
    ]),
    tin: z.string().optional(),
    identifier: z.string().optional(),
    sstNumber: z.string().optional(),
    tourismTax: z.string().optional(),
    email: z.string().optional(),
    contactNumber: z.string().optional(),
    address1: z.string().optional(),
    address2: z.string().optional(),
    postalCode: z.string().optional(),
    lhdnStateCode: z.string().optional(),
    bankAccount: z.string().optional(),
  }).superRefine((data, ctx) => {
    if (!data.eInvEnabled) return;

    if (!data.customerType) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Customer type is required.', path: ['customerType'] });
    }
    if (!data.email) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Email is required.', path: ['email'] });
    } else if (!z.string().email().safeParse(data.email).success) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Invalid email address.', path: ['email'] });
    }
    
    if (!data.address1) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Address is required.', path: ['address1'] });
    }
    if (!data.postalCode) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Postal code is required.', path: ['postalCode'] });
    }
    
    if (!data.identifier) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'This field is required.', path: ['identifier'] });
    }

    if (data.eInvVersion === 'v2') {
        if (!data.digitalSignature || data.digitalSignature.length !== 6) {
            ctx.addIssue({ code: z.ZodIssueCode.custom, message: "A 6-digit PIN is required for v2.0", path: ['digitalSignature'] });
        }
    }

    if (data.customerType === 'malaysia-business' || data.customerType === 'malaysia-individual') {
        if (!data.lhdnStateCode) {
            ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'LHDN State is required.', path: ['lhdnStateCode'] });
        }
    }

    if (data.customerType === 'malaysia-business' || data.customerType === 'malaysia-individual' || data.customerType === 'non-malaysian-business' || data.customerType === 'non-malaysian-individual') {
        if (!data.tin) {
             ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'TIN is required for this customer type.', path: ['tin'] });
        }
    }

    if (data.customerType === 'malaysia-individual' || data.customerType === 'non-malaysian-individual') {
        if (!data.contactNumber) {
            ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Contact number is required.', path: ['contactNumber'] });
        }
    }

  });

type FormValues = z.infer<typeof formSchema>;

const RequiredIndicator = () => <span className="text-destructive"> *</span>;

export default function EInvoicingForm({ stateCodes }: EInvoicingFormProps) {
  const router = useRouter();
  const [openStateCode, setOpenStateCode] = useState(false)
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      eInvEnabled: true,
      eInvVersion: 'v1',
      customerType: 'malaysia-business',
      email: '',
      contactNumber: '',
      address1: '',
      postalCode: '',
      lhdnStateCode: '',
      identifier: '',
      sstNumber: '',
      tourismTax: '',
      bankAccount: '',
      digitalSignature: '',
      tin: '',
    },
    mode: 'onChange',
  });

  const eInvEnabled = form.watch('eInvEnabled');
  const eInvVersion = form.watch('eInvVersion');
  const customerType = form.watch('customerType');
  const isMalaysiaBased = customerType === 'malaysia-business' || customerType === 'malaysia-individual';

  const isTinRequired = eInvEnabled && ['malaysia-business', 'malaysia-individual', 'non-malaysian-business', 'non-malaysian-individual'].includes(customerType);
  const isContactRequired = eInvEnabled && ['malaysia-individual', 'non-malaysian-individual'].includes(customerType);


  const getStateCodeDisplay = (code: string) => {
    const state = stateCodes.find((s) => s.Code.toLowerCase() === code.toLowerCase());
    if (!state) return "Select LHDN State...";
    return `${state.State} (${state.Code})`;
  }

  const onSubmit = (values: FormValues) => {
    setIsSubmitting(true);
    
    // Save to localStorage
    const companyDataString = localStorage.getItem('siteflow-company');
    const companyData = companyDataString ? JSON.parse(companyDataString) : {};
    
    const combinedData = {
      ...companyData,
      eInvoicing: values,
    };

    localStorage.setItem('siteflow-company', JSON.stringify(combinedData));
    
    console.log(values);
    toast({
        title: "Form Submitted!",
        description: "Your e-invoicing details have been saved.",
    });

    setTimeout(() => {
      setIsSubmitting(false);
      router.push('/dashboard');
    }, 1500);
  };

  return (
    <Card className="mt-6">
      <CardContent className="pt-6">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="space-y-4 rounded-lg border p-4">
              <FormField
                control={form.control}
                name="eInvEnabled"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between">
                    <FormLabel className="text-lg font-semibold">Enable E-Invoicing</FormLabel>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              {eInvEnabled && (
                <div className="space-y-6 pt-4">
                  <FormField
                    control={form.control}
                    name="eInvVersion"
                    render={({ field }) => (
                        <FormItem className="space-y-2">
                          <FormLabel>E-Invoicing Version</FormLabel>
                            <RadioGroup 
                                onValueChange={field.onChange} 
                                defaultValue={field.value} 
                                className="flex gap-4"
                            >
                                <FormItem className="flex items-center space-x-2">
                                <FormControl>
                                    <RadioGroupItem value="v1" id="v1" />
                                </FormControl>
                                <Label htmlFor="v1">v1.0</Label>
                                </FormItem>
                                <FormItem className="flex items-center space-x-2">
                                <FormControl>
                                    <RadioGroupItem value="v2" id="v2" />
                                </FormControl>
                                <Label htmlFor="v2">v2.0 (with Digital Signature)</Label>
                                </FormItem>
                            </RadioGroup>
                            <FormMessage />
                        </FormItem>
                    )}
                  />
                  {eInvVersion === 'v2' && (
                    <FormField
                      control={form.control}
                      name="digitalSignature"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Digital Signature PIN{eInvEnabled && <RequiredIndicator />}</FormLabel>
                          <FormControl>
                            <Input type="password" placeholder="Enter your 6-digit PIN" {...field} />
                          </FormControl>
                          <p className="text-xs text-muted-foreground">Required for v2.0 e-invoicing.</p>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}
                  
                  <Separator/>

                  <div className="space-y-4">
                     <h3 className="text-lg font-semibold">Business Identifiers</h3>
                      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                        <FormField
                            control={form.control}
                            name="customerType"
                            render={({ field }) => (
                                <FormItem>
                                <FormLabel>Customer Type{eInvEnabled && <RequiredIndicator />}</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <FormControl>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select customer type" />
                                    </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        <SelectItem value="malaysia-business">Malaysia Business</SelectItem>
                                        <SelectItem value="malaysia-individual">Malaysia Individual</SelectItem>
                                        <SelectItem value="non-malaysian-business">Non-Malaysian Business</SelectItem>
                                        <SelectItem value="non-malaysian-individual">Non-Malaysian Individual</SelectItem>
                                        <SelectItem value="government">Government Entity</SelectItem>
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="tin"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>TIN (Tax Identification Number){isTinRequired && <RequiredIndicator />}</FormLabel>
                                    <FormControl>
                                        <Input placeholder='e.g., C29183749201 or "NA"' {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                         <FormField
                            control={form.control}
                            name="identifier"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>{identifierLabels[customerType]}{eInvEnabled && <RequiredIndicator />}</FormLabel>
                                    <FormControl>
                                        <Input placeholder={identifierPlaceholders[customerType]} {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        {isMalaysiaBased && (
                          <>
                            <FormField
                                control={form.control}
                                name="sstNumber"
                                render={({ field }) => (
                                <FormItem>
                                    <FormLabel>SST Registration Number</FormLabel>
                                    <FormControl>
                                    <Input placeholder='e.g., J12-3456-78901234 or "NA"' {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="tourismTax"
                                render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Tourism Tax Registration No. (Optional)</FormLabel>
                                    <FormControl>
                                    <Input placeholder='Optional or "NA"' {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                                )}
                            />
                          </>
                        )}
                      </div>
                  </div>
                  
                  <Separator/>

                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">Contact & Address</h3>
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                        <FormField
                            control={form.control}
                            name="email"
                            render={({ field }) => (
                            <FormItem>
                                <FormLabel>Email{eInvEnabled && <RequiredIndicator />}</FormLabel>
                                <FormControl>
                                <Input type="email" placeholder="billing@yourcompany.com" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="contactNumber"
                            render={({ field }) => (
                            <FormItem>
                                <FormLabel>Contact Number{isContactRequired && <RequiredIndicator />}</FormLabel>
                                <FormControl>
                                <Input placeholder="+6012-3456789" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                            )}
                        />
                    </div>
                    <FormField
                      control={form.control}
                      name="address1"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Address Line 1{eInvEnabled && <RequiredIndicator />}</FormLabel>
                          <FormControl>
                            <Input placeholder="Unit/Lot No, Building, Street Name" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="address2"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Address Line 2 (Optional)</FormLabel>
                          <FormControl>
                            <Input placeholder="Taman/Desa/Kawasan, etc." {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                     <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                        <FormField
                            control={form.control}
                            name="postalCode"
                            render={({ field }) => (
                                <FormItem>
                                <FormLabel>Postal Code{eInvEnabled && <RequiredIndicator />}</FormLabel>
                                <FormControl>
                                    <Input placeholder="e.g., 50480" {...field} />
                                </FormControl>
                                <FormMessage />
                                </FormItem>
                            )}
                        />
                        {isMalaysiaBased && (
                            <FormField
                                control={form.control}
                                name="lhdnStateCode"
                                render={({ field }) => (
                                <FormItem className="flex flex-col">
                                    <FormLabel>LHDN State Code{eInvEnabled && isMalaysiaBased && <RequiredIndicator />}</FormLabel>
                                    <Popover open={openStateCode} onOpenChange={setOpenStateCode}>
                                    <PopoverTrigger asChild>
                                        <FormControl>
                                        <Button
                                            variant="outline"
                                            role="combobox"
                                            className={cn("w-full justify-between", !field.value && "text-muted-foreground")}
                                        >
                                            {getStateCodeDisplay(field.value || '')}
                                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                        </Button>
                                        </FormControl>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                                        <Command>
                                        <CommandInput placeholder="Search state..." />
                                        <CommandList>
                                            <CommandEmpty>No state found.</CommandEmpty>
                                            <CommandGroup>
                                            {stateCodes.map((state) => (
                                                <CommandItem
                                                    key={state.Code}
                                                    value={`${state.Code} ${state.State}`}
                                                    onSelect={() => {
                                                        form.setValue("lhdnStateCode", state.Code)
                                                        setOpenStateCode(false)
                                                    }}
                                                >
                                                <Check
                                                    className={cn("mr-2 h-4 w-4", field.value === state.Code ? "opacity-100" : "opacity-0")}
                                                />
                                                <span className='font-mono text-xs mr-2 p-1 bg-muted rounded-sm'>{state.Code}</span>
                                                <span className='flex-1'>{state.State}</span>
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
                        )}
                     </div>
                  </div>
                  
                   <Separator/>

                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">Financial Details</h3>
                     <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                        <FormField
                            control={form.control}
                            name="bankAccount"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Bank Account Number (Optional)</FormLabel>
                                    <FormControl>
                                        <Input placeholder="Enter bank account number" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                     </div>
                  </div>
                </div>
              )}
            </div>
            

            <div className="flex flex-col space-y-2 sm:flex-row sm:space-y-0 sm:space-x-2">
              <Button variant="outline" className="w-full" asChild>
                <Link href="/dashboard">Skip for now</Link>
              </Button>
               <Button type="submit" className="w-full" disabled={isSubmitting || (eInvEnabled && !form.formState.isValid)}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save and Continue
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
