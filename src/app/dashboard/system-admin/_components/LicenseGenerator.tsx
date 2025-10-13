
'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { DateInput } from '@/components/ui/date-input';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { CalendarIcon, Copy, Check, ShieldCheck, Building2, Users, Wrench, ChevronsUpDown } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Label } from '@/components/ui/label';
import { useFirestore, setDocumentNonBlocking, updateDocumentNonBlocking } from '@/firebase';
import { doc } from 'firebase/firestore';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Company } from '@/types';


const formSchema = z.object({
    purchaserType: z.enum(['existing', 'new']),
    companyId: z.string().optional(),
    purchaserName: z.string().optional(),
    maxDirectors: z.coerce.number().min(1, 'At least one director is required.'),
    maxAdmins: z.coerce.number().min(1, 'At least one admin is required.'),
    maxEngineers: z.coerce.number().min(1, 'At least one engineer is required.'),
    duration: z.enum(['unlimited', 'specific']),
    expiresAt: z.date().optional(),
}).refine(data => {
    if (data.purchaserType === 'existing') {
        return !!data.companyId;
    }
    return true;
}, {
    message: 'A company selection is required.',
    path: ['companyId'],
}).refine(data => {
    if (data.purchaserType === 'new') {
        return !!data.purchaserName && data.purchaserName.length >= 2;
    }
    return true;
}, {
    message: 'Purchaser name must be at least 2 characters.',
    path: ['purchaserName'],
}).refine(data => {
    if (data.duration === 'specific' && !data.expiresAt) {
        return false;
    }
    return true;
}, {
    message: 'Expiry date is required for specific duration.',
    path: ['expiresAt'],
});

type FormValues = z.infer<typeof formSchema>;

export type License = {
  id: string; // The license key is the ID
  purchaser: string;
  maxDirectors: number;
  maxAdmins: number;
  maxEngineers: number;
  expiresAt: string | null;
  createdAt: string;
  activatedAt?: string;
  companyId?: string;
}

interface LicenseGeneratorProps {
    onLicenseGenerated: (newLicense: License) => void;
    companies: Company[];
}

