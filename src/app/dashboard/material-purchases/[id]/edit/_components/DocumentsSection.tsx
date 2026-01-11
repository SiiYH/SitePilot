'use client';

import { format, parseISO } from 'date-fns';
import { File, Download, FileText, Receipt, Truck } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

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

interface DocumentsSectionProps {
  documents?: Document[];
}

const getDocumentIcon = (type: Document['type']) => {
  switch (type) {
    case 'invoice':
      return FileText;
    case 'receipt':
      return Receipt;
    case 'delivery_note':
      return Truck;
    default:
      return File;
  }
};

const getDocumentTypeLabel = (type: Document['type']) => {
  switch (type) {
    case 'invoice':
      return 'Invoice';
    case 'receipt':
      return 'Receipt';
    case 'delivery_note':
      return 'Delivery Note';
    default:
      return 'Document';
  }
};

export function DocumentsSection({ documents }: DocumentsSectionProps) {
  if (!documents || documents.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <File className="h-12 w-12 mx-auto mb-3 opacity-50" />
        <p>No documents attached yet.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      {documents.map((doc) => {
        const Icon = getDocumentIcon(doc.type);
        return (
          <Card key={doc.id} className="p-4 hover:bg-muted/50 transition-colors">
            <div className="flex items-start gap-3">
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                <Icon className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1 min-w-0 space-y-2">
                <div className="space-y-1">
                  <p className="font-medium text-sm truncate">{doc.name}</p>
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge variant="outline" className="text-xs">
                      {getDocumentTypeLabel(doc.type)}
                    </Badge>
                    {doc.size && (
                      <span className="text-xs text-muted-foreground">
                        {(doc.size / 1024).toFixed(1)} KB
                      </span>
                    )}
                  </div>
                </div>
                <div className="text-xs text-muted-foreground">
                  <p>Uploaded by {doc.uploadedByName}</p>
                  <p>{format(parseISO(doc.uploadedAt), 'MMM dd, yyyy')}</p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full"
                  onClick={() => window.open(doc.url, '_blank')}
                >
                  <Download className="mr-2 h-3 w-3" />
                  Download
                </Button>
              </div>
            </div>
          </Card>
        );
      })}
    </div>
  );
}