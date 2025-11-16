
'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2, Eye, EyeOff, AlertCircle } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription } from '@/components/ui/alert';
import type { UserRole } from '@/types';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Label } from '@/components/ui/label';

const formSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  contactMethod: z.enum(['email', 'phone']),
  email: z.string().optional(),
  phone: z.string().optional(),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string(),
}).refine(data => data.contactMethod === 'email' ? z.string().email().safeParse(data.email).success : true, {
  message: 'A valid email is required',
  path: ['email'],
}).refine(data => data.contactMethod === 'phone' ? z.string().min(10).safeParse(data.phone).success : true, {
  message: 'A valid phone number is required',
  path: ['phone'],
}).refine(data => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
});


export default function SignUpForm() {
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const { signUp, licenseUsage, licenseLimits } = useAuth();
  const { toast } = useToast();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      contactMethod: 'email',
      email: '',
      phone: '',
      password: '',
      confirmPassword: '',
    },
  });

  const contactMethod = form.watch('contactMethod');
  // const engineerLimitReached = licenseUsage.engineer >= licenseLimits.engineer;


  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setIsLoading(true);
    /* if (engineerLimitReached) {
       toast({
        variant: 'destructive',
        title: 'Sign Up Failed',
        description: 'The license limit for new engineers has been reached. Please contact an administrator.',
      });
      setIsLoading(false);
      return;
    } */

    const { password, email, phone } = values;
    if (!password || (!email && !phone)) {
        toast({
            variant: 'destructive',
            title: 'Sign Up Failed',
            description: 'Please provide all required information.',
        });
        setIsLoading(false);
        return;
    }

    // Role is defaulted to 'engineer' on signup now.
    const { user, error } = await signUp({ ...values, role: '' });
    if (error) {
      toast({
        variant: 'destructive',
        title: 'Sign Up Failed',
        description: error,
      });
    }
    setIsLoading(false);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        {/* {engineerLimitReached && (
           <Alert variant="destructive" className="text-sm">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              The license limit for new <strong>engineer</strong> sign-ups has been reached. Please contact an administrator.
            </AlertDescription>
          </Alert>
        )} */}
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
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <FormItem className="flex items-center space-x-2 space-y-0">
                          <FormControl>
                            <RadioGroupItem value="phone" disabled />
                          </FormControl>
                           <Label className="font-normal opacity-50 cursor-not-allowed">Phone</Label>
                        </FormItem>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Coming soon!</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
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
                  <Input placeholder="+60123456789" {...field} value={field.value ?? ''}/>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Password</FormLabel>
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

        <FormField
          control={form.control}
          name="confirmPassword"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Confirm Password</FormLabel>
              <FormControl>
                 <div className="relative">
                  <Input type={showConfirmPassword ? 'text' : 'password'} {...field} />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-1 top-1/2 h-7 w-7 -translate-y-1/2 text-muted-foreground"
                    onClick={() => setShowConfirmPassword(prev => !prev)}
                  >
                    {showConfirmPassword ? <Eye /> : <EyeOff />}
                    <span className="sr-only">{showConfirmPassword ? 'Hide password' : 'Show password'}</span>
                  </Button>
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        {/* <Button type="submit" className="w-full" disabled={isLoading || engineerLimitReached}> */}
        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Create Account
        </Button>
      </form>
    </Form>
  );
}
