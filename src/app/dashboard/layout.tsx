
'use client';
import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Loader2, ShieldAlert } from 'lucide-react';

import { useAuth } from '@/hooks/use-auth';
import AppSidebar from '@/components/dashboard/AppSidebar';
import Header from '@/components/dashboard/Header';
import { SidebarProvider, Sidebar, SidebarInset } from '@/components/ui/sidebar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

function InactiveUserPage() {
  const { logout } = useAuth();
  return (
    <div className="flex h-screen items-center justify-center bg-muted/40">
        <Card className="w-full max-w-md m-4">
            <CardHeader>
                <CardTitle className="flex items-center gap-2 text-destructive">
                    <ShieldAlert className="h-6 w-6" />
                    Account Inactive
                </CardTitle>
                <CardDescription>
                    Your account is currently inactive. An administrator from your company must activate it before you can access the dashboard.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <p className="text-sm text-muted-foreground">
                    Please contact your company's director or admin. If you believe this is an error, you can try logging out and back in.
                </p>
            </CardContent>
            <CardContent>
                 <Button onClick={logout} className="w-full">Log Out</Button>
            </CardContent>
        </Card>
    </div>
  );
}


export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.replace('/login');
        return;
      }
      // If user has no company and is not system admin, redirect to welcome
      if (!user.companyId && user.role !== 'system super admin' && pathname !== '/welcome') {
        router.push('/welcome');
      }
      // If user has company but is on welcome page, redirect to dashboard
      else if (user.companyId && pathname === '/welcome') {
        router.push('/dashboard');
      }
    }
  }, [user, loading, router, pathname]);

  if (loading || !user) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // If user is inactive, show the inactive page and block access to children
  if (user.status === 'Inactive') {
    return <InactiveUserPage />;
  }

  return (
    <SidebarProvider>
      <Sidebar collapsible="icon">
        <AppSidebar />
      </Sidebar>
      <SidebarInset>
        <Header />
        <main className="p-4 sm:p-6">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  );
}
