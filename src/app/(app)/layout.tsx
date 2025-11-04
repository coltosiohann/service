import { AppShell } from '@/components/layout/app-shell';
import { OrgProvider } from '@/components/providers/org-provider';
import { getDefaultOrg } from '@/lib/default-org';

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
  // Authentication disabled - get or create default organization
  const defaultOrg = await getDefaultOrg();

  return (
    <OrgProvider
      initialOrgId={defaultOrg.id}
      organizations={[
        {
          orgId: defaultOrg.id,
          name: defaultOrg.name,
          role: 'OWNER',
        },
      ]}
    >
      <AppShell nav={NAV_ITEMS}>{children}</AppShell>
    </OrgProvider>
  );
}



