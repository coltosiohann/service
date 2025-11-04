"use client";

import { useMutation, useQuery, type QueryKey, type UseMutationOptions } from '@tanstack/react-query';

import { useOrg } from '@/components/providers/org-provider';

type RequestOptions = {
  method?: 'GET' | 'POST' | 'PATCH' | 'DELETE';
  body?: unknown;
};

async function request<T>(input: string, { method = 'GET', body }: RequestOptions = {}) {
  const response = await fetch(input, {
    method,
    headers: body ? { 'Content-Type': 'application/json' } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data.message ?? 'Eroare la comunicarea cu serverul.');
  }

  const data = await response.json().catch(() => ({}));
  return 'data' in data ? (data.data as T) : (data as T);
}

type QueryParams = Record<string, string | number | boolean | null | undefined>;

function buildUrl(path: string, params: QueryParams) {
  const url = new URL(path, typeof window === 'undefined' ? 'http://localhost' : window.location.origin);

  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '') {
      return;
    }
    url.searchParams.set(key, String(value));
  });

  return url.toString();
}

export function useApiQuery<T>(path: string, params: QueryParams = {}, options?: { enabled?: boolean; key?: QueryKey }) {
  const { orgId } = useOrg();
  const enabled = options?.enabled ?? true;

  return useQuery<T>({
    queryKey: options?.key ?? [path, orgId, params],
    enabled: enabled && Boolean(orgId),
    queryFn: () => {
      if (!orgId) {
        throw new Error('Organizație lipsă.');
      }
      const url = buildUrl(path, { ...params, orgId });
      return request<T>(url);
    },
  });
}

export function useApiMutation<TResponse, TBody = unknown>(
  path: string,
  method: 'POST' | 'PATCH' | 'DELETE',
  params: QueryParams = {},
  options?: UseMutationOptions<TResponse, Error, TBody>,
) {
  const { orgId } = useOrg();

  return useMutation<TResponse, Error, TBody>({
    ...options,
    mutationFn: async (variables: TBody) => {
      if (!orgId) {
        throw new Error('Organizație lipsă.');
      }
      const url = buildUrl(path, { ...params, orgId });
      return request<TResponse>(url, { method, body: variables });
    },
  });
}
