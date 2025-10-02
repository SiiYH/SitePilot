
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
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { CalendarIcon, Copy, Check, ShieldCheck } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Separator } from '@/components/ui/separator';

const formSchema = z.object({
    purchaser: z.string().min(3, 'Purchaser name is required.'),
    maxAdmins: z.coerce.number().min(1, 'At least one admin is required.'),
    maxDirectors: z.coerce.number().min(1, 'At least one director is required.'),
    maxEngineers: z.coerce.number().min(1, 'At least one engineer is required.'),
    duration: z.enum(['unlimited', 'specific']),
    expiresAt: z.date().optional(),
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

export default function LicenseGenerator() {
    const [generatedKey, setGeneratedKey] = useState<string | null>(null);
    const [hasCopied, setHasCopied] = useState(false);
    const { toast } = useToast();

    const form = useForm<FormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            purchaser: '',
            maxAdmins: 1,
            maxDirectors: 2,
            maxEngineers: 5,
            duration: 'unlimited',
        },
    });

    const duration = form.watch('duration');

    const onSubmit = (values: FormValues) => {
        const expiry = values.duration === 'specific' && values.expiresAt 
            ? format(values.expiresAt, 'yyyyMMdd') 
            : 'UNLIMITED';

        const key = `SP-VALID-${values.purchaser.toUpperCase().replace(/\s/g, '_')}-A${values.maxAdmins}-D${values.maxDirectors}-E${values.maxEngineers}-EXP${expiry}`;
        
        setGeneratedKey(btoa(key)); // Base64 encode for simple obfuscation
        setHasCopied(false);
        toast({
            title: 'License Key Generated',
            description: 'The license key has been created successfully.',
        });
    };

    const copyToClipboard = () => {
        if (!generatedKey) return;
        navigator.clipboard.writeText(generatedKey);
        setHasCopied(true);
        setTimeout(() => setHasCopied(false), 2000);
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>License Key Generator</CardTitle>
                <CardDescription>
                    Fill in the details below to generate a new license key for a company.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                        <FormField
                            control={form.control}
                            name="purchaser"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Purchaser Name</FormLabel>
                                    <FormControl>
                                        <Input placeholder="e.g., Acme Corporation" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                            <FormField
                                control={form.control}
                                name="maxAdmins"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Max Admins</FormLabel>
                                        <FormControl>
                                            <Input type="number" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="maxDirectors"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Max Directors</FormLabel>
                                        <FormControl>
                                            <Input type="number" {...field} />
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
                                        <FormLabel>Max Engineers</FormLabel>
                                        <FormControl>
                                            <Input type="number" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                         <FormField
                            control={form.control}
                            name="duration"
                            render={({ field }) => (
                                <FormItem className="space-y-3">
                                <FormLabel>License Duration</FormLabel>
                                <FormControl>
                                    <RadioGroup
                                    onValueChange={field.onChange}
                                    defaultValue={field.value}
                                    className="flex flex-col space-y-1 sm:flex-row sm:space-y-0 sm:space-x-4"
                                    >
                                    <FormItem className="flex items-center space-x-2 space-y-0">
                                        <FormControl><RadioGroupItem value="unlimited" /></FormControl>
                                        <FormLabel className="font-normal">Unlimited</FormLabel>
                                    </FormItem>
                                    <FormItem className="flex items-center space-x-2 space-y-0">
                                        <FormControl><RadioGroupItem value="specific" /></FormControl>
                                        <FormLabel className="font-normal">Specific Date</FormLabel>
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
                                    <FormLabel>Expiry Date</FormLabel>
                                    <Popover>
                                        <PopoverTrigger asChild>
                                        <FormControl>
                                            <Button
                                            variant={'outline'}
                                            className={cn(
                                                'w-full pl-3 text-left font-normal sm:w-80',
                                                !field.value && 'text-muted-foreground'
                                            )}
                                            >
                                            {field.value ? format(field.value, 'PPP') : <span>Pick an expiry date</span>}
                                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                            </Button>
                                        </FormControl>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-auto p-0" align="start">
                                        <Calendar
                                            mode="single"
                                            selected={field.value}
                                            onSelect={field.onChange}
                                            disabled={(date) => date < new Date()}
                                            initialFocus
                                        />
                                        </PopoverContent>
                                    </Popover>
                                    <FormMessage />
                                    </FormItem>
                                )}
                             />
                        )}

                        <Button type="submit">
                            <ShieldCheck className="mr-2 h-4 w-4"/>
                            Generate License Key
                        </Button>
                    </form>
                </Form>

                {generatedKey && (
                    <>
                        <Separator className="my-6" />
                        <div className="space-y-4">
                            <h3 className="text-lg font-medium">Generated Key</h3>
                             <div className="flex w-full max-w-lg items-center space-x-2 rounded-md border bg-muted p-2">
                                <p className="flex-1 select-all break-all p-2 font-mono text-sm">
                                    {generatedKey}
                                </p>
                                <Button type="button" size="icon" onClick={copyToClipboard}>
                                    {hasCopied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                                </Button>
                            </div>
                        </div>
                    </>
                )}
            </CardContent>
        </Card>
    );
}
