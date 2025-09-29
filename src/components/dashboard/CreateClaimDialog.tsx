
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
import { Textarea } from '@/components/ui/textarea';

const currencies = ['MYR', 'USD', 'SGD', 'EUR', 'GBP', 'CAD'];

const formSchema = z.object({
  projectId: z.string().min(1, 'Project is required.'),
  title: z.string().min(3, 'Claim title must be at least 3 characters.'),
  description: z.string().optional(),
  amount: z.coerce.number().min(0.01, 'Amount must be greater than 0.'),
  currency: z.string().min(3, 'Currency is required.'),
  receiptImages: z.any().optional(),
});

export default function CreateClaimDialog({ projects, onClaimCreated, userId, defaultProjectId }: CreateClaimDialogProps) {
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      projectId: defaultProjectId || '',
      title: '',
      description: '',
      amount: '' as any, // Use empty string for controlled input
      currency: 'MYR',
    },
  });

  const selectedProjectId = form.watch('projectId');

  useEffect(() => {
    if (open) {
        form.reset({
            projectId: defaultProjectId || '',
            title: '',
            description: '',
            amount: '' as any, // Use empty string for controlled input
            currency: 'MYR',
        });
        const projectCurrency = projects.find(p => p.id === (defaultProjectId || selectedProjectId))?.currency;
        if (projectCurrency) {
            form.setValue('currency', projectCurrency);
        } else {
            form.setValue('currency', 'MYR');
        }
        setImagePreviews([]);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    }
  }, [open, defaultProjectId, form, projects, selectedProjectId]);

  useEffect(() => {
    if (selectedProjectId) {
      const projectCurrency = projects.find(p => p.id === selectedProjectId)?.currency;
      if (projectCurrency) {
        form.setValue('currency', projectCurrency);
      }
    } else {
        form.setValue('currency', 'MYR');
    }
  }, [selectedProjectId, projects, form]);

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    setIsLoading(true);

    const newClaim: Claim = {
      id: `claim-${Date.now()}`,
      projectId: values.projectId,
      title: values.title,
      description: values.description,
      amount: values.amount,
      currency: values.currency,
      status: 'Pending',
      date: new Date().toISOString(),
      submittedBy: userId,
      receiptImageUrls: imagePreviews,
    };
    
    mockClaims.unshift(newClaim);

    setTimeout(() => {
      onClaimCreated(newClaim);
      setIsLoading(false);
      setOpen(false);
      toast({
        title: 'Claim Created',
        description: `Your claim "${newClaim.title}" has been submitted for review.`,
      });
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
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-4">
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
                          <Input type="number" placeholder="e.g., 1500.00" {...field} />
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
                                    <Image src={preview} alt={`Receipt preview ${index + 1}`} fill className="object-cover"/>
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
            </div>
            <DialogFooter className="pt-4">
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
