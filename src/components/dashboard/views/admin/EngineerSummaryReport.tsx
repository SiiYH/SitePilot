
'use client';

import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useReportContext } from '@/contexts/ReportContext';

interface SummaryData {
  "engineer Name": string;
  "Completed Sites": number;
  "Total Amount (RM)": number;
  "Claim (RM)": number;
  "Ongoing Sites": number;
  "Due Sites": number;
}

export default function EngineerSummaryReport() {
  const { summaryData } = useReportContext();

  return (
    <Card className="print-card">
      <CardHeader className="print-hidden">
        <CardTitle>Summary Details</CardTitle>
        <CardDescription>Metrics are calculated based on all projects and claims in the system.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
            <Table>
                <TableHeader>
                    <TableRow>
                    <TableHead>engineer Name</TableHead>
                    <TableHead className="text-right">Completed Sites</TableHead>
                    <TableHead className="text-right">Total Amount (RM)</TableHead>
                    <TableHead className="text-right">Claim (RM)</TableHead>
                    <TableHead className="text-right">Ongoing Sites</TableHead>
                    <TableHead className="text-right">Due Sites</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {summaryData.map(data => (
                    <TableRow key={data['engineer Name']}>
                        <TableCell className="font-medium">{data['engineer Name']}</TableCell>
                        <TableCell className="text-right">{data['Completed Sites']}</TableCell>
                        <TableCell className="text-right">{data['Total Amount (RM)'].toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</TableCell>
                        <TableCell className="text-right">{data['Claim (RM)'].toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</TableCell>
                        <TableCell className="text-right">{data['Ongoing Sites']}</TableCell>
                        <TableCell className="text-right">{data['Due Sites']}</TableCell>
                    </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
      </CardContent>
    </Card>
  );
}
