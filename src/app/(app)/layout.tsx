import { AppShell } from '@/components/layout/app-shell';

import type { AppShellNavItem } from '@/components/layout/app-shell';

type AppLayoutProps = {
  children: React.ReactNode;
};

const NAV_ITEMS = [
  { href: '/dashboard', label: 'Panou general', icon: 'dashboard' },
  { href: '/vehicule', label: 'Autovehicule', icon: 'vehicles' },
  { href: '/anvelope', label: 'Stoc anvelope', icon: 'tires' },
  { href: '/setari', label: 'Setari', icon: 'settings' },
] satisfies AppShellNavItem[];

export default async function AppLayout({ children }: AppLayoutProps) {
  return <AppShell nav={NAV_ITEMS}>{children}</AppShell>;
}



