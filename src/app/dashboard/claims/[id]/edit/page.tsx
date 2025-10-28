
'use client';

import { useParams, notFound } from 'next/navigation';
import { Claim, Project, User } from '@/types';
import { useFirestore, useDoc, useCollection, useMemoFirebase } from '@/firebase';
import { collection, doc, query, where } from 'firebase/firestore';
import { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import EditClaimForm from './_components/EditClaimForm';

export default function EditClaimPage() {
    const params = useParams();
    const id = params.id as string;
    const firestore = useFirestore();
    const { company } = useAuth();

    const claimRef = useMemoFirebase(() => id ? doc(firestore, 'claims', id) : null, [firestore, id]);
    const { data: claim, isLoading: claimLoading, error } = useDoc<Claim>(claimRef);

    const projectsQuery = useMemoFirebase(() => {
        if (!firestore || !company?.id) return null;
        return query(collection(firestore, 'projects'), where('companyId', '==', company.id));
    }, [firestore, company?.id]);
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
                <p className="text-muted-foreground">Make changes to claim "{claim.title}".</p>
            </div>
            <EditClaimForm claim={claim} projects={projects || []} />
        </div>
    );
}

    