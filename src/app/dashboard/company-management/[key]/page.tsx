
    'use client';

    import { useEffect, useState, useMemo } from 'react';
    import { useParams, notFound, useRouter } from 'next/navigation';
    import { License } from '@/app/dashboard/system-admin/_components/LicenseGenerator';
    import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
    import { Badge } from '@/components/ui/badge';
    import { Button } from '@/components/ui/button';
    import { ArrowLeft, Building2, Calendar, Check, CheckCircle, Copy, KeyRound, Shield, User, Users, Wrench, XCircle } from 'lucide-react';
    import { format, parseISO } from 'date-fns';
    import { useToast } from '@/hooks/use-toast';
    import { Separator } from '@/components/ui/separator';
    import { useCollection, useDoc, useFirestore, useMemoFirebase } from '@/firebase';
    import { collection, doc, query, where } from 'firebase/firestore';
    import type { Company, User as UserType } from '@/types';
    import { Loader2 } from 'lucide-react';

    const InfoField = ({ label, value, children }: { label: string; value?: string | number | null, children?: React.ReactNode }) => {
        return (
            <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">{label}</p>
                {value != null ? <p className="text-sm font-semibold break-words">{value}</p> : null}
                {children}
            </div>
        );
    };

    export default function CompanyDetailsPage() {
        const params = useParams();
        const router = useRouter();
        const { toast } = useToast();
        const firestore = useFirestore();
        const companyId = params.key as string;
        
        const companyRef = useMemoFirebase(() => companyId ? doc(firestore, 'companies', companyId) : null, [firestore, companyId]);
        const { data: company, isLoading: companyLoading } = useDoc<Company>(companyRef);
        
        const licenseRef = useMemoFirebase(() => company?.licenseKey ? doc(firestore, 'licenses', company.licenseKey) : null, [firestore, company?.licenseKey]);
        const { data: license, isLoading: licenseLoading } = useDoc<License>(licenseRef);

        const [hasCopied, setHasCopied] = useState(false);
        
        const loading = companyLoading || licenseLoading;

        const copyToClipboard = () => {
            if (!license?.id) return;
            navigator.clipboard.writeText(license.id);
            setHasCopied(true);
            toast({ title: "License key copied!" });
            setTimeout(() => setHasCopied(false), 2000);
        }
        
        if (loading) {
            return (
                <div className="flex h-[calc(100vh-10rem)] items-center justify-center">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
            );
        }

        if (companyLoading) {
            return (
                <div className="flex h-[calc(100vh-10rem)] items-center justify-center">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
            );
        }

        if (!company) {
            return (
                <div className="text-center py-10">
                    <p className="text-muted-foreground">Company record not found.</p>
                </div>
            );
        }

        
        const isActivated = company.activated;
        const isExpired = license && license.expiresAt !== null && new Date(license.expiresAt) < new Date();
        
        const getStatus = (): { text: 'Active' | 'Expired' | 'Inactive'; variant: 'default' | 'destructive' | 'secondary' } => {
            if (!isActivated) {
                return { text: 'Inactive', variant: 'secondary' };
            }
            if (isExpired) {
                return { text: 'Expired', variant: 'destructive' };
            }
            return { text: 'Active', variant: 'default' };
        };

        const status = getStatus();

        return (
            <div className="space-y-6">
                <Button variant="outline" onClick={() => router.back()}>
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back to Company Management
                </Button>
                <div>
                    <h2 className="text-2xl font-bold tracking-tight">{company.name}</h2>
                    <p className="text-muted-foreground">Detailed information for this company and its license.</p>
                </div>
                
                <Card>
                    <CardHeader>
                        <CardTitle>Company & License Details</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            <InfoField label="Company Name" value={company.name} />
                            <InfoField label="Industry" value={`(${company.industryCode}) ${company.industryDescription}`} />
                            <InfoField label="License Status">
                                <Badge variant={status.variant} className={status.variant === 'default' ? 'bg-green-100 text-green-800' : ''}>
                                    {status.text}
                                </Badge>
                            </InfoField>
                        </div>

                        <Separator />
                        
                        <h3 className="text-lg font-semibold">User Limits</h3>
                        {license ? (
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <InfoField label="Max Directors" value={license.maxDirectors} />
                                <InfoField label="Max Admins" value={license.maxAdmins} />
                                <InfoField label="Max Engineers" value={license.maxEngineers} />
                            </div>
                        ) : (
                            <p className="text-sm text-muted-foreground italic">No license assigned. User limits are not set.</p>
                        )}

                        <Separator />
                        
                        <h3 className="text-lg font-semibold">Important Dates</h3>
                        {license ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                <InfoField label="License Created At" value={format(parseISO(license.createdAt), 'PPP p')} />
                                <InfoField label="License Activated At" value={license.activatedAt ? format(parseISO(license.activatedAt), 'PPP p') : 'Not Activated'} />
                                <InfoField label="Expires At" value={license.expiresAt === null ? 'Never' : format(new Date(license.expiresAt), 'PPP')} />
                            </div>
                        ) : (
                            <p className="text-sm text-muted-foreground italic">No license dates available.</p>
                        )}
                        
                        <Separator />
                        
                        <div className="space-y-2">
                            <h3 className="text-lg font-semibold">Assigned License Key</h3>
                            {license ? (
                                <div className="flex flex-col sm:flex-row gap-2">
                                    <div className="flex-1 rounded-lg border bg-muted/50 p-3">
                                        <p className="select-all break-all font-mono text-xs sm:text-sm">
                                            {license.id}
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
                            ) : (
                                <p className="text-sm text-muted-foreground italic">No license key has been assigned to this company yet.</p>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>
        );
    }

    