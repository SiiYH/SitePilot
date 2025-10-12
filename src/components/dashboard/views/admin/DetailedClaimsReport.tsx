
'use client';

import { useReportContext } from '@/contexts/ReportContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { format, parseISO } from 'date-fns';

const statusVariant: { [key: string]: 'default' | 'secondary' | 'destructive' | 'outline' } = {
  'Paid': 'default',
  'Pending': 'secondary',
  'Overdue': 'destructive',
};

export default function DetailedClaimsReport() {
  const { detailedClaimsData } = useReportContext();

  return (
    <Card className="print-card">
      <CardHeader className="print-hidden">
        <CardTitle>Claim Details</CardTitle>
        <CardDescription>Detailed list of claims based on the selected filters.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>engineer Name</TableHead>
                <TableHead>Site Name</TableHead>
                <TableHead>e-Invoice No.</TableHead>
                <TableHead>Claim Title</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead>Date</TableHead>
                <TableHead className="text-right">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {detailedClaimsData.length > 0 ? (
                detailedClaimsData.map((data, index) => (
                  <TableRow key={index}>
                    <TableCell>{data['engineer Name']}</TableCell>
                    <TableCell>{data['Site Name']}</TableCell>
                    <TableCell>{data['e-Invoice No.']}</TableCell>
                    <TableCell className="font-medium">{data['Claim Title']}</TableCell>
                    <TableCell className="text-right">
                        <span className='text-xs text-muted-foreground'>{data.Currency} </span>
                        {data.Amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </TableCell>
                    <TableCell>{format(parseISO(data.Date), 'MMM dd, yyyy')}</TableCell>
                    <TableCell className="text-right">
                        <Badge variant={statusVariant[data.Status as keyof typeof statusVariant] || 'outline'}>
                            {data.Status}
                        </Badge>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={7} className="h-24 text-center">
                    No claims found for the selected filters.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
