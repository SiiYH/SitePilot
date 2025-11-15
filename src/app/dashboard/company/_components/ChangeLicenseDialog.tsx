
'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
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
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Loader2, KeyRound } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';
import { doc, getDoc } from 'firebase/firestore';
import { useFirestore, updateDocumentNonBlocking } from '@/firebase';
import type { License } from '@/app/dashboard/system-admin/_components/LicenseGenerator';

const formSchema = z.object({
  licenseKey: z.string().min(10, 'Please enter a valid license key.'),
});

type FormValues = z.infer<typeof formSchema>;

interface ChangeLicenseDialogProps {
  onLicenseChanged: (newLicenseKey: string) => void;
}

export default function ChangeLicenseDialog({ onLicenseChanged }: ChangeLicenseDialogProps) {
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const { company } = useAuth();
  const firestore = useFirestore();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: { licenseKey: '' },
  });

  const onSubmit = async (values: FormValues) => {
    if (!company || !firestore) {
      toast({ variant: 'destructive', title: 'Error', description: 'Company data not found.' });
      return;
    }
    setIsLoading(true);

    const licenseDocRef = doc(firestore, 'licenses', values.licenseKey);
    try {
      const licenseDoc = await getDoc(licenseDocRef);
      if (!licenseDoc.exists()) {
        toast({ variant: 'destructive', title: 'Invalid License', description: 'The license key provided is not valid.' });
        setIsLoading(false);
        return;
      }
      
      const newLicense = licenseDoc.data() as License;
      
      if (newLicense.activatedAt && newLicense.companyId !== company.id) {
          toast({
              variant: 'destructive',
              title: 'License In Use',
              description: 'This license key is already activated by another company.',
          });
          setIsLoading(false);
          return;
      }

      // Update the license to mark it as activated for this company
      const licenseUpdateData = {
          companyId: company.id,
          activatedAt: new Date().toISOString(),
      };
      updateDocumentNonBlocking(licenseDocRef, licenseUpdateData);

      // Trigger the parent component to update the company's license key
      onLicenseChanged(values.licenseKey);
      
      toast({
        title: 'License Updated!',
        description: 'Your company has been switched to the new license.',
      });
      
      setOpen(false);
      form.reset();

    } catch (error) {
      console.error('Error changing license:', error);
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to update license key.' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <KeyRound className="mr-2 h-4 w-4" />
          Change License Key
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Change Company License</DialogTitle>
          <DialogDescription>
            Enter a new license key to upgrade or renew your plan. The new license will apply immediately.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="licenseKey"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>New License Key</FormLabel>
                  <FormControl>
                    <Input placeholder="Paste new license key here" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Activate New License
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

