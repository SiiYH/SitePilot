
'use client';

import { useEffect, useState, useRef } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Mail, Phone, Building, Edit, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useStorage, useFirestore, errorEmitter, FirestorePermissionError, type SecurityRuleContext, updateDocumentNonBlocking } from '@/firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { doc } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';


const getInitials = (name: string) => {
  if (!name) return '';
  const names = name.split(' ');
  if (names.length > 1) {
    return `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase();
  }
  return name.substring(0, 2).toUpperCase();
};


const InfoField = ({ icon, label, value }: { icon: React.ElementType; label: string; value?: string | null }) => {
    const Icon = icon;
    return (
        <div className="flex items-start gap-4">
            <Icon className="h-5 w-5 mt-1 flex-shrink-0 text-muted-foreground" />
            <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">{label}</p>
                {value ? (
                    <p className="text-sm break-words">{value}</p>
                ) : (
                    <p className="text-sm text-muted-foreground/70 italic">Not provided</p>
                )}
            </div>
        </div>
    );
};

export default function ProfilePage() {
  const { user, setUser, company, loading } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const storage = useStorage();
  const firestore = useFirestore();
  const { toast } = useToast();
  const [isUploading, setIsUploading] = useState(false);
  
  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user || !storage || !firestore) return;
  
    setIsUploading(true);
    toast({ title: "Uploading Avatar...", description: "Please wait." });
    
    const fileName = `avatar`;
    const storageRef = ref(storage, `avatars/${user.id}/${fileName}`);
    
    try {
      const snapshot = await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(snapshot.ref);

      const userDocRef = doc(firestore, "users", user.id);
      const updateData = { avatarUrl: downloadURL };
      
      updateDocumentNonBlocking(userDocRef, updateData);

      // Update the local user state for immediate UI feedback ONLY on success
      setUser(prevUser => prevUser ? { ...prevUser, avatarUrl: downloadURL } : null);

      toast({
        title: "Avatar Updated!",
        description: "Your new profile picture has been saved.",
      });

    } catch (error) {
      if (!(error instanceof FirestorePermissionError)) {
          console.error("Error during avatar upload process:", error);
          toast({
            variant: "destructive",
            title: "Upload Failed",
            description: "Could not upload your new avatar. Please try again.",
          });
      }
    } finally {
      setIsUploading(false);
    }
  };
  
  

  if (loading || !user) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }
  
  const capitalize = (s: string) => (s && s.charAt(0).toUpperCase() + s.slice(1)) || "";

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">My Profile</h2>
        <p className="text-muted-foreground">Manage your personal information and account settings.</p>
      </div>

        <Card className="max-w-2xl">
            <CardHeader>
                <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-4">
                        <div className="relative">
                            <Avatar className="h-24 w-24">
                                <AvatarImage src={user.avatarUrl} alt={user.name} />
                                <AvatarFallback>{getInitials(user.name)}</AvatarFallback>
                                {isUploading && (
                                  <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full">
                                    <Loader2 className="h-8 w-8 animate-spin text-white" />
                                  </div>
                                )}
                            </Avatar>
                             <input
                                type="file"
                                ref={fileInputRef}
                                onChange={handleFileChange}
                                className="hidden"
                                accept="image/*"
                                disabled={isUploading}
                            />
                             <Button size="icon" className="absolute -bottom-2 -right-2 h-8 w-8 rounded-full border-2 border-background" onClick={handleAvatarClick} disabled={isUploading}>
                                <Upload className="h-4 w-4" />
                                <span className="sr-only">Change profile picture</span>
                            </Button>
                        </div>
                        <div>
                            <CardTitle className="text-2xl">{user.name}</CardTitle>
                            <CardDescription>{capitalize(user.role)}</CardDescription>
                        </div>
                    </div>
                     <Button variant="outline" asChild>
                        <Link href="/dashboard/profile/edit">
                            <Edit className="mr-2 h-4 w-4"/>
                            Edit Profile
                        </Link>
                    </Button>
                </div>
            </CardHeader>
            <CardContent className="space-y-6">
               <Separator />
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                    <InfoField icon={Mail} label="Email Address" value={user.email} />
                    <InfoField icon={Phone} label="Phone Number" value={user.phone} />
                    {company && user.role !== 'system super admin' && (
                        <InfoField icon={Building} label="Company" value={company.name} />
                    )}
                </div>
                {user.role !== 'system super admin' && (
                    <>
                        <Separator />
                        <Card className="bg-muted/40">
                            <CardHeader>
                            <CardTitle className="text-xl">Company Settings</CardTitle>
                            <CardDescription>
                                View or edit your company's information, including e-invoicing details.
                            </CardDescription>
                            </CardHeader>
                            <CardContent>
                            <Button asChild>
                                <Link href="/dashboard/company">
                                <Building className="mr-2 h-4 w-4" />
                                Go to Company Settings
                                </Link>
                            </Button>
                            </CardContent>
                        </Card>
                    </>
                )}
            </CardContent>
        </Card>
    </div>
  );
}
