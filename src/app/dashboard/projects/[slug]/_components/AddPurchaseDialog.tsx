
'use client';

import { useState } from 'react';
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
import { PlusCircle, Loader2 } from 'lucide-react';
import { Material, MaterialPurchase, Project } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { useFirestore, setDocumentNonBlocking } from '@/firebase';
import { doc } from 'firebase/firestore';
import { useAuth } from '@/hooks/use-auth';
import { DateInput } from '@/components/ui/date-input';

const formSchema = z.object({
  materialId: z.string().min(1, 'Material is required.'),
  quantity: z.coerce.number().min(0.01, 'Quantity must be greater than 0.'),
  unitPrice: z.coerce.number().min(0.01, 'Unit price must be greater than 0.'),
  supplier: z.string().min(2, 'Supplier name is required.'),
  purchaseDate: z.date({ required_error: 'Purchase date is required.' }),
  status: z.enum(['Ordered', 'Delivered', 'Cancelled']),
  discount: z.coerce.number().optional(),
  totalPaid: z.coerce.number().optional(),
});

interface AddPurchaseDialogProps {
  project: Project;
  materials: Material[];
  onPurchaseAdded: (purchase: MaterialPurchase) => void;
}

export default function AddPurchaseDialog({ project, materials, onPurchaseAdded }: AddPurchaseDialogProps) {
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const { user, company } = useAuth();
  const firestore = useFirestore();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      materialId: '',
      quantity: 0,
      unitPrice: 0,
      supplier: '',
      purchaseDate: new Date(),
      status: 'Ordered',
      discount: 0,
      totalPaid: 0,
    },
  });

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    if (!firestore || !user || !company) return;
    setIsLoading(true);

    const purchaseId = `purchase-${Date.now()}`;
    const newPurchase: Omit<MaterialPurchase, 'id'> = {
      ...values,
      projectId: project.id,
      companyId: company.id,
      totalPrice: values.quantity * values.unitPrice,
      purchaseDate: values.purchaseDate.toISOString(),
      createdAt: new Date().toISOString(),
      createdBy: user.id,
    };
    
    const purchaseDocRef = doc(firestore, 'materialPurchases', purchaseId);
    setDocumentNonBlocking(purchaseDocRef, newPurchase);

    setTimeout(() => {
      onPurchaseAdded({ ...newPurchase, id: purchaseId });
      toast({ title: 'Purchase Added', description: 'The material purchase has been recorded.' });
      setIsLoading(false);
      setOpen(false);
      form.reset();
    }, 1000);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <PlusCircle className="mr-2 h-4 w-4" />
          Add Purchase
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Record Material Purchase</DialogTitle>
          <DialogDescription>
            Add a new material purchase record for this project.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="materialId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Material</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a material" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {materials.map(m => (
                        <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
             <div className="grid grid-cols-2 gap-4">
                <FormField
                    control={form.control}
                    name="quantity"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Quantity</FormLabel>
                        <FormControl>
                            <Input type="number" step="0.01" {...field} />
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="unitPrice"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Unit Price</FormLabel>
                        <FormControl>
                            <Input type="number" step="0.01" placeholder="$" {...field} />
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                />
            </div>
             <div className="grid grid-cols-2 gap-4">
                <FormField
                    control={form.control}
                    name="discount"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Discount</FormLabel>
                        <FormControl>
                            <Input type="number" step="0.01" placeholder="e.g., 10.00" {...field} />
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="totalPaid"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Total Paid</FormLabel>
                        <FormControl>
                            <Input type="number" step="0.01" placeholder="e.g., 100.00" {...field} />
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                />
            </div>
             <FormField
              control={form.control}
              name="supplier"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Supplier</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Global Construction Supplies" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
             <FormField
                control={form.control}
                name="purchaseDate"
                render={({ field }) => (
                    <FormItem className="flex flex-col">
                    <FormLabel>Purchase Date</FormLabel>
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
                name="status"
                render={({ field }) => (
                <FormItem>
                    <FormLabel>Status</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                        <SelectTrigger>
                        <SelectValue placeholder="Select a status" />
                        </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                        <SelectItem value="Ordered">Ordered</SelectItem>
                        <SelectItem value="Delivered">Delivered</SelectItem>
                        <SelectItem value="Cancelled">Cancelled</SelectItem>
                    </SelectContent>
                    </Select>
                    <FormMessage />
                </FormItem>
                )}
            />
            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save Purchase
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
