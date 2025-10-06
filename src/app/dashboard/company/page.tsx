
'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Building, PlusCircle, Edit, ShieldCheck, ShieldOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/hooks/use-auth';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { useFirestore, updateDocumentNonBlocking } from '@/firebase';
import { doc } from 'firebase/firestore';

const customerTypeLabels: { [key: string]: string } = {
  'malaysia-business': 'Malaysia Business',
  'malaysia-individual': 'Malaysia Individual',
  'non-malaysian-business': 'Non-Malaysian Business',
  'non-malaysian-individual': 'Non-Malaysian Individual',
  'government': 'Government Entity',
};

const identifierLabels: { [key: string]: string } = {
  'malaysia-business': 'Business Registration Number (MyCoID)',
  'malaysia-individual': 'NRIC (MyKad/MyTentera/MyPR)',
  'non-malaysian-business': 'Business/Company Registration Number',
  'non-malaysian-individual': 'Passport Number',
  'government': 'Government Entity Identifier',
};

const InfoField = ({ label, value }: { label: string; value?: string | null }) => {
    return (
        <div className="space-y-1">
            <p className="text-sm font-medium text-muted-foreground">{label}</p>
            {value ? (
                <p className="text-sm break-words">{value}</p>
            ) : (
                <p className="text-sm text-muted-foreground/70 italic">Not provided</p>
            )}
        </div>
    );
};

const LicenseActivationCard = ({ companyData, canEdit, onActivate }: { companyData: any, canEdit: boolean, onActivate: (key: string) => void }) => {
    const [licenseKey, setLicenseKey] = useState('');
    const isActivated = companyData.activated;
    
    return (
        <Card>
            <CardHeader>
                <div className="flex items-center gap-2">
                    {isActivated ? <ShieldCheck className="h-5 w-5 text-green-500" /> : <ShieldOff className="h-5 w-5 text-destructive" />}
                    <CardTitle>License & Activation</CardTitle>
                </div>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="flex items-center gap-4">
                    <p className="font-medium">Status:</p>
                    <Badge variant={isActivated ? "default" : "destructive"} className={isActivated ? "bg-green-100 text-green-800 border-green-200" : ""}>
                        {isActivated ? "Active" : "Inactive"}
                    </Badge>
                </div>
                {!isActivated && canEdit && (
                    <div className="space-y-2 rounded-md border p-4 bg-muted/20">
                        <p className="text-sm font-medium text-muted-foreground">Enter your license key to activate all features.</p>
                        <div className="flex gap-2">
                            <Input 
                                placeholder="Enter license key..."
                                value={licenseKey}
                                onChange={(e) => setLicenseKey(e.target.value)}
                            />
                            <Button onClick={() => onActivate(licenseKey)} disabled={!licenseKey}>Activate</Button>
                        </div>
                    </div>
                )}
                 {!isActivated && !canEdit && (
                     <p className="text-sm text-muted-foreground italic">
                        Only an Admin or Director can activate the company license.
                    </p>
                 )}
            </CardContent>
        </Card>
    );
}


