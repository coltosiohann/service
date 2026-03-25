import { Badge } from '@/components/ui/badge';

type ItpState = 'active' | 'expiring' | 'expired';

export function ItpBadge({ state }: { state: ItpState }) {
  if (state === 'expired') {
    return <Badge variant="danger">Expirat</Badge>;
  }
  if (state === 'expiring') {
    return <Badge variant="warning">In curand</Badge>;
  }
  return <Badge variant="success">Valabil</Badge>;
}
