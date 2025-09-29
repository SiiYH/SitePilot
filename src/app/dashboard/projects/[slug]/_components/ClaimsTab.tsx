
'use client';

import { useRouter } from "next/navigation";
import { Claim, User, Project } from "@/types";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { mockUsers } from "@/lib/data";
import { DollarSign, User as UserIcon, Calendar } from 'lucide-react';
import CreateClaimDialog from "@/components/dashboard/CreateClaimDialog";
import { useAuth } from "@/hooks/use-auth";

interface ClaimsTabProps {
  claims: Claim[];
  project: Project;
  onClaimCreated: (newClaim: Claim) => void;
}

export default function ClaimsTab({ claims, project, onClaimCreated }: ClaimsTabProps) {
    const router = useRouter();
    const { user } = useAuth();

    const handleRowClick = (claimId: string) => {
        router.push(`/dashboard/claims/${claimId}`);
    }
    
    const getUserName = (userId: string) => {
        return mockUsers.find(u => u.id === userId)?.name || 'N/A';
    }

    const statusVariant: { [key: string]: 'default' | 'secondary' | 'destructive' | 'outline' } = {
      'Paid': 'default',
      'Pending': 'secondary',
      'Overdue': 'destructive',
    };

    return (
        <Card>
            <CardHeader className="flex flex-row items-start justify-between">
                <div>
                    <CardTitle>Claims</CardTitle>
                    <CardDescription>All payment claims associated with this project. Click a claim to view details.</CardDescription>
                </div>
                {user?.role === 'Engineer' && (
                    <CreateClaimDialog
                        projects={[project]}
                        onClaimCreated={onClaimCreated}
                        userId={user.id}
                        defaultProjectId={project.id}
                    />
                )}
            </CardHeader>
            <CardContent>
                {claims.length > 0 ? (
                <>
                    {/* Mobile View: List of Cards */}
                    <div className="space-y-4 md:hidden">
                        {claims.map(claim => (
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
                                        <UserIcon className="h-4 w-4 text-muted-foreground" />
                                        <span className="text-muted-foreground">Submitted by {getUserName(claim.submittedBy)}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Calendar className="h-4 w-4 text-muted-foreground" />
                                        <span className="text-muted-foreground">{format(new Date(claim.date), 'MMM dd, yyyy')}</span>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>

                    {/* Desktop View: Table */}
                    <div className="hidden md:block">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Claim</TableHead>
                                    <TableHead>e-Inv No.</TableHead>
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
                                        <TableCell className="font-medium">{claim.title}</TableCell>
                                        <TableCell>{claim.eInvoiceNo || 'N/A'}</TableCell>
                                        <TableCell>{getUserName(claim.submittedBy)}</TableCell>
                                        <TableCell><span className="text-xs text-muted-foreground">{claim.currency}</span> {claim.amount.toLocaleString()}</TableCell>
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
                    </div>
                </>
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
