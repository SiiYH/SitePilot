'use client';

import { useParams, notFound } from 'next/navigation';
import { Claim, Project } from '@/types';
import { useFirestore, useDoc, useCollection, useMemoFirebase } from '@/firebase';
import { collection, doc, query, where } from 'firebase/firestore';
import { Loader2 } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import EditClaimForm from './_components/EditClaimForm';
import { useEffect } from 'react';

export default function EditClaimPage() {
    const { id } = useParams(); // ✅ single param route
    const firestore = useFirestore();
    const { company } = useAuth();

    console.log('🧩 useParams() =', useParams());

    const claimRef = useMemoFirebase(
        () => (id ? doc(firestore, 'claims', id as string) : null),
        [firestore, id]
    );
    
    const { data: claim, isLoading: claimLoading, error } = useDoc<Claim>(claimRef);

    const projectsQuery = useMemoFirebase(() => {
        if (!firestore || !company?.id) return null;
        return query(collection(firestore, 'projects'), where('companyId', '==', company.id));
    }, [firestore, company?.id]);
    const { data: projects, isLoading: projectsLoading } = useCollection<Project>(projectsQuery);

    const loading = claimLoading || projectsLoading;

    // 👇 Debug: print Firestore results when they change
    useEffect(() => {
        if (claim) {
            console.log('✅ Claim data retrieved from Firestore:', JSON.stringify(claim, null, 2));
        }
        if (projects) {
            console.log('✅ Projects data retrieved from Firestore:', JSON.stringify(projects, null, 2));
        }
        if (error) {
            console.error('❌ Firestore error:', error);
        }
    }, [claim, projects, error]);

    if (loading) {
        return (
            <div className="flex h-[calc(100vh-10rem)] items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    if (!claim || error) {
        console.warn('⚠️ Claim not found or error occurred:', error);
        notFound();
    }

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-2xl font-bold tracking-tight">Edit Claim</h2>
                <p className="text-muted-foreground">
                    Make changes to claim "{claim.title}".
                </p>
            </div>
            <EditClaimForm claim={claim} projects={projects || []} />
        </div>
    );
}
