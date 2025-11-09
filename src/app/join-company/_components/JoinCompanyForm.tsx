
'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, Building, AlertCircle } from 'lucide-react';
import debounce from 'lodash.debounce';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';
import { doc, getDoc, updateDoc, collection, query, where, getDocs,getCountFromServer } from 'firebase/firestore';
import { useFirestore } from '@/firebase';
import { Company, User } from '@/types';

export default function JoinCompanyForm() {
  const router = useRouter();
  const [companyId, setCompanyId] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(false);
  const [foundCompany, setFoundCompany] = useState<Company | null>(null);
  const [error, setError] = useState<string | null>(null);

  const { toast } = useToast();
  const { user, setUser } = useAuth();
  const firestore = useFirestore();

  const debouncedFetchCompany = useCallback(
    debounce(async (id: string) => {
      if (!id || id.length < 5) { // Basic validation before querying
        setFoundCompany(null);
        setError(null);
        setIsFetching(false);
        return;
      }
      setIsFetching(true);
      setError(null);
      setFoundCompany(null);

      const companyDocRef = doc(firestore, 'companies', id.trim());
      try {
        const companyDoc = await getDoc(companyDocRef);
        if (companyDoc.exists()) {
          setFoundCompany({ id: companyDoc.id, ...companyDoc.data() } as Company);
        } else {
          setError('No company found with this ID.');
        }
      } catch (e) {
        console.error('Error fetching company:', e);
        setError('An error occurred while searching for the company.');
      } finally {
        setIsFetching(false);
      }
    }, 500),
    [firestore]
  );
  
  useEffect(() => {
    debouncedFetchCompany(companyId);
  }, [companyId, debouncedFetchCompany]);

  const handleJoin = async () => {
    if (!user || !foundCompany || !firestore) return;

    setIsLoading(true);

    try {
        // Fetch current active engineer count and license limits for the target company
        const licenseRef = doc(firestore, 'licenses', foundCompany.licenseKey!);
        const licenseSnap = await getDoc(licenseRef);

        if (!licenseSnap.exists()) {
            toast({ variant: 'destructive', title: 'Error', description: 'Company license not found.' });
            setIsLoading(false);
            return;
        }

        const licenseData = licenseSnap.data();
        const maxEngineers = licenseData.maxEngineers;

        const usersQuery = query(
            collection(firestore, 'users'),
            where('companyId', '==', foundCompany.id),
            where('role', '==', 'engineer'),
            where('status', '==', 'Active')
        );
        const activeEngineersSnap = await getCountFromServer(usersQuery);
        const activeEngineersCount = activeEngineersSnap.data().count;

        const willExceedLimit = activeEngineersCount + 1 > maxEngineers;

        const userDocRef = doc(firestore, 'users', user.id);
        const updateData: Partial<User> = { 
            companyId: foundCompany.id,
            role: 'engineer',
            status: willExceedLimit ? 'Inactive' : 'Active',
            history: [
                ...user.history,
                {
                    status: willExceedLimit ? 'Inactive' : 'Active',
                    date: new Date().toISOString()
                }
            ]
        };

        await updateDoc(userDocRef, updateData);
        
        setUser(prev => prev ? { ...prev, ...updateData } : null);

        if (willExceedLimit) {
             toast({
                variant: 'destructive',
                title: `Joined ${foundCompany.name} as Inactive`,
                description: "The company has reached its engineer limit. An admin must activate your account.",
            });
        } else {
            toast({
                title: `Joined ${foundCompany.name}!`,
                description: "You've been successfully added to the company as an Engineer.",
            });
        }

        router.push('/dashboard');

    } catch (error) {
      console.error('Error joining company:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'An unexpected error occurred. Please try again.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="mt-6">
      <CardContent className="pt-6">
        <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); handleJoin(); }}>
          <div className="space-y-2">
            <Label htmlFor="company-id">Company ID</Label>
            <Input 
              id="company-id" 
              placeholder="Paste the Company ID here"
              value={companyId}
              onChange={(e) => setCompanyId(e.target.value)}
              required
            />
          </div>
            {isFetching && (
              <div className="flex items-center justify-center p-4 text-muted-foreground">
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                <span>Searching for company...</span>
              </div>
            )}
            {error && !isFetching && (
                <div className="flex items-center gap-2 rounded-md border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
                    <AlertCircle className="h-4 w-4" />
                    <p>{error}</p>
                </div>
            )}
            {foundCompany && !isFetching && (
                <div className="rounded-lg border bg-muted/50 p-4 animate-in fade-in-0">
                    <p className="text-sm font-medium text-muted-foreground">Company Found:</p>
                    <div className="flex items-center gap-3 mt-2">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                            <Building className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                            <p className="font-bold">{foundCompany.name}</p>
                            <p className="text-xs text-muted-foreground">{foundCompany.industryDescription}</p>
                        </div>
                    </div>
                </div>
            )}
          <Button 
            type="submit" 
            className="w-full"
            disabled={!foundCompany || isLoading}
          >
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Join Company
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
