'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { SimpleTooltip } from '@/components/ui/tooltip';
import {
  LayoutDashboard,
  FolderOpen,
  Settings,
  HelpCircle,
  ChevronLeft,
  ChevronRight,
  Plus,
  Scale,
} from 'lucide-react';
import { useState, createContext, useContext } from 'react';

interface SidebarContextType {
  collapsed: boolean;
  setCollapsed: (collapsed: boolean) => void;
}

const SidebarContext = createContext<SidebarContextType>({
  collapsed: false,
  setCollapsed: () => {},
});

export function useSidebar() {
  return useContext(SidebarContext);
}

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Cases', href: '/cases', icon: FolderOpen },
  { name: 'Settings', href: '/settings', icon: Settings },
  { name: 'Help', href: '/help', icon: HelpCircle },
];

export function Sidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <SidebarContext.Provider value={{ collapsed, setCollapsed }}>
      <div
        className={cn(
          'hidden lg:fixed lg:inset-y-0 lg:flex lg:flex-col transition-all duration-300 ease-in-out z-30',
          collapsed ? 'lg:w-16' : 'lg:w-64'
        )}
      >
        <div className="flex flex-col flex-grow bg-background border-r pt-5 pb-4 overflow-y-auto">
          {/* Logo */}
          <div className="flex items-center justify-between px-4 mb-6">
            <Link
              href="/dashboard"
              className={cn(
                'flex items-center gap-2 transition-opacity duration-200',
                collapsed && 'opacity-0 pointer-events-none'
              )}
            >
              <Scale className="h-6 w-6 text-primary shrink-0" />
              <span className="text-xl font-bold bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent whitespace-nowrap">
                DemandLetter.ai
              </span>
            </Link>
            {collapsed && (
              <Link href="/dashboard" className="mx-auto">
                <Scale className="h-6 w-6 text-primary" />
              </Link>
            )}
          </div>

          {/* Quick Action */}
          <div className={cn('px-3 mb-4', collapsed && 'px-2')}>
            {collapsed ? (
              <SimpleTooltip content="New Case" side="right">
                <Link href="/cases/new">
                  <Button size="icon" className="w-full h-10">
                    <Plus className="h-5 w-5" />
                  </Button>
                </Link>
              </SimpleTooltip>
            ) : (
              <Link href="/cases/new">
                <Button className="w-full justify-start gap-2">
                  <Plus className="h-4 w-4" />
                  New Case
                </Button>
              </Link>
            )}
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-2 space-y-1">
            {navigation.map((item) => {
              const isActive =
                pathname === item.href || pathname.startsWith(item.href + '/');

              const linkContent = (
                <Link
                  href={item.href}
                  className={cn(
                    'group flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-all duration-200',
                    isActive
                      ? 'bg-primary/10 text-primary'
                      : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                    collapsed && 'justify-center px-2'
                  )}
                >
                  <item.icon
                    className={cn(
                      'h-5 w-5 shrink-0 transition-colors',
                      isActive
                        ? 'text-primary'
                        : 'text-muted-foreground group-hover:text-foreground',
                      !collapsed && 'mr-3'
                    )}
                  />
                  {!collapsed && <span>{item.name}</span>}
                </Link>
              );

              return collapsed ? (
                <SimpleTooltip key={item.name} content={item.name} side="right">
                  {linkContent}
                </SimpleTooltip>
              ) : (
                <div key={item.name}>{linkContent}</div>
              );
            })}
          </nav>

          {/* Collapse Toggle */}
          <div className="px-2 mt-auto pt-4 border-t">
            <Button
              variant="ghost"
              size={collapsed ? 'icon' : 'sm'}
              onClick={() => setCollapsed(!collapsed)}
              className={cn(
                'w-full transition-all',
                collapsed ? 'justify-center' : 'justify-start gap-2'
              )}
            >
              {collapsed ? (
                <ChevronRight className="h-4 w-4" />
              ) : (
                <>
                  <ChevronLeft className="h-4 w-4" />
                  <span>Collapse</span>
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </SidebarContext.Provider>
  );
}

export function SidebarSpacer() {
  const { collapsed } = useSidebar();
  return (
    <div
      className={cn(
        'hidden lg:block transition-all duration-300',
        collapsed ? 'lg:w-16' : 'lg:w-64'
      )}
    />
  );
}
