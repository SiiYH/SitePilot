
'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
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
import { PlusCircle, Loader2, CalendarIcon, ChevronsUpDown, Check, PackagePlus } from 'lucide-react';
import { Project, Material, MaterialPurchase } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { useFirestore, setDocumentNonBlocking, addDocumentNonBlocking } from '@/firebase';
import { useAuth } from '@/hooks/use-auth';
import { doc } from 'firebase/firestore';
import { DateInput } from '@/components/ui/date-input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { cn } from '@/lib/utils';
import AddMaterialDialog from '@/app/dashboard/materials/_components/AddMaterialDialog';

interface AddPurchaseDialogProps {
  project: Project;
  materials: Material[];
  onPurchaseAdded: (purchase: MaterialPurchase) => void;
  onMaterialAdded: (material: Material) => void;
}

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

export default function AddPurchaseDialog({ project, materials, onPurchaseAdded, onMaterialAdded }: AddPurchaseDialogProps) {
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const firestore = useFirestore();
  const { user, company } = useAuth();
  
  const [isMaterialComboboxOpen, setIsMaterialComboboxOpen] = useState(false);
  const [isNewMaterialDialogOpen, setIsNewMaterialDialogOpen] = useState(false);
  const [newMaterialName, setNewMaterialName] = useState('');


  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      quantity: 1,
      unitPrice: 0,
      supplier: '',
      status: 'Ordered',
      discount: 0,
      totalPaid: 0,
    },
  });

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    if (!firestore || !company || !user) return;
    setIsLoading(true);

    const purchaseId = `purchase-${Date.now()}`;
    const totalPrice = (values.quantity * values.unitPrice) - (values.discount || 0);

    const newPurchase: Omit<MaterialPurchase, 'id'> = {
      ...values,
      totalPrice,
      projectId: project.id,
      companyId: company.id,
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
  
  const handleNewMaterialCreated = (newMaterial: Material) => {
    onMaterialAdded(newMaterial);
    form.setValue('materialId', newMaterial.id);
    setIsNewMaterialDialogOpen(false);
    setIsMaterialComboboxOpen(false);
  };
  
  const handleMaterialSearch = (search: string) => {
    setNewMaterialName(search);
  }

  const selectedMaterial = materials.find(m => m.id === form.watch('materialId'));

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <PlusCircle className="mr-2 h-4 w-4" />
          Add Purchase
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add Material Purchase</DialogTitle>
          <DialogDescription>Record a new material purchase for this project.</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
             <FormField
              control={form.control}
              name="materialId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Material</FormLabel>
                   <Popover open={isMaterialComboboxOpen} onOpenChange={setIsMaterialComboboxOpen}>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            role="combobox"
                            className={cn("w-full justify-between", !field.value && "text-muted-foreground")}
                          >
                            {field.value
                              ? materials.find(material => material.id === field.value)?.name
                              : "Select material"}
                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                        <Command>
                          <CommandInput 
                            placeholder="Search material..."
                            onValueChange={handleMaterialSearch}
                          />
                          <CommandList>
                            <CommandEmpty>
                              <Button variant="ghost" className="w-full" onClick={() => setIsNewMaterialDialogOpen(true)}>
                                <PackagePlus className="mr-2 h-4 w-4" />
                                Create "{newMaterialName}"
                              </Button>
                            </CommandEmpty>
                            <CommandGroup>
                              {materials.map((material) => (
                                <CommandItem
                                  value={material.name}
                                  key={material.id}
                                  onSelect={() => {
                                    form.setValue("materialId", material.id)
                                    setIsMaterialComboboxOpen(false)
                                  }}
                                >
                                  <Check
                                    className={cn("mr-2 h-4 w-4", material.id === field.value ? "opacity-100" : "opacity-0")}
                                  />
                                  {material.name}
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

            <div className="grid grid-cols-2 gap-4">
                <FormField
                control={form.control}
                name="quantity"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Quantity</FormLabel>
                    <div className="relative">
                        <Input type="number" placeholder="e.g., 100" {...field} className="pr-12" />
                        {selectedMaterial && <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">{selectedMaterial.unit}</span>}
                    </div>
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
                    <Input type="number" placeholder="e.g., 25.50" {...field} />
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
                    <FormLabel>Discount (Optional)</FormLabel>
                    <Input type="number" placeholder="e.g., 50.00" {...field} />
                    <FormMessage />
                    </FormItem>
                )}
                />
                <FormField
                control={form.control}
                name="totalPaid"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Total Paid (Optional)</FormLabel>
                    <Input type="number" placeholder="e.g., 2500.00" {...field} />
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
                  <Input placeholder="e.g., Acme Building Supplies" {...field} />
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
                  <DateInput
                    value={field.value}
                    onChange={field.onChange}
                  />
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
              <Button type="button" variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Add Purchase
              </Button>
            </DialogFooter>
          </form>
        </Form>
        <AddMaterialDialog 
          open={isNewMaterialDialogOpen} 
          onOpenChange={setIsNewMaterialDialogOpen} 
          onMaterialAdded={handleNewMaterialCreated}
          initialName={newMaterialName}
        />
      </DialogContent>
    </Dialog>
  );
}