export default function LicenseGenerator({ onLicenseGenerated, companies }: LicenseGeneratorProps) {
    const [generatedKey, setGeneratedKey] = useState<string | null>(null);
    const [hasCopied, setHasCopied] = useState(false);
    const { toast } = useToast();
    const firestore = useFirestore();

    const form = useForm<FormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            purchaserType: 'existing',
            companyId: '',
            purchaserName: '',
            maxDirectors: 2,
            maxAdmins: 1,
            maxEngineers: 5,
            duration: 'unlimited',
        },
    });

    const duration = form.watch('duration');
    const purchaserType = form.watch('purchaserType');

    const onSubmit = (values: FormValues) => {
        let purchaser: string;
        let companyId: string | undefined;

        if (values.purchaserType === 'existing' && values.companyId) {
            const selectedCompany = companies.find(c => c.id === values.companyId);
            if (!selectedCompany) {
                 toast({ variant: "destructive", title: "Company not found." });
                 return;
            }
            purchaser = selectedCompany.name;
            companyId = selectedCompany.id;
        } else if (values.purchaserType === 'new' && values.purchaserName) {
            purchaser = values.purchaserName;
            companyId = undefined;
        } else {
            toast({ variant: "destructive", title: "Invalid purchaser information." });
            return;
        }

        const now = new Date();
        const expiryDate = values.duration === 'specific' && values.expiresAt 
            ? values.expiresAt
            : null;
            
        const expiryString = expiryDate ? format(expiryDate, 'yyyyMMdd') : 'UNLIMITED';

        const key = `SP-VALID-${purchaser.toUpperCase().replace(/\s/g, '_')}-D${values.maxDirectors}-A${values.maxAdmins}-E${values.maxEngineers}-EXP${expiryString}-${Date.now()}`;
        
        const newLicense: License = {
            id: key,
            purchaser: purchaser,
            maxDirectors: values.maxDirectors,
            maxAdmins: values.maxAdmins,
            maxEngineers: values.maxEngineers,
            expiresAt: expiryDate ? expiryDate.toISOString() : null,
            createdAt: now.toISOString(),
        };

        if (firestore) {
            const licenseDocRef = doc(firestore, 'licenses', newLicense.id);
            if (companyId) {
                newLicense.companyId = companyId;
                newLicense.activatedAt = now.toISOString();

                const companyDocRef = doc(firestore, 'companies', companyId);
                updateDocumentNonBlocking(companyDocRef, {
                    activated: true,
                    licenseKey: key,
                });
                
                toast({
                    title: 'License Key Generated & Activated',
                    description: `A license for ${purchaser} has been created and activated.`,
                });
            } else {
                 toast({
                    title: 'License Key Generated',
                    description: `A license for ${purchaser} has been created.`,
                });
            }
            setDocumentNonBlocking(licenseDocRef, newLicense);
        }

        onLicenseGenerated(newLicense);
        setGeneratedKey(key);
        setHasCopied(false);
    };

    const copyToClipboard = async () => {
        if (!generatedKey) return;
        try {
          await navigator.clipboard.writeText(generatedKey);
          setHasCopied(true);
          setTimeout(() => setHasCopied(false), 2000);
          toast({ title: 'Copied!', description: 'License key copied to clipboard.' });
        } catch (error) {
          console.error('Clipboard write failed:', error);
          const textarea = document.createElement('textarea');
          textarea.value = generatedKey;
          document.body.appendChild(textarea);
          textarea.select();
          document.execCommand('copy');
          document.body.removeChild(textarea);
          setHasCopied(true);
          setTimeout(() => setHasCopied(false), 2000);
          toast({ title: 'Copied (fallback)', description: 'Clipboard permissions were restricted.' });
        }
      };
      

    return (
        <Card className="w-full max-w-4xl mx-auto shadow-lg">
            <CardHeader className="space-y-1 pb-6">
                <div className="flex items-center gap-2">
                    <div className="p-2 bg-primary/10 rounded-lg">
                        <ShieldCheck className="h-6 w-6 text-primary" />
                    </div>
                    <CardTitle className="text-2xl md:text-3xl">License Key Generator</CardTitle>
                </div>
                <CardDescription className="text-base">
                    Create a new license key by filling in the company details and user limits below.
                </CardDescription>
            </CardHeader>
            <CardContent className="px-4 sm:px-6">
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                        {/* Purchaser Selection Section */}
                         <div className="space-y-4">
                             <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                                <Building2 className="h-4 w-4" />
                                <span>Purchaser Information</span>
                            </div>
                             <FormField
                                control={form.control}
                                name="purchaserType"
                                render={({ field }) => (
                                    <FormItem className="space-y-3">
                                        <FormControl>
                                            <RadioGroup
                                                onValueChange={field.onChange}
                                                defaultValue={field.value}
                                                className="grid grid-cols-1 gap-3 md:grid-cols-2"
                                            >
                                                <FormItem>
                                                    <FormControl>
                                                        <Label className={cn(
                                                            "flex items-center space-x-3 space-y-0 rounded-lg border-2 p-4 cursor-pointer transition-all hover:bg-accent",
                                                            field.value === 'existing' ? 'border-primary bg-primary/5' : 'border-muted'
                                                        )}>
                                                            <RadioGroupItem value="existing" />
                                                            <span className="font-medium flex-1">
                                                                Existing Company
                                                            </span>
                                                        </Label>
                                                    </FormControl>
                                                </FormItem>
                                                <FormItem>
                                                     <FormControl>
                                                        <Label className={cn(
                                                            "flex items-center space-x-3 space-y-0 rounded-lg border-2 p-4 cursor-pointer transition-all hover:bg-accent",
                                                            field.value === 'new' ? 'border-primary bg-primary/5' : 'border-muted'
                                                        )}>
                                                            <RadioGroupItem value="new" />
                                                            <span className="font-medium flex-1">
                                                                New Purchaser
                                                            </span>
                                                        </Label>
                                                     </FormControl>
                                                </FormItem>
                                            </RadioGroup>
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                             {purchaserType === 'existing' ? (
                                <FormField
                                    control={form.control}
                                    name="companyId"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="text-base">Select Company</FormLabel>
                                            <Popover>
                                                <PopoverTrigger asChild>
                                                    <FormControl>
                                                    <Button
                                                        variant="outline"
                                                        role="combobox"
                                                        className={cn("w-full justify-between h-11 text-base", !field.value && "text-muted-foreground")}
                                                    >
                                                        {field.value ? companies.find(c => c.id === field.value)?.name : "Select a company..."}
                                                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                                    </Button>
                                                    </FormControl>
                                                </PopoverTrigger>
                                                <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                                                    <Command>
                                                    <CommandInput placeholder="Search companies..." />
                                                    <CommandList>
                                                        <CommandEmpty>No companies found.</CommandEmpty>
                                                        <CommandGroup>
                                                        {companies.map((company) => (
                                                            <CommandItem
                                                                key={company.id}
                                                                value={company.name}
                                                                onSelect={() => {
                                                                    form.setValue("companyId", company.id)
                                                                }}
                                                                >
                                                                <Check className={cn("mr-2 h-4 w-4", field.value === company.id ? "opacity-100" : "opacity-0")}/>
                                                                {company.name}
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
                             ) : (
                                <FormField
                                    control={form.control}
                                    name="purchaserName"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="text-base">Purchaser Name</FormLabel>
                                            <FormControl>
                                                <Input 
                                                    placeholder="Enter purchaser name..."
                                                    className="h-11 text-base"
                                                    {...field} 
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                             )}
                        </div>

                        <Separator />

                        {/* User Limits Section */}
                        <div className="space-y-4">
                            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                                <Users className="h-4 w-4" />
                                <span>User Limits</span>
                            </div>
                            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                                <FormField
                                    control={form.control}
                                    name="maxDirectors"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="text-sm font-medium">Max Directors</FormLabel>
                                            <FormControl>
                                                <Input 
                                                    type="number" 
                                                    min="1"
                                                    className="h-11 text-base"
                                                    {...field} 
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="maxAdmins"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="text-sm font-medium">Max Admins</FormLabel>
                                            <FormControl>
                                                <Input 
                                                    type="number" 
                                                    min="1"
                                                    className="h-11 text-base"
                                                    {...field} 
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="maxEngineers"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="text-sm font-medium">Max Engineers</FormLabel>
                                            <FormControl>
                                                <Input 
                                                    type="number" 
                                                    min="1"
                                                    className="h-11 text-base"
                                                    {...field} 
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>
                        </div>

                        <Separator />

                        {/* Duration Section */}
                        <div className="space-y-4">
                            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                                <CalendarIcon className="h-4 w-4" />
                                <span>License Duration</span>
                            </div>
                            <FormField
                                control={form.control}
                                name="duration"
                                render={({ field }) => (
                                    <FormItem className="space-y-3">
                                        <FormControl>
                                            <RadioGroup
                                                onValueChange={field.onChange}
                                                defaultValue={field.value}
                                                className="grid grid-cols-1 gap-3 md:grid-cols-2"
                                            >
                                                <FormItem>
                                                    <FormControl>
                                                        <Label className={cn(
                                                            "flex items-center space-x-3 space-y-0 rounded-lg border-2 p-4 cursor-pointer transition-all hover:bg-accent",
                                                            field.value === 'unlimited' ? 'border-primary bg-primary/5' : 'border-muted'
                                                        )}>
                                                            <RadioGroupItem value="unlimited" />
                                                            <span className="font-medium flex-1">
                                                                Unlimited Duration
                                                            </span>
                                                        </Label>
                                                    </FormControl>
                                                </FormItem>
                                                <FormItem>
                                                     <FormControl>
                                                        <Label className={cn(
                                                            "flex items-center space-x-3 space-y-0 rounded-lg border-2 p-4 cursor-pointer transition-all hover:bg-accent",
                                                            field.value === 'specific' ? 'border-primary bg-primary/5' : 'border-muted'
                                                        )}>
                                                            <RadioGroupItem value="specific" />
                                                            <span className="font-medium flex-1">
                                                                Specific Expiry Date
                                                            </span>
                                                        </Label>
                                                     </FormControl>
                                                </FormItem>
                                            </RadioGroup>
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            {duration === 'specific' && (
                                <FormField
                                    control={form.control}
                                    name="expiresAt"
                                    render={({ field }) => (
                                        <FormItem className="flex flex-col">
                                            <FormLabel className="text-base">Expiry Date</FormLabel>
                                                <FormControl>
                                                    <DateInput 
                                                        value={field.value}
                                                        onChange={field.onChange}
                                                        disabled={(date) => date < new Date()}
                                                    />
                                                </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            )}
                        </div>

                        <Button 
                            type="submit" 
                            className="w-full h-12 text-base font-semibold"
                            size="lg"
                        >
                            <ShieldCheck className="mr-2 h-5 w-5"/>
                            Generate License
                        </Button>
                    </form>
                </Form>

                {generatedKey && (
                    <>
                        <Separator className="my-8" />
                        <div className="space-y-4 animate-in fade-in-50 duration-500">
                            <Alert className="border-green-200 bg-green-50 dark:bg-green-950 dark:border-green-900">
                                <Check className="h-4 w-4 text-green-600 dark:text-green-400" />
                                <AlertDescription className="text-green-800 dark:text-green-200 font-medium">
                                    License key generated successfully! Copy it below.
                                </AlertDescription>
                            </Alert>
                            
                            <div className="space-y-2">
                                <Label className="text-sm font-medium">Your License Key</Label>
                                <div className="flex flex-col sm:flex-row gap-2">
                                    <div className="flex-1 rounded-lg border-2 bg-muted/50 p-3 sm:p-4">
                                        <div className="select-all break-all whitespace-pre-wrap font-mono text-xs sm:text-sm leading-relaxed">
                                            {generatedKey}
                                        </div>
                                    </div>
                                    <Button 
                                        type="button" 
                                        size="lg" 
                                        onClick={copyToClipboard}
                                        className="h-auto sm:h-full px-8 sm:px-4"
                                        variant={hasCopied ? "default" : "outline"}
                                    >
                                        {hasCopied ? (
                                            <>
                                                <Check className="h-8 w-4 sm:mr-2" />
                                                <span className="hidden sm:inline">Copied</span>
                                            </>
                                        ) : (
                                            <>
                                                <Copy className="h-8 w-4 sm:mr-2" />
                                                <span className="hidden sm:inline">Copy</span>
                                            </>
                                        )}
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </>
                )}
            </CardContent>
        </Card>
    );
}
