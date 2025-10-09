
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
  phoneAreaCode: z.string().optional(),
  phoneNumber: z.string().optional(),
}).refine(data => {
    if (data.phoneAreaCode && !data.phoneNumber) {
        return false;
    }
    if (!data.phoneAreaCode && data.phoneNumber) {
        return false;
    }
    return true;
}, {
    message: 'Both area code and phone number must be provided.',
    path: ['phoneNumber'],
});


type FormValues = z.infer<typeof formSchema>;

const splitPhoneNumber = (phone: string | undefined) => {
    if (!phone) return { areaCode: '', number: '' };
    const match = phone.match(/(\+\d+)\s*(.*)/);
    if (match) {
        return { areaCode: match[1], number: match[2] };
    }
    // Simple split for numbers without explicit country code format
    const parts = phone.split(' ');
    if (parts.length > 1 && parts[0].startsWith('+')) {
        return { areaCode: parts[0], number: parts.slice(1).join(' ') };
    }
    // Fallback for numbers that don't fit expected formats
    return { areaCode: '', number: phone };
};


export default function EditProfileForm() {
  const router = useRouter();
  const { user, setUser } = useAuth();
  const firestore = useFirestore();
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const { areaCode, number } = splitPhoneNumber(user?.phone);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: user?.name || '',
      email: user?.email || '',
      phoneAreaCode: areaCode,
      phoneNumber: number,
    },
  });

  const onSubmit = async (values: FormValues) => {
    setIsLoading(true);
    
    if (user) {
        const userDocRef = doc(firestore, 'users', user.id);
        const fullPhoneNumber = values.phoneAreaCode && values.phoneNumber 
            ? `${values.phoneAreaCode.trim()} ${values.phoneNumber.trim()}` 
            : '';
            
        const updateData = {
            name: values.name,
            email: values.email || '',
            phone: fullPhoneNumber,
        };

        try {
            await updateDoc(userDocRef, updateData);
            
            const updatedUserData = { ...user, ...updateData };
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

                <div>
                    <FormLabel>Phone Number</FormLabel>
                    <div className="flex gap-2 mt-2">
                        <FormField
                        control={form.control}
                        name="phoneAreaCode"
                        render={({ field }) => (
                            <FormItem className="w-24">
                            <FormControl>
                                <Input placeholder="+60" {...field} value={field.value ?? ''} />
                            </FormControl>
                             <FormMessage />
                            </FormItem>
                        )}
                        />
                         <FormField
                        control={form.control}
                        name="phoneNumber"
                        render={({ field }) => (
                            <FormItem className="flex-1">
                            <FormControl>
                                <Input placeholder="12-345 6789" {...field} value={field.value ?? ''} />
                            </FormControl>
                             <FormMessage />
                            </FormItem>
                        )}
                        />
                    </div>
                </div>
                
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
