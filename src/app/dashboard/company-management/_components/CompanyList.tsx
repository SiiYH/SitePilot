
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Building2, User, Users, Wrench } from 'lucide-react';
import { type License } from '@/app/dashboard/system-admin/_components/LicenseGenerator';
import LicenseExpiryCountdown from '@/app/dashboard/system-admin/_components/LicenseExpiryCountdown';
import { differenceInDays, parseISO } from 'date-fns';
import { useRouter } from 'next/navigation';
import { useEffect, useState, useMemo } from 'react';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, query } from 'firebase/firestore';
import type { Company, User as UserType } from '@/types';

interface CompanyListProps {
    companies: Company[];
    allUsers: UserType[];
}

const getStatus = (activated: boolean, license?: License | null): { text: 'Active' | 'Expired' | 'Inactive'; variant: 'default' | 'destructive' | 'secondary' } => {
    if (!activated || !license) {
        return { text: 'Inactive', variant: 'secondary' };
    }
    if (license.expiresAt === null) {
        return { text: 'Active', variant: 'default' };
    }
    const daysLeft = differenceInDays(parseISO(license.expiresAt), new Date());
    if (daysLeft < 0) {
        return { text: 'Expired', variant: 'destructive' };
    }
    return { text: 'Active', variant: 'default' };
}

export default function CompanyList({ companies, allUsers }: CompanyListProps) {
    const router = useRouter();
    const firestore = useFirestore();

    const licensesQuery = useMemoFirebase(() => {
      if (!firestore) return null;
      return query(collection(firestore, 'licenses'));
    }, [firestore]);
  
    const { data: licenses, isLoading: licensesLoading } = useCollection<License>(licensesQuery);

    const companyUsage = useMemo(() => {
        const usage: Record<string, { directors: number; admins: number; engineers: number }> = {};
        companies.forEach(company => {
            usage[company.id] = {
                directors: allUsers.filter(u => u.companyId === company.id && u.role === 'director' && u.status === 'Active').length,
                admins: allUsers.filter(u => u.companyId === company.id && u.role === 'admin' && u.status === 'Active').length,
                engineers: allUsers.filter(u => u.companyId === company.id && u.role === 'engineer' && u.status === 'Active').length,
            }
        });
        return usage;
    }, [companies, allUsers]);

    const handleRowClick = (companyId: string) => {
        router.push(`/dashboard/company-management/${companyId}`);
    };
    
    return (
        <Card>
            <CardHeader>
                <CardTitle>All Companies</CardTitle>
                <CardDescription>
                    List of all companies created by users. Click on a row to view details.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <div className="overflow-x-auto">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Company Name</TableHead>
                                <TableHead className="text-center">Status</TableHead>
                                <TableHead>User Limits (Used/Max)</TableHead>
                                <TableHead>Expires</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {companies.length > 0 && !licensesLoading ? (
                                [...companies].reverse().map(company => {
                                    const license = licenses?.find(l => l.id === company.licenseKey);
                                    const status = getStatus(company.activated, license);
                                    const usage = companyUsage[company.id];
                                    return (
                                        <TableRow key={company.id} onClick={() => handleRowClick(company.id)} className="cursor-pointer">
                                            <TableCell className="font-medium">
                                                <div className="flex items-center gap-2">
                                                    <Building2 className="h-4 w-4 text-muted-foreground"/>
                                                    <span>{company.name}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-center">
                                                <Badge variant={status.variant}>
                                                    {status.text}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>
                                                {license && usage ? (
                                                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
                                                        <div className="flex items-center gap-1.5" title="Directors">
                                                            <User className="h-4 w-4"/>
                                                            <span className="font-semibold">{usage.directors}/{license.maxDirectors}</span>
                                                        </div>
                                                        <div className="flex items-center gap-1.5" title="Admins">
                                                            <Wrench className="h-4 w-4" />
                                                            <span className="font-semibold">{usage.admins}/{license.maxAdmins}</span>
                                                        </div>
                                                        <div className="flex items-center gap-1.5" title="Engineers">
                                                            <Users className="h-4 w-4"/>
                                                            <span className="font-semibold">{usage.engineers}/{license.maxEngineers}</span>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <Badge variant="outline">No License</Badge>
                                                )}
                                            </TableCell>
                                            <TableCell>
                                                {license && license.expiresAt ? (
                                                    <LicenseExpiryCountdown expiresAt={license.expiresAt} />
                                                ) : license ? (
                                                    <Badge variant="secondary">Unlimited</Badge>
                                                ) : (
                                                    <Badge variant="outline">N/A</Badge>
                                                )}
                                            </TableCell>
                                        </TableRow>
                                    )
                                })
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={4} className="h-24 text-center">
                                        No companies found.
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
