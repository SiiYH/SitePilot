
'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { useState, useEffect } from 'react';
import { Check, ChevronsUpDown, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { useFirestore, setDocumentNonBlocking, updateDocumentNonBlocking } from '@/firebase';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';

type Industry = {
  Code: string;
  Description: string;
};

interface CreateCompanyFormProps {
  industries: Industry[];
}

export default function CreateCompanyForm({ industries }: CreateCompanyFormProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, setUser, company, setCompany: setAuthCompany } = useAuth();
  const firestore = useFirestore();
  const [open, setOpen] = useState(false);
  const [industryCode, setIndustryCode] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [companyDescription, setCompanyDescription] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const isEditing = searchParams.get('edit') === 'true';
  const companyId = searchParams.get('companyId');

  useEffect(() => {
    if (isEditing && company) {
      setCompanyName(company.name);
      setCompanyDescription(company.description || "");
      setIndustryCode(company.industryCode || "");
    } else if (isEditing && companyId) {
      // Fallback if company context is not yet populated
      const fetchCompany = async () => {
        const companyDocRef = doc(firestore, 'companies', companyId);
        const companyDoc = await getDoc(companyDocRef);
        if (companyDoc.exists()) {
          const companyData = companyDoc.data();
          setCompanyName(companyData.name);
          setCompanyDescription(companyData.description || "");
          setIndustryCode(companyData.industryCode || "");
        }
      }
      fetchCompany();
    }
  }, [isEditing, company, companyId, firestore]);

  const getIndustryDisplay = (code: string) => {
    const industry = industries.find((industry) => industry.Code.toLowerCase() === code.toLowerCase());
    if (!industry) return "Select industry...";
    return `(${industry.Code}) ${industry.Description}`;
  }
  
  const handleContinue = async () => {
    if (!user) return;
    setIsLoading(true);

    const selectedIndustry = industries.find((industry) => industry.Code.toLowerCase() === industryCode.toLowerCase());

    const companyData = {
      name: companyName,
      industryCode: selectedIndustry?.Code || '',
      industryDescription: selectedIndustry?.Description || '',
      description: companyDescription,
    };

    if (isEditing && companyId) {
      const companyDocRef = doc(firestore, 'companies', companyId);
      updateDocumentNonBlocking(companyDocRef, companyData);
      setAuthCompany((prev: any) => ({ ...prev, ...companyData }));
    } else {
      const newCompanyId = `company-${Date.now()}`;

      // ✅ STEP 1: Update user role to 'director' FIRST
      const userDocRef = doc(firestore, 'users', user.id);
      const userUpdates = {
        companyId: newCompanyId,
        role: 'director' as const
      };

      try {
        // Use await instead of non-blocking to ensure role is updated first
        await updateDoc(userDocRef, userUpdates);

        // ✅ STEP 2: Now create company (user is now director)
        const finalCompanyData = {
          ...companyData,
          id: newCompanyId,
          activated: false,
          licenseKey: null,
          ownerId: user.id,
        };

        const companyDocRef = doc(firestore, 'companies', newCompanyId);
        await setDoc(companyDocRef, finalCompanyData);

        // Update auth context
        setAuthCompany(finalCompanyData);
        setUser(prevUser => prevUser ? { ...prevUser, ...userUpdates } : null);

        setIsLoading(false);
        router.push('/company-setup/license');
      } catch (error) {
        console.error('Error creating company:', error);
        setIsLoading(false);
        // Handle error - maybe show toast
      }
    }

    if (isEditing) {
      setIsLoading(false);
      router.push('/dashboard/company');
    }
  }

  return (
    <Card className="mt-6">
      <CardContent className="pt-6">
        <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); handleContinue(); }}>
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
                  className="w-full justify-between h-auto"
                >
                  <span className="text-left whitespace-normal">
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
                          value={`${industry.Code} - ${industry.Description}`}
                          onSelect={(currentValue) => {
                            const selectedCode = currentValue.split(' - ')[0];
                            setIndustryCode(selectedCode.toUpperCase() === industryCode.toUpperCase() ? "" : selectedCode.toUpperCase())
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
                          <span className='flex-1 whitespace-normal'>{industry.Description}</span>
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
            type="submit" 
            className="w-full"
            disabled={!companyName || !industryCode || isLoading}
          >
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isEditing ? 'Save Changes' : 'Save and Continue'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
