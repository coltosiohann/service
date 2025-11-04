import { Badge } from '@/components/ui/badge';

type InsuranceState = 'active' | 'expiring' | 'expired';

export function InsuranceBadge({ state }: { state: InsuranceState }) {
  if (state === 'expired') {
    return <Badge variant="danger">Expirata</Badge>;
  }
  if (state === 'expiring') {
    return <Badge variant="warning">In curand</Badge>;
  }
  return <Badge variant="success">Activa</Badge>;
}
