
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
import { PlusCircle, Loader2, Upload, X } from 'lucide-react';
import { Claim, CreateClaimDialogProps } from '@/types';
import { mockClaims } from '@/lib/data';
import { useToast } from '@/hooks/use-toast';
import Image from 'next/image';

const currencies = ['MYR', 'USD', 'SGD', 'EUR', 'GBP', 'CAD'];

const formSchema = z.object({
  projectId: z.string().min(1, 'Project is required.'),
  title: z.string().min(3, 'Claim title must be at least 3 characters.'),
  amount: z.coerce.number().min(0.01, 'Amount must be greater than 0.'),
  currency: z.string().min(3, 'Currency is required.'),
  receiptImage: z.any().optional(),
});

export default function CreateClaimDialog({ projects, onClaimCreated, userId, defaultProjectId }: CreateClaimDialogProps) {
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      projectId: defaultProjectId || '',
      title: '',
      amount: undefined,
      currency: defaultProjectId ? projects.find(p => p.id === defaultProjectId)?.currency || 'MYR' : 'MYR',
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
    setIsLoading(true);

    const newClaim: Claim = {
      id: `claim-${Date.now()}`,
      projectId: values.projectId,
      title: values.title,
      amount: values.amount,
      currency: values.currency,
      status: 'Pending',
      date: new Date().toISOString(),
      submittedBy: userId,
      receiptImageUrl: imagePreview || undefined,
      receiptImageHint: imagePreview ? 'uploaded receipt' : undefined,
    };
    
    mockClaims.unshift(newClaim);

    setTimeout(() => {
      onClaimCreated(newClaim);
      setIsLoading(false);
      setOpen(false);
      form.reset({ projectId: defaultProjectId || '', title: '', amount: undefined, currency: 'MYR' });
      setImagePreview(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      toast({
        title: 'Claim Created',
        description: `Your claim "${newClaim.title}" has been submitted for review.`,
      });
    }, 1000);
  };
  
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <PlusCircle className="mr-2 h-4 w-4" />
          Create Claim
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Create New Claim</DialogTitle>
          <DialogDescription>Fill in the details below to submit a new payment claim.</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="projectId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Project</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a project" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {projects.map(p => (
                        <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                      ))}
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
                  <FormLabel>Claim Title</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Materials for Q2" {...field} />
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
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
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
                        <Input type="number" placeholder="e.g., 1500.00" {...field} />
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )}
                />
            </div>
             <FormField
                control={form.control}
                name="receiptImage"
                render={({ field }) => (
                <FormItem>
                    <FormLabel>Receipt (Optional)</FormLabel>
                    <FormControl>
                    <div>
                        <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileChange}
                        className="hidden"
                        accept="image/*"
                        />
                        <Button type="button" variant="outline" onClick={() => fileInputRef.current?.click()}>
                            <Upload className="mr-2 h-4 w-4" />
                            Upload Image
                        </Button>
                    </div>
                    </FormControl>
                    <FormMessage />
                </FormItem>
                )}
            />
            {imagePreview && (
                <div className="relative mt-2 w-full h-48">
                    <Image src={imagePreview} alt="Receipt preview" fill className="rounded-md border object-contain"/>
                    <Button
                        type="button"
                        variant="destructive"
                        size="icon"
                        className="absolute -top-2 -right-2 h-6 w-6 rounded-full"
                        onClick={() => {
                            setImagePreview(null);
                            if(fileInputRef.current) fileInputRef.current.value = '';
                        }}
                    >
                        <X className="h-4 w-4" />
                    </Button>
                </div>
            )}
            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Submit Claim
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
