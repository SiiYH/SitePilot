
'use client';
import { useAuth } from '@/hooks/use-auth';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { LogOut, User as UserIcon, Globe } from 'lucide-react';
import Logo from '../icons/Logo';
import Link from 'next/link';
import { ThemeToggle } from './ThemeToggle';

export default function Header() {
  const { user, logout } = useAuth();

  if (!user) return null;
  
  const getInitials = (name: string) => {
    const names = name.split(' ');
    if (names.length > 1) {
      return `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };


  return (
    <header className="sticky top-0 z-10 flex h-16 items-center justify-between border-b bg-background/80 px-4 backdrop-blur-sm sm:px-6 print-hidden">
      <div className="flex items-center gap-2 min-w-0">
        <div className="md:hidden">
            <SidebarTrigger />
        </div>
        <div className="hidden md:block min-w-0">
            <h1 className="text-lg font-semibold truncate">Welcome, {user.name.split(' ')[0]}!</h1>
            <p className="text-sm text-muted-foreground truncate">You are logged in as a {user.role}.</p>
        </div>
      </div>
      
      <div className="flex items-center gap-2">
        <ThemeToggle />
         <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="icon">
              <Globe className="h-[1.2rem] w-[1.2rem]" />
              <span className="sr-only">Toggle language</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem>
              English
            </DropdownMenuItem>
            <DropdownMenuItem>
              Chinese
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        <div className="md:hidden">
          <Logo />
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="relative h-10 w-10 rounded-full">
              <Avatar className="h-10 w-10">
                <AvatarImage src={user.avatarUrl} alt={user.name} />
                <AvatarFallback>{getInitials(user.name)}</AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56" align="end" forceMount>
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium leading-none">{user.name}</p>
                <p className="text-xs leading-none text-muted-foreground">
                  {user.email || user.phone}
                </p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <Link href="/dashboard/profile" passHref>
              <DropdownMenuItem>
                <UserIcon className="mr-2 h-4 w-4" />
                <span>Profile</span>
              </DropdownMenuItem>
            </Link>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={logout}>
              <LogOut className="mr-2 h-4 w-4" />
              <span>Log out</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