export default function CompanyPage() {
  const { user, company, setCompany, loading } = useAuth();
  const firestore = useFirestore();
  const { toast } = useToast();
  const canEdit = user?.role === 'Admin' || user?.role === 'Director';

  const handleActivate = async (key: string) => {
    if (!company) return;
    // Note: In a real app, license validation would happen on a secure backend.
    // This client-side logic is for demonstration purposes.
    const licensesString = localStorage.getItem('sitepilot-licenses');
    const licenses = licensesString ? JSON.parse(licensesString) : [];
    
    const license = licenses.find((lic: any) => lic.key === key);

    if (license) {
        if (license.activatedAt && license.companyId !== company.id) {
            toast({
                variant: "destructive",
                title: "License Key Already Used",
                description: "This license key has already been activated for another company.",
            });
            return;
        }
        
        const companyDocRef = doc(firestore, 'companies', company.id);
        const updateData = {
            activated: true,
            licenseKey: key,
        };
        updateDocumentNonBlocking(companyDocRef, updateData);

        // Update local state
        const updatedCompanyData = { ...company, ...updateData };
        setCompany(updatedCompanyData);

        // Update license in localStorage
        const updatedLicenses = licenses.map((lic: any) => 
            lic.key === key ? { ...lic, activatedAt: new Date().toISOString(), companyId: company.id } : lic
        );
        localStorage.setItem('sitepilot-licenses', JSON.stringify(updatedLicenses));

        toast({
            title: "License Activated!",
            description: "Your company is now active.",
        });

    } else {
        toast({
            variant: "destructive",
            title: "Invalid License Key",
            description: "The provided license key is not valid. Please try again.",
        });
    }
  };


  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const companyData = company;
  const eInvData = companyData?.eInvoicing;
  const hasEInvData = !!eInvData && eInvData.eInvEnabled;

  const fullAddress = eInvData ? [
    eInvData.address1,
    eInvData.address2,
    eInvData.postalCode,
    eInvData.lhdnStateCode,
  ].filter(Boolean).join(', ') : '';

  const getCustomerTypeLabel = (key: string) => customerTypeLabels[key] || 'N/A';
  const getIdentifierLabel = (key: string) => eInvData?.customerType ? identifierLabels[eInvData.customerType] : 'Identifier';

  const industryDisplay = companyData?.industryCode && companyData?.industryDescription 
    ? `(${companyData.industryCode}) ${companyData.industryDescription}` 
    : companyData?.industryDescription || null;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">{companyData?.name || 'Company Information'}</h2>
        <p className="text-muted-foreground">View and manage your company's details and settings.</p>
      </div>

       <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
            <Card>
                <CardHeader>
                    <div className="flex items-start justify-between">
                        <div>
                            {companyData?.name && <CardTitle>Details for {companyData.name}</CardTitle>}
                        </div>
                        {companyData && canEdit && (
                            <Button variant="outline" size="sm" asChild>
                                <Link href={`/create-company?edit=true&companyId=${companyData.id}`}>
                                <Edit className="mr-2 h-4 w-4" />
                                Edit Details
                                </Link>
                            </Button>
                        )}
                    </div>
                </CardHeader>
                <CardContent className="space-y-6">
                {companyData ? (
                    <>
                    {/* General Company Info */}
                    <div className="space-y-4">
                        <h3 className="text-base font-semibold">General Details</h3>
                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                            <InfoField label="Company Name" value={companyData.name} />
                            <InfoField label="Industry" value={industryDisplay} />
                        </div>
                        <InfoField label="Company Description" value={companyData.description} />
                    </div>
                    
                    <Separator/>

                    {/* E-Invoicing Details */}
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                           <h3 className="text-base font-semibold">E-Invoicing Details</h3>
                           {canEdit && (
                                <Button variant="outline" size="sm" asChild>
                                    <Link href={`/company-setup/e-invoicing?edit=true`}>
                                        <Edit className="mr-2 h-4 w-4" />
                                        {hasEInvData ? 'Edit' : 'Setup'}
                                    </Link>
                                </Button>
                           )}
                        </div>

                        {hasEInvData ? (
                            <>
                            <InfoField label="E-Invoicing Status" value={eInvData.eInvEnabled ? `Enabled` : 'Disabled'} />
                            
                            {eInvData.eInvEnabled && (
                                <div className="space-y-4 pt-2">
                                    <InfoField label="E-Invoicing Version" value={eInvData.eInvVersion === '1.1' ? 'Version 1.1' : 'Version 1.0'} />
                                    {/* Business Identifiers */}
                                    <div className="grid grid-cols-1 gap-y-4 gap-x-4 md:grid-cols-2">
                                        <InfoField label="Customer Type" value={getCustomerTypeLabel(eInvData.customerType)} />
                                        <InfoField label="TIN" value={eInvData.tin} />
                                        <InfoField label={getIdentifierLabel(eInvData.customerType)} value={eInvData.identifier} />
                                    </div>
                                    
                                    <Separator className="my-4" />

                                    {/* Contact & Address */}
                                    <div className="grid grid-cols-1 gap-y-4 gap-x-4 md:grid-cols-2">
                                        <InfoField label="E-Invoicing Email" value={eInvData.email} />
                                        <InfoField label="E-Invoicing Contact" value={eInvData.contactNumber} />
                                        {fullAddress && (
                                            <div className="md:col-span-2">
                                                <InfoField label="Address" value={fullAddress} />
                                            </div>
                                        )}
                                    </div>

                                    <Separator className="my-4" />

                                    {/* Financial Details */}
                                    <div className="grid grid-cols-1 gap-y-4 gap-x-4 md:grid-cols-2">
                                        <InfoField label="Bank Account Number" value={eInvData.bankAccount} />
                                    </div>
                                </div>
                            )}
                            </>
                        ) : (
                            <Card className="bg-muted/30">
                                <CardContent className="flex flex-col items-center justify-center p-8 text-center text-muted-foreground">
                                <p className="font-semibold">No E-Invoicing Information</p>
                                <p className="mb-4 text-sm">Add your e-invoicing details to enable this feature.</p>
                                <Button asChild variant="outline">
                                    <Link href="/company-setup/e-invoicing">
                                    <PlusCircle className="mr-2 h-4 w-4" />
                                    Add E-Invoicing Details
                                    </Link>
                                </Button>
                                </CardContent>
                            </Card>
                        )}
                    </div>
                    </>
                ) : (
                    <Card className="bg-muted/30">
                    <CardContent className="flex flex-col items-center justify-center p-8 text-center text-muted-foreground">
                        <Building className="mb-4 h-12 w-12" />
                        <p className="font-semibold">No Company Information</p>
                        <p className="mb-4 text-sm">Complete the company setup to see details here.</p>
                        <Button asChild>
                        <Link href="/create-company">
                            <PlusCircle className="mr-2 h-4 w-4" />
                            Set Up Company
                        </Link>
                        </Button>
                    </CardContent>
                    </Card>
                )}
                </CardContent>
            </Card>
        </div>
         <div className="lg:col-span-1">
            {companyData && (
                <LicenseActivationCard 
                    companyData={companyData} 
                    canEdit={canEdit}
                    onActivate={handleActivate}
                />
            )}
        </div>
      </div>
    </div>
  );
}
