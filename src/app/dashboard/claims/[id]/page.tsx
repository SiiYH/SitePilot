
'use client';

import { useParams, notFound, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Claim, Project, User } from '@/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ArrowLeft, DollarSign, Calendar, GanttChartSquare, Edit, User as UserIcon, Paperclip, MessageSquare, Save, CheckCircle, FileText, Hash, ThumbsDown, ThumbsUp, XCircle, Info } from 'lucide-react';
import { format } from 'date-fns';
import { useState, useEffect } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import Image from 'next/image';
import { useAuth } from '@/hooks/use-auth';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '@/components/ui/carousel';
import { getFirestore, doc, getDoc, updateDoc, Firestore } from 'firebase/firestore';
import { useFirestore, updateDocumentNonBlocking } from '@/firebase';
import { onSnapshot } from 'firebase/firestore';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';

const getInitials = (name: string) => {
    if (!name) return '';
    const names = name.split(' ');
    if (names.length > 1) {
        return `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
};

const statusVariant: { [key: string]: 'default' | 'secondary' | 'destructive' | 'outline' } = {
  'Paid': 'default',
  'Pending': 'secondary',
  'Overdue': 'destructive',
  'Rejected': 'destructive',
};

const InfoField = ({ icon, label, value, children }: { icon: React.ElementType; label: string; value?: string | null; children?: React.ReactNode }) => {
    const Icon = icon;
    return (
        <div className="flex items-start gap-4">
            <Icon className="h-5 w-5 mt-1 flex-shrink-0 text-muted-foreground" />
            <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">{label}</p>
                {value && <p className="text-sm break-words">{value}</p>}
                {children}
            </div>
        </div>
    );
};

export default function ClaimDetailsPage() {
  const params = useParams();
  const id = params.id as string;
  const { user } = useAuth();
  const { toast } = useToast();
  const firestore = useFirestore();
  const [claimData, setClaimData] = useState<{ claim: Claim; project?: Project, submittedBy?: User, approvedBy?: User } | null>(null);
  const [remark, setRemark] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [isEditingRemark, setIsEditingRemark] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [permissionError, setPermissionError] = useState(false);

  useEffect(() => {
    if (!id || !firestore) return;
    
    setIsLoading(true);
    setPermissionError(false);

    const claimRef = doc(firestore, 'claims', id);
    const unsub = onSnapshot(
      claimRef, 
      async (snapshot) => {
        if (!snapshot.exists()) {
          setClaimData(null);
          setIsLoading(false);
          notFound();
          return;
        }
        try {
            const claim = { id: snapshot.id, ...snapshot.data() } as Claim;
          
            const projectRef = doc(firestore, 'projects', claim.projectId);
            const submittedByRef = claim.submittedBy ? doc(firestore, 'users', claim.submittedBy) : null;
            const approvedByRef = claim.approvedBy ? doc(firestore, 'users', claim.approvedBy) : null;
          
            const [projectSnap, submittedBySnap, approvedBySnap] = await Promise.all([
              getDoc(projectRef).catch((err) => {
                console.error('❌ Project fetch error:', err.code, err.message);
                throw new Error(`Project fetch failed: ${err.message}`);
              }),
              submittedByRef
                ? getDoc(submittedByRef).catch((err) => {
                    console.error('❌ SubmittedBy fetch error:', err.code, err.message);
                    throw new Error(`SubmittedBy fetch failed: ${err.message}`);
                  })
                : null,
              approvedByRef
                ? getDoc(approvedByRef).catch((err) => {
                    console.error('❌ ApprovedBy fetch error:', err.code, err.message);
                    throw new Error(`ApprovedBy fetch failed: ${err.message}`);
                  })
                : null,
            ]);
          
            const project = projectSnap?.exists()
              ? ({ id: projectSnap.id, ...projectSnap.data() } as Project)
              : undefined;
            const submittedBy = submittedBySnap?.exists()
              ? ({ id: submittedBySnap.id, ...submittedBySnap.data() } as User)
              : undefined;
            const approvedBy = approvedBySnap?.exists()
              ? ({ id: approvedBySnap.id, ...approvedBySnap.data() } as User)
              : undefined;
          
            setClaimData({ claim, project, submittedBy, approvedBy });
            setRemark(claim.remark || '');
            setIsLoading(false);
          } catch (err: any) {
            console.error('🔥 Error fetching claim details:', err.code || err.name, err.message);
            console.error('🧩 Full error object:', err);
            setIsLoading(false);
          }
          
      },
      (error) => {
        console.error("Firestore permission error:", error);
        setPermissionError(true);
        setIsLoading(false);
        toast({
          variant: "destructive",
          title: "Permission Denied",
          description: "You don't have permission to view this claim.",
        });
        setClaimData(null);
      }
    );
    return () => unsub();
  }, [id, firestore, toast]);

  if (isLoading) {
    return (
        <div className="flex h-[calc(100vh-10rem)] items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
    );
  }

  if (permissionError || !claimData || !user) {
    return (
        <div className="flex h-[calc(100vh-10rem)] items-center justify-center">
            <Card className="w-full max-w-md">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-destructive">
                        <XCircle className="h-6 w-6" />
                        Access Denied
                    </CardTitle>
                    <CardDescription>
                        You don't have permission to view this claim.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <p className="text-sm text-muted-foreground mb-4">
                        This could be because:
                    </p>
                    <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1 mb-4">
                        <li>You're not the claim submitter</li>
                        <li>You don't have director privileges</li>
                        <li>The claim doesn't exist</li>
                    </ul>
                    <Button asChild className="w-full">
                        <Link href="/dashboard/claims">
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Back to Claims
                        </Link>
                    </Button>
                </CardContent>
            </Card>
        </div>
    );
  }

  const { claim, project, submittedBy, approvedBy } = claimData;
  const isDirector = user.role === 'director';
  const isAdmin = user.role === 'admin';
  const canEditClaim = user.id === claim.submittedBy && claim.status !== 'Paid';
  
  const handleApprove = async () => {
    if (!isDirector || !firestore) return;
    setIsSubmitting(true);
    try {
      const claimRef = doc(firestore, 'claims', claim.id);
      const updateData = {
        status: 'Paid' as const,
        approvedBy: user.id,
        approvedAt: new Date().toISOString(),
      };
      await updateDoc(claimRef, updateData);
      toast({
        title: 'Claim Approved',
        description: 'The claim has been marked as Paid.',
        className: 'bg-green-100 text-green-800 border-green-200'
      });
    } catch (error) {
      console.error(error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to approve claim.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleReject = async () => {
    if (!isDirector || !firestore || !rejectionReason) {
      toast({
        variant: 'destructive',
        title: 'Rejection Failed',
        description: 'Please provide a reason for rejection.',
      });
      return;
    }
    setIsSubmitting(true);
    try {
      const claimRef = doc(firestore, 'claims', claim.id);
      const updateData = {
        status: 'Rejected' as const,
        remark: rejectionReason,
        approvedBy: null,
        approvedAt: null,
      };
      await updateDoc(claimRef, updateData);
      toast({
        title: 'Claim Rejected',
        description: 'The claim has been marked as Rejected.',
      });
      setRejectionReason('');
    } catch (error) {
      console.error(error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to reject claim.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleSaveRemark = async () => {
    try {
      const claimRef = doc(firestore, 'claims', claim.id);
      await updateDoc(claimRef, { remark });
      setClaimData(prevData => prevData ? { ...prevData, claim: { ...prevData.claim, remark } } : null);
      setIsEditingRemark(false);
      toast({
        title: "Remark Saved",
        description: "The remark has been successfully updated.",
      });
    } catch (error) {
      console.error(error);
      toast({
        title: "Error",
        description: "Failed to save remark.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
       <Button variant="outline" asChild>
          <Link href="/dashboard/claims">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to All Claims
          </Link>
        </Button>
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Claim Details</h2>
        <p className="text-muted-foreground">Details for claim #{claim.id.split('-')[1]}</p>
      </div>
      
      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        <div className="md:col-span-2 space-y-6">
            <Card>
                <CardHeader>
                    <div className="flex flex-col-reverse items-start gap-4 sm:flex-row sm:items-center sm:justify-between">
                        <CardTitle>{claim.title}</CardTitle>
                        <div className="flex items-center gap-2">
                           {canEditClaim && (
                                <Button variant="outline" size="sm" asChild>
                                    <Link href={`/dashboard/claims/${claim.id}/edit`}>
                                        <Edit className="mr-2 h-4 w-4" />
                                        Edit Claim
                                    </Link>
                                </Button>
                            )}
                            <Badge variant={statusVariant[claim.status] || 'outline'} className="text-base px-3 py-1">
                                {claim.status}
                            </Badge>
                        </div>
                    </div>
                    <CardDescription>
                        Submitted on {format(new Date(claim.date), 'PPP')} for {project ? <Link href={`/dashboard/projects/${project.id}`} className="text-primary hover:underline font-medium">{project.name}</Link> : 'N/A'}
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    {claim.type && (
                         <InfoField icon={Info} label="Claim Type" value={claim.type} />
                    )}
                    {claim.description && (
                         <InfoField icon={FileText} label="Description" value={claim.description} />
                    )}
                     {claim.eInvoiceNo && (
                         <InfoField icon={Hash} label="e-Invoice No." value={claim.eInvoiceNo} />
                    )}
                    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                        <InfoField icon={DollarSign} label="Amount">
                           <p className="text-2xl font-bold"><span className="text-sm text-muted-foreground">{claim.currency}</span> {claim.amount.toLocaleString()}</p>
                        </InfoField>

                        {project && (
                            <InfoField icon={GanttChartSquare} label="Associated Project">
                                <Link href={`/dashboard/projects/${project.id}`} className="text-primary hover:underline font-medium">
                                    {project.name}
                                </Link>
                            </InfoField>
                        )}
                        {submittedBy && (
                            <InfoField icon={UserIcon} label="Submitted By">
                                <div className="flex items-center gap-2">
                                    <Avatar className="h-8 w-8">
                                        <AvatarImage src={submittedBy.avatarUrl} alt={submittedBy.name} />
                                        <AvatarFallback>{getInitials(submittedBy.name)}</AvatarFallback>
                                    </Avatar>
                                    <p className="font-medium">{submittedBy.name}</p>
                                </div>
                            </InfoField>
                        )}
                    </div>
                    {claim.status !== 'Paid' && claim.status !== 'Rejected' && isDirector && (
                      <Card className="bg-muted/40">
                          <CardHeader>
                              <CardTitle className="text-xl">Manage Claim</CardTitle>
                              <CardDescription>
                                  Approve or reject this payment claim.
                              </CardDescription>
                          </CardHeader>
                          <CardContent className="flex flex-col sm:flex-row gap-2">
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button className="w-full sm:w-auto" disabled={isSubmitting}>
                                      <ThumbsUp className="mr-2 h-4 w-4" />
                                      Approve as Paid
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                    <AlertDialogHeader>
                                    <AlertDialogTitle>Approve Claim?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                        This will mark the claim as 'Paid' and record you as the approver. This action can be reversed.
                                    </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction onClick={handleApprove} disabled={isSubmitting}>
                                        {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : 'Confirm Approval'}
                                    </AlertDialogAction>
                                    </AlertDialogFooter>
                                </AlertDialogContent>
                            </AlertDialog>

                             <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button variant="destructive" className="w-full sm:w-auto" disabled={isSubmitting}>
                                      <ThumbsDown className="mr-2 h-4 w-4" />
                                      Reject
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                    <AlertDialogHeader>
                                    <AlertDialogTitle>Reject Claim?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                        Please provide a reason for rejecting this claim. This will be visible to the submitter.
                                    </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <div className="grid gap-2">
                                        <Label htmlFor="rejection-reason">Reason for Rejection</Label>
                                        <Textarea 
                                            id="rejection-reason"
                                            placeholder="e.g., Incorrect amount, missing receipt details..."
                                            value={rejectionReason}
                                            onChange={(e) => setRejectionReason(e.target.value)}
                                        />
                                    </div>
                                    <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction onClick={handleReject} disabled={isSubmitting || !rejectionReason}>
                                        {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : 'Confirm Rejection'}
                                    </AlertDialogAction>
                                    </AlertDialogFooter>
                                </AlertDialogContent>
                            </AlertDialog>
                          </CardContent>
                      </Card>
                    )}
                     {claim.status !== 'Paid' && claim.status !== 'Rejected' && isAdmin && (
                        <Card className="bg-muted/40">
                           <CardHeader>
                               <CardTitle className="text-base flex items-center gap-2">
                                   <Info className="h-4 w-4" />
                                   Admin View
                               </CardTitle>
                           </CardHeader>
                           <CardContent>
                                <p className="text-sm text-muted-foreground">
                                    Only users with the 'director' role can approve or reject claims.
                                </p>
                           </CardContent>
                        </Card>
                    )}
                    {claim.status === 'Paid' && approvedBy && claim.approvedAt && (
                        <div className="flex items-center gap-2 mt-4 text-sm text-muted-foreground rounded-lg border bg-green-500/10 p-3 text-green-700 dark:text-green-300">
                            <CheckCircle className="h-5 w-5" />
                            <span>Approved by {approvedBy.name} on {format(new Date(claim.approvedAt), 'PPP')}</span>
                        </div>
                    )}
                     {claim.status === 'Rejected' && (
                        <div className="flex items-center gap-2 mt-4 text-sm text-muted-foreground rounded-lg border bg-destructive/10 p-3 text-destructive">
                            <XCircle className="h-5 w-5" />
                            <span>This claim has been rejected.</span>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
        
        <div className="md:col-span-1 space-y-6">
            {claim.receiptImageUrls && claim.receiptImageUrls.length > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Paperclip className="h-5 w-5 text-primary" />
                            <span>Attached Receipt(s)</span>
                        </CardTitle>
                        <CardDescription>Image(s) submitted as proof for this claim. Click to enlarge.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Carousel className="w-full max-w-xs mx-auto">
                            <CarouselContent>
                                {claim.receiptImageUrls.map((url, index) => (
                                    <CarouselItem key={index}>
                                        <Dialog>
                                            <DialogTrigger asChild>
                                                <div className="relative aspect-[3/4] w-full cursor-pointer overflow-hidden rounded-lg border transition-shadow hover:shadow-lg">
                                                    <Image
                                                        src={url}
                                                        alt={`Receipt for claim ${index + 1}`}
                                                        fill
                                                        className="object-cover"
                                                        data-ai-hint="uploaded receipt"
                                                    />
                                                </div>
                                            </DialogTrigger>
                                            <DialogContent className="p-0 sm:max-w-3xl border-0 bg-transparent shadow-none">
                                                <DialogTitle className="sr-only">Enlarged Receipt Image</DialogTitle>
                                                <div className="relative aspect-video w-full sm:aspect-[3/4]">
                                                    <Image
                                                        src={url}
                                                        alt={`Receipt for claim ${index + 1}`}
                                                        fill
                                                        className="object-contain"
                                                    />
                                                </div>
                                            </DialogContent>
                                        </Dialog>
                                    </CarouselItem>
                                ))}
                            </CarouselContent>
                            <CarouselPrevious />
                            <CarouselNext />
                        </Carousel>
                    </CardContent>
                </Card>
            )}
            <Card>
                 <CardHeader>
                    <div className="flex items-center justify-between">
                         <CardTitle className="flex items-center gap-2">
                            <MessageSquare className="h-5 w-5 text-primary" />
                            <span>Director's Remark</span>
                        </CardTitle>
                        {user?.role === 'director' && !isEditingRemark && (
                            <Button variant="outline" size="sm" onClick={() => setIsEditingRemark(true)} className="p-2 h-auto sm:h-9 sm:px-3 sm:py-2">
                                <Edit className="h-4 w-4 sm:mr-2"/>
                                <span className="sr-only sm:not-sr-only">Edit</span>
                            </Button>
                        )}
                    </div>
                 </CardHeader>
                 <CardContent>
                    {isEditingRemark && user?.role === 'director' ? (
                        <div className="space-y-4">
                            <Textarea 
                                placeholder="Add a remark for this claim..."
                                value={remark}
                                onChange={(e) => setRemark(e.target.value)}
                                rows={4}
                            />
                        </div>
                    ) : (
                        <p className="text-sm text-muted-foreground italic">
                            {claim.remark || "No remark added."}
                        </p>
                    )}
                 </CardContent>
                 {isEditingRemark && user?.role === 'director' && (
                    <CardFooter className="justify-end gap-2">
                        <Button variant="ghost" onClick={() => {
                            setIsEditingRemark(false);
                            setRemark(claim.remark || '');
                        }}>Cancel</Button>
                        <Button onClick={handleSaveRemark}>
                            <Save className="h-4 w-4 mr-2" />
                            Save Remark
                        </Button>
                    </CardFooter>
                 )}
            </Card>
        </div>
      </div>
    </div>
  );
}
