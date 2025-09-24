
'use client';

import { useRouter } from "next/navigation";
import { Claim } from "@/types";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';

interface ClaimsTabProps {
  claims: Claim[];
}

export default function ClaimsTab({ claims }: ClaimsTabProps) {
    const router = useRouter();

    const handleRowClick = (claimId: string) => {
        router.push(`/dashboard/claims/${claimId}`);
    }
    
    const statusVariant: { [key: string]: 'default' | 'secondary' | 'destructive' | 'outline' } = {
      'Paid': 'default',
      'Pending': 'secondary',
      'Overdue': 'destructive',
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle>Claims</CardTitle>
                <CardDescription>All payment claims associated with this project. Click a claim to view details.</CardDescription>
            </CardHeader>
            <CardContent>
                {claims.length > 0 ? (
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Claim ID</TableHead>
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
                                <TableCell className="font-medium">#{claim.id.split('-')[1]}</TableCell>
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
                ) : (
                     <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-muted-foreground/30 bg-muted/20 p-12 text-center">
                        <h3 className="text-lg font-semibold text-muted-foreground">No Claims Found</h3>
                        <p className="mt-1 text-sm text-muted-foreground">There are no payment claims associated with this project yet.</p>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
