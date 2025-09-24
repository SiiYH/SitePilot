
'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Claim, Project, User } from "@/types";
import { format } from "date-fns";
import { useRouter } from "next/navigation";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface ClaimsOverviewProps {
    claims: Claim[];
    projects: Project[];
    users: User[];
}

const statusVariant: { [key: string]: 'default' | 'secondary' | 'destructive' | 'outline' } = {
  'Paid': 'default',
  'Pending': 'secondary',
  'Overdue': 'destructive',
};

type StatusFilter = Claim['status'] | 'All';

export default function ClaimsOverview({ claims, projects, users }: ClaimsOverviewProps) {
    const router = useRouter();
    const [filter, setFilter] = useState<StatusFilter>('All');

    const getProjectName = (projectId: string) => {
        return projects.find(p => p.id === projectId)?.name || 'N/A';
    }
    
    const getUserName = (userId: string) => {
        return users.find(u => u.id === userId)?.name || 'NA';
    }

    const handleRowClick = (claimId: string) => {
        router.push(`/dashboard/claims/${claimId}`);
    }

    const filteredClaims = claims.filter(claim => {
        if (filter === 'All') return true;
        return claim.status === filter;
    });

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
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Claim</TableHead>
                            <TableHead>Project</TableHead>
                            <TableHead>Submitted By</TableHead>
                            <TableHead>Amount</TableHead>
                            <TableHead>Date</TableHead>
                            <TableHead className="text-right">Status</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filteredClaims.length > 0 ? (
                            filteredClaims.map(claim => (
                                <TableRow 
                                    key={claim.id} 
                                    onClick={() => handleRowClick(claim.id)}
                                    className="cursor-pointer"
                                >
                                    <TableCell className="font-medium">{claim.title}</TableCell>
                                    <TableCell>{getProjectName(claim.projectId)}</TableCell>
                                    <TableCell>{getUserName(claim.submittedBy)}</TableCell>
                                    <TableCell>${claim.amount.toLocaleString()}</TableCell>
                                    <TableCell>{format(new Date(claim.date), 'MMM dd, yyyy')}</TableCell>
                                    <TableCell className="text-right">
                                        <Badge variant={statusVariant[claim.status] || 'outline'}>
                                            {claim.status}
                                        </Badge>
                                    </TableCell>
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell colSpan={6} className="h-24 text-center">
                                    No claims found for the selected status.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    );
}
