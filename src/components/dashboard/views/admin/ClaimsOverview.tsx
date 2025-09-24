
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Claim, Project, User } from "@/types";
import { format } from "date-fns";
import { useRouter } from "next/navigation";

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

export default function ClaimsOverview({ claims, projects, users }: ClaimsOverviewProps) {
    const router = useRouter();
    
    const getProjectName = (projectId: string) => {
        return projects.find(p => p.id === projectId)?.name || 'N/A';
    }
    
    const getUserName = (userId: string) => {
        return users.find(u => u.id === userId)?.name || 'N/A';
    }

    const handleRowClick = (claimId: string) => {
        router.push(`/dashboard/claims/${claimId}`);
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Recent Claims</CardTitle>
                <CardDescription>A summary of recent payment claims. Click a claim to view details.</CardDescription>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Project</TableHead>
                            <TableHead>Submitted By</TableHead>
                            <TableHead>Amount</TableHead>
                            <TableHead>Date</TableHead>
                            <TableHead className="text-right">Status</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {claims.map(claim => (
                            <TableRow 
                                key={claim.id} 
                                onClick={() => handleRowClick(claim.id)}
                                className="cursor-pointer"
                            >
                                <TableCell className="font-medium">{getProjectName(claim.projectId)}</TableCell>
                                <TableCell>{getUserName(claim.submittedBy)}</TableCell>
                                <TableCell>${claim.amount.toLocaleString()}</TableCell>
                                <TableCell>{format(new Date(claim.date), 'MMM dd, yyyy')}</TableCell>
                                <TableCell className="text-right">
                                    <Badge variant={statusVariant[claim.status] || 'outline'}>
                                        {claim.status}
                                    </Badge>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    );
}
