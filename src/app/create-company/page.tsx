
import Link from 'next/link';
import Logo from '@/components/icons/Logo';
import CreateCompanyForm from './_components/CreateCompanyForm';

type Industry = {
  Code: string;
  Description: string;
};

async function getIndustries(): Promise<Industry[]> {
  try {
    const res = await fetch('https://sdk.myinvois.hasil.gov.my/files/MSICSubCategoryCodes.json', { cache: 'force-cache' });
    if (!res.ok) {
      console.error('Failed to fetch industries');
      return [];
    }
    return res.json();
  } catch (error) {
    console.error('Error fetching industries:', error);
    return [];
  }
}

export default async function CreateCompanyPage() {
  const industries = await getIndustries();
  
  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="w-full max-w-md">
        <div className="text-center">
          <div className="mb-4 flex justify-center">
            <Logo />
          </div>
          <h1 className="text-2xl font-bold">Create Your Company</h1>
          <p className="text-muted-foreground">Fill in the details below to set up your new workspace.</p>
        </div>
        
        <CreateCompanyForm industries={industries} />
        
        <p className="mt-6 text-center text-sm text-muted-foreground">
          Or, return to{' '}
          <Link href="/dashboard" className="font-medium text-primary hover:underline">
            your dashboard
          </Link>.
        </p>
      </div>
    </div>
  );
}
