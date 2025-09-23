'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { useState } from 'react';
import { Check, ChevronsUpDown } from 'lucide-react';
import { cn } from '@/lib/utils';

type Industry = {
  Code: string;
  Description: string;
};

interface CreateCompanyFormProps {
  industries: Industry[];
}

export default function CreateCompanyForm({ industries }: CreateCompanyFormProps) {
  const [open, setOpen] = useState(false)
  const [value, setValue] = useState("")

  return (
    <Card className="mt-6">
      <CardContent className="pt-6">
        <form className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="company-name">Company Name</Label>
            <Input id="company-name" placeholder="e.g., Acme Construction Inc." />
          </div>
          <div className="space-y-2">
            <Label htmlFor="industry">Industry</Label>
            <p className="text-xs text-muted-foreground">
              Based on official MSIC codes for Malaysian e-invoicing.
            </p>
            <Popover open={open} onOpenChange={setOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={open}
                  className="w-full justify-between"
                >
                  <span className="truncate">
                    {value
                      ? industries.find((industry) => industry.Code === value)?.Description
                      : "Select industry..."}
                  </span>
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                <Command>
                  <CommandInput placeholder="Search industry..." />
                  <CommandList>
                    <CommandEmpty>No industry found.</CommandEmpty>
                    <CommandGroup>
                      {industries.map((industry) => (
                        <CommandItem
                          key={industry.Code}
                          value={industry.Description}
                          onSelect={(currentValue) => {
                            const selectedIndustry = industries.find(i => i.Description.toLowerCase() === currentValue.toLowerCase());
                            setValue(selectedIndustry ? selectedIndustry.Code : "")
                            setOpen(false)
                          }}
                        >
                          <Check
                            className={cn(
                              "mr-2 h-4 w-4",
                              value === industry.Code ? "opacity-100" : "opacity-0"
                            )}
                          />
                          {industry.Description}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </div>
          <div className="space-y-2">
            <Label htmlFor="company-description">Company Description (Optional)</Label>
            <Textarea id="company-description" placeholder="What does your company specialize in?" />
          </div>
          <Button type="submit" className="w-full">
            Create and Continue
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
