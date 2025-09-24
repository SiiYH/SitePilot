
'use client';

import { usePathname } from 'next/navigation';
import { LayoutDashboard, ListTodo, FolderKanban, Settings, User, Building, Users, DollarSign } from 'lucide-react';
import Link from 'next/link';

import Logo from '@/components/icons/Logo';
import { SidebarHeader, SidebarContent, SidebarMenu, SidebarMenuItem, SidebarMenuButton, SidebarSeparator } from '@/components/ui/sidebar';

const mainMenuItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, tooltip: 'Dashboard' },
  { href: '/dashboard/projects', label: 'Projects', icon: FolderKanban, tooltip: 'Projects' },
  { href: '/dashboard/tasks', label: 'My Tasks', icon: ListTodo, tooltip: 'My Tasks' },
  { href: '/dashboard/team', label: 'Team', icon: Users, tooltip: 'Team' },
  { href: '/dashboard/claims', label: 'Claims', icon: DollarSign, tooltip: 'Claims' },
];

const settingsMenuItems = [
  { href: '/dashboard/profile', label: 'My Profile', icon: User, tooltip: 'My Profile' },
  { href: '/dashboard/company', label: 'Company', icon: Building, tooltip: 'Company Settings' },
]

export default function AppSidebar() {
  const pathname = usePathname();

  const isActive = (href: string) => {
    if (href === '/dashboard' && pathname !== '/dashboard') return false;
    return pathname.startsWith(href);
  };

  return (
    <>
      <SidebarHeader className="p-4">
        <Logo />
      </SidebarHeader>
      <SidebarContent className="flex-grow">
        <SidebarMenu>
          {mainMenuItems.map((item) => (
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

      <SidebarContent className="mt-auto flex-none">
        <SidebarSeparator />
         <SidebarMenu className="py-2">
          {settingsMenuItems.map((item) => (
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
