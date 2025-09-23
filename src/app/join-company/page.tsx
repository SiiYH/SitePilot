import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import Logo from '@/components/icons/Logo';

export default function JoinCompanyPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
            <div className="mb-4 flex justify-center">
                <Logo />
            </div>
          <CardTitle className="text-2xl">Join a Company</CardTitle>
          <CardDescription>Enter the code provided by your administrator to join your team.</CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="company-code">Company Code</Label>
              <Input id="company-code" placeholder="Enter your 6-digit code" />
            </div>
            <Button type="submit" className="w-full">
              Join Company
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
