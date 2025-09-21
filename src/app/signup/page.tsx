import Link from 'next/link';
import SignUpForm from '@/components/auth/SignUpForm';
import Logo from '@/components/icons/Logo';
import Image from 'next/image';

export default function SignUpPage() {
  return (
    <div className="flex min-h-screen w-full">
       <div className="relative hidden flex-1 lg:block">
        <Image
          src="https://picsum.photos/seed/signup/1200/1800"
          alt="Blueprint designs"
          fill
          className="object-cover"
          data-ai-hint="architectural blueprints"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        <div className="absolute bottom-8 left-8 text-white">
          <h2 className="text-3xl font-bold">Join the Team.</h2>
          <p className="mt-2 max-w-lg text-lg">Start streamlining your projects with SiteFlow today.</p>
        </div>
      </div>
      <div className="flex flex-1 items-center justify-center p-4 sm:p-8">
        <div className="w-full max-w-md">
          <div className="mb-8 flex justify-center">
            <Logo />
          </div>
          <h1 className="mb-2 text-center text-2xl font-bold tracking-tight text-foreground">
            Create an Account
          </h1>
          <p className="mb-6 text-center text-muted-foreground">
            Enter your details to get started with SiteFlow.
          </p>
          <SignUpForm />
          <p className="mt-6 text-center text-sm text-muted-foreground">
            Already have an account?{' '}
            <Link href="/login" className="font-medium text-primary hover:underline">
              Log in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
