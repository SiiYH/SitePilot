'use client';

import { useState, useEffect } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Download, X, ZoomIn, ZoomOut } from 'lucide-react';

// Conditionally set workerSrc only on the client
if (typeof window !== 'undefined') {
  pdfjs.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';
}

interface PDFPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  pdfUrl: string;
  fileName: string;
  onDownload: () => void;
}

export function PDFPreviewModal({
  isOpen,
  onClose,
  pdfUrl,
  fileName,
  onDownload,
}: PDFPreviewModalProps) {
  const [zoom, setZoom] = useState(1.0);
  const [numPages, setNumPages] = useState<number | null>(null);

  const handleZoomIn = () => setZoom(prev => Math.min(prev + 0.2, 2.0));
  const handleZoomOut = () => setZoom(prev => Math.max(prev - 0.2, 0.5));

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>PDF Preview - {fileName}</DialogTitle>
        </DialogHeader>

        <div className="flex items-center gap-2 py-2 border-b">
          <Button variant="outline" size="sm" onClick={handleZoomOut}>
            <ZoomOut className="h-4 w-4" />
          </Button>
          <span className="text-sm font-medium min-w-[60px] text-center">
            {(zoom * 100).toFixed(0)}%
          </span>
          <Button variant="outline" size="sm" onClick={handleZoomIn}>
            <ZoomIn className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex-1 overflow-auto bg-gray-100 p-4 flex justify-center">
          <Document
            file={pdfUrl}
            onLoadSuccess={({ numPages }) => setNumPages(numPages)}
            loading={<p className="text-sm text-gray-500 text-center">Loading PDF...</p>}
          >
            {Array.from(new Array(numPages), (_, index) => (
              <Page key={index + 1} pageNumber={index + 1} scale={zoom} />
            ))}
          </Document>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            <X className="mr-2 h-4 w-4" />
            Cancel
          </Button>
          <Button onClick={onDownload}>
            <Download className="mr-2 h-4 w-4" />
            Download PDF
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
