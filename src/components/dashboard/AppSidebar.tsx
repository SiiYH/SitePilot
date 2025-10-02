
'use client';

import { usePathname } from 'next/navigation';
import { LayoutDashboard, ListTodo, FolderKanban, Settings, User, Building, Users, DollarSign, BarChart, ShieldCheck } from 'lucide-react';
import Link from 'next/link';

import Logo from '@/components/icons/Logo';
import { SidebarHeader, SidebarContent, SidebarMenu, SidebarMenuItem, SidebarMenuButton, SidebarSeparator } from '@/components/ui/sidebar';
import { useAuth } from '@/hooks/use-auth';

const mainMenuItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, tooltip: 'Dashboard', roles: ['Admin', 'Director', 'Engineer'] },
  { href: '/dashboard/projects', label: 'Projects', icon: FolderKanban, tooltip: 'Projects', roles: ['Admin', 'Director', 'Engineer'] },
  { href: '/dashboard/tasks', label: 'My Tasks', icon: ListTodo, tooltip: 'My Tasks', roles: ['Engineer'], activePaths: ['/dashboard/work-items'] },
  { href: '/dashboard/team', label: 'Team', icon: Users, tooltip: 'Team', roles: ['Admin', 'Director'] },
  { href: '/dashboard/claims', label: 'Claims', icon: DollarSign, tooltip: 'Claims', roles: ['Admin', 'Director', 'Engineer'] },
  { href: '/dashboard/reports', label: 'Reports', icon: BarChart, tooltip: 'Reports', roles: ['Admin', 'Director'] },
];

const settingsMenuItems = [
  { href: '/dashboard/system-admin', label: 'System Admin', icon: ShieldCheck, tooltip: 'System Admin', roles: ['System Super Admin'] },
  { href: '/dashboard/profile', label: 'My Profile', icon: User, tooltip: 'My Profile', roles: ['Admin', 'Director', 'Engineer', 'System Super Admin'] },
  { href: '/dashboard/company', label: 'Company', icon: Building, tooltip: 'Company Settings', roles: ['Admin', 'Director', 'Engineer'] },
  { href: '/dashboard/settings', label: 'Settings', icon: Settings, tooltip: 'Settings', roles: ['Admin', 'Director'] },
]

export default function AppSidebar() {
  const pathname = usePathname();
  const { user } = useAuth();

  const isActive = (href: string, activePaths?: string[]) => {
    if (href === '/dashboard' && pathname !== '/dashboard') return false;
    if (pathname.startsWith(href)) return true;
    if (activePaths) {
      return activePaths.some(path => pathname.startsWith(path));
    }
    return false;
  };
  
  const userHasAccess = (roles: string[]) => {
    if (!user) return false;
    return roles.includes(user.role);
  }

  return (
    <>
      <SidebarHeader className="p-4 print-hidden">
        <Logo />
      </SidebarHeader>
      <SidebarContent className="flex-grow print-hidden">
        <SidebarMenu>
          {mainMenuItems.map((item) => (
            userHasAccess(item.roles) &&
            <SidebarMenuItem key={item.href}>
              <Link href={item.href}>
                <SidebarMenuButton
                  isActive={isActive(item.href, item.activePaths)}
                  tooltip={{ children: item.tooltip, side: 'right' }}
                >
                  <item.icon />
                  <span>{item.label}</span>
                </SidebarMenuButton>
              </Link>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarContent>

      <SidebarContent className="mt-auto flex-none print-hidden">
        <SidebarSeparator />
         <SidebarMenu className="py-2">
          {settingsMenuItems.map((item) => (
            userHasAccess(item.roles) &&
            <SidebarMenuItem key={item.href}>
              <Link href={item.href}>
                <SidebarMenuButton
                  isActive={isActive(item.href)}
                  tooltip={{ children: item.tooltip, side: 'right' }}
                >
                  <item.icon />
                  <span>{item.label}</span>
                </SidebarMenuButton>
              </Link>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarContent>
    </>
  );
}
