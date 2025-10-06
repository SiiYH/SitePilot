
import Logo from '@/components/icons/Logo';
import LicenseForm from './_components/LicenseForm';

export default function LicensePage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="w-full max-w-md">
        <div className="text-center">
          <div className="mb-4 flex justify-center">
            <Logo />
          </div>
          <h1 className="text-2xl font-bold">Activate Your License</h1>
          <p className="text-muted-foreground">
            Enter the license key for your company to unlock all features.
          </p>
        </div>
        
        <LicenseForm />
        
      </div>
    </div>
  );
}
