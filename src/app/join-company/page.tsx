
'use client';
import Link from 'next/link';
import Logo from '@/components/icons/Logo';
import JoinCompanyForm from './_components/JoinCompanyForm';
import { Suspense } from 'react';

function JoinCompanyContent() {
    return (
        <div className="flex min-h-screen items-center justify-center bg-background p-4">
            <div className="w-full max-w-md">
                 <div className="text-center">
                    <div className="mb-4 flex justify-center">
                        <Logo />
                    </div>
                    <h1 className="text-2xl font-bold">Join a Company</h1>
                    <p className="text-muted-foreground">Enter the ID provided by your administrator to join your team.</p>
                </div>
                
                <JoinCompanyForm />

                <p className="mt-6 text-center text-sm text-muted-foreground">
                    Or, go back to{' '}
                    <Link href="/welcome" className="font-medium text-primary hover:underline">
                    the previous step
                    </Link>.
                </p>
            </div>
        </div>
    );
}

export default function JoinCompanyPage() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <JoinCompanyContent />
        </Suspense>
    )
}
