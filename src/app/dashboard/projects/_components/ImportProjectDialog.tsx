'use client';

import { useState } from 'react';
import * as XLSX from 'xlsx';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Upload, FileUp, Loader2, AlertCircle, CheckCircle, Download } from 'lucide-react';
import { Project, ProgressTrackingMode } from '@/types';
import { useFirestore, setDocumentNonBlocking } from '@/firebase';
import { doc, writeBatch } from 'firebase/firestore';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { ScrollArea } from '@/components/ui/scroll-area';

interface ImportProjectDialogProps {
    companyId: string;
    onProjectsImported: () => void;
}

interface ParsedProjectRow {
    'Project Name': string;
    'Description'?: string;
    'Start Date'?: string | number | Date;
    'End Date'?: string | number | Date;
    'Status'?: string;
    'Customer/Company'?: string;
}

export default function ImportProjectDialog({ companyId, onProjectsImported }: ImportProjectDialogProps) {
    const [open, setOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [parsedProjects, setParsedProjects] = useState<Partial<Project>[]>([]);
    const [error, setError] = useState<string | null>(null);
    const { user } = useAuth();
    const { toast } = useToast();
    const firestore = useFirestore();

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsLoading(true);
        setError(null);
        setParsedProjects([]);

        const reader = new FileReader();
        reader.onload = (evt) => {
            try {
                const bstr = evt.target?.result;
                const workbook = XLSX.read(bstr, { type: 'binary', cellDates: true });
                const wsname = workbook.SheetNames[0];
                const ws = workbook.Sheets[wsname];
                const data = XLSX.utils.sheet_to_json<ParsedProjectRow>(ws);

                if (data.length === 0) {
                    setError('The uploaded file is empty or has no valid data.');
                    setIsLoading(false);
                    return;
                }

                const formattedProjects: Partial<Project>[] = data.map((row) => {
                    if (!row['Project Name']) {
                        throw new Error('Row missing "Project Name"');
                    }

                    // Helper to parse date
                    const parseDate = (val: any) => {
                        if (!val) return new Date().toISOString();
                        if (val instanceof Date) return val.toISOString();
                        try {
                            return new Date(val).toISOString();
                        } catch {
                            return new Date().toISOString();
                        }
                    };

                    return {
                        name: row['Project Name'],
                        description: row['Description'] || `Project: ${row['Project Name']}`,
                        startDate: parseDate(row['Start Date']),
                        endDate: parseDate(row['End Date']),
                        status: (row['Status'] || 'not-started').toLowerCase().replace(/\s+/g, '-'), // Basic normalization
                        siteName: row['Customer/Company'] || '',
                    };
                });

                setParsedProjects(formattedProjects);
            } catch (err: any) {
                console.error("Error parsing file:", err);
                setError(`Failed to parse file: ${err.message || 'Unknown error'}`);
            } finally {
                setIsLoading(false);
            }
        };
        reader.onerror = () => {
            setError("Failed to read file.");
            setIsLoading(false);
        }
        reader.readAsBinaryString(file);
    };

    const createSlug = (name: string) => {
        return name
            .toLowerCase()
            .replace(/&/g, 'and')
            .replace(/[^a-z0-9\s-]/g, '')
            .trim()
            .replace(/\s+/g, '-')
            .replace(/-+/g, '-');
    };

    const handleImport = async () => {
        if (!firestore || !user || parsedProjects.length === 0) return;

        setIsLoading(true);
        try {
            const batch = writeBatch(firestore);
            const now = new Date().toISOString();
            const batchSize = 450; // Firestore batch limit is 500, keeping safety margin

            // We might need to split into multiple batches if > 500, 
            // but for this implementation we'll assume < 450 for simplicity or process sequentially for chunking.
            // Let's do simple sequential batching if needed.

            let batchCount = 0;
            let currentBatch = writeBatch(firestore);

            const promises = parsedProjects.map(async (proj, index) => {
                const projectId = `proj-${Date.now()}-${index}`;
                const jobNo = `JB-${Date.now()}-${index}`;
                const slug = createSlug(proj.name || 'project');

                const newProject: Project = {
                    id: projectId,
                    name: proj.name!,
                    slug: `${slug}-${Date.now()}`, // Ensure unique slug
                    description: proj.description || '',
                    status: proj.status || 'not-started',
                    startDate: proj.startDate || now,
                    endDate: proj.endDate || now,
                    assignedEngineers: [user.id], // Assign to creator by default
                    progressTrackingMode: 'task-driven',
                    progress: 0,
                    jobNo: jobNo, // Auto-generated
                    companyId: companyId,
                    imageUrl: `https://picsum.photos/seed/${projectId}/600/400`,
                    imageHint: 'construction site',
                    createdAt: now,
                    createdBy: user.id,
                    modifiedAt: now,
                    modifiedBy: user.id,
                    tasks: [],
                    documents: [],
                    milestones: [],
                    siteName: proj.siteName,
                    // Defaults for others
                    currency: 'MYR',
                };

                const docRef = doc(firestore, 'projects', projectId);
                currentBatch.set(docRef, newProject);
                batchCount++;

                if (batchCount >= batchSize) {
                    await currentBatch.commit();
                    currentBatch = writeBatch(firestore);
                    batchCount = 0;
                }
            });

            await Promise.all(promises);
            if (batchCount > 0) {
                await currentBatch.commit();
            }

            toast({
                title: "Import Successful",
                description: `${parsedProjects.length} projects have been imported.`,
            });

            onProjectsImported();
            setOpen(false);
            setParsedProjects([]);

        } catch (err: any) {
            console.error("Import error:", err);
            setError(`Failed to import projects: ${err.message}`);
            toast({
                variant: "destructive",
                title: "Import Failed",
                description: err.message
            });
        } finally {
            setIsLoading(false);
        }
    };

    const downloadTemplate = () => {
        const headers = ['Project Name', 'Description', 'Start Date', 'End Date', 'Status', 'Customer/Company'];
        const wb = XLSX.utils.book_new();
        const ws = XLSX.utils.aoa_to_sheet([headers]);
        XLSX.utils.book_append_sheet(wb, ws, 'Template');
        XLSX.writeFile(wb, 'project_import_template.xlsx');
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="outline">
                    <FileUp className="mr-2 h-4 w-4" />
                    Import Projects
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[800px]">
                <DialogHeader>
                    <DialogTitle>Import Projects via Excel/CSV</DialogTitle>
                    <DialogDescription>
                        Upload an Excel or CSV file to create multiple projects at once.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <div className="grid w-full max-w-sm items-center gap-1.5">
                            <input
                                type="file"
                                accept=".xlsx, .xls, .csv"
                                onChange={handleFileUpload}
                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                            />
                        </div>
                        <Button variant="outline" size="sm" onClick={downloadTemplate}>
                            <Download className="mr-2 h-4 w-4" />
                            Download Template
                        </Button>
                    </div>

                    {error && (
                        <Alert variant="destructive">
                            <AlertCircle className="h-4 w-4" />
                            <AlertTitle>Error</AlertTitle>
                            <AlertDescription>{error}</AlertDescription>
                        </Alert>
                    )}

                    {parsedProjects.length > 0 && (
                        <div className="border rounded-md">
                            <div className="bg-muted px-4 py-2 border-b flex justify-between items-center">
                                <span className="font-semibold text-sm">Preview ({parsedProjects.length} projects)</span>
                                <span className="text-xs text-muted-foreground">Job No. will be auto-generated</span>
                            </div>
                            <ScrollArea className="h-[300px]">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>No.</TableHead>
                                            <TableHead>Name</TableHead>
                                            <TableHead>Description</TableHead>
                                            <TableHead>Start Date</TableHead>
                                            <TableHead>Customer</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {parsedProjects.map((p, i) => (
                                            <TableRow key={i}>
                                                <TableCell>{i + 1}</TableCell>
                                                <TableCell className="font-medium">{p.name}</TableCell>
                                                <TableCell className="max-w-[200px] truncate">{p.description}</TableCell>
                                                <TableCell>{p.startDate?.toString().split('T')[0]}</TableCell>
                                                <TableCell>{p.siteName}</TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </ScrollArea>
                        </div>
                    )}
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
                    <Button onClick={handleImport} disabled={parsedProjects.length === 0 || isLoading}>
                        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Import {parsedProjects.length > 0 ? `${parsedProjects.length} Projects` : ''}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
