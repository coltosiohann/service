import { AppShell } from '@/components/layout/app-shell';
import { OrgProvider } from '@/components/providers/org-provider';
import { getDefaultOrg } from '@/lib/default-org';

type AppLayoutProps = {
  children: React.ReactNode;
};

const NAV_ITEMS = [
  { href: '/dashboard', label: 'Panou general', icon: 'dashboard' as const },
  { href: '/vehicule', label: 'Autovehicule', icon: 'vehicles' as const },
  { href: '/anvelope', label: 'Stoc anvelope', icon: 'tires' as const },
  { href: '/remindere', label: 'Remindere', icon: 'reminders' as const },
  { href: '/setari', label: 'Setări', icon: 'settings' as const },
];

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
      <AppShell nav={NAV_ITEMS}>
        {children}
      </AppShell>
    </OrgProvider>
  );
}
