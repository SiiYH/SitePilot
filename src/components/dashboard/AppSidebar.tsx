
'use client';

import { usePathname } from 'next/navigation';
import { LayoutDashboard, ListTodo, FolderKanban, Settings } from 'lucide-react';
import Link from 'next/link';

import Logo from '@/components/icons/Logo';
import { SidebarHeader, SidebarContent, SidebarMenu, SidebarMenuItem, SidebarMenuButton } from '@/components/ui/sidebar';

const menuItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, tooltip: 'Dashboard' },
  { href: '/dashboard/projects', label: 'Projects', icon: FolderKanban, tooltip: 'Projects' },
  { href: '/dashboard/tasks', label: 'My Tasks', icon: ListTodo, tooltip: 'My Tasks' },
  { href: '/dashboard/profile', label: 'Settings', icon: Settings, tooltip: 'Settings' },
];

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
      <SidebarContent>
        <SidebarMenu>
          {menuItems.map((item) => (
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
