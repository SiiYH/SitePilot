import Link from 'next/link';
import LoginForm from '@/components/auth/LoginForm';
import Logo from '@/components/icons/Logo';
import Image from 'next/image';

export default function LoginPage() {
  return (
    <div className="flex min-h-screen w-full">
      <div className="flex flex-1 items-center justify-center p-4 sm:p-8">
        <div className="w-full max-w-md">
          <div className="mb-8 flex justify-center">
            <Logo />
          </div>
          <h1 className="mb-2 text-center text-2xl font-bold tracking-tight text-foreground">
            Welcome Back
          </h1>
          <p className="mb-6 text-center text-muted-foreground">
            Log in to manage your construction projects.
          </p>
          <LoginForm />
          <p className="mt-6 text-center text-sm text-muted-foreground">
            Don&apos;t have an account?{' '}
            <Link href="/signup" className="font-medium text-primary hover:underline">
              Sign up
            </Link>
          </p>
        </div>
      </div>
      <div className="relative hidden flex-1 lg:block">
        <Image
          src="https://picsum.photos/seed/login/1200/1800"
          alt="Construction site"
          fill
          className="object-cover"
          data-ai-hint="construction site"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        <div className="absolute bottom-8 left-8 text-white">
          <h2 className="text-3xl font-bold">Build the Future, One Project at a Time.</h2>
          <p className="mt-2 max-w-lg text-lg">Your central hub for seamless construction management.</p>
        </div>
      </div>
    </div>
  );
}
