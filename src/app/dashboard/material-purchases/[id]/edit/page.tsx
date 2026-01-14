// File: src/app/dashboard/material-purchases/[id]/edit/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams, notFound } from 'next/navigation';
import { useDoc, useMemoFirebase, useFirestore } from '@/firebase';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import type { MaterialPurchase, Material, Project, Company } from '@/types';
import { useAuth } from '@/hooks/use-auth';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, ArrowLeft, Save, X } from 'lucide-react';
import { format, parseISO, differenceInHours } from 'date-fns';
import { useToast } from '@/hooks/use-toast';

const GRACE_PERIOD_HOURS = 90;

export default function EditMaterialPurchasePage() {
  const router = useRouter();
  const params = useParams();
  const purchaseId = params.id as string;
  const { user: currentUser } = useAuth();
  const firestore = useFirestore();
  const { toast } = useToast();

  const purchaseRef = useMemoFirebase(
    () => doc(firestore, 'materialPurchases', purchaseId),
    [firestore, purchaseId]
  );
  const { data: purchase, isLoading: purchaseLoading } = useDoc<MaterialPurchase>(purchaseRef);

  const materialRef = useMemoFirebase(
    () => purchase ? doc(firestore, 'materials', purchase.materialId) : null,
    [firestore, purchase?.materialId]
  );
  const { data: material } = useDoc<Material>(materialRef);

  const companyRef = useMemoFirebase(
    () => purchase ? doc(firestore, 'companies', purchase.companyId) : null,
    [firestore, purchase?.companyId]
  );
  const { data: company } = useDoc<Company>(companyRef);

  // Debug render state
  console.log('Render: ', {
    purchaseLoading,
    purchase: purchase ? 'Present' : 'Null/Undefined',
    purchaseId,
    purchaseRefPath: purchaseRef?.path
  });
  if (purchase) console.log('Purchase Data:', purchase);

  const currencyCode = company?.currency || 'USD';

  console.log('params:', params);
  console.log('purchaseId:', purchaseId);
  console.log('purchaseRef:', purchaseRef);

  const [formData, setFormData] = useState({
    quantity: 0,
    unitPrice: 0,
    supplier: '',
    purchaseDate: '',
    status: '' as MaterialPurchase['status'],
    discount: 0,
    totalPaid: 0,
  });

  // Debug formData changes
  useEffect(() => {
    console.log('FormData State:', formData);
  }, [formData]);

  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (purchase) {
      console.log('Attempting to populate form with purchase:', purchase);
      try {
        const newData = {
          quantity: purchase.quantity,
          unitPrice: purchase.unitPrice,
          supplier: purchase.supplier,
          purchaseDate: purchase.purchaseDate ? purchase.purchaseDate.split('T')[0] : '',
          status: purchase.status,
          discount: purchase.discount || 0,
          totalPaid: purchase.totalPaid || 0,
        };
        console.log('Setting new form data:', newData);
        setFormData(newData);
      } catch (error) {
        console.error('Error populating form data:', error);
      }
    }
  }, [purchase]);

  if (purchaseLoading) {
    return (
      <div className="flex h-[calc(100vh-10rem)] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!purchase) {
    notFound();
  }

  // Check edit permissions
  const createdAt = parseISO(purchase.createdAt);
  const hoursSinceCreation = differenceInHours(new Date(), createdAt);
  const withinGracePeriod = hoursSinceCreation <= GRACE_PERIOD_HOURS;

  const canFullEdit = (purchase.status === 'Ordered' || purchase.status === 'Pending') && withinGracePeriod;
  const canEditAfterDelivery = purchase.status === 'Delivered' || purchase.status === 'Partially Delivered';
  const isReadOnly = purchase.status === 'Cancelled';

  if (isReadOnly) {
    router.push(`/dashboard/material-purchases/${purchaseId}`);
    return null;
  }

  const totalPrice = formData.quantity * formData.unitPrice;
  const finalAmount = totalPrice - formData.discount;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      const updateData: any = {
        status: formData.status,
        updatedAt: serverTimestamp(),
      };

      // Only allow quantity/price changes if full edit is permitted
      if (canFullEdit) {
        updateData.quantity = formData.quantity;
        updateData.unitPrice = formData.unitPrice;
        updateData.totalPrice = totalPrice;
        updateData.supplier = formData.supplier;
        updateData.purchaseDate = new Date(formData.purchaseDate).toISOString();
        updateData.discount = formData.discount;
        updateData.totalPaid = formData.totalPaid;
      } else {
        // Limited edit - only allow status, discount, and totalPaid changes
        updateData.discount = formData.discount;
        updateData.totalPaid = formData.totalPaid;
      }

      await updateDoc(purchaseRef, updateData);

      toast({
        title: "Success",
        description: "Purchase updated successfully",
      });
      router.push(`/dashboard/material-purchases/${purchaseId}`);
    } catch (error) {
      console.error('Error updating purchase:', error);
      toast({
        title: "Error",
        description: "Failed to update purchase",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Button variant="outline" onClick={() => router.back()}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Cancel
        </Button>
      </div>

      <Card className="max-w-3xl mx-auto">
        <CardHeader>
          <CardTitle className="text-2xl">
            Edit Purchase Order #{purchase.id.slice(0, 8).toUpperCase()}
          </CardTitle>
          <CardDescription>
            {canFullEdit
              ? 'Full editing available'
              : 'Limited editing - Can only update status, discount, and payment info'}
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Material Info (Read-only) */}
            <div className="space-y-2">
              <Label>Material</Label>
              <Input
                value={material?.name || 'Loading...'}
                disabled
                className="bg-muted"
              />
            </div>

            {/* Editable fields */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="quantity">Quantity</Label>
                <Input
                  id="quantity"
                  type="number"
                  step="any"
                  value={formData.quantity}
                  onChange={(e) => setFormData({ ...formData, quantity: parseFloat(e.target.value) || 0 })}
                  disabled={!canFullEdit}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="unitPrice">Unit Price ({currencyCode})</Label>
                <Input
                  id="unitPrice"
                  type="number"
                  step="0.01"
                  value={formData.unitPrice}
                  onChange={(e) => setFormData({ ...formData, unitPrice: parseFloat(e.target.value) || 0 })}
                  disabled={!canFullEdit}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="supplier">Supplier</Label>
                <Input
                  id="supplier"
                  value={formData.supplier}
                  onChange={(e) => setFormData({ ...formData, supplier: e.target.value })}
                  disabled={!canFullEdit}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="purchaseDate">Purchase Date</Label>
                <Input
                  id="purchaseDate"
                  type="date"
                  value={formData.purchaseDate}
                  onChange={(e) => setFormData({ ...formData, purchaseDate: e.target.value })}
                  disabled={!canFullEdit}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value) => setFormData({ ...formData, status: value as MaterialPurchase['status'] })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Pending">Pending</SelectItem>
                    <SelectItem value="Ordered">Ordered</SelectItem>
                    <SelectItem value="Partially Delivered">Partially Delivered</SelectItem>
                    <SelectItem value="Delivered">Delivered</SelectItem>
                    <SelectItem value="Returned">Returned</SelectItem>
                    <SelectItem value="Cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="discount">Discount ({currencyCode})</Label>
                <Input
                  id="discount"
                  type="number"
                  step="0.01"
                  value={formData.discount}
                  onChange={(e) => setFormData({ ...formData, discount: parseFloat(e.target.value) || 0 })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="totalPaid">Total Paid ({currencyCode})</Label>
                <Input
                  id="totalPaid"
                  type="number"
                  step="0.01"
                  value={formData.totalPaid}
                  onChange={(e) => setFormData({ ...formData, totalPaid: parseFloat(e.target.value) || 0 })}
                />
              </div>
            </div>

            {/* Summary */}
            <div className="border rounded-lg p-4 bg-muted/50 space-y-2">
              <h3 className="font-semibold">Summary</h3>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span className="font-medium">{currencyCode} {totalPrice.toFixed(2)}</span>
                </div>
                {formData.discount > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>Discount:</span>
                    <span className="font-medium">-{currencyCode} {formData.discount.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between font-bold text-lg border-t pt-2">
                  <span>Total:</span>
                  <span>{currencyCode} {finalAmount.toFixed(2)}</span>
                </div>
                {formData.totalPaid > 0 && (
                  <>
                    <div className="flex justify-between text-green-600">
                      <span>Paid:</span>
                      <span className="font-medium">{currencyCode} {formData.totalPaid.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between font-semibold text-orange-600">
                      <span>Balance Due:</span>
                      <span>{currencyCode} {(finalAmount - formData.totalPaid).toFixed(2)}</span>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex justify-end gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
              >
                <X className="mr-2 h-4 w-4" />
                Cancel
              </Button>
              <Button type="submit" disabled={isSaving}>
                {isSaving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Save Changes
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}