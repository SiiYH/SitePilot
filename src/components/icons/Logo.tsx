import { Building2 } from 'lucide-react';

export default function Logo() {
  return (
    <div className="flex items-center gap-2">
      <Building2 className="h-6 w-6 text-primary" />
      <span className="text-xl font-bold tracking-tight text-foreground">
        SitePilot
      </span>
    </div>
  );
}
