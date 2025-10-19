
'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2, Eye, EyeOff, PlusCircle, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { UserRole } from '@/types';
import { Alert, AlertDescription } from '@/components/ui/alert';

const formSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  contactMethod: z.enum(['email', 'phone']),
  email: z.string().optional(),
  phone: z.string().optional(),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  role: z.enum(['admin', 'director', 'engineer']),
  companyId: z.string(),
}).refine(data => data.contactMethod === 'email' ? z.string().email().safeParse(data.email).success : true, {
  message: 'A valid email is required',
  path: ['email'],
}).refine(data => data.contactMethod === 'phone' ? z.string().min(10).safeParse(data.phone).success : true, {
  message: 'A valid phone number is required',
  path: ['phone'],
});

interface CreateUserDialogProps {
    onUserCreated: (newUser: any) => void;
    companyId: string;
}

const roles: UserRole[] = ['admin', 'director', 'engineer'];
const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);


export default function CreateUserDialog({ onUserCreated, companyId }: CreateUserDialogProps) {
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { createUser, licenseUsage, licenseLimits } = useAuth();
  const { toast } = useToast();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      contactMethod: 'email',
      email: '',
      phone: '',
      password: '',
      role: 'engineer',
      companyId: companyId,
    },
  });

  const contactMethod = form.watch('contactMethod');
  const selectedRole = form.watch('role');

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setIsLoading(true);
    
    if (licenseUsage[values.role] >= licenseLimits[values.role]) {
      toast({
        variant: 'destructive',
        title: 'License Limit Reached',
        description: `You cannot add another ${capitalize(values.role)}. Please upgrade your plan.`,
      });
      setIsLoading(false);
      return;
    }

    const newUser = await createUser({ ...values, companyId });
    
    if (newUser) {
      toast({
        title: 'User Created',
        description: `An account for ${newUser.name} has been successfully created.`,
      });
      onUserCreated(newUser);
      setOpen(false);
      form.reset();
    } else {
        toast({
            variant: 'destructive',
            title: 'Creation Failed',
            description: 'A user with that email or phone number may already exist.',
        });
    }
    setIsLoading(false);
  };
  
  const roleLimitReached = licenseUsage[selectedRole] >= licenseLimits[selectedRole];

  return (
    <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
            <Button>
                <PlusCircle className="mr-2 h-4 w-4" />
                Create User
            </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-[425px]">
             <DialogHeader>
                <DialogTitle>Create New User</DialogTitle>
                <DialogDescription>Fill in the details to create a new user account.</DialogDescription>
            </DialogHeader>
            <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)}>
              <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-4">
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
                name="contactMethod"
                render={({ field }) => (
                    <FormItem className="space-y-3">
                    <FormLabel>Contact Method</FormLabel>
                    <FormControl>
                        <RadioGroup
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                        className="flex space-x-4"
                        >
                        <FormItem className="flex items-center space-x-2 space-y-0">
                            <FormControl>
                            <RadioGroupItem value="email" />
                            </FormControl>
                            <FormLabel className="font-normal">Email</FormLabel>
                        </FormItem>
                        <FormItem className="flex items-center space-x-2 space-y-0">
                            <FormControl>
                            <RadioGroupItem value="phone" />
                            </FormControl>
                            <FormLabel className="font-normal">Phone</FormLabel>
                        </FormItem>
                        </RadioGroup>
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )}
                />

                {contactMethod === 'email' ? (
                <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                    <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                        <Input placeholder="you@company.com" {...field} value={field.value ?? ''} />
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                    )}
                />
                ) : (
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
                )}
                
                <FormField
                    control={form.control}
                    name="role"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Role</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select a role" />
                                    </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                    {roles.map(r => (
                                        <SelectItem key={r} value={r} disabled={licenseUsage[r] >= licenseLimits[r]}>
                                            {capitalize(r)} ({licenseUsage[r]}/{licenseLimits[r]} used)
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                {roleLimitReached && (
                    <Alert variant="destructive" className="text-xs">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>
                            The license limit for the <strong>{capitalize(selectedRole)}</strong> role has been reached.
                        </AlertDescription>
                    </Alert>
                )}

                <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Temporary Password</FormLabel>
                    <FormControl>
                        <div className="relative">
                        <Input type={showPassword ? 'text' : 'password'} {...field} />
                        <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="absolute right-1 top-1/2 h-7 w-7 -translate-y-1/2 text-muted-foreground"
                            onClick={() => setShowPassword(prev => !prev)}
                        >
                            {showPassword ? <Eye /> : <EyeOff />}
                            <span className="sr-only">{showPassword ? 'Hide password' : 'Show password'}</span>
                        </Button>
                        </div>
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )}
                />
              </div>
                <DialogFooter className="pt-4">
                    <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
                        Cancel
                    </Button>
                    <Button type="submit" disabled={isLoading || roleLimitReached}>
                        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Create User
                    </Button>
                </DialogFooter>
            </form>
            </Form>
        </DialogContent>
    </Dialog>
  );
}
