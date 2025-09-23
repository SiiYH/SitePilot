import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import Logo from '@/components/icons/Logo';
import { Textarea } from '@/components/ui/textarea';

export default function CreateCompanyPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mb-4 flex justify-center">
              <Logo />
          </div>
          <CardTitle className="text-2xl">Create Your Company</CardTitle>
          <CardDescription>Fill in the details below to set up your new workspace.</CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="company-name">Company Name</Label>
              <Input id="company-name" placeholder="e.g., Acme Construction Inc." />
            </div>
             <div className="space-y-2">
              <Label htmlFor="industry">Industry</Label>
              <Input id="industry" placeholder="e.g., Commercial Construction" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="company-description">Company Description (Optional)</Label>
              <Textarea id="company-description" placeholder="What does your company specialize in?" />
            </div>
            <Button type="submit" className="w-full">
              Create and Continue
            </Button>
          </form>
           <p className="mt-6 text-center text-sm text-muted-foreground">
            Or, go back to{' '}
            <Link href="/welcome" className="font-medium text-primary hover:underline">
              the previous step
            </Link>.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
