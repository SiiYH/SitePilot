
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Building2, User, Users, Wrench } from 'lucide-react';
import { type License } from '@/app/dashboard/system-admin/_components/LicenseGenerator';
import LicenseExpiryCountdown from '@/app/dashboard/system-admin/_components/LicenseExpiryCountdown';
import { differenceInDays, parseISO } from 'date-fns';
import { useRouter } from 'next/navigation';

interface CompanyListProps {
    licenses: License[];
}

const getStatus = (expiresAt: string, activatedAt?: string): { text: 'Active' | 'Expired' | 'Inactive'; variant: 'default' | 'destructive' | 'secondary' } => {
    if (!activatedAt) {
        return { text: 'Inactive', variant: 'secondary' };
    }
    if (expiresAt === 'Unlimited') {
        return { text: 'Active', variant: 'default' };
    }
    const daysLeft = differenceInDays(parseISO(expiresAt), new Date());
    if (daysLeft < 0) {
        return { text: 'Expired', variant: 'destructive' };
    }
    return { text: 'Active', variant: 'default' };
}

export default function CompanyList({ licenses }: CompanyListProps) {
    const router = useRouter();

    const handleRowClick = (key: string) => {
        router.push(`/dashboard/company-management/${key}`);
    };
    
    return (
        <Card>
            <CardHeader>
                <CardTitle>All Companies</CardTitle>
                <CardDescription>
                    List of all companies with generated licenses. Click on a row to view details.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <div className="overflow-x-auto">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Company (Purchaser)</TableHead>
                                <TableHead className="text-center">Status</TableHead>
                                <TableHead>User Limits</TableHead>
                                <TableHead>Expires</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {licenses.length > 0 ? (
                                [...licenses].reverse().map(license => {
                                    const status = getStatus(license.expiresAt, license.activatedAt);
                                    return (
                                        <TableRow key={license.key} onClick={() => handleRowClick(license.key)} className="cursor-pointer">
                                            <TableCell className="font-medium">
                                                <div className="flex items-center gap-2">
                                                    <Building2 className="h-4 w-4 text-muted-foreground"/>
                                                    <span>{license.purchaser}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-center">
                                                <Badge variant={status.variant}>
                                                    {status.text}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
                                                    <div className="flex items-center gap-1.5" title="Directors">
                                                        <User className="h-4 w-4"/>
                                                        <span className="font-semibold">{license.maxDirectors}</span>
                                                    </div>
                                                    <div className="flex items-center gap-1.5" title="Admins">
                                                        <Wrench className="h-4 w-4" />
                                                        <span className="font-semibold">{license.maxAdmins}</span>
                                                    </div>
                                                    <div className="flex items-center gap-1.5" title="Engineers">
                                                        <Users className="h-4 w-4"/>
                                                         <span className="font-semibold">{license.maxEngineers}</span>
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                {license.expiresAt === 'Unlimited' ? (
                                                    <Badge variant="secondary">Unlimited</Badge>
                                                ) : (
                                                    <LicenseExpiryCountdown expiresAt={license.expiresAt} />
                                                )}
                                            </TableCell>
                                        </TableRow>
                                    )
                                })
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={4} className="h-24 text-center">
                                        No companies found. Generate a license to add a company.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </div>
            </CardContent>
        </Card>
    );
}
