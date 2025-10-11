
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { useFirestore, updateDocumentNonBlocking } from '@/firebase';

export default function JoinCompanyForm() {
  const router = useRouter();
  const [companyId, setCompanyId] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const { user, setUser } = useAuth();
  const firestore = useFirestore();

  const handleJoin = async () => {
    if (!user || !companyId.trim()) return;

    setIsLoading(true);

    const companyDocRef = doc(firestore, 'companies', companyId.trim());
    const userDocRef = doc(firestore, 'users', user.id);

    try {
      const companyDoc = await getDoc(companyDocRef);
      if (!companyDoc.exists()) {
        toast({
          variant: 'destructive',
          title: 'Company Not Found',
          description: 'The provided Company ID is not valid. Please check and try again.',
        });
        setIsLoading(false);
        return;
      }

      await updateDoc(userDocRef, { companyId: companyId.trim() });
      
      setUser(prev => prev ? { ...prev, companyId: companyId.trim() } : null);

      toast({
        title: 'Joined Company!',
        description: "You've been successfully added to the company.",
      });

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
          <Button 
            type="submit" 
            className="w-full"
            disabled={!companyId || isLoading}
          >
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Join Company
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
