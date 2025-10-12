

'use client';

import { usePathname } from 'next/navigation';
import { LayoutDashboard, ListTodo, FolderKanban, Settings, User, Building, Users, DollarSign, BarChart, ShieldCheck, Briefcase } from 'lucide-react';
import Link from 'next/link';

import Logo from '@/components/icons/Logo';
import { SidebarHeader, SidebarContent, SidebarMenu, SidebarMenuItem, SidebarMenuButton, SidebarSeparator } from '@/components/ui/sidebar';
import { useAuth } from '@/hooks/use-auth';
import type { UserRole } from '@/types';

const mainMenuItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, tooltip: 'Dashboard', roles: ['admin', 'director', 'engineer'] },
  { href: '/dashboard/projects', label: 'Projects', icon: FolderKanban, tooltip: 'Projects', roles: ['admin', 'director', 'engineer'] },
  { href: '/dashboard/tasks', label: 'My Tasks', icon: ListTodo, tooltip: 'My Tasks', roles: ['engineer'], activePaths: ['/dashboard/work-items'] },
  { href: '/dashboard/team', label: 'Team', icon: Users, tooltip: 'Team', roles: ['admin', 'director'] },
  { href: '/dashboard/claims', label: 'Claims', icon: DollarSign, tooltip: 'Claims', roles: ['admin', 'director', 'engineer'] },
  { href: '/dashboard/reports', label: 'Reports', icon: BarChart, tooltip: 'Reports', roles: ['admin', 'director'] },
];

const settingsMenuItems = [
  { href: '/dashboard/system-admin', label: 'System admin', icon: ShieldCheck, tooltip: 'System admin', roles: ['system super admin'] },
  { href: '/dashboard/company-management', label: 'Company Mgt', icon: Briefcase, tooltip: 'Company Management', roles: ['system super admin'] },
  { href: '/dashboard/profile', label: 'My Profile', icon: User, tooltip: 'My Profile', roles: ['admin', 'director', 'engineer', 'system super admin'] },
  { href: '/dashboard/company', label: 'Company', icon: Building, tooltip: 'Company Settings', roles: ['admin', 'director', 'engineer'] },
  { href: '/dashboard/settings', label: 'Settings', icon: Settings, tooltip: 'Settings', roles: ['admin', 'director'] },
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
  
  const userHasAccess = (roles: UserRole[]) => {
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
