
'use client';

import { useParams, notFound, useRouter } from 'next/navigation';
import { useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
import { MaterialPurchase, Material, Project } from '@/types';
import { Loader2, ArrowLeft, Package, FolderKanban, Calendar, DollarSign, User, Truck, ShoppingCart, Edit } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { format, parseISO, isBefore, subHours } from 'date-fns';
import Link from 'next/link';
import { useMemo } from 'react';

const InfoField = ({ icon: Icon, label, value, children }: { icon: React.ElementType; label: string; value?: string | number | React.ReactNode; children?: React.ReactNode }) => (
    <div className="space-y-1">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Icon className="h-4 w-4" />
            <p>{label}</p>
        </div>
        {value ? <p className="font-semibold text-base pl-6">{value}</p> : <div className="pl-6">{children}</div>}
    </div>
);

export default function MaterialPurchaseDetailsPage() {
    const params = useParams();
    const router = useRouter();
    const firestore = useFirestore();
    const purchaseId = params.id as string;
    
    const purchaseRef = useMemoFirebase(() => purchaseId ? doc(firestore, 'materialPurchases', purchaseId) : null, [firestore, purchaseId]);
    const { data: purchase, isLoading: purchaseLoading } = useDoc<MaterialPurchase>(purchaseRef);

    const materialRef = useMemoFirebase(() => (firestore && purchase?.materialId) ? doc(firestore, 'materials', purchase.materialId) : null, [firestore, purchase]);
    const { data: material, isLoading: materialLoading } = useDoc<Material>(materialRef);

    const projectRef = useMemoFirebase(() => (firestore && purchase?.projectId) ? doc(firestore, 'projects', purchase.projectId) : null, [firestore, purchase]);
    const { data: project, isLoading: projectLoading } = useDoc<Project>(projectRef);
    
    const userRef = useMemoFirebase(() => (firestore && purchase?.createdBy) ? doc(firestore, 'users', purchase.createdBy) : null, [firestore, purchase]);
    const { data: createdByUser, isLoading: userLoading } = useDoc<Project>(userRef);

    const isLoading = purchaseLoading || materialLoading || projectLoading || userLoading;

    const canEdit = useMemo(() => {
        if (!purchase) return false;
        const gracePeriodEnd = subHours(new Date(), 24);
        const createdAt = parseISO(purchase.createdAt);
        return purchase.status === 'Ordered' && isBefore(gracePeriodEnd, createdAt);
    }, [purchase]);

    if (isLoading) {
        return (
            <div className="flex h-[calc(100vh-10rem)] items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    if (!purchase && !isLoading) {
        return notFound();
    }
              

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <Button variant="outline" onClick={() => router.back()}>
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back
                </Button>
                {canEdit && (
                    <Button asChild>
                        <Link href={`/dashboard/material-purchases/${purchaseId}/edit`}>
                            <Edit className="mr-2 h-4 w-4" />
                            Edit Purchase
                        </Link>
                    </Button>
                )}
            </div>

            <Card>
                <CardHeader>
                    <div className="flex items-start justify-between">
                        <div>
                            <CardTitle className="text-2xl">Purchase: {material?.name || 'Loading...'}</CardTitle>
                            <CardDescription>Details for material purchase #{purchase!.id.slice(-6)}</CardDescription>
                        </div>
                         <Badge className="text-base px-4 py-1.5">{purchase!.status}</Badge>
                    </div>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        <InfoField icon={Package} label="Material">
                            <p className="font-semibold text-base">{material?.name}</p>
                            <p className="text-sm text-muted-foreground">{material?.category}</p>
                        </InfoField>
                         <InfoField icon={FolderKanban} label="Project">
                             <Link href={`/dashboard/projects/${project?.id}`} className="font-semibold text-base text-primary hover:underline">
                                {project?.name}
                             </Link>
                         </InfoField>
                         <InfoField icon={Truck} label="Supplier" value={purchase!.supplier} />
                         <InfoField icon={Calendar} label="Purchase Date" value={format(parseISO(purchase!.purchaseDate), 'PPP')} />
                         <InfoField icon={User} label="Recorded By" value={createdByUser?.name} />
                    </div>
                    
                    <div className="border-t pt-6 mt-6">
                        <h4 className="text-lg font-semibold mb-4 flex items-center gap-2">
                            <ShoppingCart className="h-5 w-5" />
                            Financial Details
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                            <InfoField icon={DollarSign} label="Quantity" value={`${purchase!.quantity.toLocaleString()} ${material?.unit}`} />
                            <InfoField icon={DollarSign} label="Unit Price" value={`${project?.currency} ${purchase!.unitPrice.toLocaleString(undefined, {minimumFractionDigits: 2})}`} />
                            <InfoField icon={DollarSign} label="Discount" value={`${project?.currency} ${(purchase!.discount || 0).toLocaleString(undefined, {minimumFractionDigits: 2})}`} />
                            <InfoField icon={DollarSign} label="Total Paid" value={`${project?.currency} ${(purchase!.totalPaid || 0).toLocaleString(undefined, {minimumFractionDigits: 2})}`} />
                            <div className="md:col-span-2 lg:col-span-4">
                               <InfoField icon={DollarSign} label="Total Price (After Discount)">
                                   <p className="text-xl font-bold text-primary">{project?.currency} {purchase!.totalPrice.toLocaleString(undefined, {minimumFractionDigits: 2})}</p>
                               </InfoField>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
