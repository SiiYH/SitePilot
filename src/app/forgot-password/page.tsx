import Link from 'next/link';
import ForgotPasswordForm from '@/components/auth/ForgotPasswordForm';
import Logo from '@/components/icons/Logo';

export default function ForgotPasswordPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="w-full max-w-md">
        <div className="mb-8 flex justify-center">
          <Logo />
        </div>
        <h1 className="mb-2 text-center text-2xl font-bold tracking-tight text-foreground">
          Forgot Your Password?
        </h1>
        <p className="mb-6 text-center text-muted-foreground">
          No problem. Enter your email or phone number and we&apos;ll help you reset it.
        </p>
        <ForgotPasswordForm />
        <p className="mt-6 text-center text-sm text-muted-foreground">
          Remember your password?{' '}
          <Link href="/login" className="font-medium text-primary hover:underline">
            Log in
          </Link>
        </p>
      </div>
    </div>
  );
}
