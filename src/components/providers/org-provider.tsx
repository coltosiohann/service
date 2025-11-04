"use client";

import { createContext, useContext, useMemo, useState } from 'react';

type Organization = {
  orgId: string;
  name: string;
  role: string;
};

type OrgContextType = {
  orgId: string | null;
  setOrgId: (orgId: string) => void;
  organizations: Organization[];
};

const OrgContext = createContext<OrgContextType | undefined>(undefined);

type OrgProviderProps = {
  initialOrgId: string | null;
  organizations: Organization[];
  children: React.ReactNode;
};

export function OrgProvider({ initialOrgId, organizations, children }: OrgProviderProps) {
  const [orgId, setOrgId] = useState<string | null>(initialOrgId);

  const value = useMemo(
    () => ({
      orgId,
      setOrgId,
      organizations,
    }),
    [orgId, organizations],
  );

  return <OrgContext.Provider value={value}>{children}</OrgContext.Provider>;
}

export function useOrg() {
  const context = useContext(OrgContext);
  if (!context) {
    throw new Error('useOrg trebuie folosit în interiorul OrgProvider.');
  }

  return context;
}
