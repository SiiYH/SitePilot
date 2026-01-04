'use client';

import { useState, useMemo } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, where } from 'firebase/firestore';
import { Material, MaterialPurchase } from '@/types';
import { Loader2, Package, DollarSign, LineChart, TrendingUp, TrendingDown, Minus, ShoppingCart } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { ResponsiveContainer, LineChart as RechartsLineChart, XAxis, YAxis, Tooltip, Legend, Line, CartesianGrid } from 'recharts';
import AddMaterialDialog from './_components/AddMaterialDialog';
import LockedOverlay from '@/components/ui/lockedOverlay';

const StatCard = ({ 
  icon: Icon, 
  label, 
  value, 
  trend, 
  trendValue 
}: { 
  icon: React.ElementType; 
  label: string; 
  value: string | number; 
  trend?: 'up' | 'down' | 'neutral';
  trendValue?: string;
}) => {
  const TrendIcon = trend === 'up' ? TrendingUp : trend === 'down' ? TrendingDown : Minus;
  const trendColor = trend === 'up' ? 'text-green-600' : trend === 'down' ? 'text-red-600' : 'text-gray-600';
  
  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-sm font-medium text-muted-foreground">{label}</p>
            <p className="text-2xl font-bold">{value}</p>
            {trendValue && (
              <div className={`flex items-center gap-1 text-sm ${trendColor}`}>
                <TrendIcon className="h-4 w-4" />
                <span>{trendValue}</span>
              </div>
            )}
          </div>
          <div className="p-3 rounded-full bg-primary/10">
            <Icon className="h-6 w-6 text-primary" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default function MaterialsPage() {
  const { user, company, isLicenseValid, isLicenseExpired } = useAuth();
  const firestore = useFirestore();
  const [selectedMaterial, setSelectedMaterial] = useState<Material | null>(null);
  
  const isLicenseActive = isLicenseValid;
  
  const materialsQuery = useMemoFirebase(() => {
    if (!firestore || !company?.id) return null;
    return query(collection(firestore, 'materials'), where('companyId', '==', company.id));
  }, [firestore, company?.id]);

  const purchasesQuery = useMemoFirebase(() => {
    if (!firestore || !company?.id) return null;
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

  // Calculate statistics
  const stats = useMemo(() => {
    if (!materials || !purchases) return null;
    
    const totalMaterials = materials.length;
    const totalPurchases = purchases.length;
    const totalSpent = purchases.reduce((sum, p) => sum + (p.totalPrice || 0), 0);
    
    // Calculate average price trend for selected material
    let priceTrend: 'up' | 'down' | 'neutral' = 'neutral';
    let trendValue = '';
    
    if (selectedMaterial && priceHistory.length >= 2) {
      const firstPrice = priceHistory[0].price;
      const lastPrice = priceHistory[priceHistory.length - 1].price;
      const change = ((lastPrice - firstPrice) / firstPrice) * 100;
      
      if (Math.abs(change) > 1) {
        priceTrend = change > 0 ? 'up' : 'down';
        trendValue = `${Math.abs(change).toFixed(1)}%`;
      }
    }
    
    return {
      totalMaterials,
      totalPurchases,
      totalSpent,
      priceTrend,
      trendValue,
    };
  }, [materials, purchases, selectedMaterial, priceHistory]);
  
  const handleMaterialAdded = (newMaterial: Material) => {
    console.log('New material added:', newMaterial);
  };

  if (loading) {
    return (
      <div className="flex h-[calc(100vh-10rem)] items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto" />
          <p className="text-sm text-muted-foreground">Loading materials...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-8">
      {/* Header Section */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text">
            Material Management
          </h2>
          <p className="text-muted-foreground mt-1">
            Track construction materials and monitor price fluctuations over time.
          </p>
        </div>
        <AddMaterialDialog onMaterialAdded={handleMaterialAdded} />
      </div>

      {/* Statistics Cards */}
      {stats && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <StatCard 
            icon={Package}
            label="Total Materials"
            value={stats.totalMaterials}
          />
          <StatCard 
            icon={ShoppingCart}
            label="Total Purchases"
            value={stats.totalPurchases}
          />
          <StatCard 
            icon={DollarSign}
            label="Total Spent"
            value={`$${stats.totalSpent.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
            trend={selectedMaterial ? stats.priceTrend : undefined}
            trendValue={selectedMaterial && stats.trendValue ? stats.trendValue : undefined}
          />
        </div>
      )}

      {/* Main Content */}
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
            {/* Materials List */}
            <Card className="lg:col-span-1 border-2 shadow-lg">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <Package className="h-5 w-5 text-primary" />
                  </div>
                  All Materials
                </CardTitle>
                <CardDescription>Click a material to view its price history</CardDescription>
              </CardHeader>
              <CardContent>
                {materials && materials.length > 0 ? (
                  <div className="space-y-2 max-h-[500px] overflow-y-auto pr-2">
                    {materials.map(material => (
                      <div
                        key={material.id}
                        onClick={() => handleMaterialSelect(material)}
                        className={`group p-4 rounded-lg border-2 cursor-pointer transition-all duration-200 ${
                          selectedMaterial?.id === material.id
                            ? 'border-primary bg-primary/5 shadow-md'
                            : 'border-border hover:border-primary/50 hover:bg-accent/50'
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="space-y-1 flex-1">
                            <p className={`font-semibold ${
                              selectedMaterial?.id === material.id ? 'text-primary' : 'group-hover:text-primary'
                            } transition-colors`}>
                              {material.name}
                            </p>
                            <div className="flex items-center gap-2 flex-wrap">
                              <Badge variant="outline" className="text-xs">
                                {material.category}
                              </Badge>
                              <span className="text-xs text-muted-foreground">
                                per {material.unit}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <Package className="h-12 w-12 text-muted-foreground/50 mb-3" />
                    <p className="text-sm font-medium text-muted-foreground">No materials yet</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Add your first material to get started
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Price Chart */}
            <Card className="lg:col-span-2 border-2 shadow-lg">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <LineChart className="h-5 w-5 text-primary" />
                  </div>
                  Price Fluctuation Analysis
                </CardTitle>
                <CardDescription>
                  {selectedMaterial
                    ? `Historical price data for ${selectedMaterial.name} (per ${selectedMaterial.unit})`
                    : 'Select a material from the list to visualize its price trend'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {selectedMaterial ? (
                  priceHistory.length > 0 ? (
                    <div className="space-y-4">
                      {/* Chart */}
                      <div className="rounded-lg border bg-card p-4">
                        <ResponsiveContainer width="100%" height={350}>
                          <RechartsLineChart data={priceHistory}>
                            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                            <XAxis 
                              dataKey="date" 
                              className="text-xs"
                              tick={{ fill: 'hsl(var(--muted-foreground))' }}
                            />
                            <YAxis 
                              tickFormatter={(value) => `$${value}`}
                              className="text-xs"
                              tick={{ fill: 'hsl(var(--muted-foreground))' }}
                            />
                            <Tooltip
                              formatter={(value: number) => [
                                `$${value.toFixed(2)}`,
                                'Unit Price',
                              ]}
                              contentStyle={{
                                backgroundColor: 'hsl(var(--card))',
                                border: '1px solid hsl(var(--border))',
                                borderRadius: '8px',
                              }}
                            />
                            <Legend />
                            <Line
                              type="monotone"
                              dataKey="price"
                              stroke="hsl(var(--primary))"
                              strokeWidth={3}
                              name={`Price per ${selectedMaterial.unit}`}
                              dot={{ fill: 'hsl(var(--primary))', r: 5 }}
                              activeDot={{ r: 8 }}
                            />
                          </RechartsLineChart>
                        </ResponsiveContainer>
                      </div>
                      
                      {/* Price Summary */}
                      {priceHistory.length >= 2 && (
                        <div className="grid grid-cols-3 gap-4">
                          <div className="p-4 rounded-lg border bg-card">
                            <p className="text-xs text-muted-foreground mb-1">First Price</p>
                            <p className="text-lg font-bold">${priceHistory[0].price.toFixed(2)}</p>
                          </div>
                          <div className="p-4 rounded-lg border bg-card">
                            <p className="text-xs text-muted-foreground mb-1">Latest Price</p>
                            <p className="text-lg font-bold">${priceHistory[priceHistory.length - 1].price.toFixed(2)}</p>
                          </div>
                          <div className="p-4 rounded-lg border bg-card">
                            <p className="text-xs text-muted-foreground mb-1">Data Points</p>
                            <p className="text-lg font-bold">{priceHistory.length}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-[350px] rounded-lg border-2 border-dashed">
                      <DollarSign className="h-12 w-12 text-muted-foreground/50 mb-3" />
                      <p className="text-sm font-medium text-muted-foreground">No purchase data available</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Record a purchase to see price history
                      </p>
                    </div>
                  )
                ) : (
                  <div className="flex flex-col items-center justify-center h-[350px] rounded-lg border-2 border-dashed">
                    <LineChart className="h-12 w-12 text-muted-foreground/50 mb-3" />
                    <p className="text-sm font-medium text-muted-foreground">No material selected</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Select a material from the list to view analytics
                    </p>
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