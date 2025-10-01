
'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Building, PlusCircle, Edit } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/hooks/use-auth';
import StatusManager from './_components/StatusManager';

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

export default function CompanyPage() {
  const [companyData, setCompanyData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const canEdit = user?.role === 'Admin' || user?.role === 'Director';

  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const storedCompanyData = localStorage.getItem('sitepilot-company');
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

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const eInvData = companyData?.eInvoicing;
  const hasEInvData = !!eInvData && Object.keys(eInvData).length > 0;

  const fullAddress = eInvData ? [
    eInvData.address1,
    eInvData.address2,
    eInvData.postalCode,
    eInvData.lhdnStateCode,
  ].filter(Boolean).join(', ') : '';

  const getCustomerTypeLabel = (key: string) => customerTypeLabels[key] || 'N/A';
  const getIdentifierLabel = (key: string) => eInvData?.customerType ? identifierLabels[eInvData.customerType] : 'Identifier';

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">{companyData?.name || 'Company Information'}</h2>
        <p className="text-muted-foreground">View and manage your company's details and settings.</p>
      </div>

      <Card>
        <CardHeader>
            <div className="flex items-start justify-between">
                <div>
                    {companyData?.name && <CardTitle>Details for {companyData.name}</CardTitle>}
                </div>
                 {companyData && canEdit && (
                    <Button variant="outline" size="sm" asChild>
                        <Link href="/create-company">
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
                      <InfoField label="Industry" value={companyData.industry} />
                  </div>
                  <InfoField label="Company Description" value={companyData.description} />
              </div>
              
              <Separator/>

              {/* E-Invoicing Details */}
              <div className="space-y-4">
                  <h3 className="text-base font-semibold">E-Invoicing Details</h3>
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
      
      {canEdit && (
        <>
            <Separator />
            <StatusManager />
        </>
      )}

    </div>
  );
}
