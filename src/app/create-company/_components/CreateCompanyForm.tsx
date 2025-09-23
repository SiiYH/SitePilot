
'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { useState, useEffect } from 'react';
import { Check, ChevronsUpDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

type Industry = {
  Code: string;
  Description: string;
};

interface CreateCompanyFormProps {
  industries: Industry[];
}

export default function CreateCompanyForm({ industries }: CreateCompanyFormProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [industryCode, setIndustryCode] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [companyDescription, setCompanyDescription] = useState("");

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedCompanyData = localStorage.getItem('siteflow-company');
      if (storedCompanyData) {
        const company = JSON.parse(storedCompanyData);
        setCompanyName(company.name || '');
        setCompanyDescription(company.description || '');

        if (company.industry) {
            // Extracts code like 'F' from '(F) CONSTRUCTION'
            const codeMatch = company.industry.match(/^\(([^)]+)\)/);
            if (codeMatch && codeMatch[1]) {
                setIndustryCode(codeMatch[1]);
            }
        }
      }
    }
  }, []);

  const getIndustryDisplay = (code: string) => {
    const industry = industries.find((industry) => industry.Code.toLowerCase() === code.toLowerCase());
    if (!industry) return "Select industry...";
    return `(${industry.Code}) ${industry.Description}`;
  }
  
  const handleContinue = () => {
    const storedCompanyData = localStorage.getItem('siteflow-company');
    const existingData = storedCompanyData ? JSON.parse(storedCompanyData) : {};

    const companyData = {
      ...existingData,
      name: companyName,
      industry: getIndustryDisplay(industryCode),
      description: companyDescription,
    };
    localStorage.setItem('siteflow-company', JSON.stringify(companyData));
    router.push('/company-setup/e-invoicing');
  }

  return (
    <Card className="mt-6">
      <CardContent className="pt-6">
        <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
          <div className="space-y-2">
            <Label htmlFor="company-name">Company Name</Label>
            <Input 
              id="company-name" 
              placeholder="e.g., Acme Construction Inc." 
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              required
            />
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
                    {getIndustryDisplay(industryCode)}
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
                      {industries.map((industry, index) => (
                        <CommandItem
                          key={`${industry.Code}-${industry.Description}-${index}`}
                          value={industry.Code}
                          onSelect={(currentValue) => {
                            setIndustryCode(currentValue.toUpperCase() === industryCode.toUpperCase() ? "" : currentValue.toUpperCase())
                            setOpen(false)
                          }}
                        >
                          <Check
                            className={cn(
                              "mr-2 h-4 w-4",
                              industryCode.toUpperCase() === industry.Code.toUpperCase() ? "opacity-100" : "opacity-0"
                            )}
                          />
                          <span className='font-mono text-xs mr-2 p-1 bg-muted rounded-sm text-foreground group-aria-selected:text-foreground'>{industry.Code}</span>
                          <span className='flex-1'>{industry.Description}</span>
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
            <Textarea 
              id="company-description" 
              placeholder="What does your company specialize in?" 
              value={companyDescription}
              onChange={(e) => setCompanyDescription(e.target.value)}
            />
          </div>
          <Button 
            type="button" 
            className="w-full"
            disabled={!companyName || !industryCode}
            onClick={handleContinue}
          >
            Save and Continue
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
