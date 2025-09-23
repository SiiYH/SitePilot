
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import Link from 'next/link';
import { Switch } from '@/components/ui/switch';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Check, ChevronsUpDown } from 'lucide-react';
import { cn } from '@/lib/utils';

type StateCode = {
  Code: string;
  Description: string;
};

interface EInvoicingFormProps {
  stateCodes: StateCode[];
}

export default function EInvoicingForm({ stateCodes }: EInvoicingFormProps) {
  const [eInvEnabled, setEInvEnabled] = useState(true);
  const [eInvVersion, setEInvVersion] = useState('v1');
  const [openStateCode, setOpenStateCode] = useState(false)
  const [stateCodeValue, setStateCodeValue] = useState("")

  const getStateCodeDisplay = (code: string) => {
    const state = stateCodes.find((s) => s.Code.toLowerCase() === code.toLowerCase());
    if (!state) return "Select LHDN State...";
    return `${state.Description} (${state.Code})`;
  }

  return (
    <Card className="mt-6">
      <CardContent className="pt-6">
        <form className="space-y-6">
          {/* E-Invoicing Configuration */}
          <div className="space-y-4 rounded-lg border p-4">
            <h3 className="text-lg font-semibold">E-Invoicing Configuration</h3>
            <div className="flex items-center justify-between">
              <Label htmlFor="e-inv-enabled">Enable E-Invoicing</Label>
              <Switch id="e-inv-enabled" checked={eInvEnabled} onCheckedChange={setEInvEnabled} />
            </div>
            {eInvEnabled && (
              <>
                <div className="space-y-2">
                  <Label>E-Invoicing Version</Label>
                  <RadioGroup defaultValue="v1" className="flex gap-4" onValueChange={setEInvVersion}>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="v1" id="v1" />
                      <Label htmlFor="v1">v1.0</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="v2" id="v2" />
                      <Label htmlFor="v2">v2.0 (with Digital Signature)</Label>
                    </div>
                  </RadioGroup>
                </div>
                {eInvVersion === 'v2' && (
                  <div className="space-y-2">
                    <Label htmlFor="digital-signature">Digital Signature PIN</Label>
                    <Input id="digital-signature" type="password" placeholder="Enter your 6-digit PIN" />
                     <p className="text-xs text-muted-foreground">Required for v2.0 e-invoicing.</p>
                  </div>
                )}
              </>
            )}
          </div>
          
          {/* Business Details */}
          <div className="space-y-4">
             <h3 className="text-lg font-semibold">Business Identifiers</h3>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
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
                 <div className="space-y-2">
                  <Label htmlFor="tourism-tax">Tourism Tax Registration No.</Label>
                  <Input id="tourism-tax" placeholder="Optional" />
                </div>
              </div>
          </div>
          
          <Separator/>

          {/* Contact & Address */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Contact & Address</h3>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="supplier-email">Supplier Email</Label>
                <Input id="supplier-email" type="email" placeholder="billing@yourcompany.com" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="mobile-no">Mobile Number</Label>
                <Input id="mobile-no" placeholder="+6012-3456789" />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="address-1">Address Line 1</Label>
              <Input id="address-1" placeholder="Unit/Lot No, Building, Street Name" />
            </div>
             <div className="space-y-2">
              <Label htmlFor="address-2">Address Line 2 (Optional)</Label>
              <Input id="address-2" placeholder="Taman/Desa/Kawasan, etc." />
            </div>
             <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
               <div className="space-y-2">
                  <Label htmlFor="postal-code">Postal Code</Label>
                  <Input id="postal-code" placeholder="e.g., 50480" />
                </div>
                 <div className="space-y-2">
                    <Label htmlFor="lhdn-state">LHDN State Code</Label>
                    <Popover open={openStateCode} onOpenChange={setOpenStateCode}>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          role="combobox"
                          aria-expanded={openStateCode}
                          className="w-full justify-between"
                        >
                          <span className="truncate">
                            {getStateCodeDisplay(stateCodeValue)}
                          </span>
                          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                        <Command>
                          <CommandInput placeholder="Search state..." />
                          <CommandList>
                            <CommandEmpty>No state found.</CommandEmpty>
                            <CommandGroup>
                              {stateCodes.map((state) => (
                                <CommandItem
                                  key={state.Code}
                                  value={state.Code}
                                  onSelect={(currentValue) => {
                                    setStateCodeValue(currentValue === stateCodeValue ? "" : currentValue)
                                    setOpenStateCode(false)
                                  }}
                                >
                                  <Check
                                    className={cn(
                                      "mr-2 h-4 w-4",
                                      stateCodeValue.toLowerCase() === state.Code.toLowerCase() ? "opacity-100" : "opacity-0"
                                    )}
                                  />
                                  <span className='font-mono text-xs mr-2 p-1 bg-muted rounded-sm text-foreground group-aria-selected:text-foreground'>{state.Code}</span>
                                  <span className='flex-1'>{state.Description}</span>
                                </CommandItem>
                              ))}
                            </CommandGroup>
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>
                  </div>
             </div>
          </div>
          
           <Separator/>

          {/* Financial Details */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Financial Details</h3>
             <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="space-y-2">
                    <Label htmlFor="bank-account">Bank Account Number</Label>
                    <Input id="bank-account" placeholder="Enter bank account number" />
                </div>
                 <div className="space-y-2">
                    <Label htmlFor="customer-type">Customer Type</Label>
                     <Select>
                      <SelectTrigger id="customer-type">
                        <SelectValue placeholder="Select customer type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="business">Business</SelectItem>
                        <SelectItem value="individual">Individual</SelectItem>
                        <SelectItem value="government">Government</SelectItem>
                      </SelectContent>
                    </Select>
                </div>
             </div>
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
