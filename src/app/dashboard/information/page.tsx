'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Info, Mail, ShieldCheck, GitBranch } from 'lucide-react';

const InfoField = ({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: string }) => (
    <div className="flex items-start gap-4">
        <Icon className="h-5 w-5 mt-1 flex-shrink-0 text-muted-foreground" />
        <div className="space-y-1">
            <p className="text-sm font-medium text-muted-foreground">{label}</p>
            <p className="text-sm font-semibold break-words">{value}</p>
        </div>
    </div>
);

export default function InformationPage() {
  const appVersion = "1.0.0";
  const supportEmail = "support@sitepilot.com";
  const slaDetails = `SitePilot guarantees a 99.9% uptime for all services. Scheduled maintenance will be announced at least 24 hours in advance. Critical support requests will be addressed within 4 business hours, and standard requests within 24 business hours.`;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Application Information</h2>
        <p className="text-muted-foreground">
          Version details, support contact, and service level agreement.
        </p>
      </div>

      <Card>
        <CardHeader>
            <CardTitle className="flex items-center gap-2">
                <Info className="h-5 w-5 text-primary" />
                General Details
            </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
            <InfoField icon={GitBranch} label="App Version" value={appVersion} />
            <InfoField icon={Mail} label="Support Email" value={supportEmail} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
            <CardTitle className="flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-primary" />
                Service Level Agreement (SLA)
            </CardTitle>
        </CardHeader>
        <CardContent>
            <p className="text-sm text-muted-foreground leading-relaxed">
                {slaDetails}
            </p>
        </CardContent>
      </Card>
    </div>
  );
}
