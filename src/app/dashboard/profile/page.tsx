
'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Mail, Phone, Building, PlusCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import Link from 'next/link';

const getInitials = (name: string) => {
  const names = name.split(' ');
  if (names.length > 1) {
    return `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase();
  }
  return name.substring(0, 2).toUpperCase();
};

export default function ProfilePage() {
  const { user } = useAuth();
  const [companyData, setCompanyData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const storedCompanyData = localStorage.getItem('siteflow-company');
        if (storedCompanyData) {
          setCompanyData(JSON.parse(storedCompanyData));
        }
      } catch (error) {
        console.error("Failed to parse company data from localStorage", error);
      } finally {
        setLoading(false);
      }
    }
  }, []);

  if (loading || !user) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const eInvData = companyData?.eInvoicing || {};
  const fullAddress = [
    eInvData.address1,
    eInvData.address2,
    eInvData.postalCode,
    eInvData.lhdnStateCode,
  ].filter(Boolean).join(', ');

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Profile & Settings</h2>
        <p className="text-muted-foreground">Manage your personal and company information.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <div className="md:col-span-1">
          <Card>
            <CardHeader className="items-center text-center">
              <Avatar className="h-24 w-24 mb-4">
                <AvatarImage src={user.avatarUrl} alt={user.name} />
                <AvatarFallback>{getInitials(user.name)}</AvatarFallback>
              </Avatar>
              <CardTitle>{user.name}</CardTitle>
              <CardDescription>{user.role}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
               <Separator />
                <div className="flex items-center gap-3">
                    <Mail className="h-5 w-5 text-muted-foreground" />
                    <span className="text-sm">{user.email || 'No email provided'}</span>
                </div>
                 <div className="flex items-center gap-3">
                    <Phone className="h-5 w-5 text-muted-foreground" />
                    <span className="text-sm">{user.phone || 'No phone provided'}</span>
                </div>
            </CardContent>
          </Card>
        </div>

        <div className="md:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Company Information</CardTitle>
              {companyData?.name && <CardDescription>Details for {companyData.name}.</CardDescription>}
            </CardHeader>
            <CardContent className="space-y-4">
              {companyData ? (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="company-name">Company Name</Label>
                    <Input id="company-name" value={companyData.name || ''} readOnly />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="industry">Industry</Label>
                    <Input id="industry" value={companyData.industry || ''} readOnly />
                  </div>
                  {eInvData.email && (
                    <div className="space-y-2">
                      <Label>E-Invoicing Contact Email</Label>
                      <Input value={eInvData.email} readOnly />
                    </div>
                  )}
                  {fullAddress && (
                    <div className="space-y-2">
                      <Label>Address</Label>
                      <Input value={fullAddress} readOnly />
                    </div>
                  )}
                  <div className="mt-6 flex justify-end">
                    <Button variant="outline" asChild>
                      <Link href="/create-company">Edit Company Details</Link>
                    </Button>
                  </div>
                </>
              ) : (
                <div className="flex flex-col items-center justify-center text-center text-muted-foreground p-8">
                  <Building className="h-12 w-12 mb-4" />
                  <p className="font-semibold">No Company Information</p>
                  <p className="text-sm mb-4">Complete the company setup to see details here.</p>
                  <Button asChild>
                    <Link href="/create-company">
                      <PlusCircle className="mr-2 h-4 w-4" />
                      Set Up Company
                    </Link>
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
