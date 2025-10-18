'use client';

import { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Claim, Project, User } from "@/types";
import { format } from "date-fns";
import { useRouter } from "next/navigation";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DollarSign, User as UserIcon, Calendar, FolderKanban, ArrowUpDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuth } from '@/hooks/use-auth';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, query, where } from 'firebase/firestore';

interface ClaimsOverviewProps {
    claims: Claim[];
    projects: Project[];
}

const statusVariant: { [key: string]: 'default' | 'secondary' | 'destructive' | 'outline' } = {
  'Paid': 'default',
  'Pending': 'secondary',
  'Overdue': 'destructive',
};

type StatusFilter = Claim['status'] | 'All';
type SortKey = 'amount' | 'submittedAt';
type SortDirection = 'ascending' | 'descending';

const getInitials = (name: string) => {
    if (!name) return '';
    const names = name.split(' ');
    if (names.length > 1) {
        return `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
};

export default function ClaimsOverview({ claims, projects }: ClaimsOverviewProps) {
    const router = useRouter();
    const { company } = useAuth();
    const firestore = useFirestore();
    const [filter, setFilter] = useState<StatusFilter>('All');
    const [sortConfig, setSortConfig] = useState<{ key: SortKey; direction: SortDirection } | null>(null);

    // console.log(company?.id);
    // console.log(claims);
    // Query users from the same company
    const usersQuery = useMemoFirebase(() => {
        if (!firestore || !company?.id) return null;
        return query(collection(firestore, 'users'), where('companyId', '==', company.id));
    }, [firestore, company?.id]);

    const { data: users } = useCollection<User>(usersQuery);

    const getProjectName = (projectId: string) => {
        return projects.find(p => p.id === projectId)?.name || 'N/A';
    }
    
    const getUser = (userId: string) => {
        return users?.find(u => u.id === userId);
    }

    const handleRowClick = (claimId: string) => {
        router.push(`/dashboard/claims/${claimId}`);
    }

    const filteredClaims = claims.filter(claim => {
        if (filter === 'All') return true;
        return claim.status === filter;
    });

    const sortedClaims = useMemo(() => {
        let sortableClaims = [...filteredClaims];
        if (sortConfig !== null) {
            sortableClaims.sort((a, b) => {
                if (a[sortConfig.key] < b[sortConfig.key]) {
                    return sortConfig.direction === 'ascending' ? -1 : 1;
                }
                if (a[sortConfig.key] > b[sortConfig.key]) {
                    return sortConfig.direction === 'ascending' ? 1 : -1;
                }
                return 0;
            });
        }
        return sortableClaims;
    }, [filteredClaims, sortConfig]);

    const requestSort = (key: SortKey) => {
        let direction: SortDirection = 'ascending';
        if (sortConfig && sortConfig.key === key && sortConfig.direction === 'ascending') {
            direction = 'descending';
        }
        setSortConfig({ key, direction });
    };

    return (
        <Card>
            <CardHeader>
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <CardTitle>Recent Claims</CardTitle>
                        <CardDescription>A summary of recent payment claims. Click a claim to view details.</CardDescription>
                    </div>
                    <div className="w-full sm:w-48">
                         <Select value={filter} onValueChange={(value: StatusFilter) => setFilter(value)}>
                            <SelectTrigger>
                                <SelectValue placeholder="Filter by status" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="All">All Statuses</SelectItem>
                                <SelectItem value="Pending">Pending</SelectItem>
                                <SelectItem value="Paid">Paid</SelectItem>
                                <SelectItem value="Overdue">Overdue</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                {/* Mobile View */}
                <div className="space-y-4 md:hidden">
                    {sortedClaims.length > 0 ? (
                        sortedClaims.map(claim => {
                            const submittedByUser = getUser(claim.submittedBy);
                            return (
                                <Card key={claim.id} onClick={() => handleRowClick(claim.id)} className="cursor-pointer transition-shadow hover:shadow-md">
                                    <CardHeader>
                                        <div className="flex items-start justify-between gap-4">
                                            <CardTitle className="text-lg">{claim.title}</CardTitle>
                                            <Badge variant={statusVariant[claim.status] || 'outline'}>{claim.status}</Badge>
                                        </div>
                                    </CardHeader>
                                    <CardContent className="space-y-3 text-sm">
                                        <div className="flex items-center gap-2">
                                            <DollarSign className="h-4 w-4 text-muted-foreground" />
                                            <span className="font-semibold"><span className="text-xs text-muted-foreground">{claim.currency}</span> {claim.amount.toLocaleString()}</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <FolderKanban className="h-4 w-4 text-muted-foreground" />
                                            <span className="text-muted-foreground">{getProjectName(claim.projectId)}</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <UserIcon className="h-4 w-4 text-muted-foreground" />
                                            <span className="text-muted-foreground">Submitted by {submittedByUser?.name || 'N/A'}</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Calendar className="h-4 w-4 text-muted-foreground" />
                                            <span className="text-muted-foreground">{format(new Date(claim.date), 'MMM dd, yyyy')}</span>
                                        </div>
                                    </CardContent>
                                </Card>
                            )
                        })
                    ) : (
                         <div className="h-24 text-center flex items-center justify-center">
                            <p>No claims found for the selected status.</p>
                        </div>
                    )}
                </div>
                
                {/* Desktop View */}
                <div className="hidden md:block">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Claim</TableHead>
                                <TableHead>e-Inv No.</TableHead>
                                <TableHead>Project</TableHead>
                                <TableHead>Submitted By</TableHead>
                                <TableHead>
                                    <Button variant="ghost" onClick={() => requestSort('amount')}>
                                        Amount
                                        <ArrowUpDown className="ml-2 h-4 w-4" />
                                    </Button>
                                </TableHead>
                                <TableHead>
                                     <Button variant="ghost" onClick={() => requestSort('submittedAt')}>
                                        Date
                                        <ArrowUpDown className="ml-2 h-4 w-4" />
                                    </Button>
                                </TableHead>
                                <TableHead className="text-right">Status</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {sortedClaims.length > 0 ? (
                                sortedClaims.map(claim => {
                                    const submittedByUser = getUser(claim.submittedBy);
                                    return (
                                        <TableRow 
                                            key={claim.id} 
                                            onClick={() => handleRowClick(claim.id)}
                                            className="cursor-pointer"
                                        >
                                            <TableCell className="font-medium">{claim.title}</TableCell>
                                            <TableCell>{claim.eInvoiceNo || 'N/A'}</TableCell>
                                            <TableCell>{getProjectName(claim.projectId)}</TableCell>
                                            <TableCell>
                                                {submittedByUser ? (
                                                    <div className="flex items-center gap-2">
                                                        <Avatar className="h-6 w-6">
                                                            <AvatarImage src={submittedByUser.avatarUrl} alt={submittedByUser.name} />
                                                            <AvatarFallback>{getInitials(submittedByUser.name)}</AvatarFallback>
                                                        </Avatar>
                                                        <span>{submittedByUser.name}</span>
                                                    </div>
                                                ) : 'N/A'}
                                            </TableCell>
                                            <TableCell><span className="text-xs text-muted-foreground">{claim.currency}</span> {claim.amount.toLocaleString()}</TableCell>
                                            <TableCell>{format(new Date(claim.date), 'MMM dd, yyyy')}</TableCell>
                                            <TableCell className="text-right">
                                                <Badge variant={statusVariant[claim.status] || 'outline'}>
                                                    {claim.status}
                                                </Badge>
                                            </TableCell>
                                        </TableRow>
                                    )
                                })
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={7} className="h-24 text-center">
                                        No claims found for the selected status.
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