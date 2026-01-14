'use client';

import { useRouter } from 'next/navigation';
import { ArrowLeft, Package, Calendar, User, FileText, ShoppingCart, TrendingDown, Edit, MessageSquare, FileUp } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { format, parseISO, differenceInHours } from 'date-fns';
import { useDoc, useMemoFirebase, useFirestore } from '@/firebase';
import { doc } from 'firebase/firestore';
import type { MaterialPurchase, Material, Project, User as UserType, Company } from '@/types';
import { Loader2 } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';

const InfoField = ({
  icon,
  label,
  value,
  children
}: {
  icon: React.ElementType;
  label: string;
  value?: string | null;
  children?: React.ReactNode
}) => {
  const Icon = icon;
  return (
    <div className="flex items-start gap-4">
      <Icon className="h-5 w-5 mt-1 flex-shrink-0 text-muted-foreground" />
      <div className="space-y-1">
        <p className="text-sm font-medium text-muted-foreground">{label}</p>
        {value && <p className="text-sm break-words">{value}</p>}
        {children && <div className="text-sm">{children}</div>}
      </div>
    </div>
  );
};

const getStatusVariant = (status: MaterialPurchase['status']) => {
  switch (status) {
    case 'Delivered':
      return 'default';
    case 'Ordered':
      return 'secondary';
    case 'Pending':
      return 'outline';
    case 'Partially Delivered':
      return 'secondary';
    case 'Cancelled':
    case 'Returned':
      return 'destructive';
    default:
      return 'outline';
  }
};

const GRACE_PERIOD_HOURS = 90;

