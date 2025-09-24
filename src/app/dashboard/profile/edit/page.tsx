
import EditProfileForm from './_components/EditProfileForm';

export default function EditProfilePage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Edit Profile</h2>
        <p className="text-muted-foreground">Manage your personal information and account settings.</p>
      </div>
      <EditProfileForm />
    </div>
  );
}
