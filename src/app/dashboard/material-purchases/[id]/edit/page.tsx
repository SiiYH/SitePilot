'use client';

import { useParams, notFound } from 'next/navigation';
import { useFirestore, useDoc, useMemoFirebase, useCollection } from '@/firebase';
import { doc, collection, query, where } from 'firebase/firestore';
import { MaterialPurchase, Material, Project } from '@/types';
import { Loader2 } from 'lucide-react';
import EditPurchaseForm from './_components/EditPurchaseForm';
import { useAuth } from '@/hooks/use-auth';

export default function EditMaterialPurchasePage() {
    const params = useParams();
    const { company } = useAuth();
    const firestore = useFirestore();
    const purchaseId = params.id as string;
    
    const purchaseRef = useMemoFirebase(() => purchaseId ? doc(firestore, 'materialPurchases', purchaseId) : null, [firestore, purchaseId]);
    const { data: purchase, isLoading: purchaseLoading } = useDoc<MaterialPurchase>(purchaseRef);
    
    const projectRef = useMemoFirebase(() => (firestore && purchase?.projectId) ? doc(firestore, 'projects', purchase.projectId) : null, [firestore, purchase]);
    const { data: project, isLoading: projectLoading } = useDoc<Project>(projectRef);
    
    const materialsQuery = useMemoFirebase(() => (firestore && company?.id) ? query(collection(firestore, 'materials'), where('companyId', '==', company.id)) : null, [firestore, company?.id]);
    const { data: materials, isLoading: materialsLoading } = useCollection<Material>(materialsQuery);

    const isLoading = purchaseLoading || projectLoading || materialsLoading;

    if (isLoading) {
        return (
            <div className="flex h-[calc(100vh-10rem)] items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }
    
    if (!purchase || !project || !materials) {
        return notFound();
    }

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-2xl font-bold tracking-tight">Edit Material Purchase</h2>
                <p className="text-muted-foreground">
                    Update the details for purchase #{purchase.id.slice(-6)}.
                </p>
            </div>
            <EditPurchaseForm 
                purchase={purchase}
                project={project}
                materials={materials}
            />
        </div>
    );
}
