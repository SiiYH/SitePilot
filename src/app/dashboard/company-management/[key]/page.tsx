
'use client';

import { useEffect, useState } from 'react';
import { useParams, notFound, useRouter } from 'next/navigation';
import { License } from '@/app/dashboard/system-admin/_components/LicenseGenerator';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Building2, Calendar, CheckCircle, Copy, KeyRound, Shield, User, Users, Wrench, XCircle } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { Separator } from '@/components/ui/separator';

const STORAGE_KEY = 'sitepilot-licenses';

const InfoField = ({ label, value, children }: { label: string; value?: string | number | null, children?: React.ReactNode }) => {
    return (
        <div className="space-y-1">
            <p className="text-sm font-medium text-muted-foreground">{label}</p>
            {value && <p className="text-sm font-semibold break-words">{value}</p>}
            {children}
        </div>
    );
};

export default function CompanyDetailsPage() {
    const params = useParams();
    const router = useRouter();
    const { toast } = useToast();
    const [license, setLicense] = useState<License | null>(null);
    const [hasCopied, setHasCopied] = useState(false);

    useEffect(() => {
        const key = params.key as string;
        if (key) {
            const storedLicenses = localStorage.getItem(STORAGE_KEY);
            if (storedLicenses) {
                const licenses: License[] = JSON.parse(storedLicenses);
                const foundLicense = licenses.find(lic => lic.key === key);
                setLicense(foundLicense || null);
            }
        }
    }, [params.key]);

    const copyToClipboard = () => {
        if (!license?.key) return;
        navigator.clipboard.writeText(license.key);
        setHasCopied(true);
        toast({ title: "License key copied!" });
        setTimeout(() => setHasCopied(false), 2000);
    }

    if (!license) {
        return (
            <div className="flex h-[calc(100vh-10rem)] items-center justify-center">
                <p>Loading company details...</p>
            </div>
        );
    }
    
    const isActivated = !!license.activatedAt;
    const isActive = isActivated && (license.expiresAt === 'Unlimited' || parseISO(license.expiresAt) > new Date());

    return (
        <div className="space-y-6">
            <Button variant="outline" onClick={() => router.back()}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Company Management
            </Button>
            <div>
                <h2 className="text-2xl font-bold tracking-tight">{license.purchaser}</h2>
                <p className="text-muted-foreground">Detailed license information for this company.</p>
            </div>
            
            <Card>
                <CardHeader>
                    <CardTitle>License Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        <InfoField label="Purchaser Name" value={license.purchaser} />
                         <InfoField label="License Status">
                            <Badge variant={isActive ? 'default' : 'destructive'} className={isActive ? 'bg-green-100 text-green-800' : ''}>
                                {isActivated ? (isActive ? 'Active' : 'Expired') : 'Inactive'}
                            </Badge>
                        </InfoField>
                    </div>

                    <Separator />
                    
                    <h3 className="text-lg font-semibold">User Limits</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <InfoField label="Directors" value={license.maxDirectors} />
                        <InfoField label="Admins" value={license.maxAdmins} />
                        <InfoField label="Engineers" value={license.maxEngineers} />
                    </div>

                    <Separator />
                    
                    <h3 className="text-lg font-semibold">Important Dates</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        <InfoField label="License Created At" value={format(parseISO(license.createdAt), 'PPP p')} />
                        <InfoField label="License Activated At" value={license.activatedAt ? format(parseISO(license.activatedAt), 'PPP p') : 'Not Activated'} />
                        <InfoField label="Expires At" value={license.expiresAt === 'Unlimited' ? 'Never' : format(parseISO(license.expiresAt), 'PPP')} />
                    </div>
                    
                    <Separator />
                    
                     <div className="space-y-2">
                        <h3 className="text-lg font-semibold">License Key</h3>
                        <div className="flex flex-col sm:flex-row gap-2">
                            <div className="flex-1 rounded-lg border bg-muted/50 p-3">
                                <p className="select-all break-all font-mono text-xs sm:text-sm">
                                    {license.key}
                                </p>
                            </div>
                            <Button 
                                type="button" 
                                onClick={copyToClipboard}
                                variant={hasCopied ? "default" : "outline"}
                                className="w-full sm:w-auto"
                            >
                                {hasCopied ? (
                                    <Check className="mr-2 h-4 w-4" />
                                ) : (
                                    <Copy className="mr-2 h-4 w-4" />
                                )}
                                {hasCopied ? 'Copied' : 'Copy Key'}
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}

    