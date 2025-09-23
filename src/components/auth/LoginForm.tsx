
'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import Link from 'next/link';
import { Mail, Phone, Loader2, Eye, EyeOff } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';

const emailSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

const phoneSchema = z.object({
  phone: z.string().min(10, 'Invalid phone number'),
  password: z.string().min(1, 'Password is required'),
});

export default function LoginForm() {
  const [activeTab, setActiveTab] = useState('email');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { login } = useAuth();
  const { toast } = useToast();

  const formEmail = useForm<z.infer<typeof emailSchema>>({
    resolver: zodResolver(emailSchema),
    defaultValues: { email: '', password: '' },
  });

  const formPhone = useForm<z.infer<typeof phoneSchema>>({
    resolver: zodResolver(phoneSchema),
    defaultValues: { phone: '', password: '' },
  });

  const onEmailSubmit = async (values: z.infer<typeof emailSchema>) => {
    setIsLoading(true);
    const user = await login(values);
    if (!user) {
      toast({
        variant: 'destructive',
        title: 'Login Failed',
        description: 'Invalid email or password. Please try again.',
      });
    }
    setIsLoading(false);
  };

  const onPhoneSubmit = async (values: z.infer<typeof phoneSchema>) => {
    setIsLoading(true);
    const user = await login(values);
    if (!user) {
      toast({
        variant: 'destructive',
        title: 'Login Failed',
        description: 'Invalid phone number or password. Please try again.',
      });
    }
    setIsLoading(false);
  };
  
  const PasswordField = ({ form }: { form: any }) => (
    <FormField
      control={form.control}
      name="password"
      render={({ field }) => (
        <FormItem>
          <div className="flex items-center justify-between">
            <FormLabel>Password</FormLabel>
            <Link href="/forgot-password" passHref>
              <Button variant="link" className="h-auto p-0 text-sm">Forgot password?</Button>
            </Link>
          </div>
          <FormControl>
            <div className="relative">
              <Input type={showPassword ? 'text' : 'password'} {...field} />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute right-1 top-1/2 h-7 w-7 -translate-y-1/2 text-muted-foreground hover:bg-transparent"
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
  );


  return (
    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="email">
          <Mail className="mr-2 h-4 w-4" /> Email
        </TabsTrigger>
        <TabsTrigger value="phone">
          <Phone className="mr-2 h-4 w-4" /> Phone
        </TabsTrigger>
      </TabsList>
      <TabsContent value="email">
        <Form {...formEmail}>
          <form onSubmit={formEmail.handleSubmit(onEmailSubmit)} className="space-y-4">
            <FormField
              control={formEmail.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input placeholder="engineer@sitepilot.com" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <PasswordField form={formEmail} />
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Log In
            </Button>
          </form>
        </Form>
      </TabsContent>
      <TabsContent value="phone">
        <Form {...formPhone}>
          <form onSubmit={formPhone.handleSubmit(onPhoneSubmit)} className="space-y-4">
            <FormField
              control={formPhone.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Phone Number</FormLabel>
                  <FormControl>
                    <Input placeholder="+1 555-123-4567" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <PasswordField form={formPhone} />
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Log In
            </Button>
          </form>
        </Form>
      </TabsContent>
    </Tabs>
  );
}
