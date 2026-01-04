
'use client';

import { useState } from 'react';
import { MaterialPurchase, Project, Material } from '@/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { format, parseISO } from 'date-fns';
import { Button } from '@/components/ui/button';
import { PlusCircle, Package } from 'lucide-react';
import AddPurchaseDialog from './AddPurchaseDialog';
import { useAuth } from '@/hooks/use-auth';

interface MaterialsTabProps {
  purchases: MaterialPurchase[];
  materials: Material[];
  project: Project;
  onPurchaseAdded: (purchase: MaterialPurchase) => void;
}

export default function MaterialsTab({ purchases, materials, project, onPurchaseAdded }: MaterialsTabProps) {
  const { user } = useAuth();
  const canAddPurchase = user?.role === 'admin' || user?.role === 'director' || project.assignedEngineers.includes(user.id);

  const getMaterialName = (materialId: string) => {
    return materials.find(m => m.id === materialId)?.name || 'Unknown';
  };

  const getMaterialUnit = (materialId: string) => {
    return materials.find(m => m.id === materialId)?.unit || 'unit';
  };
  
  return (
    <Card>
      <CardHeader className="flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <CardTitle>Material Purchases</CardTitle>
          <CardDescription>All materials purchased for this project.</CardDescription>
        </div>
        {canAddPurchase && (
          <AddPurchaseDialog
            project={project}
            materials={materials}
            onPurchaseAdded={onPurchaseAdded}
          />
        )}
      </CardHeader>
      <CardContent>
        {purchases.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Material</TableHead>
                <TableHead>Quantity</TableHead>
                <TableHead>Unit Price</TableHead>
                <TableHead>Discount</TableHead>
                <TableHead>Total Paid</TableHead>
                <TableHead>Total Price</TableHead>
                <TableHead>Supplier</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {purchases.map(purchase => (
                <TableRow key={purchase.id}>
                  <TableCell className="font-medium">{getMaterialName(purchase.materialId)}</TableCell>
                  <TableCell>{purchase.quantity} {getMaterialUnit(purchase.materialId)}</TableCell>
                  <TableCell>${purchase.unitPrice.toFixed(2)}</TableCell>
                  <TableCell>${(purchase.discount || 0).toFixed(2)}</TableCell>
                  <TableCell>${(purchase.totalPaid || 0).toFixed(2)}</TableCell>
                  <TableCell>${purchase.totalPrice.toFixed(2)}</TableCell>
                  <TableCell>{purchase.supplier}</TableCell>
                  <TableCell>{format(parseISO(purchase.purchaseDate), 'MMM dd, yyyy')}</TableCell>
                  <TableCell>{purchase.status}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-muted-foreground/30 bg-muted/20 p-12 text-center">
            <Package className="h-10 w-10 mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold text-muted-foreground">No Material Purchases</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              This project does not have any material purchases recorded yet.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
