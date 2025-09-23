import Logo from '@/components/icons/Logo';
import EInvoicingForm from './_components/EInvoicingForm';

type StateCode = {
  Code: string;
  Description: string;
};

async function getStateCodes(): Promise<StateCode[]> {
  try {
    const res = await fetch('https://sdk.myinvois.hasil.gov.my/files/StateCodes.json', { cache: 'force-cache' });
    if (!res.ok) {
      console.error('Failed to fetch state codes');
      return [];
    }
    return res.json();
  } catch (error) {
    console.error('Error fetching state codes:', error);
    return [];
  }
}

export default async function EInvoicingPage() {
  const stateCodes = await getStateCodes();

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="w-full max-w-2xl">
        <div className="text-center">
          <div className="mb-4 flex justify-center">
            <Logo />
          </div>
          <h1 className="text-2xl font-bold">E-Invoicing Details (Optional)</h1>
          <p className="text-muted-foreground">
            You can enter your company's e-invoicing information now, or skip and complete it later from your company settings.
          </p>
        </div>
        
        <EInvoicingForm stateCodes={stateCodes} />
        
      </div>
    </div>
  );
}
