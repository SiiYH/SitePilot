
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';
import { doc } from 'firebase/firestore';
import { useFirestore, updateDocumentNonBlocking } from '@/firebase';

export default function LicenseForm() {
  const router = useRouter();
  const [licenseKey, setLicenseKey] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const { company, setCompany } = useAuth();
  const firestore = useFirestore();

  const handleActivate = async () => {
    if (!company) {
        toast({
            variant: 'destructive',
            title: "Error",
            description: "No company context found. Please go back and create a company first.",
        });
        return;
    }
    
    setIsLoading(true);

    // Note: In a real app, license validation would happen on a secure backend.
    // This client-side logic is for demonstration purposes.
    const licensesString = localStorage.getItem('sitepilot-licenses');
    const licenses = licensesString ? JSON.parse(licensesString) : [];
    
    const license = licenses.find((lic: any) => lic.key === licenseKey);

    if (license) {
        if (license.activatedAt && license.companyId !== company.id) {
            toast({
                variant: "destructive",
                title: "License Key Already Used",
                description: "This license key has already been activated for another company.",
            });
            setIsLoading(false);
            return;
        }

        const companyDocRef = doc(firestore, 'companies', company.id);
        const updateData = {
            activated: true,
            licenseKey: licenseKey,
        };
        updateDocumentNonBlocking(companyDocRef, updateData);

        const updatedCompanyData = { ...company, ...updateData };
        setCompany(updatedCompanyData);

        const updatedLicenses = licenses.map((lic: any) => 
            lic.key === licenseKey ? { ...lic, activatedAt: new Date().toISOString(), companyId: company.id } : lic
        );
        localStorage.setItem('sitepilot-licenses', JSON.stringify(updatedLicenses));

        toast({
            title: "License Activated!",
            description: "Your company is now active. Let's set up e-invoicing.",
        });
        
        setTimeout(() => {
            setIsLoading(false);
            router.push('/company-setup/e-invoicing');
        }, 1500);

    } else {
        toast({
            variant: "destructive",
            title: "Invalid License Key",
            description: "The provided license key is not valid. Please check and try again.",
        });
        setIsLoading(false);
    }
  };

  return (
    <Card className="mt-6">
      <CardContent className="pt-6">
        <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); handleActivate(); }}>
          <div className="space-y-2">
            <Label htmlFor="license-key">License Key</Label>
            <Input 
              id="license-key" 
              placeholder="Paste your license key here"
              value={licenseKey}
              onChange={(e) => setLicenseKey(e.target.value)}
              required
            />
          </div>
          <Button 
            type="submit" 
            className="w-full"
            disabled={!licenseKey || isLoading}
          >
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Activate and Continue
          </Button>
           <Button variant="outline" className="w-full" asChild>
                <Link href="/company-setup/e-invoicing">Skip for now</Link>
            </Button>
        </form>
      </CardContent>
    </Card>
  );
}
