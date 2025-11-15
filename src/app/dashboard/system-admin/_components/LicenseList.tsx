'use client';

import { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Copy, Check, KeyRound, Building2, User, Users, Wrench, Calendar, Search, FileKey, Clock, Infinity } from 'lucide-react';
import { format, parseISO, isPast } from 'date-fns';
import { type License } from './LicenseGenerator';
import { useToast } from '@/hooks/use-toast';
import LicenseExpiryCountdown from './LicenseExpiryCountdown';

interface LicenseListProps {
    licenses: License[];
}

export default function LicenseList({ licenses }: LicenseListProps) {
    const [copiedKey, setCopiedKey] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const { toast } = useToast();

    const copyToClipboard = (key: string) => {
        navigator.clipboard.writeText(key);
        setCopiedKey(key);
        toast({ 
            title: "Copied!", 
            description: "License key copied to clipboard." 
        });
        setTimeout(() => setCopiedKey(null), 2000);
    };

    // Filter licenses based on search
    const filteredLicenses = useMemo(() => {
        if (!searchQuery) return licenses;
        const query = searchQuery.toLowerCase();
        return licenses.filter(license => 
            license.purchaser.toLowerCase().includes(query) ||
            license.id.toLowerCase().includes(query)
        );
    }, [licenses, searchQuery]);

    // Calculate stats
    const stats = useMemo(() => {
        const total = licenses.length;
        const active = licenses.filter(l => l.expiresAt === null || !isPast(new Date(l.expiresAt))).length;
        const expired = total - active;
        const unlimited = licenses.filter(l => l.expiresAt === null).length;
        
        return { total, active, expired, unlimited };
    }, [licenses]);

    const InfoRow = ({ icon, label, children }: { icon: React.ElementType, label: string, children: React.ReactNode }) => {
        const Icon = icon;
        return (
            <div className="flex items-center justify-between py-2 text-sm">
                <div className="flex items-center gap-2 text-muted-foreground">
                    <Icon className="h-4 w-4" />
                    <span>{label}</span>
                </div>
                <div className="font-medium text-right">{children}</div>
            </div>
        );
    };

    const StatCard = ({ icon, label, value, description }: { icon: React.ElementType, label: string, value: number, description: string }) => {
        const Icon = icon;
        return (
            <div className="rounded-lg border bg-card p-4">
                <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                        <Icon className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                        <p className="text-2xl font-bold">{value}</p>
                        <p className="text-sm text-muted-foreground">{label}</p>
                    </div>
                </div>
            </div>
        );
    };

    const EmptyState = () => (
        <div className="flex flex-col items-center justify-center py-16 px-4">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-muted/50 mb-4">
                <FileKey className="h-10 w-10 text-muted-foreground" />
            </div>
            <h3 className="font-semibold text-lg mb-2">No Licenses Generated</h3>
            <p className="text-sm text-muted-foreground text-center max-w-sm">
                {searchQuery 
                    ? `No licenses found matching "${searchQuery}". Try a different search term.`
                    : "Generate your first license to get started with the system."
                }
            </p>
        </div>
    );

    const LicenseCard = ({ license }: { license: License }) => {
        const isExpired = license.expiresAt && isPast(new Date(license.expiresAt));
        
        return (
            <div className={`group rounded-xl border bg-card transition-all hover:shadow-md ${isExpired ? 'opacity-60' : ''}`}>
                <div className="p-5 space-y-4">
                    {/* Header */}
                    <div className="flex items-start justify-between gap-4">
                        <div className="flex items-start gap-3 min-w-0 flex-1">
                            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                                <Building2 className="h-6 w-6 text-primary" />
                            </div>
                            <div className="min-w-0 flex-1">
                                <h3 className="font-semibold text-lg mb-1">{license.purchaser}</h3>
                                <div className="space-y-1">
                                    <p className="text-sm text-muted-foreground">
                                        Generated {format(parseISO(license.createdAt), 'MMM dd, yyyy')}
                                    </p>
                                    {license.expiresAt ? (
                                        <p className={`text-sm font-medium ${isExpired ? 'text-destructive' : 'text-muted-foreground'}`}>
                                            {isExpired ? 'Expired' : 'Expires'} {format(parseISO(license.expiresAt), 'MMM dd, yyyy')}
                                        </p>
                                    ) : (
                                        <p className="text-sm text-muted-foreground">
                                            No expiration date
                                        </p>
                                    )}
                                </div>
                            </div>
                        </div>
                        {license.expiresAt === null ? (
                            <Badge variant="secondary" className="shrink-0 gap-1">
                                <Infinity className="h-3 w-3" />
                                Unlimited
                            </Badge>
                        ) : isExpired ? (
                            <Badge variant="destructive" className="shrink-0">
                                Expired
                            </Badge>
                        ) : (
                            <div className="shrink-0">
                                <LicenseExpiryCountdown expiresAt={license.expiresAt} />
                            </div>
                        )}
                    </div>

                    {/* License Key */}
                    <div className="rounded-lg border bg-muted/30 p-3">
                        <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                                <KeyRound className="h-4 w-4" />
                                License Key
                            </div>
                            <Button 
                                variant="ghost" 
                                size="sm" 
                                className="h-8 gap-2 -mr-2"
                                onClick={() => copyToClipboard(license.id)}
                            >
                                {copiedKey === license.id ? (
                                    <>
                                        <Check className="h-4 w-4 text-green-500" />
                                        <span className="text-green-500">Copied!</span>
                                    </>
                                ) : (
                                    <>
                                        <Copy className="h-4 w-4" />
                                        Copy
                                    </>
                                )}
                            </Button>
                        </div>
                        <p className="font-mono text-xs break-all leading-relaxed text-foreground/80">
                            {license.id}
                        </p>
                    </div>

                    {/* User Limits */}
                    <div className="grid grid-cols-3 gap-4 pt-2">
                        <div className="text-center">
                            <div className="flex h-10 w-10 mx-auto mb-2 items-center justify-center rounded-lg bg-blue-500/10">
                                <User className="h-5 w-5 text-blue-600" />
                            </div>
                            <p className="text-lg font-bold">{license.maxDirectors}</p>
                            <p className="text-xs text-muted-foreground">Directors</p>
                        </div>
                        <div className="text-center">
                            <div className="flex h-10 w-10 mx-auto mb-2 items-center justify-center rounded-lg bg-amber-500/10">
                                <Wrench className="h-5 w-5 text-amber-600" />
                            </div>
                            <p className="text-lg font-bold">{license.maxAdmins}</p>
                            <p className="text-xs text-muted-foreground">Admins</p>
                        </div>
                        <div className="text-center">
                            <div className="flex h-10 w-10 mx-auto mb-2 items-center justify-center rounded-lg bg-green-500/10">
                                <Users className="h-5 w-5 text-green-600" />
                            </div>
                            <p className="text-lg font-bold">{license.maxEngineers}</p>
                            <p className="text-xs text-muted-foreground">Engineers</p>
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="space-y-6">
            {/* Stats Overview */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <StatCard 
                    icon={FileKey} 
                    label="Total Licenses" 
                    value={stats.total}
                    description="All generated"
                />
                <StatCard 
                    icon={Check} 
                    label="Active" 
                    value={stats.active}
                    description="Currently valid"
                />
                <StatCard 
                    icon={Clock} 
                    label="Expired" 
                    value={stats.expired}
                    description="No longer valid"
                />
                <StatCard 
                    icon={Infinity} 
                    label="Unlimited" 
                    value={stats.unlimited}
                    description="No expiry date"
                />
            </div>

            {/* Main Card */}
            <Card>
                <CardHeader>
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                        <div>
                            <CardTitle>Generated Licenses</CardTitle>
                            <CardDescription>
                                Manage and view all license keys generated by the system
                            </CardDescription>
                        </div>
                        {licenses.length > 0 && (
                            <div className="relative w-full sm:w-72">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder="Search by company or key..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="pl-9"
                                />
                            </div>
                        )}
                    </div>
                </CardHeader>
                <CardContent>
                    {filteredLicenses.length > 0 ? (
                        <div className="grid gap-4 md:grid-cols-2">
                            {[...filteredLicenses].reverse().map(license => (
                                <LicenseCard key={license.id} license={license} />
                            ))}
                        </div>
                    ) : (
                        <EmptyState />
                    )}
                </CardContent>
            </Card>
        </div>
    );
}