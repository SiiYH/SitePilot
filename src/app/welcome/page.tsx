import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import Logo from '@/components/icons/Logo';
import { Users, PlusCircle } from 'lucide-react';

export default function WelcomePage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="w-full max-w-lg text-center">
        <div className="mb-8 flex justify-center">
          <Logo />
        </div>
        <h1 className="mb-4 text-3xl font-bold tracking-tight text-foreground">
          Welcome to SiteFlow
        </h1>
        <p className="mb-8 max-w-md mx-auto text-muted-foreground">
            The all-in-one platform for managing your construction projects. How would you like to get started?
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
           <Card className="text-left hover:shadow-lg transition-shadow">
                <CardHeader>
                    <Users className="h-8 w-8 mb-2 text-primary" />
                    <CardTitle>Join a Company</CardTitle>
                    <CardDescription>Get an invitation from your administrator to join an existing company workspace.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Button className="w-full" asChild>
                        <Link href="/login">Log In to Existing Account</Link>
                    </Button>
                </CardContent>
           </Card>
           <Card className="text-left hover:shadow-lg transition-shadow">
                <CardHeader>
                    <PlusCircle className="h-8 w-8 mb-2 text-primary" />
                    <CardTitle>Create a New Company</CardTitle>
                    <CardDescription>Set up a new workspace for your company and start managing your projects and team.</CardDescription>
                </CardHeader>
                <CardContent>
                     <Button className="w-full" variant="outline" asChild>
                        <Link href="/signup">Create a New Account</Link>
                    </Button>
                </CardContent>
           </Card>
        </div>
         <p className="mt-8 text-center text-sm text-muted-foreground">
          SiteFlow is a demo application. Functionality may be limited.
        </p>
      </div>
    </div>
  );
}
