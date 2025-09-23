
'use client';

import { useAuth } from '@/hooks/use-auth';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Building, Mail, Phone, User as UserIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';

// Mock company data - in a real app, this would come from your database
const companyData = {
  name: 'Acme Construction Inc.',
  industry: '(41001) Construction of buildings',
  description: 'Specializing in commercial and residential construction projects with a focus on sustainable building practices.',
  email: 'contact@acmeconstruction.com',
  phone: '+603-1234-5678',
  address: 'Level 10, Tower A, 123 Jalan Ampang, 50450 Kuala Lumpur, Malaysia',
};

const getInitials = (name: string) => {
  const names = name.split(' ');
  if (names.length > 1) {
    return `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase();
  }
  return name.substring(0, 2).toUpperCase();
};

export default function ProfilePage() {
  const { user } = useAuth();

  if (!user) {
    return null;
  }

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
              <CardDescription>Details for {companyData.name}.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="company-name">Company Name</Label>
                <Input id="company-name" value={companyData.name} readOnly />
              </div>
              <div className="space-y-2">
                <Label htmlFor="industry">Industry</Label>
                <Input id="industry" value={companyData.industry} readOnly />
              </div>
               <div className="space-y-2">
                <Label>Contact Email</Label>
                <Input value={companyData.email} readOnly />
              </div>
               <div className="space-y-2">
                <Label>Address</Label>
                <Input value={companyData.address} readOnly />
              </div>
               <div className="mt-6 flex justify-end">
                <Button variant="outline">Edit Company Details</Button>
               </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
