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
pdfjs.GlobalWorkerOptions.workerSrc = `/pdf.worker.min.js`;

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
  const [pageNumber, setPageNumber] = useState(1);
  const [viewMode, setViewMode] = useState<'single' | 'all'>('single');

  // Reset state when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setZoom(1.0);
      setPageNumber(1);
      setViewMode('single');
    }
  }, [isOpen]);

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Prevent default for navigation keys
      if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', '+', '-', '='].includes(e.key)) {
        e.preventDefault();
      }

      if (viewMode === 'single') {
        if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
          goToPrevPage();
        } else if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
          goToNextPage();
        }
      }

      if (e.key === '+' || e.key === '=') {
        handleZoomIn();
      } else if (e.key === '-') {
        handleZoomOut();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, pageNumber, numPages, viewMode]);

  const handleZoomIn = () => setZoom(prev => Math.min(prev + 0.2, 2.5));
  const handleZoomOut = () => setZoom(prev => Math.max(prev - 0.2, 0.5));
  const resetZoom = () => setZoom(1.0);

  const goToPrevPage = () => {
    setPageNumber(prev => Math.max(prev - 1, 1));
  };

  const goToNextPage = () => {
    setPageNumber(prev => Math.min(prev + 1, numPages || 1));
  };

  const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
    setNumPages(numPages);
  };

  const toggleViewMode = () => {
    setViewMode(prev => prev === 'single' ? 'all' : 'single');
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl h-[90vh] flex flex-col [&>button]:hidden">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle>PDF Preview - {fileName}</DialogTitle>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="h-8 w-8"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>

        <div className="flex items-center justify-between gap-2 py-2 px-1 border-b">
          <div className="flex items-center gap-2">
            {viewMode === 'single' && (
              <>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={goToPrevPage}
                  disabled={pageNumber <= 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="text-sm font-medium min-w-[80px] text-center">
                  Page {pageNumber} of {numPages || '—'}
                </span>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={goToNextPage}
                  disabled={pageNumber >= (numPages || 1)}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </>
            )}
          </div>

          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={toggleViewMode}
              className="text-xs"
            >
              {viewMode === 'single' ? 'View All' : 'Single Page'}
            </Button>
            
            <div className="w-px h-6 bg-border" />
            
            <Button variant="outline" size="sm" onClick={handleZoomOut}>
              <ZoomOut className="h-4 w-4" />
            </Button>
            <button
              onClick={resetZoom}
              className="text-sm font-medium min-w-[60px] text-center hover:text-primary transition-colors"
              title="Reset zoom"
            >
              {(zoom * 100).toFixed(0)}%
            </button>
            <Button variant="outline" size="sm" onClick={handleZoomIn}>
              <ZoomIn className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="flex-1 overflow-auto bg-gray-100 dark:bg-gray-900 p-4 flex justify-center">
          <Document
            file={pdfUrl}
            onLoadSuccess={onDocumentLoadSuccess}
            loading={
              <div className="flex flex-col items-center justify-center h-full">
                <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
                <p className="text-sm text-muted-foreground">Loading PDF...</p>
              </div>
            }
            error={
              <div className="flex flex-col items-center justify-center h-full text-destructive">
                <AlertCircle className="h-12 w-12 mb-4" />
                <p className="font-semibold mb-2">Failed to load PDF</p>
                <p className="text-sm text-muted-foreground mb-4">Please try downloading the file instead.</p>
                <Button onClick={onDownload} variant="outline">
                  <Download className="mr-2 h-4 w-4" />
                  Download PDF
                </Button>
              </div>
            }
            options={{
              cMapUrl: `https://unpkg.com/pdfjs-dist@${pdfjs.version}/cmaps/`,
              cMapPacked: true,
              standardFontDataUrl: `https://unpkg.com/pdfjs-dist@${pdfjs.version}/standard_fonts/`,
            }}
          >
            <div className="space-y-4">
              {viewMode === 'all' ? (
                Array.from(new Array(numPages), (_, index) => (
                  <div key={`page_${index + 1}`} className="bg-white shadow-lg">
                    <Page 
                      pageNumber={index + 1} 
                      scale={zoom}
                      renderTextLayer={true}
                      renderAnnotationLayer={true}
                    />
                  </div>
                ))
              ) : (
                <div className="bg-white shadow-lg">
                  <Page 
                    pageNumber={pageNumber} 
                    scale={zoom}
                    renderTextLayer={true}
                    renderAnnotationLayer={true}
                    loading={
                      <div className="flex items-center justify-center py-16">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                      </div>
                    }
                  />
                </div>
              )}
            </div>
          </Document>
        </div>

        <DialogFooter className="flex-row justify-between sm:justify-between">
          <div className="text-xs text-muted-foreground hidden sm:block">
            Use <kbd className="px-1.5 py-0.5 bg-muted rounded text-xs">←</kbd> <kbd className="px-1.5 py-0.5 bg-muted rounded text-xs">→</kbd> to navigate • <kbd className="px-1.5 py-0.5 bg-muted rounded text-xs">+</kbd> <kbd className="px-1.5 py-0.5 bg-muted rounded text-xs">-</kbd> to zoom
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose}>
              <X className="mr-2 h-4 w-4" />
              Close
            </Button>
            <Button onClick={onDownload}>
              <Download className="mr-2 h-4 w-4" />
              Download
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