export default function MaterialPurchaseClient({ purchase }: { purchase: MaterialPurchase }) {
  const router = useRouter();
  const firestore = useFirestore();
  const { user: currentUser } = useAuth();

  // Fetch material details
  const materialRef = useMemoFirebase(
    () => doc(firestore, 'materials', purchase.materialId),
    [firestore, purchase.materialId]
  );
  const { data: material, isLoading: materialLoading } = useDoc<Material>(materialRef);

  // Fetch project details
  const projectRef = useMemoFirebase(
    () => doc(firestore, 'projects', purchase.projectId),
    [firestore, purchase.projectId]
  );
  const { data: project, isLoading: projectLoading } = useDoc<Project>(projectRef);

  // Fetch creator details
  const creatorRef = useMemoFirebase(
    () => doc(firestore, 'users', purchase.createdBy),
    [firestore, purchase.createdBy]
  );
  const { data: creator, isLoading: creatorLoading } = useDoc<UserType>(creatorRef);

  // Fetch company details for currency
  const companyRef = useMemoFirebase(
    () => doc(firestore, 'companies', purchase.companyId),
    [firestore, purchase.companyId]
  );
  const { data: company, isLoading: companyLoading } = useDoc<Company>(companyRef);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: company?.currency || 'USD',
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    try {
      return format(parseISO(dateString), 'MMM dd, yyyy');
    } catch {
      return dateString;
    }
  };

  // Determine edit permissions
  const getEditPermissions = () => {
    const createdAt = parseISO(purchase.createdAt);
    const hoursSinceCreation = differenceInHours(new Date(), createdAt);
    const withinGracePeriod = hoursSinceCreation <= GRACE_PERIOD_HOURS;

    return {
      canFullEdit: (purchase.status === 'Ordered' || purchase.status === 'Pending') && withinGracePeriod,
      canEditNotes: purchase.status !== 'Cancelled',
      canChangeStatus: purchase.status !== 'Cancelled',
      canAttachDocuments: true,
      isReadOnly: purchase.status === 'Cancelled',
      canEditAfterDelivery: purchase.status === 'Delivered' || purchase.status === 'Partially Delivered',
    };
  };

  const permissions = getEditPermissions();

  const handleEdit = () => {
    router.push(`/dashboard/material-purchases/${purchase.id}/edit`);
  };

  const handleAddNote = () => {
    // TODO: Implement add note functionality
    console.log('Add note');
  };

  const handleAttachDocument = () => {
    // TODO: Implement attach document functionality
    console.log('Attach document');
  };

  const isLoading = materialLoading || projectLoading || creatorLoading || companyLoading;

  if (isLoading) {
    return (
      <div className="flex h-[calc(100vh-10rem)] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const amountPaid = purchase.totalPaid || 0;
  const balanceDue = purchase.totalPrice - amountPaid;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Button variant="outline" onClick={() => router.back()}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>

        <div className="flex gap-2">
          {permissions.canAttachDocuments && (
            <Button variant="outline" onClick={handleAttachDocument}>
              <FileUp className="mr-2 h-4 w-4" />
              Attach Document
            </Button>
          )}

          {permissions.canEditNotes && (
            <Button variant="outline" onClick={handleAddNote}>
              <MessageSquare className="mr-2 h-4 w-4" />
              Add Note
            </Button>
          )}

          {permissions.canFullEdit && (
            <Button onClick={handleEdit}>
              <Edit className="mr-2 h-4 w-4" />
              Edit Purchase
            </Button>
          )}

          {permissions.canEditAfterDelivery && !permissions.canFullEdit && (
            <Button variant="secondary" onClick={handleEdit} disabled>
              <Edit className="mr-2 h-4 w-4" />
              Limited Edit
            </Button>
          )}

          {permissions.isReadOnly && (
            <Badge variant="destructive" className="px-3 py-2">
              Read Only
            </Badge>
          )}
        </div>
      </div>

      <Card className="max-w-5xl mx-auto">
        <CardHeader>
          <div className="flex flex-col sm:flex-row items-start justify-between gap-4">
            <div className="space-y-2">
              <CardTitle className="text-3xl">
                Purchase Order #{purchase.id.slice(0, 8).toUpperCase()}
              </CardTitle>
              <CardDescription>
                Created {formatDate(purchase.createdAt)} by {creator?.name || 'Unknown User'}
              </CardDescription>
            </div>
            <div className="flex flex-col gap-2 items-end">
              <Badge variant={getStatusVariant(purchase.status)} className="text-sm px-3 py-1">
                {purchase.status.toUpperCase()}
              </Badge>
              {!permissions.canFullEdit && !permissions.isReadOnly && (
                <span className="text-xs text-muted-foreground">
                  {permissions.canEditAfterDelivery
                    ? 'Limited editing (delivered)'
                    : 'Grace period expired'}
                </span>
              )}
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Purchase Overview */}
          <div>
            <h3 className="font-semibold text-lg mb-4">Purchase Overview</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <InfoField
                icon={Calendar}
                label="Purchase Date"
                value={formatDate(purchase.purchaseDate)}
              />
              <InfoField
                icon={User}
                label="Supplier"
                value={purchase.supplier}
              />
              {project && (
                <InfoField
                  icon={Package}
                  label="Project"
                  value={project.name}
                />
              )}
              <InfoField
                icon={User}
                label="Created By"
                value={creator?.name || 'Unknown User'}
              />
            </div>
          </div>

          <Separator />

          {/* Material Details */}
          <div>
            <h3 className="font-semibold text-lg mb-4">Material Details</h3>
            <div className="border rounded-lg overflow-hidden">
              <table className="w-full">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="text-left p-3 text-sm font-medium">Material</th>
                    <th className="text-right p-3 text-sm font-medium">Quantity</th>
                    <th className="text-right p-3 text-sm font-medium">Unit Price</th>
                    <th className="text-right p-3 text-sm font-medium">Total</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="hover:bg-muted/30 transition-colors">
                    <td className="p-3">
                      <div className="font-medium">{material?.name || 'Loading...'}</div>
                      {material?.description && (
                        <div className="text-sm text-muted-foreground">{material.description}</div>
                      )}
                    </td>
                    <td className="p-3 text-right">
                      {purchase.quantity} {material?.unit || 'units'}
                    </td>
                    <td className="p-3 text-right">{formatCurrency(purchase.unitPrice)}</td>
                    <td className="p-3 text-right font-medium">{formatCurrency(purchase.totalPrice)}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <Separator />

          {/* Financial Summary */}
          <div>
            <h3 className="font-semibold text-lg mb-4">Financial Summary</h3>
            <div className="border rounded-lg overflow-hidden">
              <table className="w-full">
                <tbody className="divide-y">
                  <tr className="hover:bg-muted/30 transition-colors">
                    <td className="p-3 font-medium">Subtotal</td>
                    <td className="p-3 text-right">
                      {formatCurrency(purchase.totalPrice)}
                    </td>
                  </tr>

                  {purchase.discount! > 0 ? (
                    <tr className="hover:bg-muted/30 transition-colors">
                      <td className="p-3 font-medium flex items-center gap-2">
                        <TrendingDown className="h-4 w-4 text-green-600" />
                        Discount
                      </td>
                      <td className="p-3 text-right text-green-600">
                        -{formatCurrency(purchase.discount!)}
                      </td>
                    </tr>
                  ) : null}

                  <tr className="bg-muted/50 border-t-2">
                    <td className="p-3 font-semibold">Total Amount</td>
                    <td className="p-3 text-right font-bold text-lg">
                      {formatCurrency(
                        purchase.discount
                          ? purchase.totalPrice - purchase.discount
                          : purchase.totalPrice
                      )}
                    </td>
                  </tr>

                  {purchase.totalPaid !== undefined ? (
                    <tr className="hover:bg-muted/30 transition-colors">
                      <td className="p-3 font-medium">Amount Paid</td>
                      <td className="p-3 text-right text-green-600 font-medium">
                        {formatCurrency(amountPaid)}
                      </td>
                    </tr>
                  ) : null}

                  {purchase.totalPaid !== undefined ? (
                    <tr className="bg-muted/30">
                      <td className="p-3 font-semibold">Balance Due</td>
                      <td
                        className={`p-3 text-right font-bold ${balanceDue > 0 ? 'text-orange-600' : 'text-green-600'
                          }`}
                      >
                        {formatCurrency(balanceDue)}
                      </td>
                    </tr>
                  ) : null}
                </tbody>
              </table>
            </div>
          </div>


          <Separator />

          {/* Edit Permissions Info */}
          {!permissions.isReadOnly && (
            <>
              <div className="bg-muted/50 rounded-lg p-4">
                <h4 className="font-medium mb-2 flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Editing Permissions
                </h4>
                <div className="text-sm space-y-1 text-muted-foreground">
                  {permissions.canFullEdit && (
                    <p>✓ Full editing available (within {GRACE_PERIOD_HOURS}h grace period)</p>
                  )}
                  {!permissions.canFullEdit && permissions.canEditAfterDelivery && (
                    <>
                      <p>⚠ Limited editing - Status is "{purchase.status}"</p>
                      <p className="text-xs">• Can add notes and comments</p>
                      <p className="text-xs">• Can change status</p>
                      <p className="text-xs">• Cannot modify quantities or prices</p>
                    </>
                  )}
                  {!permissions.canFullEdit && !permissions.canEditAfterDelivery && (
                    <p>⚠ Grace period expired - Limited editing only</p>
                  )}
                  <p>✓ Can always add notes and attach documents</p>
                </div>
              </div>
              <Separator />
            </>
          )}

          {/* Additional Information */}
          <div>
            <h3 className="font-semibold text-lg mb-4">Additional Information</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <InfoField
                icon={FileText}
                label="Purchase ID"
                value={purchase.id}
              />
              <InfoField
                icon={ShoppingCart}
                label="Company ID"
                value={purchase.companyId}
              />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
