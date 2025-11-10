"use client";

import { Bell, CircleDot, Droplet, Gauge, Settings, Truck } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';

import type { Route } from 'next';
import type { ReactNode } from 'react';

export type AppShellNavItem = {
  href: Route;
  label: string;
  icon: 'dashboard' | 'vehicles' | 'tires' | 'oil' | 'reminders' | 'settings';
};

const iconMap: Record<AppShellNavItem['icon'], ReactNode> = {
  dashboard: <Gauge className="size-4" />,
  vehicles: <Truck className="size-4" />,
  tires: <CircleDot className="size-4" />,
  oil: <Droplet className="size-4" />,
  reminders: <Bell className="size-4" />,
  settings: <Settings className="size-4" />,
};

type AppShellProps = {
  children: ReactNode;
  nav: AppShellNavItem[];
};

export function AppShell({ children, nav }: AppShellProps) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <header className="border-b border-border bg-white">
        <div className="flex flex-col gap-4 px-6 pb-4 pt-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-2xl bg-primary font-bold text-primary-foreground">
              FC
            </div>
            <div>
              <p className="text-lg font-semibold">FleetCare</p>
              <p className="text-sm text-muted-foreground">Monitorizare service flotă - stație locală</p>
            </div>
          </div>
        </div>
        <nav className="flex items-center gap-2 overflow-x-auto px-6 pb-4">
          {nav.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  buttonVariants({ variant: isActive ? 'default' : 'ghost', size: 'sm' }),
                  'rounded-full px-4 py-2 text-sm font-semibold',
                )}
              >
                <span className="mr-2 flex size-6 items-center justify-center rounded-full bg-primary/10 text-primary">
                  {iconMap[item.icon]}
                </span>
                {item.label}
              </Link>
            );
          })}
        </nav>
      </header>
      <main className="px-6 py-8">
        <div className="mx-auto max-w-7xl space-y-8">{children}</div>
      </main>
    </div>
  );
}
