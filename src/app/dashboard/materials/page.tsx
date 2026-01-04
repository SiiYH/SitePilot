'use client';

import { useState, useMemo } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, where } from 'firebase/firestore';
import { Material, MaterialPurchase } from '@/types';
import { Loader2, Package, DollarSign, LineChart, PlusCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { format } from 'date-fns';
import { ResponsiveContainer, LineChart as RechartsLineChart, XAxis, YAxis, Tooltip, Legend, Line } from 'recharts';
import AddMaterialDialog from './_components/AddMaterialDialog';
import LockedOverlay from '@/components/ui/lockedOverlay';

export default function MaterialsPage() {
  const { user, company, isLicenseValid, isLicenseExpired } = useAuth();
  const firestore = useFirestore();
  const [selectedMaterial, setSelectedMaterial] = useState<Material | null>(null);
  
  // Check if license is active
  const isLicenseActive = isLicenseValid;
  
  const materialsQuery = useMemoFirebase(() => {
    if (!firestore || !company?.id) return null;
    return query(collection(firestore, 'materials'), where('companyId', '==', company.id));
  }, [firestore, company?.id]);

  const purchasesQuery = useMemoFirebase(() => {
    if (!firestore || !company?.id) return null;
    // Query the top-level 'materialPurchases' collection, filtering by the current companyId.
    return query(collection(firestore, 'materialPurchases'), where('companyId', '==', company.id));
  }, [firestore, company?.id]);


  const { data: materials, isLoading: materialsLoading } = useCollection<Material>(materialsQuery);
  const { data: purchases, isLoading: purchasesLoading } = useCollection<MaterialPurchase>(purchasesQuery);

  const loading = materialsLoading || purchasesLoading;

  const handleMaterialSelect = (material: Material) => {
    setSelectedMaterial(material);
  };

  const priceHistory = useMemo(() => {
    if (!selectedMaterial || !purchases) return [];
    return purchases
      .filter(p => p.materialId === selectedMaterial.id)
      .sort((a, b) => new Date(a.purchaseDate).getTime() - new Date(b.purchaseDate).getTime())
      .map(p => ({
        date: format(new Date(p.purchaseDate), 'MMM yyyy'),
        price: p.unitPrice,
      }));
  }, [selectedMaterial, purchases]);
  
  const handleMaterialAdded = (newMaterial: Material) => {
    // The useCollection hook will automatically update the UI.
    console.log('New material added:', newMaterial);
  };


  if (loading) {
    return (
      <div className="flex h-[calc(100vh-10rem)] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Material Management</h2>
          <p className="text-muted-foreground">
            Track all construction materials and monitor their price fluctuations.
          </p>
        </div>
        <AddMaterialDialog onMaterialAdded={handleMaterialAdded} />
      </div>

       <div className="relative">
        {!isLicenseActive && (
          <LockedOverlay 
            user={user}
            isLicenseExpired={isLicenseExpired}
            message="Activate your license to access Material Management."
          />
        )}
        <div className={!isLicenseActive ? 'pointer-events-none select-none' : ''}>
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            <Card className="lg:col-span-1">
                <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Package className="h-5 w-5" />
                    All Materials
                </CardTitle>
                <CardDescription>Select a material to view its price history.</CardDescription>
                </CardHeader>
                <CardContent>
                <Table>
                    <TableHeader>
                    <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Category</TableHead>
                        <TableHead>Unit</TableHead>
                    </TableRow>
                    </TableHeader>
                    <TableBody>
                    {materials && materials.length > 0 ? (
                        materials.map(material => (
                        <TableRow 
                            key={material.id}
                            onClick={() => handleMaterialSelect(material)}
                            className={`cursor-pointer ${selectedMaterial?.id === material.id ? 'bg-muted' : ''}`}
                        >
                            <TableCell className="font-medium">{material.name}</TableCell>
                            <TableCell>{material.category}</TableCell>
                            <TableCell>{material.unit}</TableCell>
                        </TableRow>
                        ))
                    ) : (
                        <TableRow>
                        <TableCell colSpan={3} className="h-24 text-center">
                            No materials found.
                        </TableCell>
                        </TableRow>
                    )}
                    </TableBody>
                </Table>
                </CardContent>
            </Card>

            <Card className="lg:col-span-2">
                <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <LineChart className="h-5 w-5" />
                    Price Fluctuation
                </CardTitle>
                <CardDescription>
                    {selectedMaterial
                    ? `Price history for ${selectedMaterial.name} per ${selectedMaterial.unit}.`
                    : 'Select a material to see its price trend.'}
                </CardDescription>
                </CardHeader>
                <CardContent>
                {selectedMaterial ? (
                    priceHistory.length > 0 ? (
                    <ResponsiveContainer width="100%" height={300}>
                        <RechartsLineChart data={priceHistory}>
                        <XAxis dataKey="date" />
                        <YAxis tickFormatter={(value) => `$${value}`} />
                        <Tooltip
                            formatter={(value: number) => [
                            `$${value.toFixed(2)}`,
                            'Unit Price',
                            ]}
                        />
                        <Legend />
                        <Line
                            type="monotone"
                            dataKey="price"
                            stroke="hsl(var(--primary))"
                            strokeWidth={2}
                            name={`Price per ${selectedMaterial.unit}`}
                        />
                        </RechartsLineChart>
                    </ResponsiveContainer>
                    ) : (
                    <div className="flex h-[300px] items-center justify-center rounded-md border-2 border-dashed">
                        <p className="text-muted-foreground">No purchase data for this material yet.</p>
                    </div>
                    )
                ) : (
                    <div className="flex h-[300px] items-center justify-center rounded-md border-2 border-dashed">
                    <p className="text-muted-foreground">Select a material to begin.</p>
                    </div>
                )}
                </CardContent>
            </Card>
            </div>
        </div>
      </div>
    </div>
  );
}
