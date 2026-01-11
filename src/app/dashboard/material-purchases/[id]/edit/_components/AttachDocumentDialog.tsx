'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useFirestore } from '@/firebase';
import { doc, updateDoc, arrayUnion, serverTimestamp } from 'firebase/firestore';
import { useAuth } from '@/hooks/use-auth';
import { Loader2, Upload, File } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface Document {
  id: string;
  name: string;
  type: 'invoice' | 'delivery_note' | 'receipt' | 'other';
  url: string;
  uploadedBy: string;
  uploadedByName: string;
  uploadedAt: string;
  size?: number;
}

interface AttachDocumentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  purchaseId: string;
  onDocumentAttached?: () => void;
}

export function AttachDocumentDialog({ open, onOpenChange, purchaseId, onDocumentAttached }: AttachDocumentDialogProps) {
  const [file, setFile] = useState<File | null>(null);
  const [documentType, setDocumentType] = useState<Document['type']>('invoice');
  const [isUploading, setIsUploading] = useState(false);
  const firestore = useFirestore();
  const { user } = useAuth();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file || !user) return;

    setIsUploading(true);
    try {
      // In a real implementation, you would upload to Firebase Storage or your file storage service
      // For now, we'll simulate the upload and store metadata
      
      // Simulated upload - replace with actual Firebase Storage upload
      const fileUrl = `https://storage.example.com/${purchaseId}/${Date.now()}_${file.name}`;
      
      const documentData: Document = {
        id: `doc_${Date.now()}`,
        name: file.name,
        type: documentType,
        url: fileUrl,
        uploadedBy: user.id,
        uploadedByName: user.name,
        uploadedAt: new Date().toISOString(),
        size: file.size,
      };

      const purchaseRef = doc(firestore, 'materialPurchases', purchaseId);
      await updateDoc(purchaseRef, {
        documents: arrayUnion(documentData),
        updatedAt: serverTimestamp(),
      });
        // Success
        toast({
            title: "Success",
            description: "Document attached successfully",
        });
        setFile(null);
        setDocumentType('invoice');
        onOpenChange(false);
        onDocumentAttached?.();
    } catch (error) {
        console.error('Error attaching document:', error);
        // Error
        toast({
            title: "Error",
            description: "Failed to attach document",
            variant: "destructive",
        });
    } finally {
        setIsUploading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Attach Document</DialogTitle>
            <DialogDescription>
              Upload invoices, delivery notes, receipts, or other documents related to this purchase.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="documentType">Document Type</Label>
              <Select value={documentType} onValueChange={(value) => setDocumentType(value as Document['type'])}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="invoice">Invoice</SelectItem>
                  <SelectItem value="delivery_note">Delivery Note</SelectItem>
                  <SelectItem value="receipt">Receipt</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="file">File</Label>
              <div className="flex items-center gap-3">
                <Input
                  id="file"
                  type="file"
                  onChange={handleFileChange}
                  accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                  required
                  className="cursor-pointer"
                />
              </div>
              {file && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground mt-2 p-2 bg-muted rounded-md">
                  <File className="h-4 w-4" />
                  <span className="truncate">{file.name}</span>
                  <span className="text-xs">({(file.size / 1024).toFixed(1)} KB)</span>
                </div>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isUploading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isUploading || !file}>
              {isUploading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="mr-2 h-4 w-4" />
                  Attach Document
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}