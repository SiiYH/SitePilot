
'use client';

import { useParams, notFound, useRouter } from 'next/navigation';
import Link from 'next/link';
import { mockClaims, mockUsers, mockProjects } from '@/lib/data';
import { Claim, Project, User } from '@/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ArrowLeft, DollarSign, Calendar, GanttChartSquare, Edit, User as UserIcon, Paperclip, MessageSquare, Save, CheckCircle, FileText, Hash } from 'lucide-react';
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


async function getClaim(firestore: Firestore, id: string): Promise<{ claim: Claim; project?: Project; submittedBy?: User; approvedBy?: User } | undefined> {
    const claimRef = doc(firestore, 'claims', id);
    const claimSnap = await getDoc(claimRef);
  
    if (!claimSnap.exists()) return undefined;
  
    const claim = { id: claimSnap.id, ...claimSnap.data() } as Claim;
  
    // Fetch project, submittedBy, approvedBy if present
    const [projectSnap, submittedSnap, approvedSnap] = await Promise.all([
      claim.projectId ? getDoc(doc(firestore, 'projects', claim.projectId)) : Promise.resolve(null),
      claim.submittedBy ? getDoc(doc(firestore, 'users', claim.submittedBy)) : Promise.resolve(null),
      claim.approvedBy ? getDoc(doc(firestore, 'users', claim.approvedBy)) : Promise.resolve(null),
    ]);
  
    return {
      claim,
      project: projectSnap?.exists() ? ({ id: projectSnap.id, ...projectSnap.data() } as Project) : undefined,
      submittedBy: submittedSnap?.exists() ? ({ id: submittedSnap.id, ...submittedSnap.data() } as User) : undefined,
      approvedBy: approvedSnap?.exists() ? ({ id: approvedSnap.id, ...approvedSnap.data() } as User) : undefined,
    };
  }
  

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
  const [isEditingRemark, setIsEditingRemark] = useState(false);

  useEffect(() => {
    if (id && firestore) {
        getClaim(firestore, id).then(data => {
            if (data) {
                setClaimData(data);
                setRemark(data.claim.remark || '');
            } else {
                notFound();
            }
        });
    }
  }, [id, firestore]);

  if (!claimData || !user) {
    return null;
  }

  const { claim, project, submittedBy, approvedBy } = claimData;
  const canManageClaim = user.role === 'director';

  const handleStatusChange = async (newStatus: Claim['status']) => {
    if (!canManageClaim) return;
  
    try {
      const claimRef = doc(firestore, 'claims', claim.id);
  
      const updateData: any = { status: newStatus };
  
      if (newStatus === 'Paid') {
        updateData.approvedBy = user.id;
        updateData.approvedAt = new Date().toISOString();
      } else {
        updateData.approvedBy = null;
        updateData.approvedAt = null;
      }
  
      await updateDoc(claimRef, updateData);
  
      toast({
        title: "Claim updated",
        description: `Claim status changed to ${newStatus}.`,
      });
  
      const refreshed = await getClaim(firestore, claim.id);
      if (refreshed) setClaimData(refreshed);
  
    } catch (error) {
      console.error(error);
      toast({
        title: "Error",
        description: "Failed to update claim status.",
        variant: "destructive",
      });
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
                        <Badge variant={statusVariant[claim.status] || 'outline'} className="text-base px-3 py-1">
                            {claim.status}
                        </Badge>
                    </div>
                    <CardDescription>
                        Submitted on {format(new Date(claim.date), 'PPP')} for {project ? <Link href={`/dashboard/projects/${project.slug}`} className="text-primary hover:underline font-medium">{project.name}</Link> : 'N/A'}
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
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
                                <Link href={`/dashboard/projects/${project.slug}`} className="text-primary hover:underline font-medium">
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

                    <Card className="bg-muted/40">
                        <CardHeader>
                            <CardTitle className="text-xl">Manage Claim</CardTitle>
                            <CardDescription>
                                {canManageClaim 
                                    ? "Update the status of this payment claim." 
                                    : "Only Directors can change the claim status."}
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="max-w-xs">
                                {canManageClaim ? (
                                    <Select value={claim.status} onValueChange={handleStatusChange}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Set status" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="Pending">Pending</SelectItem>
                                            <SelectItem value="Paid">Paid</SelectItem>
                                            <SelectItem value="Overdue">Overdue</SelectItem>
                                        </SelectContent>
                                    </Select>
                                ) : (
                                     <Badge variant={statusVariant[claim.status] || 'outline'} className="text-base px-3 py-1">
                                        {claim.status}
                                    </Badge>
                                )}
                            </div>
                            {claim.status === 'Paid' && approvedBy && claim.approvedAt && (
                                <div className="flex items-center gap-2 mt-4 text-sm text-muted-foreground">
                                    <CheckCircle className="h-4 w-4 text-green-500" />
                                    <span>Approved by {approvedBy.name} on {format(new Date(claim.approvedAt), 'PPP')}</span>
                                </div>
                            )}
                        </CardContent>
                    </Card>
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
                            <span>director's Remark</span>
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
