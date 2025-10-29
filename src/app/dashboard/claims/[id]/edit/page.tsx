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
    const { id } = useParams();
    const firestore = useFirestore();
    const { company } = useAuth();

    const claimRef = useMemoFirebase(
        () => (firestore && id ? doc(firestore, 'claims', id as string) : null),
        [firestore, id]
    );

    const projectsQuery = useMemoFirebase(
        () => (firestore && company?.id ? query(collection(firestore, 'projects'), where('companyId', '==', company.id)) : null),
        [firestore, company?.id]
    );

    const { data: claim, isLoading: claimLoading, error } = useDoc<Claim>(claimRef);
    const { data: projects, isLoading: projectsLoading } = useCollection<Project>(projectsQuery);

    const loading = claimLoading || projectsLoading;

    if (loading) {
        return (
            <div className="flex h-[calc(100vh-10rem)] items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    if (!claim || error) {
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
