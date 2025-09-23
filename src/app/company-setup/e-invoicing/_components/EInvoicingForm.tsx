'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import Link from 'next/link';

export default function EInvoicingForm() {
  return (
    <Card className="mt-6">
      <CardContent className="pt-6">
        <form className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="tin">TIN (Tax Identification Number)</Label>
            <Input id="tin" placeholder="e.g., C29183749201" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="sst-number">SST Registration Number</Label>
            <Input id="sst-number" placeholder="e.g., J12-3456-78901234" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="mycoid">Business Registration Number (MyCoID)</Label>
            <Input id="mycoid" placeholder="e.g., 202401000123 (1234567-A)" />
          </div>
          <div className="flex flex-col space-y-2 sm:flex-row sm:space-y-0 sm:space-x-2">
            <Button variant="outline" className="w-full" asChild>
                <Link href="/dashboard">Skip for now</Link>
            </Button>
            <Button type="submit" className="w-full" asChild>
              <Link href="/dashboard">Save and Continue</Link>
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
