
'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import Logo from '@/components/icons/Logo';
import { useAuth } from '@/hooks/use-auth';
import { Users, PlusCircle } from 'lucide-react';
import { Loader2 } from 'lucide-react';

export default function WelcomePage() {
  const { user, loading } = useAuth();
  
  if (loading || !user) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const canCreateCompany = user.role === 'Admin' || user.role === 'Director';

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="w-full max-w-lg text-center">
        <div className="mb-8 flex justify-center">
          <Logo />
        </div>
        <h1 className="mb-4 text-3xl font-bold tracking-tight text-foreground">
          Welcome to SitePilot
        </h1>
        <p className="mb-8 max-w-md mx-auto text-muted-foreground">
            You're one step away from managing your construction projects. How would you like to get started?
        </p>
        <div className={`grid grid-cols-1 ${canCreateCompany ? 'md:grid-cols-2' : 'md:grid-cols-1'} gap-6`}>
           <Card className={`text-left hover:shadow-lg transition-shadow ${!canCreateCompany && 'md:max-w-sm mx-auto'}`}>
                <CardHeader>
                    <Users className="h-8 w-8 mb-2 text-primary" />
                    <CardTitle>Join a Company</CardTitle>
                    <CardDescription>Enter an invitation code to join an existing company workspace.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Button className="w-full" asChild>
                        <Link href="/join-company">Join with Code</Link>
                    </Button>
                </CardContent>
           </Card>
           {canCreateCompany && (
            <Card className="text-left hover:shadow-lg transition-shadow">
                    <CardHeader>
                        <PlusCircle className="h-8 w-8 mb-2 text-primary" />
                        <CardTitle>Create a New Company</CardTitle>
                        <CardDescription>Set up a new workspace for your company and start managing projects.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Button className="w-full" variant="outline" asChild>
                            <Link href="/create-company">Create Company</Link>
                        </Button>
                    </CardContent>
            </Card>
           )}
        </div>
         <p className="mt-8 text-center text-sm text-muted-foreground">
          If you need to log in to a different account, you can <Link href="/login" className="font-medium text-primary hover:underline">log in</Link>.
        </p>
      </div>
    </div>
  );
}
