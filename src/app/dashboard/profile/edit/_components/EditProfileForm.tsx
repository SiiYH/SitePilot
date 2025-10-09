
'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useFirestore } from '@/firebase';
import { doc, updateDoc } from 'firebase/firestore';

const formSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address').optional().or(z.literal('')),
  phone: z.string().min(10, 'Invalid phone number').optional().or(z.literal('')),
});

type FormValues = z.infer<typeof formSchema>;

export default function EditProfileForm() {
  const router = useRouter();
  const { user, setUser } = useAuth();
  const firestore = useFirestore();
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: user?.name || '',
      email: user?.email || '',
      phone: user?.phone || '',
    },
  });

  const onSubmit = async (values: FormValues) => {
    setIsLoading(true);
    
    if (user) {
        const userDocRef = doc(firestore, 'users', user.id);
        try {
            await updateDoc(userDocRef, values);
            
            // Optimistically update local state for immediate UI feedback
            const updatedUserData = { ...user, ...values };
            setUser(updatedUserData);

            toast({
              title: 'Profile Updated',
              description: 'Your changes have been saved successfully.',
            });

            setTimeout(() => {
              setIsLoading(false);
              router.push('/dashboard/profile');
            }, 1000);

        } catch (error) {
            console.error("Error updating profile:", error);
            toast({
                variant: "destructive",
                title: "Update Failed",
                description: "Could not save your changes. Please try again.",
            });
            setIsLoading(false);
        }
    } else {
        toast({
            variant: "destructive",
            title: "Error",
            description: "You must be logged in to edit your profile.",
        });
        setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-2xl">
        <CardHeader>
            <CardTitle>Edit Your Profile</CardTitle>
            <CardDescription>Make changes to your personal information here. Click save when you're done.</CardDescription>
        </CardHeader>
        <CardContent>
            <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Full Name</FormLabel>
                    <FormControl>
                        <Input placeholder="John Doe" {...field} />
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )}
                />
                
                <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Email Address</FormLabel>
                    <FormControl>
                        <Input type="email" placeholder="you@company.com" {...field} value={field.value ?? ''} />
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )}
                />

                <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Phone Number</FormLabel>
                    <FormControl>
                        <Input placeholder="+1 555-123-4567" {...field} value={field.value ?? ''} />
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )}
                />
                
                <div className="flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2">
                    <Button type="button" variant="outline" asChild>
                        <Link href="/dashboard/profile">Cancel</Link>
                    </Button>
                    <Button type="submit" disabled={isLoading}>
                        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Save Changes
                    </Button>
                </div>
            </form>
            </Form>
      </CardContent>
    </Card>
  );
}
