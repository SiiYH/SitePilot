
import LicenseGenerator from './_components/LicenseGenerator';

export default function SystemAdminPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">System Administration</h2>
        <p className="text-muted-foreground">
          Manage system-level settings and generate licenses.
        </p>
      </div>
      <LicenseGenerator />
    </div>
  );
}
