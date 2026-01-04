
'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '@/hooks/use-auth';
import { useFirestore, setDocumentNonBlocking } from '@/firebase';
import { doc } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, PlusCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Material } from '@/types';

const formSchema = z.object({
  name: z.string().min(2, 'Material name is required.'),
  description: z.string().optional(),
  category: z.string().min(2, 'Category is required.'),
  unit: z.string().min(1, 'Unit of measurement is required.'),
});

type FormValues = z.infer<typeof formSchema>;

interface AddMaterialDialogProps {
  onMaterialAdded: (material: Material) => void;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  initialName?: string;
}

export default function AddMaterialDialog({ onMaterialAdded, open, onOpenChange, initialName }: AddMaterialDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const { company } = useAuth();
  const firestore = useFirestore();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: initialName || '',
      description: '',
      category: '',
      unit: '',
    },
  });
  
  useEffect(() => {
    if (initialName) {
      form.setValue('name', initialName);
    }
  }, [initialName, form]);

  const onSubmit = (values: FormValues) => {
    if (!firestore || !company) return;
    setIsLoading(true);

    const materialId = `mat-${Date.now()}`;
    const newMaterial: Omit<Material, 'id'> = {
      ...values,
      companyId: company.id,
      createdAt: new Date().toISOString(),
    };

    const materialDocRef = doc(firestore, 'materials', materialId);
    setDocumentNonBlocking(materialDocRef, newMaterial);

    setTimeout(() => {
      onMaterialAdded({ ...newMaterial, id: materialId });
      toast({ title: 'Material Added', description: `${values.name} has been added to the repository.` });
      setIsLoading(false);
      onOpenChange?.(false); // Close dialog
      form.reset();
    }, 1000);
  };
  
  const dialogProps = open !== undefined && onOpenChange ? { open, onOpenChange } : {};

  return (
    <Dialog {...dialogProps}>
      {open === undefined && (
        <DialogTrigger asChild>
          <Button>
            <PlusCircle className="mr-2 h-4 w-4" />
            Add Material
          </Button>
        </DialogTrigger>
      )}
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add New Material</DialogTitle>
          <DialogDescription>
            Add a new material to your central repository.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Material Name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Portland Cement" {...field} />
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
                    <Textarea placeholder="Details about the material..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
             <div className="grid grid-cols-2 gap-4">
                <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Category</FormLabel>
                    <FormControl>
                        <Input placeholder="e.g., Cement" {...field} />
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )}
                />
                <FormField
                control={form.control}
                name="unit"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Unit of Measure</FormLabel>
                    <FormControl>
                        <Input placeholder="e.g., Bag, Ton, etc." {...field} />
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )}
                />
            </div>
            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => onOpenChange?.(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Add Material
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
