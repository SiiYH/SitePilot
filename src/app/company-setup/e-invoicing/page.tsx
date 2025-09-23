import Logo from '@/components/icons/Logo';
import EInvoicingForm from './_components/EInvoicingForm';

export default function EInvoicingPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="w-full max-w-md">
        <div className="text-center">
          <div className="mb-4 flex justify-center">
            <Logo />
          </div>
          <h1 className="text-2xl font-bold">E-Invoicing Details (Optional)</h1>
          <p className="text-muted-foreground">
            You can enter your company's e-invoicing information now, or skip and complete it later from your company settings.
          </p>
        </div>
        
        <EInvoicingForm />
        
      </div>
    </div>
  );
}
