
import Link from 'next/link';
import Logo from '@/components/icons/Logo';
import CreateCompanyForm from './_components/CreateCompanyForm';
import GoBackButton from './_components/GoBackButton';
import industryData from '@/lib/msic-sub-category-codes.json';

type Industry = {
  Code: string;
  Description: string;
};

// The data is now read from the local JSON file.
const industries: Industry[] = industryData.map(item => ({
  Code: item.Code,
  Description: item.Description
})).filter((value, index, self) => 
  self.findIndex(t => t.Code === value.Code && t.Description === value.Description) === index
);

export default async function CreateCompanyPage() {
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
          Or, <GoBackButton />
        </p>
      </div>
    </div>
  );
}
