'use client';

import { useState, useEffect } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Download, X, ZoomIn, ZoomOut, Loader2, AlertCircle, ChevronLeft, ChevronRight } from 'lucide-react';

// Import required CSS for TextLayer and AnnotationLayer
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';

// Set up the worker source for pdfjs
pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url,
).toString();


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

  const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
    setNumPages(numPages);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl h-[90vh] flex flex-col">
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

        <div className="flex-1 overflow-auto bg-gray-100 dark:bg-gray-900 p-4 flex justify-center">
          <Document
            file={pdfUrl}
            onLoadSuccess={onDocumentLoadSuccess}
            loading={
              <div className="flex items-center justify-center h-full">
                <Loader2 className="h-8 w-8 animate-spin" />
              </div>
            }
            error={
              <div className="flex flex-col items-center justify-center h-full text-destructive">
                <AlertCircle className="h-8 w-8 mb-2" />
                <p className="font-semibold">Failed to load PDF</p>
                <p className="text-xs">Please try downloading the file instead.</p>
              </div>
            }
          >
            {Array.from(new Array(numPages), (_, index) => (
              <Page 
                key={`page_${index + 1}`} 
                pageNumber={index + 1} 
                scale={zoom}
                className="mb-4 shadow-lg"
              />
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