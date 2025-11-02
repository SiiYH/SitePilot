'use client';

import { useParams, notFound } from 'next/navigation';
import { Claim, Project } from '@/types';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, doc, getDoc, query, where } from 'firebase/firestore';
import { Loader2 } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import EditClaimForm from './_components/EditClaimForm';
import { useEffect, useState } from 'react';

export default function EditClaimPage() {
    const { id } = useParams();
    const firestore = useFirestore();
    const { company, user } = useAuth(); // Added user to get current engineer
    const [claim, setClaim] = useState<Claim | null>(null);
    const [claimLoading, setClaimLoading] = useState(true);

    console.log('🧩 useParams() =', useParams());

    // Fetch claim using getDoc directly (since this works)
    useEffect(() => {
        async function loadClaim() {
            if (!firestore || !id) {
                setClaimLoading(false);
                return;
            }
            
            setClaimLoading(true);
            const ref = doc(firestore, 'claims', id as string);
            
            try {
                const snap = await getDoc(ref);
                if (snap.exists()) {
                    setClaim({ id: snap.id, ...snap.data() } as Claim);
                    // console.log('✅ Claim loaded:', snap.id);
                } else {
                    // console.warn('⚠️ No claim found');
                    setClaim(null);
                }
            } catch (error) {
                // console.error('🔥 Error loading claim:', error);
                setClaim(null);
            } finally {
                setClaimLoading(false);
            }
        }
        
        loadClaim();
    }, [firestore, id]);

    // Fetch projects assigned to this engineer only
    const projectsQuery = useMemoFirebase(
        () => {
            if (!firestore || !company?.id || !user?.id) return null;
            
            return query(
                collection(firestore, 'projects'),
                where('companyId', '==', company.id),
                where('assignedEngineers', 'array-contains', user.id) // Filter by engineer
            );
        },
        [firestore, company?.id, user?.id]
    );

    const { data: projects, isLoading: projectsLoading } = useCollection<Project>(projectsQuery);

    /* console.log('📦 claim =', claim);
    console.log('🔄 claimLoading =', claimLoading);
    console.log('👷 Assigned projects =', projects); */

    // Wait for initial load to complete
    if (claimLoading || projectsLoading || !firestore || !company || !user) {
        return (
            <div className="flex h-[calc(100vh-10rem)] items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    // After loading is complete, check if claim exists
    if (!claim) {
        return notFound();
    }

    // Security check - verify the claim belongs to the user's company
    if (claim.companyId !== company.id) {
        return notFound();
    }

    // Optional: Additional security - verify the claim belongs to this engineer
    if (claim.submittedBy !== user.id) {
        return notFound();
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