
'use client';

import { useState, useRef, useEffect } from 'react';
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Upload, X } from 'lucide-react';
import { Claim, Project } from '@/types';
import { useToast } from '@/hooks/use-toast';
import Image from 'next/image';
import { Textarea } from '@/components/ui/textarea';
import { useFirestore, updateDocumentNonBlocking } from '@/firebase';
import { useAuth } from '@/hooks/use-auth';
import { doc } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useRouter } from 'next/navigation';

const currencies = ['MYR', 'USD', 'SGD', 'EUR', 'GBP', 'CAD'];

const formSchema = z.object({
  projectId: z.string().min(1, 'Project is required.'),
  title: z.string().min(3, 'Claim title must be at least 3 characters.'),
  eInvoiceNo: z.string().optional(),
  description: z.string().optional(),
  amount: z.string().refine(val => !isNaN(parseFloat(val.replace(/,/g, ''))), {
    message: "Amount must be a number."
  }).refine(val => parseFloat(val.replace(/,/g, '')) > 0, {
    message: "Amount must be greater than 0."
  }),
  currency: z.string().min(3, 'Currency is required.'),
  receiptImages: z.any().optional(),
});

interface EditClaimFormProps {
    claim: Claim;
    projects: Project[];
}

export default function EditClaimForm({ claim, projects }: EditClaimFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [imagePreviews, setImagePreviews] = useState<string[]>(claim.receiptImageUrls || []);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const firestore = useFirestore();
  const router = useRouter();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      projectId: claim.projectId,
      title: claim.title,
      eInvoiceNo: claim.eInvoiceNo || '',
      description: claim.description || '',
      amount: claim.amount.toString(),
      currency: claim.currency,
    },
  });

  const selectedProjectId = form.watch('projectId');

  useEffect(() => {
    if (selectedProjectId) {
      const projectCurrency = projects.find(p => p.id === selectedProjectId)?.currency;
      if (projectCurrency) {
        form.setValue('currency', projectCurrency);
      }
    }
  }, [selectedProjectId, projects, form]);

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    if (!firestore) {
      toast({ variant: "destructive", title: "Error", description: "Database not found." });
      return;
    }
    setIsLoading(true);
  
    const claimDocRef = doc(firestore, 'claims', claim.id);
  
    // Create the update object and remove undefined/unnecessary fields
    const updatedClaimData: any = {
      projectId: values.projectId,
      title: values.title,
      amount: parseFloat(values.amount.replace(/,/g, '')),
      currency: values.currency,
      receiptImageUrls: imagePreviews,
      status: 'Pending' as const,
      submittedAt: new Date().toISOString(),
    };
  
    // Only add optional fields if they have values
    if (values.eInvoiceNo && values.eInvoiceNo.trim() !== '') {
      updatedClaimData.eInvoiceNo = values.eInvoiceNo;
    }
  
    if (values.description && values.description.trim() !== '') {
      updatedClaimData.description = values.description;
    }
  
    // Don't include receiptImages field - it's only for the form, not for Firestore
    
    updateDocumentNonBlocking(claimDocRef, updatedClaimData);
  
    setTimeout(() => {
      setIsLoading(false);
      toast({
        title: 'Claim Updated',
        description: `Your claim "${values.title}" has been re-submitted for review.`,
      });
      router.push(`/dashboard/claims/${claim.id}`);
    }, 1000);
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files) {
      const remainingSlots = 3 - imagePreviews.length;
      const filesToProcess = Array.from(files).slice(0, remainingSlots);

      if (files.length > remainingSlots) {
        toast({
          variant: 'destructive',
          title: 'Upload Limit Exceeded',
          description: `You can only upload up to 3 images. ${filesToProcess.length} images were added.`,
        });
      }

      filesToProcess.forEach(file => {
        const reader = new FileReader();
        reader.onload = (e) => {
          setImagePreviews(prev => [...prev, e.target?.result as string]);
        };
        reader.readAsDataURL(file);
      });
    }
  };

  const removeImage = (index: number) => {
    setImagePreviews(prev => prev.filter((_, i) => i !== index));
  }

  return (
    <Card>
        <CardHeader>
            <CardTitle>Edit Claim Details</CardTitle>
            <CardDescription>Update the claim information below. Resubmitting will require re-approval.</CardDescription>
        </CardHeader>
        <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="projectId"
              render={({ field }) => {
                const selectedProject = projects.find(p => p.id === field.value);
                return (
                  <FormItem>
                    <FormLabel>Project</FormLabel>
                    <FormControl>
                      <div className="rounded-lg border bg-muted/50 p-3">
                        <p className="text-sm font-medium">{selectedProject?.name}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Project cannot be changed after claim creation
                        </p>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                );
              }}
            />
            <FormField
                    control={form.control}
                    name="title"
                    render={({ field }) => (
                    <FormItem>
                        <FormLabel>Claim Title</FormLabel>
                        <FormControl>
                        <Input placeholder="e.g., Materials for Q2" {...field} />
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="eInvoiceNo"
                    render={({ field }) => (
                    <FormItem>
                        <FormLabel>e-Invoice No. (Optional)</FormLabel>
                        <FormControl>
                        <Input placeholder="e.g., INV-2024-12345" {...field} />
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
                        <Textarea placeholder="Enter a brief description of the claim..." {...field} />
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                    )}
                />
                <div className="flex gap-2">
                    <FormField
                    control={form.control}
                    name="currency"
                    render={({ field }) => (
                        <FormItem className="w-24">
                        <FormLabel>Currency</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                            <SelectTrigger>
                                <SelectValue placeholder="CUR" />
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
                    <FormField
                    control={form.control}
                    name="amount"
                    render={({ field }) => (
                        <FormItem className="flex-grow">
                        <FormLabel>Amount</FormLabel>
                        <FormControl>
                            <Input
                            type="text"
                            placeholder="e.g., 1,500.00"
                            value={field.value}
                            onChange={(e) => {
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
                            }}
                            onBlur={(e) => {
                                const value = e.target.value.replace(/,/g, '');
                                if (value && !isNaN(parseFloat(value))) {
                                const num = parseFloat(value);
                                const formatted = new Intl.NumberFormat('en-US', {
                                    minimumFractionDigits: 2,
                                    maximumFractionDigits: 2
                                }).format(num).replace(/,/g, ''); // Remove commas for storage but not display
                                field.onChange(new Intl.NumberFormat('en-US').format(parseFloat(formatted))); // Reformat for display
                                }
                            }}
                            />
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                    />
                </div>
                <FormField
                    control={form.control}
                    name="receiptImages"
                    render={({ field }) => (
                    <FormItem>
                        <FormLabel>Receipt(s) (Max 3)</FormLabel>
                        <FormControl>
                        <div>
                            <input
                            type="file"
                            ref={fileInputRef}
                            onChange={handleFileChange}
                            className="hidden"
                            accept="image/*"
                            multiple
                            />
                            <Button
                            type="button"
                            variant="outline"
                            onClick={() => fileInputRef.current?.click()}
                            disabled={imagePreviews.length >= 3}
                            >
                            <Upload className="mr-2 h-4 w-4" />
                            Upload Image(s)
                            </Button>
                        </div>
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                    )}
                />
                {imagePreviews.length > 0 && (
                    <div className="grid grid-cols-2 gap-2">
                    {imagePreviews.map((preview, index) => (
                        <div key={index} className="relative mt-2">
                        <Dialog>
                            <DialogTrigger asChild>
                            <div className="relative aspect-square w-full cursor-pointer overflow-hidden rounded-lg border transition-shadow hover:shadow-lg">
                                <Image src={preview} alt={`Receipt preview ${index + 1}`} fill className="object-cover" />
                            </div>
                            </DialogTrigger>
                            <DialogContent className="p-0 sm:max-w-2xl border-0 bg-transparent shadow-none">
                            <DialogTitle className="sr-only">Enlarged Receipt Preview</DialogTitle>
                            <div className="relative aspect-video w-full">
                                <Image
                                src={preview}
                                alt={`Receipt preview ${index + 1}`}
                                fill
                                className="object-contain"
                                />
                            </div>
                            </DialogContent>
                        </Dialog>
                        <Button
                            type="button"
                            variant="destructive"
                            size="icon"
                            className="absolute -top-2 -right-2 h-6 w-6 rounded-full"
                            onClick={() => removeImage(index)}
                        >
                            <X className="h-4 w-4 fill-destructive-foreground" />
                        </Button>
                        </div>
                    ))}
                    </div>
                )}
                
                <div className="flex justify-end gap-2 pt-4">
                    <Button type="button" variant="ghost" onClick={() => router.back()}>
                        Cancel
                    </Button>
                    <Button type="submit" disabled={isLoading}>
                        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Save & Resubmit
                    </Button>
                </div>
            </form>
            </Form>
        </CardContent>
    </Card>
  );
}

    