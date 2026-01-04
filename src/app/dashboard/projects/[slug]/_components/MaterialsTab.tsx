
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { MaterialPurchase, Project, Material } from '@/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { format, parseISO } from 'date-fns';
import { Button } from '@/components/ui/button';
import { PlusCircle, Package, DollarSign, Calendar, Truck } from 'lucide-react';
import AddPurchaseDialog from './AddPurchaseDialog';
import { useAuth } from '@/hooks/use-auth';
import { Badge } from '@/components/ui/badge';

interface MaterialsTabProps {
  purchases: MaterialPurchase[];
  materials: Material[];
  project: Project;
  onPurchaseAdded: (purchase: MaterialPurchase) => void;
  onMaterialAdded: (material: Material) => void;
}

const statusVariant: { [key: string]: 'default' | 'secondary' | 'destructive' | 'outline' } = {
  'Ordered': 'secondary',
  'Delivered': 'default',
  'Cancelled': 'destructive',
};

const InfoRow = ({ icon: Icon, label, children }: { icon: React.ElementType, label: string, children: React.ReactNode }) => (
    <div className="flex items-center gap-2 text-sm">
        <Icon className="h-4 w-4 text-muted-foreground" />
        <span className="text-muted-foreground">{label}:</span>
        <span className="font-semibold text-right flex-1">{children}</span>
    </div>
);


export default function MaterialsTab({ purchases, materials, project, onPurchaseAdded, onMaterialAdded }: MaterialsTabProps) {
  const { user } = useAuth();
  const router = useRouter();
  const canAddPurchase = user?.role === 'admin' || user?.role === 'director' || project.assignedEngineers.includes(user!.id);

  const getMaterialName = (materialId: string) => {
    return materials.find(m => m.id === materialId)?.name || 'Unknown';
  };

  const getMaterialUnit = (materialId: string) => {
    return materials.find(m => m.id === materialId)?.unit || 'unit';
  };
  
  const handleRowClick = (purchaseId: string) => {
    router.push(`/dashboard/material-purchases/${purchaseId}`);
  };

  return (
    <Card>
      <CardHeader className="flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <CardTitle>Material Purchases</CardTitle>
          <CardDescription>All materials purchased for this project. Click an item to view details.</CardDescription>
        </div>
        {canAddPurchase && (
          <AddPurchaseDialog
            project={project}
            materials={materials}
            onPurchaseAdded={onPurchaseAdded}
            onMaterialAdded={onMaterialAdded}
          />
        )}
      </CardHeader>
      <CardContent>
        {purchases.length > 0 ? (
          <>
            {/* Mobile View */}
            <div className="space-y-4 md:hidden">
              {purchases.map(purchase => (
                <Card key={purchase.id} onClick={() => handleRowClick(purchase.id)} className="cursor-pointer hover:shadow-md transition-shadow">
                   <CardHeader>
                        <div className="flex items-start justify-between gap-4">
                            <CardTitle className="text-lg">{getMaterialName(purchase.materialId)}</CardTitle>
                            <Badge variant={statusVariant[purchase.status] || 'outline'}>{purchase.status}</Badge>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                         <InfoRow icon={Package} label="Quantity">
                            {purchase.quantity} {getMaterialUnit(purchase.materialId)}
                         </InfoRow>
                         <InfoRow icon={DollarSign} label="Total Price">
                             {project.currency} {purchase.totalPrice.toFixed(2)}
                         </InfoRow>
                          <InfoRow icon={Truck} label="Supplier">
                            {purchase.supplier}
                         </InfoRow>
                         <InfoRow icon={Calendar} label="Date">
                             {format(parseISO(purchase.purchaseDate), 'MMM dd, yyyy')}
                         </InfoRow>
                    </CardContent>
                </Card>
              ))}
            </div>
            {/* Desktop View */}
            <div className="hidden md:block">
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
                    <TableRow key={purchase.id} onClick={() => handleRowClick(purchase.id)} className="cursor-pointer">
                      <TableCell className="font-medium">{getMaterialName(purchase.materialId)}</TableCell>
                      <TableCell>{purchase.quantity} {getMaterialUnit(purchase.materialId)}</TableCell>
                      <TableCell>{project.currency} {purchase.unitPrice.toFixed(2)}</TableCell>
                      <TableCell>{project.currency} {(purchase.discount || 0).toFixed(2)}</TableCell>
                      <TableCell>{project.currency} {(purchase.totalPaid || 0).toFixed(2)}</TableCell>
                      <TableCell>{project.currency} {purchase.totalPrice.toFixed(2)}</TableCell>
                      <TableCell>{purchase.supplier}</TableCell>
                      <TableCell>{format(parseISO(purchase.purchaseDate), 'MMM dd, yyyy')}</TableCell>
                      <TableCell>
                          <Badge variant={statusVariant[purchase.status] || 'outline'}>
                            {purchase.status}
                          </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </>
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
