"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { useOrg } from "@/components/providers/org-provider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

import type { Route } from "next";

export function OrgSwitcher() {
  const { orgId, setOrgId, organizations } = useOrg();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  if (!organizations.length) {
    return null;
  }

  const handleChange = (value: string) => {
    setOrgId(value);
    document.cookie = `fleetcare_org=${value}; path=/; max-age=${60 * 60 * 24 * 30}`;
    const params = new URLSearchParams(searchParams);
    params.set("orgId", value);
    const href = `${pathname}?${params.toString()}` as unknown as Route;
    router.push(href);
  };

  const current = orgId ?? organizations[0]?.orgId ?? "";

  return (
    <Select value={current} onValueChange={handleChange}>
      <SelectTrigger className="w-64">
        <SelectValue placeholder="Selecta?i organiza?ia" />
      </SelectTrigger>
      <SelectContent>
        {organizations.map((org) => (
          <SelectItem key={org.orgId} value={org.orgId}>
            {org.name} – {org.role}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
